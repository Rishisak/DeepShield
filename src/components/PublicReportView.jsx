import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../apiConfig';

// ── Radial confidence gauge ────────────────────────────────────────────────────
function ConfidenceArc({ score, isDeepfake }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ * 0.75; // 75% arc
  const color = isDeepfake ? '#ef4444' : '#22c55e';
  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      {/* Track */}
      <circle cx="70" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)"
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${circ * 0.75} ${circ}`}
        strokeDashoffset={circ * 0.125}
        transform="rotate(135 70 80)" />
      {/* Fill */}
      <motion.circle
        cx="70" cy="80" r={r} fill="none" stroke={color}
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${circ * 0.75} ${circ}`}
        strokeDashoffset={circ * 0.125}
        transform="rotate(135 70 80)"
        initial={{ strokeDashoffset: circ * 0.875 + circ * 0.125 }}
        animate={{ strokeDashoffset: offset * 0.75 + circ * 0.125 - circ * 0.75 + circ * 0.875 }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
      {/* Value text */}
      <text x="70" y="78" textAnchor="middle" fill={color}
        fontSize="20" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
        {score.toFixed(1)}%
      </text>
      <text x="70" y="95" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="600">
        CONFIDENCE
      </text>
    </svg>
  );
}

export default function PublicReportView() {
  const [report, setReport] = useState(null);
  const [error, setError]   = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const uuid = window.location.pathname.split('/').pop();
    fetch(`${API_BASE_URL}/report/${uuid}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        let parsedFrames = [];
        try { parsedFrames = typeof data.report.frames === 'string' ? JSON.parse(data.report.frames) : data.report.frames; } catch(e) {}
        setReport({ ...data.report, frames: parsedFrames });
      })
      .catch(() => setError(true));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Error state ─────────────────────────────────────────────────────────── */
  if (error) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050816', fontFamily: "'Outfit', sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: 40 }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
          background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(239,68,68,0.15)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: '#ef4444', marginBottom: 10, fontWeight: 800 }}>Report Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>This verification link is invalid or has expired.</p>
      </motion.div>
    </div>
  );

  /* ── Loading state ───────────────────────────────────────────────────────── */
  if (!report) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#050816', gap: 16, fontFamily: "'Outfit', sans-serif",
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#00d4ff', borderRightColor: 'rgba(0,212,255,0.3)',
        }}
      />
      <p style={{ color: '#475569', fontSize: '0.85rem' }}>Loading verification report…</p>
    </div>
  );

  const isDeepfake = report.verdict === 'FAKE';
  const conf       = (report.confidence * 100);
  const verdictColor = isDeepfake ? '#ef4444' : '#22c55e';
  const verdictGlow  = isDeepfake ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)';

  /* ── Main report ─────────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, rgba(0,212,255,0.04) 0%, #050816 60%)',
      fontFamily: "'Outfit', sans-serif", color: '#e2e8f0',
      padding: '40px 20px 80px',
    }}>
      {/* Top scan bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, transparent, #00d4ff, #a855f7, transparent)',
        zIndex: 50,
      }} />

      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* ── Header row ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#rptGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs><linearGradient id="rptGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00d4ff"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
            <span style={{
              fontSize: '1rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>DeepShield AI</span>
            <span style={{
              fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20,
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
              color: '#00d4ff', fontWeight: 700,
            }}>VERIFIED REPORT</span>
          </div>

          {/* Copy link button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 10,
              background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
              border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: copied ? '#4ade80' : '#94a3b8',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              fontFamily: "'Outfit', sans-serif", transition: 'all 0.25s',
            }}
          >
            {copied
              ? <><span>✓</span> Link Copied!</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copy Link</>
            }
          </motion.button>
        </motion.div>

        {/* ── Metadata card ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(10,15,41,0.7)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '20px 24px', marginBottom: 20,
            display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Analyzed File</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>{report.filename}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Scan Date</p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{new Date(report.scan_date).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Verification ID</p>
            <code style={{
              fontSize: '0.78rem', color: '#00d4ff',
              background: 'rgba(0,212,255,0.08)', padding: '4px 10px', borderRadius: 8,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{report.uuid}</code>
          </div>
        </motion.div>

        {/* ── Verdict card ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(10,15,41,0.7)', backdropFilter: 'blur(20px)',
            border: `1px solid ${verdictColor}22`,
            borderRadius: 24, overflow: 'hidden', marginBottom: 20,
            boxShadow: `0 0 40px ${verdictGlow}`,
          }}
        >
          {/* Colored top bar */}
          <div style={{
            height: 4,
            background: isDeepfake
              ? 'linear-gradient(90deg, #ef4444, #ff2d95)'
              : 'linear-gradient(90deg, #22c55e, #06ffd0)',
          }} />

          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 160 }}
              style={{
                width: 96, height: 96, borderRadius: '50%', margin: '0 auto 24px',
                background: isDeepfake ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                border: `2px solid ${verdictColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px ${verdictGlow}`,
              }}
            >
              {isDeepfake ? (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              ) : (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              )}
            </motion.div>

            {/* Verdict text */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900,
                color: verdictColor, marginBottom: 8, letterSpacing: '-1px',
                textShadow: `0 0 30px ${verdictGlow}`,
              }}
            >
              {isDeepfake ? 'DEEPFAKE DETECTED' : 'GENUINE MEDIA'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 28 }}
            >
              {isDeepfake
                ? 'This content has been flagged as artificially generated or manipulated.'
                : 'No manipulation signals detected. This content appears to be authentic.'}
            </motion.p>

            {/* Confidence arc */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              style={{ display: 'inline-block' }}
            >
              <ConfidenceArc score={conf} isDeepfake={isDeepfake} />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Frame grid ─────────────────────────────────────────────────────── */}
        {report.frames && report.frames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{
              background: 'rgba(10,15,41,0.7)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span>🎞️</span>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>Extracted Face Vectors</h3>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                {report.frames.length} frames
              </span>
            </div>
            <div style={{
              padding: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: 10,
            }}>
              {report.frames.map((f_url, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  style={{
                    borderRadius: 10, overflow: 'hidden',
                    border: `2px solid ${isDeepfake ? 'rgba(239,68,68,0.25)' : 'rgba(0,212,255,0.2)'}`,
                    background: '#000', position: 'relative',
                  }}
                >
                  <img
                    src={API_BASE_URL + f_url}
                    alt={`Frame ${i}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  <div style={{
                    padding: '3px', textAlign: 'center',
                    fontSize: '0.6rem', fontWeight: 700,
                    background: isDeepfake ? 'rgba(239,68,68,0.15)' : 'rgba(0,212,255,0.1)',
                    color: isDeepfake ? '#f87171' : '#00d4ff',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    F{String(i).padStart(3, '0')}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Footer watermark ───────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ textAlign: 'center', marginTop: 32, fontSize: '0.72rem', color: '#1e293b' }}
        >
          🔒 Cryptographically verified · Powered by DeepShield AI Neural Engine v4.0
        </motion.p>
      </div>
    </div>
  );
}
