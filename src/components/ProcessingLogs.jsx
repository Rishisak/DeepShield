import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Color-coded log level config ──────────────────────────────────────────────
const LOG_MESSAGES = [
  { text: 'Initializing neural engine...',          icon: '⚡', level: 'info'    },
  { text: 'Loading detection model (EfficientNet-B4)...', icon: '🧠', level: 'info' },
  { text: 'Extracting video frames (30 fps)...',    icon: '🎞️', level: 'info'    },
  { text: 'Preprocessing facial regions...',         icon: '👤', level: 'info'    },
  { text: 'Applying FFT spectral analysis...',       icon: '📊', level: 'warn'    },
  { text: 'Running MesoNet inception layers...',     icon: '🔬', level: 'info'    },
  { text: 'Detecting facial inconsistencies...',     icon: '🔍', level: 'warn'    },
  { text: 'Analyzing temporal coherence (LSTM)...',  icon: '⏱️', level: 'info'    },
  { text: 'Computing artifact heatmap...',           icon: '🗺️', level: 'info'    },
  { text: 'Cross-referencing GAN fingerprints...',   icon: '🧬', level: 'warn'    },
  { text: 'Evaluating blink pattern anomalies...',   icon: '👁️', level: 'info'    },
  { text: 'Running ensemble consensus (COBRA)...',   icon: '🐍', level: 'info'    },
  { text: 'Generating confidence scores...',         icon: '📈', level: 'info'    },
  { text: 'Compiling analysis report...',            icon: '📋', level: 'info'    },
  { text: 'Analysis complete.',                      icon: '✅', level: 'success'  },
];

const LEVEL_COLOR = {
  info:    '#94a3b8',
  warn:    '#fbbf24',
  success: '#22c55e',
};

function timestamp() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

export default function ProcessingLogs({ isProcessing, onComplete }) {
  const [logs, setLogs]           = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone]           = useState(false);
  const containerRef              = useRef(null);
  const onCompleteRef             = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!isProcessing) { setLogs([]); setCurrentIdx(0); setDone(false); return; }
    if (currentIdx >= LOG_MESSAGES.length) { onCompleteRef.current?.(); setDone(true); return; }
    const delay = currentIdx === 0 ? 300 : 600 + Math.random() * 800;
    const t = setTimeout(() => {
      setLogs(prev => [...prev, { ...LOG_MESSAGES[currentIdx], ts: timestamp() }]);
      setCurrentIdx(prev => prev + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [isProcessing, currentIdx]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [logs]);

  const progress = logs.length / LOG_MESSAGES.length;

  return (
    <div
      className="glass-card"
      style={{ marginTop: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Terminal header ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ef4444', '#fbbf24', '#22c55e'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <span style={{
          flex: 1, textAlign: 'center',
          fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace",
          color: '#475569', letterSpacing: 1,
        }}>
          deepshield — neural-engine — bash
        </span>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <motion.div
            animate={isProcessing ? { opacity: [1, 0.2, 1] } : { opacity: 0.25 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isProcessing ? '#22c55e' : '#64748b',
              boxShadow: isProcessing ? '0 0 6px #22c55e' : 'none',
            }}
          />
          <span style={{
            fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace",
            color: isProcessing ? '#22c55e' : '#475569', fontWeight: 600,
          }}>
            {isProcessing ? 'LIVE' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      {isProcessing && (
        <div style={{ height: 2, background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
              boxShadow: '0 0 8px rgba(0,212,255,0.5)',
            }}
          />
        </div>
      )}

      {/* ── Log output ──────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          padding: '12px 16px',
          maxHeight: 260,
          overflowY: 'auto',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.76rem',
          lineHeight: 1.7,
        }}
      >
        {/* Prompt line when idle */}
        {!isProcessing && logs.length === 0 && (
          <div style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#22c55e' }}>●</span>
            <span>deepshield@ai:~$</span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ display: 'inline-block', width: 6, height: 13, background: '#475569', borderRadius: 1 }}
            />
          </div>
        )}

        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                color: i === logs.length - 1 && isProcessing
                  ? LEVEL_COLOR[log.level]
                  : log.level === 'success'
                    ? '#4ade80'
                    : log.level === 'warn'
                      ? '#fbbf2480'
                      : '#475569',
                padding: '1px 0',
              }}
            >
              {/* Timestamp */}
              <span style={{ color: '#334155', flexShrink: 0 }}>[{log.ts}]</span>
              {/* Icon */}
              <span style={{ flexShrink: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>{log.icon}</span>
              {/* Message */}
              <span style={{
                color: i === logs.length - 1 && isProcessing
                  ? LEVEL_COLOR[log.level]
                  : log.level === 'success'
                    ? '#4ade80'
                    : log.level === 'warn' && i === logs.length - 1
                      ? '#fbbf24'
                      : '#64748b',
              }}>
                {log.text}
                {i === logs.length - 1 && isProcessing && log.level !== 'success' && (
                  <span className="typing-cursor" />
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bouncing dots when waiting for next log */}
        {isProcessing && logs.length > 0 && logs.length < LOG_MESSAGES.length && (
          <div style={{ display: 'flex', gap: 4, padding: '6px 0 2px 52px' }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4ff' }}
              />
            ))}
          </div>
        )}

        {/* Done state */}
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#22c55e' }}>●</span>
              <span>deepshield@ai:~$</span>
              <span style={{ color: '#4ade80' }}>process exited with code 0</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
