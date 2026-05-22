import { motion } from 'framer-motion';

const LINKS = ['Documentation', 'API', 'Research', 'Privacy', 'Terms'];

const TECH_BADGES = [
  { label: 'EfficientNet-B4', color: '#00d4ff' },
  { label: 'MesoNet',         color: '#a855f7' },
  { label: 'GradCAM',         color: '#22c55e' },
  { label: 'LSTM Temporal',   color: '#fbbf24' },
  { label: 'COBRA Ensemble',  color: '#ff2d95' },
];

export default function Footer() {
  return (
    <footer
      id="footer"
      style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '56px 24px 36px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* ── Top row ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 40,
          justifyContent: 'space-between', marginBottom: 44,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(0,212,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#footerGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00d4ff"/>
                      <stop offset="100%" stopColor="#a855f7"/>
                    </linearGradient>
                  </defs>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <span className="gradient-text" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                DeepShield AI
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.8 }}>
              Advanced deepfake detection powered by ensemble neural intelligence.
              Protecting truth in the age of synthetic media.
            </p>

            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                marginTop: 16, padding: '5px 12px', borderRadius: 20,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#22c55e', boxShadow: '0 0 6px #22c55e',
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 600, letterSpacing: '0.3px' }}>
                All Systems Operational
              </span>
            </motion.div>
          </div>

          {/* Links column */}
          <div>
            <h4 style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
              Platform
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LINKS.map(link => (
                <a
                  key={link} href="#"
                  style={{ fontSize: '0.82rem', color: '#475569', textDecoration: 'none', transition: 'color 0.2s', width: 'fit-content' }}
                  onMouseEnter={e => e.target.style.color = '#00d4ff'}
                  onMouseLeave={e => e.target.style.color = '#475569'}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Tech stack column */}
          <div>
            <h4 style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
              Neural Models
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TECH_BADGES.map(badge => (
                <div key={badge.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: badge.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div style={{
          height: 1, marginBottom: 24,
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), rgba(168,85,247,0.2), transparent)',
        }} />

        {/* ── Bottom row ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 16,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: '0.72rem', color: '#1e293b' }}>
            © {new Date().getFullYear()} DeepShield AI · All rights reserved
          </p>
          <p style={{ fontSize: '0.72rem', color: '#1e293b' }}>
            Built with 🧠 Neural Intelligence · v5.0
          </p>
        </div>
      </div>
    </footer>
  );
}
