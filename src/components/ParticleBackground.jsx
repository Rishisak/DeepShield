import { useEffect, useRef } from 'react';

export default function ParticleBackground({ isDark = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationId;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let lastFrame = 0;
    const TARGET_FPS = 40;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      // Capped at 70 — original had up to 120, O(n²) made it very slow
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 70);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.15,
          color: Math.random() > 0.5 ? '0, 212, 255' : '168, 85, 247',
        });
      }
    };

    const animate = (timestamp) => {
      animationId = requestAnimationFrame(animate);

      // Hard FPS cap — don't run at 120Hz when 40Hz looks identical
      if (timestamp - lastFrame < FRAME_INTERVAL) return;
      lastFrame = timestamp;

      // Stop burning CPU when the tab is not visible
      if (document.hidden) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const n = particles.length;
      // Use squared distances: avoids expensive Math.sqrt per pair
      const LINK_DIST_SQ = 130 * 130;
      const MOUSE_DIST_SQ = 180 * 180;

      for (let i = 0; i < n; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Plain circle fill instead of a radial gradient per particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity + 0.2})`;
        ctx.fill();

        // Connection lines between nearby particles
        for (let j = i + 1; j < n; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < LINK_DIST_SQ) {
            const alpha = 0.07 * (1 - distSq / LINK_DIST_SQ);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse interaction
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mdistSq = mdx * mdx + mdy * mdy;
        if (mdistSq < MOUSE_DIST_SQ) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.12 * (1 - mdistSq / MOUSE_DIST_SQ)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // Debounce resize so we don't recreate particles on every pixel change
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        createParticles();
      }, 200);
    };

    resize();
    createParticles();
    animationId = requestAnimationFrame(animate);

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: isDark ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    />
  );
}
