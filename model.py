import os, cv2, shutil
import numpy as np
from PIL import Image

import torch
import torch.nn as nn
from torchvision import transforms
from efficientnet_pytorch import EfficientNet
from gradcam import GradCAM

# ==============================
# CONFIG
# ==============================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMG_SIZE = 224
FRAMES_PER_VIDEO = 10
MODEL_PATH = "combined.pth"

# ==============================
# TRANSFORMS (SAME AS TRAINING)
# ==============================
EVAL_TF = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# ==============================
# HELPERS
# ==============================

def evenly_spaced(n, k):
    if k <= 1:
        return [n // 2]
    return np.linspace(0, n - 1, k, dtype=int)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def detect_and_crop_face(frame, size):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) > 0:
        x, y, w, h = faces[0]
        crop = frame[y:y+h, x:x+w]
    else:
        h, w, _ = frame.shape
        min_dim = min(h, w)
        sx = (w - min_dim) // 2
        sy = (h - min_dim) // 2
        crop = frame[sy:sy+min_dim, sx:sx+min_dim]

    crop = cv2.resize(crop, (size, size))
    crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    return crop


def make_fft_tensor(pil_img):
    img = np.array(pil_img)
    fft = np.fft.fft2(img, axes=(0,1))
    fft_shift = np.fft.fftshift(fft)
    mag = np.log(np.abs(fft_shift) + 1)

    mag = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)
    mag = mag.astype(np.uint8)

    return transforms.ToTensor()(mag)

# ==============================
# MODEL
# ==============================

class MesoNetBranch(nn.Module):
    def __init__(self, out_dim=128):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3,8,3,padding=1), nn.ReLU(), nn.BatchNorm2d(8), nn.MaxPool2d(2),
            nn.Conv2d(8,8,5,padding=2), nn.ReLU(), nn.BatchNorm2d(8), nn.MaxPool2d(2),
            nn.Conv2d(8,16,5,padding=2), nn.ReLU(), nn.BatchNorm2d(16), nn.MaxPool2d(2),
            nn.Conv2d(16,16,5,padding=2), nn.ReLU(), nn.BatchNorm2d(16),
            nn.AdaptiveAvgPool2d((4,4))
        )
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(16*4*4,256), nn.ReLU(), nn.Dropout(0.35),
            nn.Linear(256,out_dim)
        )

    def forward(self,x):
        return self.fc(self.features(x))


class EfficientNetBranch(nn.Module):
    def __init__(self,out_dim=512):
        super().__init__()
        self.backbone = EfficientNet.from_pretrained("efficientnet-b4")
        in_feat = self.backbone._fc.in_features
        self.backbone._fc = nn.Identity()

        self.proj = nn.Sequential(
            nn.Linear(in_feat,512),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(512,out_dim)
        )

    def forward(self,x):
        return self.proj(self.backbone(x))


class FFTBranch(nn.Module):
    def __init__(self,out_dim=128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3,16,3,padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(16,32,3,padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32,64,3,padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d((4,4)),
            nn.Flatten(),
            nn.Linear(64*4*4,256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256,out_dim)
        )

    def forward(self,x):
        return self.net(x)


class CombinedDeepfakeModel(nn.Module):
    def __init__(self,num_classes=2,lstm_hidden=384):
        super().__init__()
        self.meso = MesoNetBranch(128)
        self.eff  = EfficientNetBranch(512)
        self.fft  = FFTBranch(128)

        fused = 768

        self.temporal = nn.Sequential(
            nn.Conv1d(fused,fused,3,padding=1),
            nn.GELU(),
            nn.BatchNorm1d(fused),
            nn.Conv1d(fused,fused,3,padding=1),
            nn.GELU(),
            nn.BatchNorm1d(fused)
        )

        self.lstm = nn.LSTM(
            fused, lstm_hidden,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )

        self.attn = nn.Linear(lstm_hidden*2,1)

        self.head = nn.Sequential(
            nn.Linear(lstm_hidden*2,256),
            nn.GELU(),
            nn.Dropout(0.4),
            nn.Linear(256,num_classes)
        )

    def forward(self,rgb_seq,fft_seq):
        B,T,C,H,W = rgb_seq.shape

        r = rgb_seq.view(B*T,C,H,W)
        f = fft_seq.view(B*T,C,H,W)

        feat = torch.cat([
            self.meso(r),
            self.eff(r),
            self.fft(f)
        ], dim=1)

        feat = feat.view(B,T,-1)

        tc = self.temporal(feat.permute(0,2,1)).permute(0,2,1)

        lstm_out,_ = self.lstm(tc)

        attn_w = torch.softmax(self.attn(lstm_out), dim=1)
        ctx = (attn_w * lstm_out).sum(dim=1)

        return self.head(ctx)

# ==============================
# LOAD MODEL (optional — ViT is primary for API responses)
# ==============================
model = None

if os.path.isfile(MODEL_PATH):
    try:
        model = CombinedDeepfakeModel().to(DEVICE)
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True))
        model.eval()
        print("[OK] DeepFake ensemble model loaded")
    except Exception as e:
        print(f"[WARN] DeepFake model failed to load: {e}")
        model = None
