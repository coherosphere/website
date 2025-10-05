import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

export default function TreasuryStats({ 
  totalBalance, 
  totalIncoming, 
  totalOutgoing, 
  transactionCount,
  isLoading
}) {
  const formatSats = (sats) => {
    return new Intl.NumberFormat().format(sats || 0);
  };

  const stats = [
    {
      title: "Balance (sats)",
      value: isLoading ? '...' : formatSats(totalBalance),
      icon: Wallet,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20"
    },
    {
      title: "Inflow (sats)",
      value: isLoading ? '...' : formatSats(totalIncoming),
      icon: TrendingUp,
      color: "text-green-400", 
      bgColor: "bg-green-500/20"
    },
    {
      title: "Outflows (sats)",
      value: isLoading ? '...' : formatSats(totalOutgoing),
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/20"
    },
    {
      title: "Transactions",
      value: isLoading ? '...' : transactionCount,
      icon: ArrowRightLeft,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm">
                {stat.title}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}