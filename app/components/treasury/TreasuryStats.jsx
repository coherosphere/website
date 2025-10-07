import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import StatCard from '@/components/StatCard';

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

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <StatCard
        icon={Wallet}
        value={isLoading ? '—' : formatSats(totalBalance)}
        label="Balance (sats)"
        color="text-orange-400"
        isLoading={isLoading}
      />
      <StatCard
        icon={TrendingUp}
        value={isLoading ? '—' : formatSats(totalIncoming)}
        label="Received (sats)"
        color="text-green-400"
        isLoading={isLoading}
      />
      <StatCard
        icon={TrendingDown}
        value={isLoading ? '—' : formatSats(totalOutgoing)}
        label="Sent (sats)"
        color="text-red-400"
        isLoading={isLoading}
      />
      <StatCard
        icon={ArrowRightLeft}
        value={isLoading ? '—' : transactionCount}
        label="Transactions"
        color="text-blue-400"
        isLoading={isLoading}
      />
    </motion.div>
  );
}