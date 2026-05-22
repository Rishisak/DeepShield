import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, suffix = '', color, icon, delay = 0 }) {
  const displayed = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 18,
        padding: '22px 24px',
        border: '1px solid var(--glass-border)',
        boxShadow: `0 0 24px ${color}10`,
        flex: '1 1 180px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 90, height: 90, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
      <div style={{
        fontSize: '2rem', fontWeight: 800, color,
        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
      }}>
        {displayed}{suffix}
      </div>
      <div style={{
        fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 6,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {label}
      </div>
    </motion.div>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }) {
  if (!active) return <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>;
  return <span style={{ color: '#00d4ff', marginLeft: 4 }}>{dir === 'desc' ? '↓' : '↑'}</span>;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/history/${user.id}`)
      .then(res => res.json())
      .then(data => { setHistory(data.history || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.id]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalScans = history.length;
  const fakeCount  = history.filter(s => s.verdict === 'FAKE').length;
  const realCount  = history.filter(s => s.verdict === 'REAL').length;
  const avgConf    = totalScans > 0
    ? Math.round(history.reduce((a, s) => a + s.confidence * 100, 0) / totalScans)
    : 0;

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = col => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };
  const sorted = [...history].sort((a, b) => {
    let va, vb;
    if (sortBy === 'date')       { va = new Date(a.scan_date); vb = new Date(b.scan_date); }
    else if (sortBy === 'verdict') { va = a.verdict; vb = b.verdict; }
    else                          { va = a.confidence; vb = b.confidence; }
    return sortDir === 'desc' ? (va > vb ? -1 : 1) : (va < vb ? -1 : 1);
  });

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(user.api_key || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (id) => {
    console.log('handleDelete called for ID:', id);
    fetch(`${API_BASE_URL}/history/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        console.log('Delete response:', data);
        if (data.success) {
          setHistory(prev => prev.filter(item => item.id !== id));
        }
      })
      .catch(err => {
        console.error('Delete error:', err);
        alert('Failed to delete scan.');
      });
  };

  const COLS = [
    { key: 'date',       label: 'Date' },
    { key: 'file',       label: 'Filename', noSort: true },
    { key: 'verdict',    label: 'Verdict' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'actions',     label: 'Actions',  noSort: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 1080, margin: '90px auto 60px', padding: '0 24px', color: 'var(--text-primary)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <motion.h2
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 6 }}
        >
          Welcome back, <span className="gradient-text">{user.name || user.email}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
        >
          Here's an overview of your deepfake analysis activity.
        </motion.p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
        <StatCard label="Total Scans"     value={totalScans} icon="🎬" color="#00d4ff" delay={0.1} />
        <StatCard label="Deepfakes Found" value={fakeCount}  icon="⚠️" color="#ef4444" delay={0.2} />
        <StatCard label="Real Videos"     value={realCount}  icon="✅" color="#22c55e" delay={0.3} />
        <StatCard label="Avg Confidence"  value={avgConf} suffix="%" icon="🎯" color="#a855f7" delay={0.4} />
      </div>

      {/* ── History Table ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
          marginBottom: 32,
        }}
      >
        {/* Table header bar */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: '1.1rem' }}>🗂️</span>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Scan History</h3>
          <span style={{
            marginLeft: 'auto', fontSize: '0.72rem',
            color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {totalScans} record{totalScans !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="login-spinner" style={{ margin: '0 auto 14px', width: 28, height: 28, borderWidth: 3 }} />
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>Loading scan history…</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ fontSize: '3rem', marginBottom: 14 }}
            >🛡️</motion.div>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>No scans yet. Upload a video to get started!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {COLS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => !col.noSort && handleSort(col.key)}
                      style={{
                        padding: '12px 20px',
                        fontSize: '0.7rem', color: 'var(--text-secondary)',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
                        cursor: col.noSort ? 'default' : 'pointer',
                        userSelect: 'none', whiteSpace: 'nowrap',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => { if (!col.noSort) e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { if (!col.noSort) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {col.label}
                      {!col.noSort && <SortIcon active={sortBy === col.key} dir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((scan, i) => {
                  const isReal = scan.verdict === 'REAL';
                  const conf   = (scan.confidence * 100).toFixed(1);
                  return (
                    <motion.tr
                      key={scan.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(scan.scan_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-primary)', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={scan.filename}>
                          {scan.filename}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20,
                          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px',
                          background: isReal ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: isReal ? '#4ade80' : '#f87171',
                          border: `1px solid ${isReal ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        }}>
                          {isReal ? '✓ REAL' : '✗ FAKE'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${conf}%` }}
                              transition={{ delay: 0.4 + i * 0.05, duration: 0.7, ease: 'easeOut' }}
                              style={{
                                height: '100%', borderRadius: 999,
                                background: isReal
                                  ? 'linear-gradient(90deg, #22c55e, #06ffd0)'
                                  : 'linear-gradient(90deg, #ef4444, #ff2d95)',
                              }}
                            />
                          </div>
                          <span style={{
                            fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
                            color: 'var(--text-secondary)', whiteSpace: 'nowrap',
                          }}>
                            {conf}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => window.open('/report/' + scan.uuid, '_blank')}
                            title="Open public report"
                            style={{
                              background: 'rgba(0,212,255,0.06)',
                              border: '1px solid rgba(0,212,255,0.18)',
                              borderRadius: 8, color: '#00d4ff',
                              padding: '6px 12px', cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: '0.75rem', fontWeight: 600,
                              fontFamily: "'Outfit', sans-serif",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(0,212,255,0.15)';
                              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(0,212,255,0.06)';
                              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.18)';
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                          </button>
                          <button
                            onClick={() => handleDelete(scan.id)}
                            title="Delete scan"
                            style={{
                              background: 'rgba(239,68,68,0.06)',
                              border: '1px solid rgba(239,68,68,0.18)',
                              borderRadius: 8, color: '#ef4444',
                              padding: '6px 8px', cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'inline-flex', alignItems: 'center',
                              fontSize: '0.75rem',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)';
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
