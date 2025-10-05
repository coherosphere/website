import React from 'react';
import { motion } from 'framer-motion';

export default function ConnectionLines({ hubs, positions }) {
  // Generate connections between nearby hubs
  const generateConnections = () => {
    const connections = [];
    const hubsWithPositions = hubs.map((hub, index) => ({
      ...hub,
      position: positions[index]
    }));

    for (let i = 0; i < hubsWithPositions.length; i++) {
      for (let j = i + 1; j < hubsWithPositions.length; j++) {
        const hub1 = hubsWithPositions[i];
        const hub2 = hubsWithPositions[j];
        
        // Calculate distance
        const dx = hub2.position.x - hub1.position.x;
        const dy = hub2.position.y - hub1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only connect hubs within a certain distance
        if (distance < 30 && Math.random() > 0.6) {
          connections.push({
            from: hub1.position,
            to: hub2.position,
            strength: Math.random() * 0.5 + 0.5
          });
        }
      }
    }
    
    return connections;
  };

  const connections = generateConnections();

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {connections.map((connection, index) => (
        <motion.line
          key={index}
          x1={`${connection.from.x}%`}
          y1={`${connection.from.y}%`}
          x2={`${connection.to.x}%`}
          y2={`${connection.to.y}%`}
          stroke="url(#connectionGradient)"
          strokeWidth="1"
          opacity={connection.strength}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      ))}
      <defs>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3DDAD7" stopOpacity="0" />
          <stop offset="50%" stopColor="#3DDAD7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3DDAD7" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}