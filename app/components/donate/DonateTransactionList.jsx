import React from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, Zap, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const TransactionSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-3 px-4 bg-slate-600/40 rounded-lg animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
          <div>
            <div className="h-4 w-16 bg-slate-600 rounded mb-1"></div>
            <div className="h-3 w-24 bg-slate-600 rounded"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="h-4 w-12 bg-slate-600 rounded mb-1"></div>
          <div className="h-3 w-8 bg-slate-600 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function DonateTransactionList({ transactions, type, isLoading }) {
  const showSkeleton = transactions.length === 0 && isLoading;

  const formatAmount = (sats) => {
    return new Intl.NumberFormat().format(sats);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return 'not confirmed';
    }
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-slate-700/30 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          {type === 'lightning' ? <Zap className="w-4 h-4 text-yellow-400" /> : <Bitcoin className="w-4 h-4 text-orange-400" />}
          Recent {type === 'lightning' ? 'Lightning' : 'Bitcoin'} Transactions
        </h4>
      </div>
      
      {showSkeleton ? (
        <TransactionSkeleton />
      ) : transactions.length === 0 ? (
        <div className="text-slate-400 text-sm text-center py-8">
          No recent {type === 'lightning' ? 'Lightning' : 'Bitcoin'} transactions found
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              layout="position"
              initial={false}
              className="flex items-center justify-between py-3 px-4 bg-slate-600/40 rounded-lg hover:bg-slate-600/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                {tx.direction === 'in' ? (
                  <ArrowDownCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowUpCircle className="w-4 h-4 text-red-400" />
                )}
                <div className="text-left">
                  <div className="text-white text-sm font-medium text-left">
                    {tx.direction === 'in' ? 'Received' : 'Sent'}
                  </div>
                  <div className="text-slate-400 text-xs text-left">
                    {formatDate(tx.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold text-sm ${tx.direction === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.direction === 'in' ? '+' : '-'}{formatAmount(tx.amount)}
                </div>
                <div className="text-slate-400 text-xs">sats</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}