else:
    print(f"[WARN] {MODEL_PATH} not found — DeepFake heatmaps disabled; ViT inference still works")

# ==============================
# PREDICT
# ==============================

def predict_video(video_path, threshold=0.5, frames_to_sample=10, progress_cb=None):
    """
    Analyse a video for deepfake content.

    Args:
        video_path      : Path to the video file.
        threshold       : Fake-class probability threshold (default 0.5).
        frames_to_sample: Number of frames to extract and analyse.
        progress_cb     : Optional callable(stage, progress, message).
                          Called at key stages so callers can track progress.

    Returns:
        (label, confidence, frame_urls, heatmap_urls)
    """

    def emit(stage, progress, message=''):
        if progress_cb:
            try:
                progress_cb(stage, progress, message)
            except Exception:
                pass  # never let a progress callback crash inference

    if model is None:
        raise RuntimeError("DeepFake ensemble weights not available (combined.pth missing)")

    tmp_dir = "temp_frames"
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)
    os.makedirs(tmp_dir)

    # ── Stage: Frame extraction ──────────────────────────────────────────────
    emit('frames_extracting', 15, 'Extracting video frames...')

    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    idxs = set(evenly_spaced(total, frames_to_sample))

    saved = []
    original_bgr = []   # keep original BGR crops for heatmap overlay
    fid = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if fid in idxs:
            face_rgb = detect_and_crop_face(frame, IMG_SIZE)
            face_bgr = cv2.cvtColor(face_rgb, cv2.COLOR_RGB2BGR)
            path = os.path.join(tmp_dir, f"f{len(saved)}.jpg")
            cv2.imwrite(path, face_bgr)
            saved.append(path)
            original_bgr.append(face_bgr)

        fid += 1

    cap.release()

    emit('frames_extracted', 25, f'Extracted {len(saved)} frames')

    if not saved:
        raise RuntimeError("No frames extracted")

    # Pad if fewer frames than requested
    while len(saved) < frames_to_sample:
        saved.append(saved[-1])
        original_bgr.append(original_bgr[-1])

    # ── Stage: Build tensors ─────────────────────────────────────────────────
    emit('building_tensors', 30, 'Preparing tensors...')

    rgb_list, fft_list = [], []

    for i, p in enumerate(saved):
        progress = 30 + int((i / len(saved)) * 40)
        emit('inference_frame', progress, f'Processing frame {i+1}/{len(saved)}...')
        pil = Image.open(p).convert("RGB")
        rgb_list.append(EVAL_TF(pil))
        fft_list.append(make_fft_tensor(pil))

    # ── Stage: Neural inference ──────────────────────────────────────────────
    emit('inference_running', 72, 'Running neural network inference...')

    rgb_t = torch.stack(rgb_list).unsqueeze(0).to(DEVICE)
    fft_t = torch.stack(fft_list).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(rgb_t, fft_t)
        probs = torch.softmax(logits, dim=1)[0]

    real_p = probs[0].item()
    fake_p = probs[1].item()

    label = "FAKE" if fake_p >= threshold else "REAL"
    conf  = fake_p if label == "FAKE" else real_p

    # ── Stage: GradCAM heatmaps ──────────────────────────────────────────────
    emit('generating_heatmaps', 80, 'Generating GradCAM heatmaps...')

    gradcam = GradCAM(model, DEVICE)
    heatmap_paths = []

    for i, (rgb_tensor, fft_tensor, orig_bgr) in enumerate(
            zip(rgb_list, fft_list, original_bgr)):
        try:
            # Single-frame sequence: (1, 1, 3, H, W)
            rgb_seq = rgb_tensor.unsqueeze(0).unsqueeze(0)
            fft_seq = fft_tensor.unsqueeze(0).unsqueeze(0)

            heatmap_np = gradcam.generate(rgb_seq, fft_seq)

            if heatmap_np is not None:
                blended = gradcam.overlay(orig_bgr, heatmap_np, alpha=0.50)
                hpath = os.path.join(tmp_dir, f"heatmap_f{i}.jpg")
                cv2.imwrite(hpath, blended)
                heatmap_paths.append(hpath)
            else:
                heatmap_paths.append(None)

        except Exception as e:
            print(f"[GradCAM] frame {i} failed: {e}")
            heatmap_paths.append(None)

    gradcam.remove_hooks()

    emit('complete', 96, 'Finalizing results...')

    frame_urls   = ["/" + p.replace("\\", "/") for p in saved]
    heatmap_urls = [
        "/" + p.replace("\\", "/") if p else None
        for p in heatmap_paths
    ]

    return label, conf, frame_urls, heatmap_urls