
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Bitcoin, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function TransactionRow({ 
  transaction, 
  index, 
  runningBalance 
}) {
  const isIncoming = transaction.direction === 'in';
  const isLightning = transaction.type === 'lightning';
  
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

  const handleHashClick = async (hash) => {
    try {
      await navigator.clipboard.writeText(hash);
      // Optional: You could add a toast notification here
      console.log('Hash copied to clipboard:', hash);
    } catch (err) {
      console.error('Failed to copy hash:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Desktop View */}
      <div
        className={`hidden md:grid grid-cols-12 gap-4 items-center py-4 px-6 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
          isIncoming ? 'bg-green-500/5' : 'bg-red-500/5'
        }`}
      >
        {/* Transaction Type & Icon */}
        <div className="col-span-3 flex items-center gap-3">
          {isLightning ? (
              <Zap className="w-5 h-5 text-orange-400" />
            ) : (
              <Bitcoin className="w-5 h-5 text-orange-400" />
            )}
          <div>
            <div className="text-white font-medium">
              {isLightning ? 'Lightning' : 'On-chain'}
            </div>
            <div className="text-slate-400 text-xs">
              {formatDate(transaction.timestamp)}
            </div>
          </div>
        </div>

        {/* Direction */}
        <div className="col-span-2 flex items-center gap-2">
          {isIncoming ? (
            <ArrowDownCircle className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowUpCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="font-medium text-white">
            {isIncoming ? 'Received' : 'Sent'}
          </span>
        </div>

        {/* Amount */}
        <div className="col-span-3 text-right font-mono">
          <div className={`font-semibold ${
            isIncoming ? 'text-green-400' : 'text-red-400'
          }`}>
            {isIncoming ? '+' : '-'}{formatAmount(transaction.amount)} sats
          </div>
        </div>

        {/* Running Balance */}
        <div className="col-span-3 text-right font-mono">
          <div className="text-white font-semibold">
            {formatAmount(runningBalance)} sats
          </div>
        </div>

        {/* Transaction Hash/ID (truncated) */}
        <div className="col-span-1 text-right">
          {transaction.hash && (
            <button 
              onClick={() => handleHashClick(transaction.hash)}
              className="text-slate-500 text-xs font-mono hover:text-slate-300 cursor-pointer transition-colors"
              title={`Click to copy: ${transaction.hash}`}
            >
              {transaction.hash.substring(0, 6)}...
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile View - With Card like Activity Feed */}
      <div className="md:hidden mb-4">
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {isLightning ? (
                    <Zap className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Bitcoin className="w-5 h-5 text-orange-400" />
                  )}
                <div>
                  <div className="text-white font-semibold">
                    {isLightning ? 'Lightning' : 'On-chain'}
                  </div>
                   <div className="font-medium text-sm flex items-center gap-1 text-white">
                    {isIncoming ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                    <span>{isIncoming ? 'Received' : 'Sent'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold font-mono text-lg ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                   {isIncoming ? '+' : '-'}{formatAmount(transaction.amount)}
                </div>
                 <div className="text-slate-400 text-sm">sats</div>
              </div>
            </div>
            
            <div className="text-xs text-slate-500 mb-4">{formatDate(transaction.timestamp)}</div>
            
            <div className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center mb-2">
              <span className="text-slate-300 font-medium">New Balance:</span>
              <span className="text-white font-semibold font-mono">{formatAmount(runningBalance)} sats</span>
            </div>

            {/* Hash for mobile */}
            {transaction.hash && (
              <div className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-slate-300 font-medium">Hash:</span>
                <button 
                  onClick={() => handleHashClick(transaction.hash)}
                  className="text-slate-400 text-xs font-mono hover:text-slate-200 cursor-pointer transition-colors"
                  title={`Click to copy: ${transaction.hash}`}
                >
                  {transaction.hash.substring(0, 8)}...
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );
}
