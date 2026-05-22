import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function HeroSection({ onShowInfo, onUploadClick }) {
  const [stats, setStats] = useState([
    { value: "97.3%", label: "Detection Accuracy" },
    { value: "<0.8s", label: "Analysis Time" },
    { value: "500K+", label: "Videos Analyzed" },
  ]);

  const [typeIndex, setTypeIndex] = useState(0);
  const subtitles = [
    "Powered by ViT & COBRA Ensemble • Real-time Detection",
    "Dual Model Architecture • Advanced AI Forensics",
    "Detect what humans cannot • Production-Ready System",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTypeIndex((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px 60px",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Grid background */}
      <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: "900px",
        }}
      >
        {/* Main Heading */}
        <motion.h1
          variants={itemVariants}
          className="heading-display"
          style={{ marginBottom: "24px" }}
        >
          DETECT WHAT THE HUMAN EYE CANNOT
        </motion.h1>

        {/* Animated subtitle */}
        <motion.div
          variants={itemVariants}
          style={{
            minHeight: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "48px",
          }}
        >
          <motion.p
            key={typeIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.5px",
            }}
          >
            {subtitles[typeIndex]}
            <span className="typing-cursor" />
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} style={{ marginBottom: "72px" }}>
          <motion.button
            onClick={onUploadClick}
            className="btn-primary glow-pulse"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            style={{
              fontSize: "1.1rem",
              padding: "16px 48px",
              position: "relative",
            }}
          >
            ANALYZE VIDEO NOW
          </motion.button>
          <motion.button
            onClick={onShowInfo}
            style={{
              background: "transparent",
              border: "2px solid var(--accent-cyan)",
              color: "var(--accent-cyan)",
              marginLeft: "16px",
              padding: "14px 40px",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "DM Mono, monospace",
              fontSize: "0.95rem",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              transition: "all 0.3s ease",
            }}
            whileHover={{ background: "rgba(0, 212, 255, 0.1)" }}
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            marginBottom: "60px",
          }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="glass-card"
              whileHover={{ y: -4 }}
              style={{
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div
                className="heading-md gradient-text"
                style={{ marginBottom: "8px" }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* How it works section */}
        <motion.div variants={itemVariants}>
          <h2
            style={{
              color: "var(--text-secondary)",
              marginBottom: "32px",
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            How It Works
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "24px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {[
              {
                step: "1",
                title: "Upload Video",
                desc: "Drop your video file",
              },
              { step: "→", title: "AI Analysis", desc: "Neural networks scan" },
              { step: "3", title: "Get Report", desc: "Instant results" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="glass-card"
                style={{
                  padding: "20px",
                  textAlign: "center",
                  position: "relative",
                }}
                whileHover={{ borderColor: "var(--accent-cyan)" }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "var(--accent-cyan)",
                    marginBottom: "12px",
                  }}
                >
                  {item.step}
                </div>
                <div
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  {item.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
