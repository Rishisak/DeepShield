import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "./apiConfig";
import { io } from "socket.io-client";
import ParticleBackground from "./components/ParticleBackground";
import HeroSection from "./components/HeroSection";
import UploadPanel from "./components/UploadPanel";
import ResultPanel from "./components/ResultPanel";
import ProcessingLogs from "./components/ProcessingLogs";
import FeaturesSection from "./components/FeaturesSection";
import Footer from "./components/Footer";
import LoginPage from "./components/LoginPage";
import PublicReportView from "./components/PublicReportView";
import ThemeToggle from "./components/ThemeToggle";
import ArchitecturePage from "./components/ArchitecturePage";

import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // ── Persist user login state to localStorage ────────────────────────────────
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ds-user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleUserLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("ds-user", JSON.stringify(userData));
  };

  const handleUserLogout = () => {
    setUser(null);
    localStorage.removeItem("ds-user");
  };

  const [currentView, setCurrentView] = useState("Scanner");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [result, setResult] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ── Theme state — read persisted preference on first load ─────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("ds-theme");
    return saved ? saved === "dark" : true; // default: dark
  });
  const toggleTheme = () => setIsDark((d) => !d);

  const resultTimeoutRef = useRef(null);
  const userRef = useRef(user);
  const socketRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── Scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── WebSocket connection ───────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── File analysis handler ──────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file, scanMode = "deep") => {
    setResult(null);
    setIsProcessing(true);
    setUploadProgress(5);
    setProgressStatus("Uploading video...");

    const socket = socketRef.current;

    // Generate a unique session ID for this scan so only our socket
    // receives progress events for this specific request.
    const sessionId = crypto.randomUUID();

    // Join the private room, then attach the progress listener
    socket.emit("join", { session_id: sessionId });

    const onProgress = ({ progress, message }) => {
      setUploadProgress(progress);
      setProgressStatus(message);
    };
    socket.on("progress", onProgress);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("scan_mode", scanMode);
    formData.append("user_email", userRef.current?.email || "");
    formData.append("session_id", sessionId);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Detach the listener as soon as we have a result
      socket.off("progress", onProgress);

      setUploadProgress(100);
      setProgressStatus(
        data.cached ? "Complete! (instant cached result)" : "Complete!",
      );

      resultTimeoutRef.current = setTimeout(() => {
        setResult({
          verdict: data.result,
          confidence: data.confidence * 100,
          frames: data.frames,
          heatmapFrames: data.heatmap_frames,
          frameResults: data.frame_results,
          meanProbs: data.mean_probs,
          cached: data.cached || false,
        });
        setIsProcessing(false);

        // Log to history
        const currentUser = userRef.current;
        fetch(`${API_BASE_URL}/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            filename: file.name || "webcam_capture.webm",
            verdict: data.result,
            confidence: data.confidence,
            frames: data.frames || [],
            heatmap_frames: data.heatmap_frames || [],
            file_hash: data.file_hash || "",
          }),
        }).catch((err) => console.error("Failed to log history", err));
      }, 600);
    } catch (error) {
      console.error("Analysis failed:", error);
      socket.off("progress", onProgress);
      clearTimeout(resultTimeoutRef.current);
      setIsProcessing(false);
      setProgressStatus("");
      alert("Failed to connect to the analysis engine.");
    }
  }, []);

  const handleProcessingComplete = useCallback(() => {}, []);

  if (window.location.pathname.startsWith("/report/")) {
    return <PublicReportView />;
  }

  if (!user) {
    return <LoginPage onLogin={handleUserLogin} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <ParticleBackground isDark={isDark} />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 24px",
          transition: "all 0.35s ease",
          background: scrolled ? "var(--nav-bg-scrolled)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled
            ? "1px solid var(--nav-border)"
            : "1px solid transparent",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          {/* ── Logo ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))",
                border: "1px solid rgba(0,212,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#navGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient
                    id="navGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span
              className="gradient-text"
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              DeepShield
            </span>
          </div>

          {/* ── Nav links with active pill ── */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 4 }}
            className="nav-links-desktop"
          >
            {["Scanner", "Architecture", "Dashboard"]
              .concat(user.role === "admin" ? ["Admin"] : [])
              .map((link) => (
                <button
                  key={link}
                  id={`nav-${link.toLowerCase()}`}
                  onClick={() => setCurrentView(link)}
                  style={{
                    position: "relative",
                    padding: "6px 16px",
                    border: "none",
                    borderRadius: 10,
                    background:
                      currentView === link
                        ? "rgba(0,212,255,0.1)"
                        : "transparent",
                    color: currentView === link ? "#00d4ff" : "#64748b",
                    fontSize: "0.85rem",
                    fontWeight: currentView === link ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    transition: "all 0.25s ease",
                    letterSpacing: "0.2px",
                  }}
                  onMouseEnter={(e) => {
                    if (currentView !== link)
                      e.currentTarget.style.color = "#cbd5e1";
                    if (currentView !== link)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (currentView !== link)
                      e.currentTarget.style.color = "#64748b";
                    if (currentView !== link)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {link}
                  {currentView === link && (
                    <motion.div
                      layoutId="nav-active-pill"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "15%",
                        right: "15%",
                        height: 2,
                        borderRadius: 999,
                        background: "linear-gradient(90deg, #00d4ff, #a855f7)",
                        boxShadow: "0 0 8px rgba(0,212,255,0.5)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              ))}
          </div>

          {/* ── Right side: version badge + theme toggle + user avatar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
            }}
          >
            <div
              style={{
                padding: "5px 14px",
                borderRadius: 10,
                background: "rgba(0,212,255,0.07)",
                border: "1px solid rgba(0,212,255,0.18)",
                fontSize: "0.75rem",
                color: "#00d4ff",
                fontWeight: 600,
                letterSpacing: "0.3px",
              }}
            >
              v5.0
            </div>

            {/* Theme toggle */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            {/* User avatar — click opens dropdown */}
            <div style={{ position: "relative" }}>
              <div
                id="user-avatar"
                onClick={() => setShowUserMenu((m) => !m)}
                title={`Signed in as ${user.email}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #00d4ff, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: showUserMenu
                    ? "0 0 0 2px rgba(0,212,255,0.5), 0 0 16px rgba(0,212,255,0.3)"
                    : "0 0 12px rgba(0,212,255,0.25)",
                  userSelect: "none",
                  transition: "box-shadow 0.25s ease",
                }}
              >
                {user.name ? user.name[0].toUpperCase() : "?"}
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      minWidth: 220,
                      background: "var(--dropdown-bg)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--dropdown-border)",
                      borderRadius: 14,
                      boxShadow:
                        "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
                      overflow: "hidden",
                      zIndex: 200,
                    }}
                  >
                    {/* User info row */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--dropdown-border)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {user.name || "User"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-secondary)",
                          wordBreak: "break-all",
                        }}
                      >
                        {user.email}
                      </div>
                      {user.role === "admin" && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 6,
                            fontSize: "0.65rem",
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: "#f87171",
                            fontWeight: 700,
                            letterSpacing: "0.4px",
                          }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>

                    {/* Menu items */}
                    {[
                      { label: "🖥️  Scanner", view: "Scanner" },
                      { label: "�  Architecture", view: "Architecture" },
                      { label: "�📊  Dashboard", view: "Dashboard" },
                    ]
                      .concat(
                        user.role === "admin"
                          ? [{ label: "⚡  Admin Panel", view: "Admin" }]
                          : [],
                      )
                      .map((item) => (
                        <button
                          key={item.view}
                          onClick={() => {
                            setCurrentView(item.view);
                            setShowUserMenu(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 16px",
                            border: "none",
                            background: "transparent",
                            color:
                              currentView === item.view
                                ? "#00d4ff"
                                : "var(--text-secondary)",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            fontFamily: "'Outfit', sans-serif",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.04)";
                            e.currentTarget.style.color = "#e2e8f0";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color =
                              currentView === item.view ? "#00d4ff" : "#94a3b8";
                          }}
                        >
                          {item.label}
                        </button>
                      ))}

                    {/* Sign out */}
                    <div
                      style={{
                        borderTop: "1px solid var(--dropdown-border)",
                        padding: "8px",
                      }}
                    >
                      <button
                        id="signout-btn"
                        onClick={() => {
                          handleUserLogout();
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          border: "none",
                          borderRadius: 8,
                          background: "rgba(239,68,68,0.07)",
                          color: "#f87171",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          fontFamily: "'Outfit', sans-serif",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.14)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.07)")
                        }
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {currentView === "Scanner" && (
        <>
          <HeroSection
            onShowInfo={() => setCurrentView("Architecture")}
            onUploadClick={() => {
              document
                .getElementById("analysis")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <section
            id="analysis"
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 1100,
              margin: "0 auto",
              padding: "20px 24px 60px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  flex: "1 1 420px",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <UploadPanel
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                  uploadProgress={uploadProgress}
                  progressStatus={progressStatus}
                />
                <ProcessingLogs
                  isProcessing={isProcessing}
                  onComplete={handleProcessingComplete}
                />
              </div>

              <div style={{ flex: "1 1 420px", minWidth: 0 }}>
                <ResultPanel result={result} isProcessing={isProcessing} />
              </div>
            </div>
          </section>
          <FeaturesSection />
        </>
      )}

      {currentView === "Architecture" && <ArchitecturePage />}
      {currentView === "Dashboard" && <Dashboard user={user} />}
      {currentView === "Admin" && <AdminPanel user={user} />}

      <Footer />

      <style>{`
        @media (min-width: 768px) {
          .nav-links-desktop { display: flex !important; }
        }
        @media (max-width: 767px) {
          .nav-links-desktop { display: none !important; }
        }
      `}</style>
    </motion.div>
  );
}
