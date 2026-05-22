import { useEffect } from 'react';

/**
 * ThemeToggle — A large, clearly visible pill button for switching between
 * dark (🌙 Night Mode) and light (☀️ Day Mode / projector-friendly) themes.
 */
export default function ThemeToggle({ isDark, onToggle }) {
  // Apply data-theme to <html> on every change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('ds-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      id="theme-toggle-btn"
      className="theme-toggle-btn"
      onClick={onToggle}
      title={isDark ? 'Switch to Day Mode (projector-friendly)' : 'Switch to Night Mode'}
      aria-label="Toggle theme"
    >
      <span className="toggle-icon">{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Night' : 'Day'}</span>
    </button>
  );
}
