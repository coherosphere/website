
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import { iconMap } from '@/components/learning/iconMap'; // Import the icon map from its new file

export default function ResourceCard({ resource, index }) {
  const categoryColors = {
    'CommunityBuilding': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'HolisticHealth': 'bg-green-500/20 text-green-400 border-green-500/30',
    'DecentralizedTech': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Nature&Sustainability': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  const categoryKey = resource.category.replace(/ & /g, '').replace(/ /g, '');
  const Icon = iconMap[resource.icon_name] || ArrowUpRight; // Get icon from map, with a fallback

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      <Card className="group bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 hover:border-orange-500/50 transition-all duration-300 h-full flex flex-col">
        <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
          <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${categoryColors[categoryKey]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
              {resource.title}
            </CardTitle>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-transform group-hover:rotate-45" />
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-slate-400 text-sm leading-relaxed">{resource.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
