import React, { useEffect, useRef } from 'react';

export default function CoherosphereNetworkSpinner({ 
  size = 100,
  color = '#FF6600',
  lineWidth = 2,
  dotRadius = 6,
  interval = 1100,
  glowIntensity = 0.9,
  maxConcurrent = 4 
}) {
  const linesGroupRef = useRef(null);
  const dotsRef = useRef([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const linesGroup = linesGroupRef.current;
    const dots = dotsRef.current;

    if (!linesGroup) return;

    // Alle ungeordneten Paare (Kanten + Diagonalen)
    const pairs = [];
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        pairs.push([i, j]);
      }
    }

    const getPos = (index) => {
      const dot = dots[index];
      if (!dot) return { x: 0, y: 0 };
      return {
        x: parseFloat(dot.getAttribute('cx')),
        y: parseFloat(dot.getAttribute('cy'))
      };
    };

    function lineBetween(i, j, animated) {
      const a = getPos(i);
      const b = getPos(j);
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('x1', a.x);
      el.setAttribute('y1', a.y);
      el.setAttribute('x2', b.x);
      el.setAttribute('y2', b.y);
      el.setAttribute('class', animated ? 'cs-line cs-draw-fade' : 'cs-line');
      el.style.stroke = color;
      el.style.strokeWidth = lineWidth;
      el.style.strokeLinecap = 'round';
      el.style.filter = `drop-shadow(0 0 10px rgba(255, 102, 0, ${glowIntensity}))`;
      linesGroup.appendChild(el);
      return el;
    }

    if (reduceMotion) {
      // Statische Outline (6 Kanten), keine Animation
      const order = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]];
      order.forEach(([i, j]) => {
        const line = lineBetween(i, j, false);
        line.style.opacity = '0.9';
      });
      return;
    }

    // Dynamische Animation
    let active = 0;
    let intervalId;

    function spawn() {
      if (active >= maxConcurrent) return;
      const [i, j] = pairs[Math.floor(Math.random() * pairs.length)];
      const el = lineBetween(i, j, true);
      active++;
      const lifespan = 1700; // draw + fade
      setTimeout(() => {
        el.remove();
        active--;
      }, lifespan);
    }

    intervalId = setInterval(spawn, interval);
    // Direkt starten
    spawn();
    spawn();

    return () => {
      clearInterval(intervalId);
      // Cleanup lines
      while (linesGroup.firstChild) {
        linesGroup.removeChild(linesGroup.firstChild);
      }
    };
  }, [size, color, lineWidth, interval, glowIntensity, maxConcurrent]);

  return (
    <div 
      className="cs-spinner" 
      role="status" 
      aria-label="Lädt …"
      style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}
    >
      <style>{`
        .cs-dot {
          fill: ${color};
          opacity: 0.9;
          filter: drop-shadow(0 0 4px rgba(255, 102, 0, ${glowIntensity * 0.7}));
        }

        .cs-line {
          opacity: 0;
        }

        .cs-draw-fade {
          pathLength: 100;
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: cs-draw 900ms ease-out forwards, cs-fade 1000ms ease-in forwards 750ms;
        }

        @keyframes cs-draw {
          0%   { stroke-dashoffset: 100; opacity: 0; }
          20%  { opacity: 0.9; }
          60%  { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        @keyframes cs-fade {
          to { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-draw-fade {
            animation: none;
            opacity: 0.9;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <svg 
        className="cs-svg" 
        viewBox="0 0 100 100" 
        aria-hidden="true"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {/* Feste Punkte im regelmäßigen Sechseck */}
        <g id="cs-dots">
          <circle ref={el => dotsRef.current[0] = el} className="cs-dot" cx="60" cy="12" r={dotRadius} />
          <circle ref={el => dotsRef.current[1] = el} className="cs-dot" cx="102" cy="36" r={dotRadius} />
          <circle ref={el => dotsRef.current[2] = el} className="cs-dot" cx="102" cy="84" r={dotRadius} />
          <circle ref={el => dotsRef.current[3] = el} className="cs-dot" cx="60" cy="108" r={dotRadius} />
          <circle ref={el => dotsRef.current[4] = el} className="cs-dot" cx="18" cy="84" r={dotRadius} />
          <circle ref={el => dotsRef.current[5] = el} className="cs-dot" cx="18" cy="36" r={dotRadius} />
        </g>
        <g ref={linesGroupRef} id="cs-lines"></g>
      </svg>
    </div>
  );
}