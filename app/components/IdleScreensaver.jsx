
import React, { useEffect, useRef, useState } from 'react';
import { Mouse } from 'lucide-react';
import { useUser } from '@/components/auth/UserContext';
import { base44 } from '@/api/base44Client';

export default function IdleScreensaver() {
  const idleRef = useRef(null);
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const { currentUser } = useUser();
  const [idleTimeout, setIdleTimeout] = useState(30000); // Default 30 seconds (30000 ms)

  // Load idle timeout from AppConfig
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await base44.functions.invoke('getAppConfig');
        if (response.data && response.data.success) {
          const seconds = response.data.config.screensaver_idle_seconds;
          if (typeof seconds === 'number' && seconds > 0) {
            setIdleTimeout(seconds * 1000); // Convert to milliseconds
            console.log('[IdleScreensaver] Loaded idle timeout:', seconds, 'seconds');
          } else {
            console.log('[IdleScreensaver] screensaver_idle_seconds not found or invalid in config, using default (30s)');
          }
        } else {
          console.error('[IdleScreensaver] Failed to load config: success was false or response.data was malformed', response.data);
        }
      } catch (error) {
        console.error('[IdleScreensaver] Failed to load config from backend, using default (30s):', error);
      }
    };
    loadConfig();
  }, []); // Run only once on component mount

  useEffect(() => {
    console.log('[IdleScreensaver] Current user:', currentUser?.email);
    console.log('[IdleScreensaver] Screensaver enabled:', currentUser?.screensaver_enabled);
    
    // Check if screensaver is enabled for this user
    if (currentUser && currentUser.screensaver_enabled === false) {
      console.log('[IdleScreensaver] Disabled by user preference');
      // Ensure any previous cleanup is performed if user disables it while active
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      return; // Don't initialize if user disabled it
    }

    console.log('[IdleScreensaver] Initializing screensaver with timeout:', idleTimeout / 1000, 'seconds');

    // Configuration
    const IDLE_MS = idleTimeout; // Use dynamic timeout
    const MAX_NODES = 140;
    const CONNECT = 140;
    const DPR_MAX = 1.75;
    const BREATH_S = 12;

    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let idle = false;
    let timer = null;
    let W = 0;
    let H = 0;
    let animationFrameId = null;

    const $idle = idleRef.current;
    const $c = canvasRef.current;
    if (!$idle || !$c) {
      console.warn('[IdleScreensaver] Refs not available, cannot initialize.');
      return;
    }

    const ctx = $c.getContext('2d');
    if (!ctx) {
      console.error('[IdleScreensaver] Canvas context not available.');
      return;
    }

    // Noise function for organic movement
    function makeNoise(seed = Math.random() * 1e6) {
      const lerp = (a, b, t) => a + (b - a) * t;
      const smooth = t => t * t * (3 - 2 * t);
      const hash = (x, y) => Math.abs(Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453) % 1;
      return (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
        const u = smooth(xf), v = smooth(yf);
        const v00 = hash(xi, yi), v10 = hash(xi + 1, yi);
        const v01 = hash(xi, yi + 1), v11 = hash(xi + 1, yi + 1);
        return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
      };
    }
    const noise = makeNoise();

    // Resize handler
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, DPR_MAX);
      W = window.innerWidth;
      H = window.innerHeight;
      $c.style.width = W + 'px';
      $c.style.height = H + 'px';
      $c.width = Math.floor(W * dpr);
      $c.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // State
    const S = {
      nodes: [],
      last: performance.now(),
      start: performance.now()
    };

    // Initialize nodes
    function initNodes() {
      const area = W * H;
      const n = Math.max(60, Math.min(MAX_NODES, Math.round(area / 9000)));
      S.nodes = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.1 + Math.random() * 1.5
      }));
    }

    // Breathing animation
    function breath(t) {
      const c = ((t - S.start) / (BREATH_S * 1000)) % 1;
      return 0.5 + 0.5 * Math.sin(c * Math.PI * 2);
    }

    // Update node positions
    function update(dt) {
      const b = REDUCED ? 0.25 : breath(performance.now());
      const flow = 0.0008 + b * 0.0012;
      const vmax = REDUCED ? 0.15 : 0.25 + b * 0.2;

      for (const n of S.nodes) {
        const a = noise(n.x * flow, n.y * flow) * Math.PI * 2;
        n.vx = (n.vx + Math.cos(a) * 0.03) * 0.96;
        n.vy = (n.vy + Math.sin(a) * 0.03) * 0.96;

        const m = Math.hypot(n.vx, n.vy) || 1;
        if (m > vmax) {
          n.vx = n.vx / m * vmax;
          n.vy = n.vy / m * vmax;
        }

        n.x += n.vx * (dt * 0.06);
        n.y += n.vy * (dt * 0.06);

        if (n.x < -50) n.x = W + 50;
        if (n.x > W + 50) n.x = -50;
        if (n.y < -50) n.y = H + 50;
        if (n.y > H + 50) n.y = -50;
      }
    }

    // Draw function
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const t = breath(performance.now());
      const a1 = 0.06 + (0.14 - 0.06) * t;
      const a2 = 0.06 + (0.14 - 0.06) * (1 - t);

      g.addColorStop(0, `rgba(8,17,26,${a1.toFixed(3)})`);
      g.addColorStop(1, `rgba(10,23,36,${a2.toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const nodes = S.nodes;
      const R2 = CONNECT * CONNECT;
      const lineAlpha = (0.08 + 0.12 * t) * (REDUCED ? 0.6 : 1);

      ctx.lineWidth = 1;

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;

          if (d2 < R2) {
            const u = 1 - Math.sqrt(d2) / CONNECT;
            ctx.strokeStyle = `rgba(125,211,252,${(lineAlpha * u).toFixed(3)})`;
            ctx.beginPath();
            const mx = (a.x + b.x) / 2 + dy * 0.08;
            const my = (a.y + b.y) / 2 - dx * 0.08;
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(mx, my, b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(255,138,43,0.7)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 8);
        grd.addColorStop(0, `rgba(255,138,43,${(0.15 * (0.25 + 0.75 * t)).toFixed(3)})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Animation loop
    function loop() {
      if (!idle) return;

      const t = performance.now();
      let dt = t - S.last;
      S.last = t;
      if (dt > 120) dt = 16;

      update(dt);
      draw();

      // Using setTimeout with requestAnimationFrame to control frame rate
      // This allows for 'reduced motion' preference to have slower updates
      setTimeout(() => {
        animationFrameId = requestAnimationFrame(loop);
      }, REDUCED ? 40 : 16);
    }

    // Enter idle mode
    function enter() {
      if (idle) return;
      idle = true;
      $idle.classList.add('active');
      resize();
      initNodes();
      S.last = performance.now();
      S.start = performance.now();
      animationFrameId = requestAnimationFrame(loop);
      console.log('[IdleScreensaver] Entered idle mode.');
    }

    // Exit idle mode
    function exit() {
      if (!idle) return;
      idle = false;
      $idle.classList.remove('active');
      ctx.clearRect(0, 0, $c.width, $c.height);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      console.log('[IdleScreensaver] Exited idle mode.');
    }

    // Reset idle timer
    function reset() {
      clearTimeout(timer);
      if (idle) exit();
      timer = setTimeout(enter, IDLE_MS);
      // console.log('[IdleScreensaver] Idle timer reset, next enter in:', IDLE_MS / 1000, 'seconds');
    }

    // Event listeners
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'touchmove', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));

    const handleResize = () => {
      if (idle) {
        resize();
        initNodes(); // Re-initialize nodes on resize to adapt to new dimensions
      }
    };
    window.addEventListener('resize', handleResize);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        exit();
        clearTimeout(timer); // Prevent screensaver from activating while tab is hidden
        console.log('[IdleScreensaver] Tab hidden, screensaver suspended.');
      } else {
        reset(); // Reset timer when tab becomes visible
        console.log('[IdleScreensaver] Tab visible, screensaver timer reset.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize
    resize();
    reset();

    // Cleanup function
    cleanupRef.current = () => {
      console.log('[IdleScreensaver] Performing cleanup...');
      clearTimeout(timer);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      exit(); // Ensure screensaver is exited visually
      events.forEach(e => window.removeEventListener(e, reset));
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('[IdleScreensaver] Cleanup complete.');
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [currentUser?.screensaver_enabled, idleTimeout]); // Re-run effect if user preference or timeout changes

  // Don't render anything if user has disabled it
  if (currentUser && currentUser.screensaver_enabled === false) {
    console.log('[IdleScreensaver] Render: Disabled, returning null');
    return null;
  }

  console.log('[IdleScreensaver] Render: Enabled, rendering component');

  return (
    <>
      <style>
        {`
          #idle-screensaver {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            opacity: 0;
            pointer-events: none;
            transition: opacity 900ms ease;
            z-index: 9999;
          }
          #idle-screensaver.active {
            opacity: 1;
            pointer-events: auto;
          }
          #idle-veil {
            position: absolute;
            inset: 0;
            background: rgba(6, 10, 16, 0.92);
          }
          #idle-canvas {
            position: absolute;
            inset: 0;
            width: 100vw;
            height: 100vh;
            display: block;
          }
          #idle-mouse-icon {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            opacity: 0.15;
            color: rgba(255, 255, 255, 0.4);
            pointer-events: none;
            transition: opacity 1.5s ease;
          }
          #idle-screensaver.active #idle-mouse-icon {
            opacity: 0.25;
          }
          #idle-hint-text {
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 255, 255, 0.25);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.5px;
            text-align: center;
            opacity: 0;
            transition: opacity 2s ease;
            pointer-events: none;
            font-family: 'Inter', system-ui, sans-serif;
          }
          #idle-screensaver.active #idle-hint-text {
            opacity: 1;
          }
          @media (prefers-reduced-motion: reduce) {
            #idle-screensaver {
              transition: none;
            }
          }
        `}
      </style>

      <div id="idle-screensaver" ref={idleRef} aria-hidden="true">
        <div id="idle-veil"></div>
        <canvas id="idle-canvas" ref={canvasRef} aria-hidden="true"></canvas>
        <Mouse id="idle-mouse-icon" strokeWidth={1.5} />
        <div id="idle-hint-text">
          The sphere awaits your touch — move or press any key to return.
        </div>
      </div>
    </>
  );
}
