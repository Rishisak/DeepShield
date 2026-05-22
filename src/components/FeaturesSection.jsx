import { useState } from 'react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    num: '01',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#f1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="f1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00d4ff"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    title: '90.2% Accuracy',
    description: 'State-of-the-art ensemble neural networks achieve near-perfect detection across all known deepfake generation methods.',
    accent: '#00d4ff',
    gradient: 'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(168,85,247,0.04))',
    borderColor: 'rgba(0,212,255,0.14)',
  },
  {
    num: '02',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#f2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="f2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#ff2d95"/></linearGradient></defs>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Real-Time Analysis',
    description: 'Process videos in seconds with GPU-accelerated frame extraction and parallel neural inference pipelines.',
    accent: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.07), rgba(255,45,149,0.04))',
    borderColor: 'rgba(168,85,247,0.14)',
  },
  {
    num: '03',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#f3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="f3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#06ffd0"/><stop offset="100%" stopColor="#00d4ff"/></linearGradient></defs>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
    title: 'Military-Grade Security',
    description: 'End-to-end encrypted processing. Your videos never leave your session and are deleted immediately after analysis.',
    accent: '#06ffd0',
    gradient: 'linear-gradient(135deg, rgba(6,255,208,0.07), rgba(0,212,255,0.04))',
    borderColor: 'rgba(6,255,208,0.14)',
  },
  {
    num: '04',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#f4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="f4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff2d95"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    title: 'Multi-Model Ensemble',
    description: 'Combines MesoNet, EfficientNet-B4, FFT spectral analysis, LSTM temporal networks, and COBRA consensus.',
    accent: '#ff2d95',
    gradient: 'linear-gradient(135deg, rgba(255,45,149,0.07), rgba(168,85,247,0.04))',
    borderColor: 'rgba(255,45,149,0.14)',
  },
  {
    num: '05',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#f5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="f5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#f97316"/></linearGradient></defs>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    title: 'GradCAM Heatmaps',
    description: 'Visualize exactly which facial regions the AI flagged as suspicious using class activation map overlays.',
    accent: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.07), rgba(249,115,22,0.04))',
    borderColor: 'rgba(251,191,36,0.14)',
  },
  {
    num: '06',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#f6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="f6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#22c55e"/><stop offset="100%" stopColor="#06ffd0"/></linearGradient></defs>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Instant Cache Results',
    description: 'SHA-256 file hashing skips reprocessing — identical videos get instant cached results with zero wait time.',
    accent: '#22c55e',
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.07), rgba(6,255,208,0.04))',
    borderColor: 'rgba(34,197,94,0.14)',
  },
];

function FeatureCard({ feature, i }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="glass-card feature-card"
      style={{
        padding: 28,
        background: feature.gradient,
        borderColor: hovered ? feature.accent + '44' : feature.borderColor,
        cursor: 'default',
        boxShadow: hovered ? `0 0 30px ${feature.accent}10, 0 16px 40px rgba(0,0,0,0.3)` : 'none',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient number badge */}
      <div style={{
        position: 'absolute', top: 20, right: 20,
        fontSize: '2.2rem', fontWeight: 900,
        fontFamily: "'JetBrains Mono', monospace",
        color: feature.accent,
        opacity: 0.08,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        {feature.num}
      </div>

      {/* Glow orb on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 100, height: 100, borderRadius: '50%',
          background: `radial-gradient(circle, ${feature.accent}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 50, height: 50, borderRadius: 14,
        background: `${feature.accent}10`,
        border: `1px solid ${feature.accent}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: hovered ? `0 0 16px ${feature.accent}20` : 'none',
        transition: 'box-shadow 0.35s ease',
      }}>
        {feature.icon}
      </div>

      {/* Number tag */}
      <div style={{
        fontSize: '0.65rem', fontWeight: 700,
        color: feature.accent,
        letterSpacing: '0.8px', textTransform: 'uppercase',
        marginBottom: 8, opacity: 0.8,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {feature.num}
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
        {feature.title}
      </h3>
      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {feature.description}
      </p>

      {/* Arrow indicator on hover */}
      <motion.div
        animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{
          marginTop: 18,
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: '0.75rem', fontWeight: 600, color: feature.accent,
        }}
      >
        Learn more
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      style={{
        position: 'relative', zIndex: 1,
        padding: '80px 24px 60px',
        maxWidth: 1200, margin: '0 auto',
      }}
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 60 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 999,
          background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)',
          marginBottom: 16,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#00d4ff' }}>
            Why DeepShield
          </span>
        </div>

        <h2 style={{
          fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
          fontWeight: 900, marginBottom: 14, color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
        }}>
          Powered by{' '}
          <span className="gradient-text">Next-Gen AI</span>
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Built with cutting-edge deep learning architectures for unparalleled deepfake detection.
        </p>
      </motion.div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {FEATURES.map((feature, i) => (
          <FeatureCard key={i} feature={feature} i={i} />
        ))}
      </div>
    </section>
  );
}
