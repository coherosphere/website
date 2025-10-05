import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MemberCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="text-center bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300 h-full flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <img
              src={member.avatar_url}
              alt={member.display_name}
              className="w-20 h-20 rounded-full border-2 border-slate-600"
            />
            {/* Resonance Glow - jetzt mit festen Dimensionen */}
            <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-2 border-orange-500/50 animate-pulse" />
          </div>
          
          <div className="flex-grow flex flex-col">
            <h3 className="text-lg font-bold text-white break-words mb-3">{member.display_name}</h3>
            <p className="text-sm text-slate-400 mb-3 line-clamp-2 flex-grow">{member.bio}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-auto">
              {(member.skills || []).slice(0, 3).map(skill => (
                <Badge key={skill} variant="secondary" className="bg-slate-700 text-slate-300">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}