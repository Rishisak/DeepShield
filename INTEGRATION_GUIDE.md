# DeepFake Detection - ViT Model Integration Guide

## Overview

The system now runs both the **DeepFake model** and **ViT (Vision Transformer) model** in parallel, returning only the ViT model's predictions to the frontend.

---

## Architecture

### Model Pipeline

```
Video Upload → app.py (/predict endpoint)
    ↓
parallel_inference.py (get_vit_result_only)
    ├─ Thread 1: vit_model.predict_video() [ViT model]
    └─ Thread 2: model.predict_video() [DeepFake model - optional reference]
    ↓
ViT Results → Response to Frontend
```

---

## Files

### New Files Created

#### 1. **vit_model.py** - ViT Model Integration

- Loads Vision Transformer from `Wvolf_ViT_Deepfake_Detection/`
- Features:
  - `sample_frames()`: Extract evenly-spaced frames from video
  - `crop_face()`: Detect and crop face using Haar cascade
  - `predict_image()`: Run ViT inference on a single face
  - `predict_video()`: Process entire video and return aggregated results
- Labels: {0: 'Real', 1: 'Fake'}
- Default: 10 frames sampled from video

**Returns:**

```python
(
    label,          # 'Real' or 'Fake'
    confidence,     # float (0-1)
    frame_results,  # list of per-frame predictions
    mean_probs      # averaged probabilities across frames
)
```

#### 2. **parallel_inference.py** - Parallel Execution Engine

- Runs both models concurrently using `ThreadPoolExecutor`
- Key functions:
  - `run_parallel_inference()`: Run both models, returns combined results
  - `get_vit_result_only()`: Run parallel but return only ViT results

**Main Flow:**

```python
# Usage in app.py
result, confidence, frame_results, mean_probs = get_vit_result_only(
    video_path,
    frames_to_sample=10,
    progress_cb=emit_progress
)
```

### Copied Files

#### **Wvolf_ViT_Deepfake_Detection/**

- Pre-trained Vision Transformer model from Hugging Face
- Contains: `pytorch_model.bin`, `config.json`, `preprocessor_config.json`

---

## Modified Files

### 1. **app.py** - Flask Backend

**Changes:**

- Line 11: Import changed from `model` to `parallel_inference`

  ```python
  from parallel_inference import get_vit_result_only
  ```

- **`/predict` endpoint** (~line 100):
  - Now calls `get_vit_result_only()` instead of `predict_video()`
  - Returns ViT results with new fields: `frame_results`, `mean_probs`, `model`
  - Response includes model name: `"model": "ViT (Vision Transformer)"`

- **`/api/analyze` endpoint** (~line 155):
  - Updated to use ViT model

- **`/history` POST endpoint** (~line 175):
  - Now stores `frame_results` and `mean_probs` for ViT data

### 2. **db.py** - Database Schema

**Changes:**

- Added migrations for new columns:
  - `frame_results` (JSON): Per-frame predictions from ViT
  - `mean_probs` (JSON): Aggregated probability scores

### 3. **requirements.txt**

**Added:**

- `transformers` (for Hugging Face model loading)

---

## API Response Format

### Success Response (200 OK)

```json
{
  "result": "Real",
  "confidence": 0.94,
  "frame_results": [
    {
      "frame_index": 0,
      "label": "Real",
      "confidence": 0.92
    },
    {
      "frame_index": 1,
      "label": "Real",
      "confidence": 0.95
    }
  ],
  "mean_probs": [0.94, 0.06],
  "frames": ["Real", "Real", ...],
  "heatmap_frames": [],
  "file_hash": "abc123...",
  "cached": false,
  "model": "ViT (Vision Transformer)"
}
```

### Output Fields

| Field           | Type    | Description                                   |
| --------------- | ------- | --------------------------------------------- |
| `result`        | string  | 'Real' or 'Fake' - ViT prediction             |
| `confidence`    | float   | Confidence of ViT prediction (0-1)            |
| `frame_results` | array   | Per-frame predictions with confidence         |
| `mean_probs`    | array   | Averaged probabilities [prob_real, prob_fake] |
| `model`         | string  | Model name for tracking                       |
| `cached`        | boolean | Whether result was cached                     |

---

## Processing Flow

### Step 1: Video Upload

- User uploads video via frontend
- Saved to `uploads/` folder

### Step 2: Hash-based Caching

- Compute SHA-256 hash of video file
- Check cache in database
- If found, return cached ViT results immediately

### Step 3: Parallel Inference

- **Thread 1 (ViT)**:
  1. Sample 10 evenly-spaced frames
  2. Detect and crop faces
  3. Run ViT inference on each frame
  4. Average probabilities across frames
  5. Return final label and confidence

- **Thread 2 (DeepFake)** (runs simultaneously, not used):
  1. Extract frames and GradCAM
  2. Run DeepFake model
  3. Collect results

### Step 4: Return ViT Results

- Both threads complete
- Return only ViT results to frontend
- Store in cache for future requests

---

## Configuration

### Frame Sampling

- **Default**: 10 frames
- **Quick scan**: 3 frames (adjustable in app.py)
- **Method**: Evenly-spaced indices from video

### Model Paths

- **ViT Model**: `./Wvolf_ViT_Deepfake_Detection/`
- **DeepFake Model**: `./combined.pth`

### Device

- Automatically uses GPU if CUDA available
- Falls back to CPU otherwise

---

## Testing

### 1. Import Verification

```bash
# Test ViT model loading
python -c "import vit_model; print('ViT loaded')"

# Test parallel inference
python -c "import parallel_inference; print('Parallel inference loaded')"

# Test Flask app
python -c "from app import app; print('App loaded')"
```

### 2. Test Prediction

```bash
# Start Flask app
python app.py

# Send test video (via UI or API)
curl -F "video=@test_video.mp4" \
     -F "scan_mode=deep" \
     -F "session_id=test123" \
     http://localhost:5000/predict
```

---

## Troubleshooting

### Issue: Model Loading Fails

**Error**: `[ViT] Model not loaded!`
**Solution**: Ensure `Wvolf_ViT_Deepfake_Detection/` folder exists with model files

### Issue: CUDA Out of Memory

**Error**: `CUDA out of memory`
**Solution**:

- Set batch size smaller in code (already using frame-by-frame)
- Run on CPU by setting `DEVICE = "cpu"` in vit_model.py

### Issue: Inference Too Slow

**Optimization**:

- Reduce frame samples: `frames_to_sample=5`
- Enable GPU acceleration
- Check video resolution (preprocessing should handle it)

---

## Performance Notes

### Inference Time (Approximate)

- **ViT Model**: ~5-15 seconds per video (GPU)
- **Frame Extraction**: ~2-5 seconds
- **Total**: ~7-20 seconds per video

### Model Sizes

- **ViT Model**: ~350MB (pytorch_model.bin)
- **DeepFake Model**: ~200MB (combined.pth)
- **Combined**: ~550MB

---

## Next Steps

1. **Test with sample videos**
2. **Monitor model accuracy** on your dataset
3. **Adjust frame sampling** if needed
4. **Fine-tune thresholds** if necessary
5. **Deploy to production** server

---

## Summary

✅ ViT model integrated with parallel inference  
✅ DeepFake model still running in background (optional)  
✅ Frontend receives ViT predictions only  
✅ Database stores detailed ViT analytics  
✅ Caching enabled for repeated videos  
✅ All files consolidated in DeepFake-main/
