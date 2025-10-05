import React from 'react';
import { motion } from 'framer-motion';
import { Users, Lightbulb } from 'lucide-react';

export default function ResonanceHub({ 
  hub, 
  position, 
  onHubClick,
  intensity = 1.0 
}) {
  const size = Math.max(12, Math.min(24, 12 + hub.member_count / 10));
  
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
      }}
      // FIX FOR HOVER SHIFT: Use motion props for transforms
      x="-50%"
      y="-50%"
      onClick={() => onHubClick(hub)}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Pulsing resonance effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full opacity-30"
        style={{ 
          width: size * 1.8, 
          height: size * 1.8,
          // Centering is now handled by the parent's layout
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 2 + intensity,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Main hub circle */}
      <div
        className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-lg flex items-center justify-center border-2 border-orange-400/50"
        style={{ width: size, height: size }}
      >
        <Users className="text-white" style={{ width: size/3, height: size/3 }} />
      </div>
      
    </motion.div>
  );
}