import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Wallet, RefreshCw, Settings, AlertTriangle, Bitcoin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

import TreasuryStats from "@/components/treasury/TreasuryStats";
import TransactionRow from "@/components/treasury/TransactionRow";
import { checkApiStatus } from "@/api/functions";
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

const API_CACHE_KEY = 'coherosphere_api_status';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const BITCOIN_ADDRESS = "bc1q7davwh4083qrw8dsnazavamul4ngam99zt7nfy";

export default function Treasury() {
  const [transactions, setTransactions] = useState([]);
  const [onChainStatus, setOnChainStatus] = useState(null);
  const [lightningStatus, setLightningStatus] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(['all']);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const getItemsPerPage = () => window.innerWidth < 768 ? 15 : 20;
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);

  useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBitcoinTxAmount = useCallback((tx, address) => {
    let received = tx.vout?.reduce((sum, output) => 
        output.scriptpubkey_address === address ? sum + output.value : sum, 0) || 0;
    
    let sent = tx.vin?.reduce((sum, input) =>
        input.prevout?.scriptpubkey_address === address ? sum + input.prevout.value : sum, 0) || 0;

    const netAmount = received - sent;
    return { amount: Math.abs(netAmount), direction: netAmount >= 0 ? 'in' : 'out' };
  }, []);

  const processApiData = useCallback((data) => {
    if (!data) return;

    setOnChainStatus(data.mempool);
    setLightningStatus(data.alby);

    console.log(`Processing ${data.totalBitcoinTxs || 0} Bitcoin txs and ${data.totalLightningTxs || 0} Lightning txs`);

    const onChainTxs = (data.bitcoinTransactions || []).map(tx => {
      const { amount, direction } = getBitcoinTxAmount(tx, BITCOIN_ADDRESS);
      return {
        id: tx.txid,
        hash: tx.txid,
        amount,
        direction,
        timestamp: tx.status.block_time,
        type: 'bitcoin'
      };
    });

    const lightningTxs = (data.lightningTransactions || []).map(tx => ({
      id: tx.id || tx.payment_hash,
      hash: tx.id || tx.payment_hash,
      amount: tx.amount,
      direction: tx.type === 'incoming' ? 'in' : 'out',
      timestamp: tx.created_at,
      type: 'lightning'
    }));

    const allTransactions = [...onChainTxs, ...lightningTxs]
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log(`Combined and sorted: ${allTransactions.length} total transactions`);
    setTransactions(allTransactions);
  }, [getBitcoinTxAmount]);

  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    if (!forceRefresh) {
      const cached = localStorage.getItem(API_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('Using cached Treasury data.');
          processApiData(data);
          setLastRefresh(new Date(timestamp));
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const response = await checkApiStatus();
      if (response && response.data) {
        const now = new Date();
        processApiData(response.data);
        setLastRefresh(now);
        localStorage.setItem(API_CACHE_KEY, JSON.stringify({ data: response.data, timestamp: now.getTime() }));
      } else {
        throw new Error("Invalid API response structure.");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to fetch transaction data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [processApiData]);
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = () => fetchTransactions(true);

  const handleFilterToggle = (filterType) => {
    if (filterType === 'all') {
      setSelectedFilters(['all']);
    } else {
      setSelectedFilters(prev => {
        const withoutAll = prev.filter(f => f !== 'all');
        if (withoutAll.includes(filterType)) {
          const newFilters = withoutAll.filter(f => f !== filterType);
          return newFilters.length === 0 ? ['all'] : newFilters;
        } else {
          return [...withoutAll, filterType];
        }
      });
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilters.includes('all')) return true;
    const directionMatch = 
      (selectedFilters.includes('inflow') && transaction.direction === 'in') ||
      (selectedFilters.includes('outflow') && transaction.direction === 'out');
    const typeMatch = 
      (selectedFilters.includes('on-chain') && transaction.type === 'bitcoin') ||
      (selectedFilters.includes('lightning') && transaction.type === 'lightning');
    const hasActiveDirectionFilters = selectedFilters.some(f => ['inflow', 'outflow'].includes(f));
    const hasActiveTypeFilters = selectedFilters.some(f => ['on-chain', 'lightning'].includes(f));
    if (hasActiveDirectionFilters && hasActiveTypeFilters) return directionMatch && typeMatch;
    if (hasActiveDirectionFilters) return directionMatch;
    if (hasActiveTypeFilters) return typeMatch;
    return false;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const filterCounts = {
    all: transactions.length,
    inflow: transactions.filter(t => t.direction === 'in').length,
    outflow: transactions.filter(t => t.direction === 'out').length,
    'on-chain': transactions.filter(t => t.type === 'bitcoin').length,
    lightning: transactions.filter(t => t.type === 'lightning').length,
  };

  const calculateRunningBalance = (allTransactions, currentIndex) => {
    const finalBalance = allTransactions.reduce((sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount), 0);
    const sumOfNewerTransactions = allTransactions
      .slice(0, currentIndex)
      .reduce((sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount), 0);
    return finalBalance - sumOfNewerTransactions;
  };

  const stats = {
    totalBalance: transactions.reduce((sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount), 0),
    totalIncoming: transactions.filter(tx => tx.direction === 'in').reduce((sum, tx) => sum + tx.amount, 0),
    totalOutgoing: transactions.filter(tx => tx.direction === 'out').reduce((sum, tx) => sum + tx.amount, 0),
    transactionCount: transactions.length
  };

  return (
    <>
      {isLoading ? (
        <>
          {/* Fixed Overlay Spinner */}
          <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
            <div className="text-center">
              <CoherosphereNetworkSpinner 
                size={100}
                lineWidth={2}
                dotRadius={6}
                interval={1100}
                maxConcurrent={4}
              />
              <div className="text-slate-400 text-lg mt-4">Loading Treasury...</div>
            </div>
          </div>
          
          {/* Virtual placeholder */}
          <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
        </>
      ) : (
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <Wallet className="w-12 h-12 text-orange-500 flex-shrink-0" />
                <div>
                  <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                    Treasury & Transactions
                  </h1>
                  <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  className="btn-secondary-coherosphere"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="outline" className="btn-secondary-coherosphere">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
            <p className="text-lg text-slate-400 leading-relaxed mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Complete financial transparency for coherosphere.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6 bg-orange-500/10 border-orange-500/30">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-400">{error}</AlertDescription>
            </Alert>
          )}

          {/* Treasury Stats - NO isLoading prop anymore, data is already loaded */}
          <TreasuryStats {...stats} isLoading={false} />
          
          {/* Transaction Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleFilterToggle('all')}
                variant="ghost"
                className={`filter-chip h-auto ${selectedFilters.includes('all') ? 'active' : ''}`}
              >
                All
                <Badge variant="secondary" className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('all') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}>{filterCounts.all}</Badge>
              </Button>
              <Button
                onClick={() => handleFilterToggle('inflow')}
                variant="ghost"
                className={`filter-chip h-auto ${selectedFilters.includes('inflow') ? 'active' : ''}`}
              >
                Received
                <Badge variant="secondary" className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('inflow') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}>{filterCounts.inflow}</Badge>
              </Button>
              <Button
                onClick={() => handleFilterToggle('outflow')}
                variant="ghost"
                className={`filter-chip h-auto ${selectedFilters.includes('outflow') ? 'active' : ''}`}
              >
                Sent
                <Badge variant="secondary" className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('outflow') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}>{filterCounts.outflow}</Badge>
              </Button>
              <Button
                onClick={() => handleFilterToggle('on-chain')}
                variant="ghost"
                className={`filter-chip h-auto ${selectedFilters.includes('on-chain') ? 'active' : ''}`}
              >
                On-Chain
                <Badge variant="secondary" className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('on-chain') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}>{filterCounts['on-chain']}</Badge>
              </Button>
              <Button
                onClick={() => handleFilterToggle('lightning')}
                variant="ghost"
                className={`filter-chip h-auto ${selectedFilters.includes('lightning') ? 'active' : ''}`}
              >
                Lightning
                <Badge variant="secondary" className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('lightning') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}>{filterCounts.lightning}</Badge>
              </Button>
            </div>
          </motion.div>

          {/* Transactions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No transactions found for selected filters
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 py-3 px-6 bg-slate-700/30 backdrop-blur-sm border border-slate-700 rounded-t-xl text-slate-300 text-sm font-medium">
                  <div className="col-span-3">Transaction</div>
                  <div className="col-span-2">Direction</div>
                  <div className="col-span-3 text-right">Amount</div>
                  <div className="col-span-3 text-right">Running Balance</div>
                  <div className="col-span-1 text-right">Hash</div>
                </div>

                <div className="md:bg-slate-800/50 md:backdrop-blur-sm md:border-x md:border-b md:border-slate-700 md:rounded-b-xl md:rounded-t-none">
                  {paginatedTransactions.map((transaction, index) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      index={index}
                      runningBalance={calculateRunningBalance(transactions, transactions.indexOf(transaction))}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <motion.div
                    className="pt-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="ghost"
                        className={`filter-chip h-auto ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        ←
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                          .map((page, index, arr) => (
                            <React.Fragment key={page}>
                              {index > 0 && arr[index - 1] !== page - 1 && <span className="text-slate-500 px-2">...</span>}
                              <Button onClick={() => handlePageChange(page)} variant="ghost" className={`filter-chip h-auto w-10 ${currentPage === page ? 'active' : ''}`}>{page}</Button>
                            </React.Fragment>
                          ))}
                      </div>
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="ghost"
                        className={`filter-chip h-auto ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        →
                      </Button>
                    </div>
                    <div className="text-slate-400 text-sm text-center">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}