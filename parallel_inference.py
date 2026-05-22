"""
Parallel Inference Engine
Runs DeepFake model and ViT model concurrently and returns results.
On memory-constrained hosts (Render free tier), use VIT_ONLY=1 (default).
"""

import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Optional, Tuple, Dict, List
import numpy as np

VIT_ONLY = os.environ.get("VIT_ONLY", "1") == "1"


def run_parallel_inference(
    video_path: str,
    frames_to_sample: int = 10,
    progress_cb: Optional[Callable] = None,
    use_vit_only: bool = True,
) -> Dict:
    """
    Run DeepFake model and ViT model in parallel on the same video.

    Args:
        video_path      : Path to the video file
        frames_to_sample: Number of frames to sample
        progress_cb     : Optional progress callback function(stage, progress, message)
        use_vit_only    : If True, return only ViT results; if False, return both

    Returns:
        Dictionary containing:
        {
            'vit': {
                'result': str (REAL/FAKE),
                'confidence': float,
                'frame_results': list,
                'mean_probs': array,
                'error': None or error message
            },
            'deepfake': {
                'result': str (REAL/FAKE),
                'confidence': float,
                'frames': list,
                'heatmap_frames': list,
                'error': None or error message
            }
        }
    """

    results = {
        "vit": {
            "result": None,
            "confidence": None,
            "frame_results": [],
            "mean_probs": None,
            "error": None,
        },
        "deepfake": {
            "result": None,
            "confidence": None,
            "frames": [],
            "heatmap_frames": [],
            "error": None,
        },
    }

    from vit_model import predict_video as predict_vit

    def run_vit():
        """Run ViT model prediction"""
        try:
            label, conf, frame_results, mean_probs = predict_vit(
                video_path, frames_to_sample=frames_to_sample, progress_cb=progress_cb
            )
            results["vit"]["result"] = label
            results["vit"]["confidence"] = conf
            results["vit"]["frame_results"] = frame_results
            results["vit"]["mean_probs"] = mean_probs.tolist() if isinstance(mean_probs, np.ndarray) else mean_probs
        except Exception as e:
            error_msg = f"ViT inference failed: {str(e)}"
            print(f"[ERROR] {error_msg}")
            results["vit"]["error"] = error_msg

    def run_deepfake():
        """Run DeepFake model prediction"""
        try:
            from model import predict_video as predict_deepfake
            label, conf, frames, heatmap_frames = predict_deepfake(
                video_path, frames_to_sample=frames_to_sample, progress_cb=progress_cb
            )
            results["deepfake"]["result"] = label
            results["deepfake"]["confidence"] = conf
            results["deepfake"]["frames"] = frames
            results["deepfake"]["heatmap_frames"] = heatmap_frames
        except Exception as e:
            error_msg = f"DeepFake inference failed: {str(e)}"
            print(f"[ERROR] {error_msg}")
            results["deepfake"]["error"] = error_msg

    if VIT_ONLY:
        run_vit()
        return results

    with ThreadPoolExecutor(max_workers=2) as executor:
        vit_future = executor.submit(run_vit)
        deepfake_future = executor.submit(run_deepfake)
        for future in as_completed([vit_future, deepfake_future]):
            try:
                future.result()
            except Exception as e:
                print(f"[ERROR] Thread execution failed: {e}")

    return results


def get_vit_result_only(
    video_path: str,
    frames_to_sample: int = 10,
    progress_cb: Optional[Callable] = None,
) -> Tuple[str, float, List[Dict], List, List]:
    """
    Run parallel inference and return ViT results with optional deepfake heatmaps.

    Args:
        video_path      : Path to the video file
        frames_to_sample: Number of frames to sample
        progress_cb     : Optional progress callback function

    Returns:
        (result_label, confidence, frame_results, mean_probs, heatmap_frames)
    """
    if VIT_ONLY:
        from vit_model import predict_video as predict_vit, release_vit_memory
        try:
            label, conf, frame_results, mean_probs = predict_vit(
                video_path,
                frames_to_sample=frames_to_sample,
                progress_cb=progress_cb,
            )
            mean_probs_out = mean_probs.tolist() if isinstance(mean_probs, np.ndarray) else mean_probs
            return label, conf, frame_results, mean_probs_out, []
        finally:
            release_vit_memory()

    results = run_parallel_inference(
        video_path,
        frames_to_sample=frames_to_sample,
        progress_cb=progress_cb,
        use_vit_only=True,
    )

    vit_data = results["vit"]
    if vit_data["error"]:
        raise RuntimeError(vit_data["error"])

    heatmap_frames = []
    try:
        deepfake_data = results.get("deepfake", {})
        if deepfake_data.get("heatmap_frames"):
            heatmap_frames = deepfake_data["heatmap_frames"]
    except Exception as e:
        print(f"[INFO] Deepfake heatmaps not available: {e}")

    return (
        vit_data["result"],
        vit_data["confidence"],
        vit_data["frame_results"],
        vit_data["mean_probs"],
        heatmap_frames,
    )
