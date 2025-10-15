import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    // Trigger reconnection animation after 1 second
    const timer = setTimeout(() => {
      setReconnected(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06070b] via-[#0a1020] to-[#06070b] flex items-center justify-center overflow-hidden relative">
      {/* Animated background network lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3DDAD7" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#FF6A00" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3DDAD7" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Pulsing network lines */}
        <motion.line
          x1="10%"
          y1="20%"
          x2="90%"
          y2="80%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.line
          x1="90%"
          y1="20%"
          x2="10%"
          y2="80%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.line
          x1="50%"
          y1="10%"
          x2="50%"
          y2="90%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </svg>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-2xl">
        {/* Broken/Reconnecting Node */}
        <motion.div
          className="mb-12 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <svg width="200" height="200" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6A00" />
                <stop offset="100%" stopColor="#FF8C42" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Outer pulsing ring */}
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#nodeGradient)"
              strokeWidth="2"
              opacity="0.3"
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: [0.8, 1.1, 0.8],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Main broken circle that reconnects */}
            <motion.circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="url(#nodeGradient)"
              strokeWidth="3"
              strokeDasharray="377"
              strokeDashoffset={reconnected ? 0 : 100}
              filter="url(#glow)"
              initial={{ strokeDashoffset: 100 }}
              animate={{ 
                strokeDashoffset: reconnected ? 0 : 100,
                opacity: reconnected ? 1 : 0.6
              }}
              transition={{ 
                duration: 2,
                ease: "easeInOut"
              }}
            />

            {/* Center dot */}
            <motion.circle
              cx="100"
              cy="100"
              r="8"
              fill="url(#nodeGradient)"
              filter="url(#glow)"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Connection nodes around the circle */}
            {[0, 90, 180, 270].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = 100 + 60 * Math.cos(rad);
              const y = 100 + 60 * Math.sin(rad);
              
              return (
                <motion.circle
                  key={angle}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3DDAD7"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: reconnected ? [0, 1, 0.8] : 0,
                    scale: reconnected ? [0, 1.5, 1] : 0
                  }}
                  transition={{ 
                    delay: 1.5 + (i * 0.2),
                    duration: 0.8
                  }}
                />
              );
            })}
          </svg>
        </motion.div>

        {/* 404 Code */}
        <motion.div
          className="text-slate-500 text-sm font-mono mb-4 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          404
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-white mb-4"
          style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          Not all connections are lost forever.
        </motion.h1>

        {/* Subline */}
        <motion.p
          className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1 }}
        >
          Sometimes, dissonance shows us where coherence begins.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1 }}
        >
          <Link to={createPageUrl("Dashboard")}>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 w-full sm:w-auto">
              Return to Resonance
            </Button>
          </Link>
          
          <Link to={createPageUrl("Manifesto")}>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800/50 px-6 py-3 w-full sm:w-auto">
              Explore Manifesto
            </Button>
          </Link>
        </motion.div>

        {/* Secondary CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1 }}
        >
          <Link to={createPageUrl("GlobalHubs")}>
            <Button variant="ghost" className="text-slate-400 hover:text-white text-sm px-4 py-2">
              Join a Local Hub
            </Button>
          </Link>
          
          <Link to={createPageUrl("Status")}>
            <Button variant="ghost" className="text-slate-400 hover:text-white text-sm px-4 py-2">
              Check Network Status
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}