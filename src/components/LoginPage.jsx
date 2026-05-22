import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../apiConfig';
import { useGoogleLogin } from '@react-oauth/google';

// ── tiny floating orb rendered on a canvas ──────────────────────────────────
function LoginBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#00d4ff' : '#a855f7',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Eye icon for password visibility ─────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function InputField({ id, label, type = 'text', value, onChange, placeholder, rightSlot, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={id === 'password' ? 'current-password' : 'username'}
          style={{
            width: '100%',
            padding: rightSlot ? '12px 44px 12px 16px' : '12px 16px',
            background: focused
              ? 'transparent'
              : 'var(--bg-secondary)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : focused ? 'rgba(0,212,255,0.5)' : 'var(--glass-border)'}`,
            borderRadius: 12,
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontFamily: 'Outfit, sans-serif',
            outline: 'none',
            transition: 'all 0.25s ease',
            boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.08)' : 'none',
          }}
        />
        {rightSlot && (
          <div style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {rightSlot}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        const data = await res.json();
        if (res.ok) {
          onLogin(data.user);
        } else {
          setErrors({ email: data.error || 'Google login failed' });
          setShake(true);
          setTimeout(() => setShake(false), 600);
        }
      } catch (error) {
        setErrors({ email: 'Server error. Is the backend running?' });
      }
      setLoading(false);
    },
    onError: () => {
      setErrors({ email: 'Google login failed or was cancelled' });
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  });

  const validate = () => {
    const e = {};
    if (mode === 'signup' && !name.trim()) e.name = 'Full name is required';
    if (!email.includes('@') || !email.includes('.')) e.email = 'Enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = { email, password };
      if (mode === 'signup') body.name = name;

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();

      if (!res.ok) {
        setErrors({ email: data.error || 'Authentication failed' });
        setShake(true);
        setTimeout(() => setShake(false), 600);
      } else {
        if (mode === 'signup') {
          // Switch to login mode
          setMode('login');
          setPassword(''); // prompt for password again
        } else {
          onLogin(data.user);
        }
      }
    } catch (error) {
      setErrors({ email: 'Server error. Is the backend running?' });
    }

    setLoading(false);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setErrors({});
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <LoginBackground />

      {/* Glow orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Scan line at top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #00d4ff, #a855f7, transparent)', zIndex: 50, animation: 'loginTopBar 3s ease-in-out infinite' }} />

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24, scale: 0.97 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className={shake ? 'login-shake' : ''}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 420,
          margin: '0 24px',
        }}
      >
        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(30px) saturate(1.8)',
          border: '1px solid var(--glass-border)',
          borderRadius: 24,
          padding: '40px 36px 36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))',
              border: '1px solid rgba(0,212,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#loginGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.3px' }}>
              DeepShield
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.2 }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {mode === 'login'
                ? 'Sign in to access the deepfake analysis engine'
                : 'Join DeepShield and protect content integrity'}
            </p>
          </div>

          {/* Social Sign-in */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={() => googleLogin()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '11px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.25s ease',
              marginBottom: 20,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--glass-border)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <InputField
                    id="fullname"
                    label="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    error={errors.name}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@deepshield.ai"
              error={errors.email}
            />

            <InputField
              id="password"
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password}
              rightSlot={
                <span onClick={() => setShowPw(s => !s)}>
                  <EyeIcon open={showPw} />
                </span>
              }
            />

            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: -8 }}>
                <a href="#" style={{ fontSize: '0.78rem', color: '#00d4ff', textDecoration: 'none', opacity: 0.85 }}
                  onMouseEnter={e => e.target.style.opacity = 1}
                  onMouseLeave={e => e.target.style.opacity = 0.85}
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Submit button */}
            <motion.button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                marginTop: 4,
                width: '100%',
                padding: '13px',
                borderRadius: 14,
                border: 'none',
                background: loading
                  ? 'rgba(0,212,255,0.15)'
                  : 'linear-gradient(135deg, #00d4ff, #a855f7)',
                color: loading ? '#64748b' : '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                fontFamily: 'Outfit, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
                boxShadow: loading ? 'none' : '0 0 24px rgba(0,212,255,0.3), 0 0 60px rgba(168,85,247,0.15)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  {mode === 'login' ? 'Authenticating…' : 'Creating account…'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </motion.button>
          </form>

          {/* Switch mode */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              id="auth-mode-switch"
              type="button"
              onClick={switchMode}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: '#00d4ff', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.target.style.opacity = 0.75}
              onMouseLeave={e => e.target.style.opacity = 1}
            >
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Badge */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '0.5px', opacity: 0.8 }}>
          🔒 End-to-end encrypted · SOC 2 compliant
        </p>
      </motion.div>
    </div>
  );
}
