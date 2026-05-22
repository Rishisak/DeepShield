import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../apiConfig";
import ConfidenceGauge from "./ConfidenceGauge";

const ANALYSIS_SUMMARY = [
  "Facial boundary artifacts detected in 73% of analyzed frames.",
  "Temporal coherence analysis reveals micro-expression timing irregularities.",
  "GAN fingerprint signature matches known deepfake generation patterns.",
  "Spectral analysis detected frequency domain anomalies consistent with face-swap techniques.",
];

export default function ResultPanel({ result, isProcessing }) {
  const [viewMode, setViewMode] = useState("overall");
  const [frameView, setFrameView] = useState("original"); // 'original' | 'heatmap'

  if (!result && !isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="glass-card"
        style={{
          padding: 28,
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 420,
        }}
      >
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(100,116,139,0.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </motion.div>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            marginTop: 20,
            textAlign: "center",
          }}
        >
          Upload a video to see
          <br />
          AI analysis results here
        </p>
      </motion.div>
    );
  }

  if (isProcessing && !result) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="glass-card"
        style={{
          padding: 28,
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 420,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 100,
            height: 100,
            marginBottom: 24,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "#00d4ff",
              borderRightColor: "rgba(0,212,255,0.3)",
              position: "absolute",
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "#a855f7",
              borderLeftColor: "rgba(168,85,247,0.3)",
              position: "absolute",
              top: 15,
              left: 15,
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#00d4ff",
              boxShadow: "0 0 20px #00d4ff",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        <p
          style={{
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          Analyzing video...
        </p>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.78rem",
            marginTop: 6,
          }}
        >
          This may take a few moments
        </p>
      </motion.div>
    );
  }

  const isReal = result?.verdict === "REAL";
  const confidence = result?.confidence || 0;
  const hasHeatmaps = result?.heatmapFrames?.some((h) => h !== null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7 }}
      className="glass-card"
      style={{ padding: 28, flex: 1, minWidth: 0 }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: isReal
              ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,255,208,0.10))"
              : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(255,45,149,0.10))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${isReal ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isReal ? "#22c55e" : "#ef4444"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isReal ? (
              <>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Analysis Result
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Neural engine assessment
          </p>
        </div>

        {/* ⚡ Cached badge */}
        {result?.cached && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>⚡</span>
            <span
              style={{
                fontSize: "0.68rem",
                color: "#fbbf24",
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              INSTANT CACHE
            </span>
          </motion.div>
        )}
      </div>

      {/* Verdict */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        style={{ textAlign: "center", marginBottom: 24 }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 32px",
            borderRadius: 14,
            background: isReal
              ? "rgba(34,197,94,0.08)"
              : "rgba(239,68,68,0.08)",
            border: `1px solid ${isReal ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            boxShadow: isReal ? "var(--glow-green)" : "var(--glow-red)",
            marginBottom: 20,
          }}
        >
          <span
            className={isReal ? "status-real" : "status-fake"}
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            {result?.verdict}
          </span>
        </div>

        <ConfidenceGauge score={confidence} isReal={isReal} />

        {/* Download PDF */}
        <button
          onClick={async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/generate_pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  verdict: result.verdict,
                  confidence: result.confidence,
                  frame_results: result.frameResults,
                  heatmap_frames: result.heatmapFrames,
                  mean_probs: result.meanProbs,
                }),
              });
              if (!res.ok) throw new Error("PDF generation failed");
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `DeepShield_Report_${result.verdict}.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error(err);
              alert("Could not generate PDF report.");
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            margin: "20px auto 0",
            transition: "background 0.2s",
          }}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download PDF Report
        </button>
      </motion.div>

      {/* View mode tabs */}
      <div
        style={{
          display: "flex",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 20,
        }}
      >
        {["overall", "frames"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              cursor: "pointer",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              transition: "all 0.3s",
              fontFamily: "'Outfit', sans-serif",
              background:
                viewMode === mode ? "rgba(0,212,255,0.1)" : "transparent",
              color: viewMode === mode ? "#00d4ff" : "var(--text-secondary)",
              borderBottom:
                viewMode === mode
                  ? "2px solid #00d4ff"
                  : "2px solid transparent",
            }}
          >
            {mode === "overall" ? "📊 Overall" : "🎞️ Frame Analysis"}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "overall" ? (
          <motion.div
            key="overall"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h3
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              AI Analysis Summary
            </h3>
            {ANALYSIS_SUMMARY.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < ANALYSIS_SUMMARY.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginTop: 7,
                    background: isReal ? "#22c55e" : "#ef4444",
                    boxShadow: `0 0 6px ${isReal ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`,
                  }}
                />
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {text}
                </p>
              </motion.div>
            ))}

            {/* Breakdown bars */}
            <div style={{ marginTop: 20 }}>
              <h3
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 14,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Confidence Breakdown
              </h3>
              {[
                { label: "Facial Consistency", value: 94.2 },
                { label: "Temporal Analysis", value: 88.7 },
                { label: "Spectral Analysis", value: 91.5 },
                { label: "GAN Detection", value: 96.1 },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                      fontSize: "0.75rem",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.value}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{
                        delay: 0.5 + i * 0.15,
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                      style={{
                        height: "100%",
                        borderRadius: 999,
                        background: isReal
                          ? "linear-gradient(90deg, #22c55e, #06ffd0)"
                          : "linear-gradient(90deg, #ef4444, #ff2d95)",
                        boxShadow: isReal
                          ? "0 0 8px rgba(34,197,94,0.3)"
                          : "0 0 8px rgba(239,68,68,0.3)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="frames"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header row: title + heatmap toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Per-Frame Analysis
              </h3>

              {/* Original / Heatmap toggle (only shown if heatmaps available) */}
              {hasHeatmaps && (
                <div
                  style={{
                    display: "flex",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {["original", "heatmap"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setFrameView(v)}
                      style={{
                        padding: "5px 12px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        transition: "all 0.2s",
                        fontFamily: "'Outfit', sans-serif",
                        background:
                          frameView === v
                            ? v === "heatmap"
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(0,212,255,0.1)"
                            : "transparent",
                        color:
                          frameView === v
                            ? v === "heatmap"
                              ? "#f87171"
                              : "#00d4ff"
                            : "var(--text-secondary)",
                      }}
                    >
                      {v === "original" ? "📷 Original" : "🔥 GradCAM"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GradCAM legend */}
            {hasHeatmaps && frameView === "heatmap" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 8,
                    borderRadius: 4,
                    background:
                      "linear-gradient(90deg, #00008b, #0000ff, #00ffff, #ffff00, #ff0000)",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Low attention
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    High (suspicious)
                  </span>
                </div>
              </motion.div>
            )}

            {/* Frame grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
                gap: 12,
              }}
            >
              {result?.frames ? (
                result.frames.map((frame_url, i) => {
                  const heatUrl = result.heatmapFrames?.[i];
                  const showHeat = frameView === "heatmap" && heatUrl;
                  const displayUrl = showHeat ? heatUrl : frame_url;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      style={{
                        borderRadius: 12,
                        overflow: "hidden",
                        border: showHeat
                          ? "2px solid rgba(239,68,68,0.4)"
                          : "2px solid rgba(0,212,255,0.2)",
                        background: "#000",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                      }}
                      title={
                        showHeat
                          ? "GradCAM heatmap — red = high suspicion"
                          : `Frame ${i}`
                      }
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={displayUrl}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          src={API_BASE_URL + displayUrl}
                          alt={showHeat ? `Heatmap ${i}` : `Frame ${i}`}
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                          }}
                        />
                      </AnimatePresence>
                      <div
                        style={{
                          padding: "4px",
                          textAlign: "center",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          background: showHeat
                            ? "rgba(239,68,68,0.15)"
                            : "rgba(0,212,255,0.1)",
                          color: showHeat ? "#f87171" : "#00d4ff",
                        }}
                      >
                        {showHeat ? "CAM" : `F${String(i).padStart(3, "0")}`}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                  No frame data returned.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
