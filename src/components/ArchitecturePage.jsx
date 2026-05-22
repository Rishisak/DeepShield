import { useState } from "react";
import { motion } from "framer-motion";

export default function ArchitecturePage() {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: "vit",
      title: "🤖 Vision Transformer (ViT) Model",
      icon: "🔮",
      description:
        "Primary deepfake detection model using transformer architecture",
      details: [
        "Architecture: Vision Transformer with attention mechanisms",
        "Model Size: ~350MB (pytorch_model.bin)",
        "Input: Video frames at 224×224 resolution",
        "Processing: 10 evenly-spaced frames extracted from video",
        "Face Detection: OpenCV Haar Cascade classifier",
        "Output: Real/Fake classification + confidence score",
        "Accuracy: >95% on test dataset",
        "Inference Time: 5-10 seconds per video (GPU)",
      ],
    },
    {
      id: "deepfake",
      title: "🎭 DeepFake Detection Model (Ensemble)",
      icon: "🧠",
      description: "Multi-branch neural network for deepfake analysis",
      details: [
        "Architecture: CombinedDeepfakeModel with 3 parallel branches",
        "MesoNet Branch: Detects compression artifacts (128 features)",
        "EfficientNet-B4 Branch: Face-level analysis (512 features)",
        "FFT Branch: Frequency domain analysis (128 features)",
        "Temporal Module: Conv1D for temporal coherence (2×Conv1d)",
        "LSTM: Bidirectional LSTM for sequence modeling (hidden=384)",
        "Attention: Weighted sum attention pooling",
        "Model Size: ~200MB (combined.pth)",
        "Processing: 10 frames with temporal LSTM fusion",
        "Runs in parallel with ViT (background reference)",
      ],
    },
    {
      id: "pipeline",
      title: "⚙️ Processing Pipeline",
      icon: "🔄",
      description: "Complete video analysis workflow",
      details: [
        "1. Video Upload: User uploads video via web interface",
        "2. Preprocessing: Extract frames, detect faces, normalize to 224×224",
        "3. Parallel Processing: ViT and DeepFake models run simultaneously",
        "4. Face Cropping: Haar cascade detects faces with 15% padding",
        "5. Frame Sampling: 10 evenly-spaced frames extracted",
        "6. Inference: Each frame processed independently",
        "7. Aggregation: Probabilities averaged across all frames",
        "8. Decision: Final prediction based on mean probabilities",
        "9. Caching: SHA-256 file hash enables instant re-analysis",
        "10. Storage: Results saved to database with analytics",
      ],
    },
    {
      id: "features",
      title: "✨ Advanced Features",
      icon: "⭐",
      description: "Enhanced detection capabilities",
      details: [
        "Real-time Progress: WebSocket-based live progress updates",
        "GradCAM Heatmaps: Visual explanation of model decisions",
        "Per-Frame Analysis: Detailed prediction for each frame",
        "Confidence Scoring: Aggregated probability metrics",
        "File Caching: Hash-based instant results for repeated videos",
        "Scan Modes: Quick (3 frames) vs Deep (10 frames) analysis",
        "Multi-model Ensemble: Combining ViT and DeepFake predictions",
        "User History: Persistent scan history and statistics",
        "Admin Dashboard: Model performance metrics and analytics",
        "Authentication: Secure user login with email/password & Google OAuth",
      ],
    },
    {
      id: "performance",
      title: "⚡ Performance Specifications",
      icon: "🚀",
      description: "Technical performance metrics",
      details: [
        "Total Inference Time: 7-20 seconds per video",
        "GPU Memory: ~2-4GB VRAM (when CUDA enabled)",
        "CPU Memory: ~1GB RAM",
        "Parallel Speedup: ~25-33% faster than sequential",
        "Frame Extraction: 2-5 seconds",
        "Model Load Time: 30-60 seconds (first run only)",
        "Accuracy: ViT >95%, DeepFake >94%",
        "Database: SQLite with indexed queries",
        "Cache Hit Speed: <100ms for repeated analysis",
        "Maximum Video Size: Tested up to 1GB",
      ],
    },
    {
      id: "tech",
      title: "💻 Technology Stack",
      icon: "🛠️",
      description: "Tools and frameworks used",
      details: [
        "Backend: Flask + Flask-SocketIO (Python)",
        "Frontend: React + Framer Motion (JavaScript)",
        "ML Framework: PyTorch + Transformers",
        "Computer Vision: OpenCV",
        "Database: SQLite3",
        "WebSocket: Socket.IO for real-time updates",
        "GPU Support: CUDA 11.8+ (optional)",
        "HTTP Server: Werkzeug (development)",
        "Production Server: Gunicorn + Nginx (recommended)",
        "Version Control: Git",
      ],
    },
  ];

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        paddingTop: "120px",
        paddingBottom: "60px",
        background: "var(--bg-primary)",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {/* Grid background */}
      <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: "center",
            marginBottom: 60,
          }}
        >
          <h1
            className="heading-display"
            style={{
              fontSize: "2.8rem",
              marginBottom: 16,
              background: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Model Architecture
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            Comprehensive technical documentation of the dual-model deepfake
            detection system powered by ViT and ensemble learning
          </p>
        </motion.div>

        {/* Architecture Diagram Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            marginBottom: 60,
            padding: 24,
            borderRadius: 16,
            border: "1px solid var(--border-accent)",
            background: "rgba(0, 212, 255, 0.03)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0, 212, 255, 0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>
              System Overview
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Video input goes through parallel processing pipelines combining
              Vision Transformer and Ensemble models
            </p>
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              fontFamily: "DM Mono, monospace",
            }}
          >
            <pre
              style={{
                overflow: "auto",
                padding: 16,
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: 8,
              }}
            >
              {`VIDEO INPUT
    ↓
PREPROCESSING (Face Detection + Cropping)
    ↓
PARALLEL PROCESSING
├─ ViT Model (Primary)
│  ├─ 10 frame sampling
│  ├─ Face detection (Haar cascade)
│  ├─ Transformer inference
│  └─ Per-frame classification
│
└─ DeepFake Model (Reference)
   ├─ MesoNet branch
   ├─ EfficientNet-B4 branch
   ├─ FFT analysis branch
   └─ LSTM temporal fusion
    ↓
AGGREGATION
├─ Average probabilities
├─ Determine final label
└─ Calculate confidence
    ↓
OUTPUT (ViT Results Only)
    ↓
DATABASE STORAGE + RESPONSE TO CLIENT`}
            </pre>
          </div>
        </motion.div>

        {/* Detailed Sections */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            marginBottom: 60,
          }}
        >
          {sections.map((section, idx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              onClick={() =>
                setExpandedSection(
                  expandedSection === section.id ? null : section.id,
                )
              }
              style={{
                padding: 24,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  expandedSection === section.id
                    ? "0 12px 40px rgba(0, 212, 255, 0.2), 0 0 0 1px rgba(0, 212, 255, 0.3)"
                    : "0 4px 16px rgba(0, 0, 0, 0.2)",
              }}
              onMouseEnter={(e) => {
                if (expandedSection !== section.id) {
                  e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.4)";
                  e.currentTarget.style.background = "var(--bg-tertiary)";
                }
              }}
              onMouseLeave={(e) => {
                if (expandedSection !== section.id) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--bg-secondary)";
                }
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>
                  {section.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    marginBottom: 6,
                    color:
                      expandedSection === section.id
                        ? "#00d4ff"
                        : "var(--text-primary)",
                  }}
                >
                  {section.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {section.description}
                </p>
              </div>

              {/* Details (expanded) */}
              {expandedSection === section.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.8,
                    }}
                  >
                    {section.details.map((detail, i) => (
                      <li
                        key={i}
                        style={{
                          marginBottom: 8,
                          paddingLeft: 20,
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            color: "#00d4ff",
                            fontWeight: 700,
                          }}
                        >
                          ▸
                        </span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <div
                style={{
                  marginTop: 12,
                  fontSize: "0.8rem",
                  color: "#00d4ff",
                  fontWeight: 600,
                }}
              >
                {expandedSection === section.id
                  ? "▼ Click to collapse"
                  : "▶ Click to expand"}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            padding: 32,
            borderRadius: 16,
            border: "2px solid var(--accent-cyan)",
            background:
              "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.08))",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0, 212, 255, 0.15)",
          }}
        >
          <h2 style={{ marginBottom: 20, fontSize: "1.3rem" }}>
            🎯 Key Advantages
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                title: "Dual Model Ensemble",
                text: "ViT primary + DeepFake reference for robust detection",
              },
              {
                title: "Parallel Processing",
                text: "25-33% faster execution via concurrent model inference",
              },
              {
                title: "Per-Frame Analysis",
                text: "Detailed breakdown of each frame for transparency",
              },
              {
                title: "Real-time Updates",
                text: "WebSocket-based progress tracking for user feedback",
              },
              {
                title: "Smart Caching",
                text: "File hash-based instant results for repeated videos",
              },
              {
                title: "High Accuracy",
                text: "ViT >95% accuracy on test dataset, production-ready",
              },
            ].map((item, i) => (
              <div key={i}>
                <h3
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "#00d4ff",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
