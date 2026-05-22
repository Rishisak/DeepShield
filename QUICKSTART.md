# Quick Start Guide

## Setup

### 1. Navigate to DeepFake-main folder

```bash
cd c:\Users\lvssk\Downloads\FinalPExpo\DeepFake-main
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Flask server

```bash
python app.py
```

The server will start on `http://localhost:5000`

---

## What's Changed

### Before

- Only DeepFake model (MesoNet + EfficientNet + FFT) was used
- Output: DeepFake model's prediction + GradCAM heatmaps

### After

- **ViT model** (Vision Transformer) now runs in parallel
- Both models execute simultaneously
- **Frontend receives only ViT predictions** ✅
- DeepFake model runs in background for reference
- Frame predictions and aggregated probabilities returned

---

## API Usage

### Predict Endpoint

```bash
POST /predict
Content-Type: multipart/form-data

Parameters:
- video: (file) Video file to analyze
- scan_mode: (string) 'quick' or 'deep' [default: 'deep']
- user_email: (string) Optional email for notifications
- session_id: (string) WebSocket session ID for live progress
```

**Response:**

```json
{
  "result": "Real",
  "confidence": 0.94,
  "frame_results": [...],
  "mean_probs": [0.94, 0.06],
  "model": "ViT (Vision Transformer)",
  "cached": false
}
```

---

## Project Structure

```
DeepFake-main/
├── app.py                          # Flask backend (MODIFIED)
├── vit_model.py                    # ViT integration (NEW)
├── parallel_inference.py           # Parallel runner (NEW)
├── model.py                        # DeepFake model (original)
├── db.py                           # Database (MODIFIED)
├── requirements.txt                # Dependencies (MODIFIED)
├── Wvolf_ViT_Deepfake_Detection/   # ViT model files (NEW)
├── combined.pth                    # DeepFake weights
├── INTEGRATION_GUIDE.md            # Detailed docs (NEW)
├── src/                            # React frontend
└── [other files...]
```

---

## Testing

### 1. Check model loading

```bash
python -c "import vit_model; print('✓ ViT loaded')"
python -c "import parallel_inference; print('✓ Parallel inference ready')"
```

### 2. Run Flask server

```bash
python app.py
```

### 3. Test via frontend or curl

```bash
# Using curl
curl -F "video=@sample.mp4" http://localhost:5000/predict

# Or use frontend at http://localhost:5000
```

---

## Important Notes

1. **Models load on startup** - First run may take 30-60 seconds
2. **GPU recommended** - Inference is faster with CUDA
3. **Model size** - Combined models are ~550MB
4. **Cache enabled** - Repeated videos return instantly
5. **Frame sampling** - 10 frames extracted from each video

---

## Troubleshooting

| Issue                                                 | Solution                                           |
| ----------------------------------------------------- | -------------------------------------------------- |
| `ModuleNotFoundError: No module named 'transformers'` | Run `pip install transformers`                     |
| `CUDA out of memory`                                  | Models default to CPU automatically                |
| `Wvolf_ViT_Deepfake_Detection not found`              | Ensure folder exists in DeepFake-main/             |
| Models take too long to load                          | Install `pytorch` GPU version for faster inference |

---

## Next: Frontend Integration

The frontend (React in `src/`) already expects responses in this format. To display ViT results:

```javascript
// src/App.jsx or components/ResultPanel.jsx
const response = await fetch('/predict', ...);
const data = await response.json();

// Now use ViT results:
console.log(data.result);        // 'Real' or 'Fake'
console.log(data.confidence);    // 0.94
console.log(data.frame_results); // Per-frame data
console.log(data.model);         // 'ViT (Vision Transformer)'
```

---

## Summary

✅ Both models running in parallel  
✅ ViT output returned to frontend  
✅ Database stores detailed analytics  
✅ Performance optimized with threading  
✅ Ready for production deployment
