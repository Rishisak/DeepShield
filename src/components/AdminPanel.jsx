import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../apiConfig';

// ── Animated count-up hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(typeof target === 'number' ? target : Math.floor(target)); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, suffix = '', color, icon, delay = 0 }) {
  const displayed = useCountUp(typeof value === 'number' ? value : parseFloat(value) || 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 18,
        padding: '22px 26px',
        border: `1px solid ${color}28`,
        boxShadow: `0 0 24px ${color}0e`,
        flex: '1 1 200px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -22, right: -22,
        width: 90, height: 90, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
      <div style={{
        fontSize: '2.2rem', fontWeight: 800, color,
        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
      }}>
        {displayed}{suffix}
      </div>
      <div style={{
        fontSize: '0.73rem', color: '#64748b', marginTop: 6,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {label}
      </div>
    </motion.div>
  );
}

// ── Stacked bar chart ─────────────────────────────────────────────────────────
function DetectionChart({ fake, real }) {
  const total  = fake + real || 1;
  const fakePct = ((fake / total) * 100).toFixed(1);
  const realPct = ((real / total) * 100).toFixed(1);

  const bars = [
    { label: 'Deepfake', count: fake, pct: fakePct, color: '#ef4444', grad: 'linear-gradient(90deg, #ef4444, #ff2d95)' },
    { label: 'Real',     count: real, pct: realPct, color: '#22c55e', grad: 'linear-gradient(90deg, #22c55e, #06ffd0)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      style={{
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 20,
        padding: '24px 26px',
        border: '1px solid rgba(255,255,255,0.07)',
        marginTop: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{
          fontSize: '0.78rem', color: '#475569',
          textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700,
        }}>
          Detection Breakdown
        </h3>
        <span style={{
          fontSize: '0.7rem', color: '#334155',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {total} total scans
        </span>
      </div>

      {/* Stacked bar */}
      <div style={{ height: 32, borderRadius: 999, overflow: 'hidden', display: 'flex', marginBottom: 20, background: 'rgba(255,255,255,0.04)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fakePct}%` }}
          transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
          style={{ background: bars[0].grad, boxShadow: '0 0 16px rgba(239,68,68,0.3)' }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${realPct}%` }}
          transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
          style={{ background: bars[1].grad, boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}
        />
      </div>

      {/* Individual bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {bars.map(bar => (
          <div key={bar.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: bar.color, boxShadow: `0 0 6px ${bar.color}80` }} />
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>{bar.label}</span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: bar.color, fontWeight: 700 }}>
                {bar.count} <span style={{ color: '#334155', fontWeight: 400 }}>({bar.pct}%)</span>
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.pct}%` }}
                transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 999, background: bar.grad }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend totals */}
      <div style={{
        display: 'flex', gap: 20, flexWrap: 'wrap',
        paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {[
          { label: 'Total Scans', count: total,  color: '#00d4ff' },
          { label: 'Deepfakes',   count: fake,   color: '#f87171' },
          { label: 'Real Videos', count: real,   color: '#4ade80' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.label}:</span>
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, color: item.color,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel({ user }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/stats?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (!data.error) setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="login-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  if (!stats) return (
    <div style={{ color: '#ef4444', textAlign: 'center', marginTop: 120, fontSize: '1.05rem' }}>
      ⛔ Unauthorized access.
    </div>
  );

  const fakeCount = stats.total_scans
    ? Math.round(stats.total_scans * parseFloat(stats.fake_percentage) / 100)
    : 0;
  const realCount = stats.total_scans - fakeCount;
  const realPct   = (100 - parseFloat(stats.fake_percentage)).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 1080, margin: '90px auto 60px', padding: '0 24px', color: '#fff' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <motion.div
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}
        >
          <span style={{
            padding: '4px 14px', borderRadius: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.6px',
          }}>
            ⚡ ADMIN
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ fontSize: '2rem', fontWeight: 800 }}
        >
          Global <span className="gradient-text">Analytics</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 6 }}
        >
          Platform-wide statistics and deepfake detection metrics.
        </motion.p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Total Users"       value={stats.total_users}              icon="👥" color="#a855f7" delay={0.1} />
        <StatCard label="Total Scans"       value={stats.total_scans}              icon="🎬" color="#00d4ff" delay={0.2} />
        <StatCard label="Deepfake Rate"     value={parseFloat(stats.fake_percentage)} suffix="%" icon="🚨" color="#ef4444" delay={0.3} />
        <StatCard label="Real Content Rate" value={parseFloat(realPct)}            suffix="%" icon="✅" color="#22c55e" delay={0.4} />
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <DetectionChart fake={fakeCount} real={realCount} />
    </motion.div>
  );
}
