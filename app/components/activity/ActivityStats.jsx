import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, MessageCircle, AtSign, Reply, Heart, Zap } from 'lucide-react';

export default function ActivityStats({ 
  totalEvents, 
  posts, 
  mentions, 
  replies, 
  reactions, 
  zapsIn, 
  zapsOut, 
  totalZapAmountIn,
  totalZapAmountOut,
  isLoading 
}) {
  const StatCard = ({ icon: Icon, value, label, color, isLoading }) => (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardContent className="p-4 text-center">
        {isLoading ? (
          <>
            <div className={`w-8 h-8 rounded-full bg-slate-700 mx-auto mb-2 animate-pulse`}></div>
            <div className="h-6 w-3/4 bg-slate-700 rounded mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 w-1/2 bg-slate-700 rounded mx-auto animate-pulse"></div>
          </>
        ) : (
          <>
            <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
            <div className="text-2xl font-bold text-white mb-1">
              <motion.div
                key={value}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </motion.div>
            </div>
            <div className="text-slate-400 text-sm">
              {label}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <StatCard
        icon={Activity}
        value={totalEvents}
        label="Events (sum)"
        color="text-orange-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={MessageCircle}
        value={posts}
        label="Posts"
        color="text-blue-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={AtSign}
        value={mentions}
        label="Mentions"
        color="text-purple-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={Reply}
        value={replies}
        label="Replies"
        color="text-green-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={Heart}
        value={reactions}
        label="Reactions"
        color="text-pink-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={Zap}
        value={totalZapAmountIn || 0}
        label="Zaps In (sats)"
        color="text-yellow-400"
        isLoading={isLoading}
      />
      <StatCard
        icon={Zap}
        value={totalZapAmountOut || 0}
        label="Zaps Out (sats)"
        color="text-orange-400"
        isLoading={isLoading}
      />
    </motion.div>
  );
}