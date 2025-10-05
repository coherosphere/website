import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, value, label, color, isLoading }) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardContent className="p-4 text-center">
        <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
        <div className="text-2xl font-bold text-white mb-1">
          {isLoading && value === '—' ? (
            <div className="h-8 w-16 mx-auto bg-slate-700 animate-pulse rounded" />
          ) : (
            <motion.div
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {value}
            </motion.div>
          )}
        </div>
        <div className="text-slate-400 text-sm">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}