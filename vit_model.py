"""
Vision Transformer (ViT) Deepfake Detection Model
Integrated from PExpo (Hugging Face Model: Wvolf/ViT_Deepfake_Detection)
"""

import os
import gc
import cv2
import uuid
import threading
import numpy as np
from PIL import Image

# Limit PyTorch thread pools (saves RAM on small instances)
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import torch
torch.set_num_threads(1)

# =========================
# CONFIG
# =========================
MODEL_PATH = "./Wvolf_ViT_Deepfake_Detection"
HF_MODEL_ID = "Wvolf/ViT_Deepfake_Detection"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
NUM_SAMPLED_FRAMES = 10  # Match with DeepFake model for consistency

# Face detector (OpenCV Haar cascade)
FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# =========================
# LAZY MODEL LOADING (fast HTTP startup for cloud deploy)
# =========================
processor = None
vit_model = None
id2label = None
_load_lock = threading.Lock()


def _load_vit_weights():
    """Load from local folder; fall back to Hugging Face Hub when weights are missing."""
    local_bin = os.path.join(MODEL_PATH, "pytorch_model.bin")
    if os.path.isfile(local_bin) and os.path.getsize(local_bin) > 1000:
        return MODEL_PATH, True
    print("[ViT] Local weights missing or incomplete — downloading from Hugging Face...")
    return HF_MODEL_ID, False


def ensure_vit_loaded():
    """Load ViT on first inference request so the web server can start immediately."""
    global processor, vit_model, id2label
    if vit_model is not None:
        return
    with _load_lock:
        if vit_model is not None:
            return
        from transformers import AutoImageProcessor, AutoModelForImageClassification

        print("[ViT] Loading Vision Transformer model...")
        model_source, local_only = _load_vit_weights()
        processor = AutoImageProcessor.from_pretrained(model_source, local_files_only=local_only)
        vit_model = AutoModelForImageClassification.from_pretrained(
            model_source,
            local_files_only=local_only,
            low_cpu_mem_usage=True,
            torch_dtype=torch.float16,
        )
        vit_model.eval()
        id2label = vit_model.config.id2label
        print(f"[ViT] Model loaded successfully. Labels: {id2label}")


def release_vit_memory():
    """Free model RAM after each scan (required for 512MB hosts)."""
    global processor, vit_model, id2label
    vit_model = None
    processor = None
    id2label = None
    gc.collect()


# =========================
# HELPERS
# =========================
def evenly_spaced(n, k):
    """Generate k evenly spaced indices from 0 to n-1"""
    if k <= 1:
        return [n // 2]
    return np.linspace(0, n - 1, k, dtype=int)


def sample_frames(video_path, num_frames=NUM_SAMPLED_FRAMES):
    """Extract evenly spaced frames from video"""
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total <= 0:
        cap.release()
        raise ValueError("Could not read video or frame count is 0.")

    indices = set(evenly_spaced(total, num_frames))
    frames = []
    fid = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if fid in indices:
            frames.append(frame)
        fid += 1

    cap.release()
    return frames


def crop_face(frame_bgr):
    """Detect and crop face from frame using Haar cascade"""
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        # Fallback: center crop if no face is found
        h, w = frame_bgr.shape[:2]
        size = min(h, w)
        y1 = (h - size) // 2
        x1 = (w - size) // 2
        crop = frame_bgr[y1 : y1 + size, x1 : x1 + size]
        return crop

    # Get largest face
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

    # Add small padding
    pad = int(0.15 * max(w, h))
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(frame_bgr.shape[1], x + w + pad)
    y2 = min(frame_bgr.shape[0], y + h + pad)

    return frame_bgr[y1:y2, x1:x2]


def predict_image(face_bgr):
    """Predict on a single face crop using ViT"""
    ensure_vit_loaded()

    rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)

    inputs = processor(images=pil_img, return_tensors="pt")
    inputs = {k: v.to(dtype=torch.float16) for k, v in inputs.items()}

    with torch.inference_mode():
        outputs = vit_model(**inputs)
        probs = torch.softmax(outputs.logits.float(), dim=-1)[0].cpu().numpy()

    pred_idx = int(np.argmax(probs))
    pred_label = id2label[pred_idx]
    confidence = float(probs[pred_idx])

    return pred_label, confidence, probs


# =========================
# MAIN PREDICTION FUNCTION
# =========================
def predict_video(video_path, frames_to_sample=NUM_SAMPLED_FRAMES, progress_cb=None):
    """
    Analyze a video for deepfake content using ViT model.

    Args:
        video_path      : Path to the video file.
        frames_to_sample: Number of frames to extract and analyse.
        progress_cb     : Optional callable(stage, progress, message) for progress tracking.

    Returns:
        (label, confidence, frame_results, mean_probs)
        - label: 'REAL' or 'FAKE'
        - confidence: float between 0 and 1
        - frame_results: list of per-frame predictions with frame paths
        - mean_probs: averaged probabilities across all frames
    """
    max_frames = int(os.environ.get("MAX_FRAMES", str(NUM_SAMPLED_FRAMES)))
    frames_to_sample = min(frames_to_sample, max_frames)

    def emit(stage, progress, message=""):
        if progress_cb:
            try:
                progress_cb(stage, progress, message)
            except Exception:
                pass

    ensure_vit_loaded()
    emit("vit_frames_extracting", 15, "[ViT] Extracting frames...")

    # Sample frames
    frames = sample_frames(video_path, frames_to_sample)

    if not frames:
        raise RuntimeError("[ViT] No frames extracted")

    emit("vit_frames_extracted", 25, f"[ViT] Extracted {len(frames)} frames")

    # Pad if fewer frames than requested
    while len(frames) < frames_to_sample:
        frames.append(frames[-1])

    # Create unique session ID for this analysis
    session_id = str(uuid.uuid4())
    temp_frames_dir = os.path.join('temp_frames', session_id)
    os.makedirs(temp_frames_dir, exist_ok=True)

    # Process frames
    emit("vit_inference_running", 30, "[ViT] Running inference...")

    frame_results = []
    all_probs = []

    for i, frame in enumerate(frames):
        progress = 30 + int((i / len(frames)) * 60)
        emit("vit_inference_frame", progress, f"[ViT] Processing frame {i+1}/{len(frames)}...")

        try:
            face = crop_face(frame)
            label, conf, probs = predict_image(face)

            # Save frame as image
            frame_filename = f"frame_{i:03d}.jpg"
            frame_path = os.path.join(temp_frames_dir, frame_filename)
            cv2.imwrite(frame_path, face)
            
            # Store frame path as URL format for API
            frame_url = f"/temp_frames/{session_id}/{frame_filename}"

            # Extract real and fake probabilities
            real_prob = float(probs[0]) * 100  # Probability of being REAL
            fake_prob = float(probs[1]) * 100  # Probability of being FAKE

            frame_results.append(
                {
                    "frame_index": i, 
                    "label": label, 
                    "confidence": conf,
                    "frame_path": frame_url,
                    "real_prob": real_prob,
                    "fake_prob": fake_prob
                }
            )
            all_probs.append(probs)
        except Exception as e:
            print(f"[ViT] Error processing frame {i}: {e}")
            continue

    if not all_probs:
        raise RuntimeError("[ViT] No frames processed successfully")

    # Average probabilities
    all_probs = np.array(all_probs)
    mean_probs = all_probs.mean(axis=0)

    final_idx = int(np.argmax(mean_probs))
    final_label = id2label[final_idx]
    final_conf = float(mean_probs[final_idx])

    emit("vit_complete", 95, "[ViT] Inference complete")

    return final_label, final_conf, frame_results, mean_probs
