
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function ResonanceVisualizer({ votes = [] }) {
  const votePulses = useMemo(() => {
    return votes.map((vote, index) => {
      const angle = Math.random() * 360;
      const radius = 50 + Math.random() * 80;
      const x = 50 + (radius / 180) * 100 * Math.cos(angle * (Math.PI / 180));
      const y = 50 + (radius / 180) * 100 * Math.sin(angle * (Math.PI / 180));
      const color = vote.vote_type === 'support' ? '#FF6A00' : '#3DDAD7';
      return { x, y, color, key: `${vote.id}-${index}` };
    });
  }, [votes]);

  return (
    <div className="relative w-full aspect-square max-w-xs lg:max-w-md mx-auto">
      {/* Concentric rings */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-slate-700/50"
          style={{
            width: `${(i + 1) * 25}%`,
            height: `${(i + 1) * 25}%`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: i * 0.1 }}
        />
      ))}
      
      {/* Vote pulses */}
      {votePulses.map((pulse, index) => (
        <motion.div
          key={pulse.key}
          className="absolute rounded-full"
          style={{
            left: `${pulse.x}%`,
            top: `${pulse.y}%`,
            width: 12,
            height: 12,
            backgroundColor: pulse.color,
            boxShadow: `0 0 15px ${pulse.color}`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 1, 0] }}
          transition={{
            delay: 0.5 + index * 0.1,
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3 + Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
