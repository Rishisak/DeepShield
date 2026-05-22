import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from '@vladmandic/face-api';

// ─── Face-API Initialization ────────────────────────────────────────────────
let faceApiReady = false;

async function initFaceApi() {
  if (faceApiReady) return;
  const MODEL_URL = '/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  faceApiReady = true;
}

// ─── Frame Sampling + Face Detection ────────────────────────────────────────
async function validateVideoHasFaces(file) {
  await initFaceApi();

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.addEventListener('loadedmetadata', async () => {
      const duration = video.duration;
      // Sample at 10%, 40%, 70% through the video
      const sampleTimes = [
        Math.max(0.5, duration * 0.10),
        Math.max(0.5, duration * 0.40),
        Math.max(0.5, duration * 0.70),
      ];

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 });

      for (const t of sampleTimes) {
        // Seek to timestamp
        await new Promise((res) => {
          const timeout = setTimeout(res, 500);
          const onSeeked = () => { clearTimeout(timeout); res(); };
          video.currentTime = t;
          video.addEventListener('seeked', onSeeked, { once: true });
        });

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const detections = await faceapi.detectAllFaces(canvas, options);

        if (detections.length > 0) {
          URL.revokeObjectURL(url);
          video.remove();
          resolve({ valid: true, facesFound: detections.length });
          return;
        }
      }

      URL.revokeObjectURL(url);
      video.remove();
      resolve({ valid: false, facesFound: 0 });
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      // If we can't load metadata, let it pass through to the backend
      resolve({ valid: true, facesFound: -1 });
    });
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function UploadPanel({ onFileSelect, isProcessing, uploadProgress, progressStatus }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null); // null | string
  const [rejectedFileName, setRejectedFileName] = useState(null);
  const [recordMode, setRecordMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [scanMode, setScanMode] = useState('deep');
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (webcamRef.current) webcamRef.current.srcObject = stream;
    } catch(err) {
      console.error(err);
      alert("Could not access webcam.");
    }
  };

  const stopWebcam = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
       webcamRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  const startRecording = () => {
    if (!webcamRef.current || !webcamRef.current.srcObject) return;
    setIsRecording(true);
    let chunks = [];
    const stream = webcamRef.current.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = (e) => {
        if(e.data && e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], 'webcam_capture.webm', { type: 'video/webm' });
        setIsRecording(false);
        setRecordMode(false);
        stopWebcam();
        handleFile(file);
    };
    mediaRecorderRef.current.start();
    setTimeout(() => {
        if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, 3000); 
  };

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('Please upload a video file.');
      return;
    }

    // Reset any previous state
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setValidationError(null);
    setRejectedFileName(null);
    setIsValidating(true);

    try {
      const result = await validateVideoHasFaces(file);

      if (!result.valid) {
        setRejectedFileName(file.name);
        setValidationError(
          'No human faces detected in this video. DeepShield only analyzes videos containing real human faces. Videos of animals, nature, or non-human content cannot be analyzed.'
        );
        setIsValidating(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Valid — show preview
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setVideoPreviewUrl(url);
    } catch (err) {
      console.error('Face validation error:', err);
      // On unexpected error, let it through
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setVideoPreviewUrl(url);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleInputChange = (e) => { const file = e.target.files[0]; handleFile(file); };
  const handleAnalyze = () => {
    if (selectedFile) {
      onFileSelect(selectedFile, scanMode);
    }
  };
  const handleRemove = () => {
    setSelectedFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setValidationError(null);
    setRejectedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="glass-card"
      style={{ padding: 28, flex: 1, minWidth: 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(0,212,255,0.15)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upload Video</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Drag & drop or turn on webcam</p>
        </div>
        <button
          onClick={() => {
             setRecordMode(!recordMode);
             if (!recordMode) setTimeout(startWebcam, 100);
             else stopWebcam();
          }}
          disabled={isProcessing}
          style={{
             background: recordMode ? 'rgba(239,68,68,0.2)' : 'rgba(0,212,255,0.1)',
             border: `1px solid ${recordMode ? 'rgba(239,68,68,0.4)' : 'rgba(0,212,255,0.3)'}`,
             color: recordMode ? '#f87171' : '#00d4ff',
             padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
          }}>
          {recordMode ? 'Cancel Webcam' : 'Use Webcam'}
        </button>
      </div>

      {/* Hidden file input always present */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <AnimatePresence mode="wait">

        {/* ── VALIDATING STATE ── */}
        {isValidating && (
          <motion.div
            key="validating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: 220, gap: 20,
              borderRadius: 16, border: '2px dashed rgba(0,212,255,0.25)',
              background: 'rgba(0,212,255,0.03)', padding: 32,
            }}
          >
            {/* Spinning face scan icon */}
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTopColor: '#00d4ff',
                  borderRightColor: 'rgba(0,212,255,0.3)',
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTopColor: '#a855f7',
                  borderLeftColor: 'rgba(168,85,247,0.3)',
                }}
              />
              {/* Face icon in center */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M3 21v-1a9 9 0 0118 0v1" />
                </svg>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>
                Scanning for faces…
              </p>
              <p style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.6 }}>
                Checking if this video contains human faces<br />
                before allowing upload
              </p>
            </div>

            {/* Animated dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4ff' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── REJECTION STATE ── */}
        {!isValidating && validationError && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              borderRadius: 16, border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.05)', padding: 28,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 16, textAlign: 'center',
            }}
          >
            {/* X icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 250, delay: 0.1 }}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239,68,68,0.2)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.div>

            <div>
              <p style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>
                Video Rejected
              </p>
              {rejectedFileName && (
                <p style={{
                  fontSize: '0.72rem', color: '#64748b',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 10, wordBreak: 'break-all',
                }}>
                  {rejectedFileName}
                </p>
              )}
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.7 }}>
                {validationError}
              </p>
            </div>

            {/* What's allowed */}
            <div style={{
              width: '100%', borderRadius: 12,
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.1)',
              padding: '12px 16px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: '0.72rem', color: '#00d4ff', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                ✓ Accepted video types
              </p>
              {[
                '👤 Face-swap deepfakes',
                '🎤 Talking-head videos',
                '📹 Political speeches / interviews',
                '🤳 Selfie or webcam recordings',
              ].map((item, i) => (
                <p key={i} style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.8 }}>{item}</p>
              ))}
              <p style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600, marginTop: 8, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                ✗ Not accepted
              </p>
              {[
                '🐆 Nature / wildlife footage',
                '⚽ Sports broadcasts (no close face)',
                '🌄 Landscape / scenery videos',
              ].map((item, i) => (
                <p key={i} style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.8 }}>{item}</p>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setValidationError(null); setRejectedFileName(null); fileInputRef.current?.click(); }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12,
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00d4ff', fontFamily: "'Outfit', sans-serif",
                fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                letterSpacing: 0.3,
              }}
            >
              Try a Different Video
            </motion.button>
          </motion.div>
        )}

        {/* ── DROPZONE / WEBCAM (idle) ── */}
        {!isValidating && !validationError && !selectedFile && (
          recordMode ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', height: 260, display: 'flex', flexDirection: 'column' }}
            >
               <video ref={webcamRef} autoPlay playsInline muted style={{ flex: 1, width: '100%', objectFit: 'cover' }} />
               <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  <button onClick={startRecording} disabled={isRecording} style={{
                     background: isRecording ? '#ef4444' : '#22c55e', color: '#fff',
                     border: 'none', padding: '10px 24px', borderRadius: 24, fontSize: '0.9rem', fontWeight: 600,
                     cursor: isRecording ? 'not-allowed' : 'pointer', boxShadow: '0 0 16px rgba(0,0,0,0.5)'
                  }}>
                     {isRecording ? 'Recording (3s)...' : 'Record 3s Clip'}
                  </button>
               </div>
            </motion.div>
          ) : (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ marginBottom: 16 }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="M8 17l4-5 4 5" />
                </svg>
              </motion.div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 6 }}>
                Drop your video here
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 10, opacity: 0.8 }}>
                MP4, MOV, AVI, WebM — Max 500MB
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                background: 'rgba(0,212,255,0.06)',
                border: '1px solid rgba(0,212,255,0.15)',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2.5">
                  <circle cx="12" cy="8" r="5" /><path d="M3 21v-1a9 9 0 0118 0v1" />
                </svg>
                <span style={{ fontSize: '0.68rem', color: '#00d4ff', fontWeight: 600, letterSpacing: 0.4 }}>
                  HUMAN FACES REQUIRED
                </span>
              </div>
            </motion.div>
          )
        )}

        {/* ── PREVIEW STATE ── */}
        {!isValidating && !validationError && selectedFile && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ position: 'relative' }}
          >
            {/* Validated badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, marginBottom: 12,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600, letterSpacing: 0.4 }}>
                HUMAN FACE VERIFIED
              </span>
            </motion.div>

            {/* Video Preview */}
            <div style={{
              position: 'relative',
              borderRadius: 16,
              border: '1px solid rgba(0,212,255,0.15)',
              marginBottom: 16,
              background: '#000',
              overflow: 'visible',
            }}>
              <video
                key={videoPreviewUrl}
                src={videoPreviewUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: '100%',
                  height: 220,
                  objectFit: 'contain',
                  display: 'block',
                  background: '#000',
                  borderRadius: 16,
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 1,
                }}
              />

              {/* Scan line during processing */}
              {isProcessing && <div className="scan-line" />}

              {/* Heatmap overlays during processing */}
              {isProcessing && (
                <>
                  {[
                    { top: '25%', left: '35%', size: 60 },
                    { top: '30%', left: '55%', size: 45 },
                    { top: '45%', left: '42%', size: 35 },
                  ].map((box, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.6, 0.2] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
                      style={{
                        position: 'absolute',
                        top: box.top, left: box.left,
                        width: box.size, height: box.size,
                        border: '2px solid rgba(0,212,255,0.6)',
                        borderRadius: 6, boxShadow: '0 0 12px rgba(0,212,255,0.3)',
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {/* File Info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.08)',
              marginBottom: 16,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,212,255,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {formatSize(selectedFile.size)} • {selectedFile.type.split('/')[1]?.toUpperCase()}
                </p>
              </div>
              {!isProcessing && (
                <button onClick={handleRemove} style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                  color: '#ef4444', fontSize: '0.75rem', transition: 'all 0.2s',
                }}>
                  ✕
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                  fontSize: '0.75rem', color: '#94a3b8',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00d4ff' }}
                    />
                    {progressStatus || 'Processing...'}
                  </span>
                  <span style={{ color: uploadProgress >= 98 ? '#a855f7' : '#94a3b8' }}>
                    {Math.floor(uploadProgress)}%
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%`, transition: 'width 0.4s ease' }} />
                </div>
              </motion.div>
            )}

            {/* Scan Mode Toggle */}
            {!isProcessing && (
              <div style={{
                display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20, overflow: 'hidden'
              }}>
                 <button
                   onClick={() => setScanMode('quick')}
                   style={{
                     flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                     background: scanMode === 'quick' ? 'rgba(0,212,255,0.15)' : 'transparent',
                     color: scanMode === 'quick' ? '#00d4ff' : '#64748b',
                   }}
                 >
                   ⚡ Quick Scan
                 </button>
                 <button
                   onClick={() => setScanMode('deep')}
                   style={{
                     flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                     background: scanMode === 'deep' ? 'rgba(168,85,247,0.15)' : 'transparent',
                     color: scanMode === 'deep' ? '#a855f7' : '#64748b',
                   }}
                 >
                   🧠 Deep Scan
                 </button>
              </div>
            )}

            {/* Analyze Button */}
            {!isProcessing && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="neon-button"
                onClick={handleAnalyze}
                style={{ width: '100%', fontSize: '0.95rem', padding: '14px 24px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Analyze with AI
                </span>
              </motion.button>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
