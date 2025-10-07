
import React, { useState, useEffect } from "react";
import { AdminSettings } from "@/api/entities";
import { motion } from "framer-motion";
import { Wallet, RefreshCw, Settings, AlertTriangle, Bitcoin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import TreasuryStats from "@/components/treasury/TreasuryStats";
import TransactionRow from "@/components/treasury/TransactionRow";

// This function generates realistic mock transactions to simulate live API calls.
const generateMockTransactions = () => {
    const now = Math.floor(Date.now() / 1000);
    let transactions = [];
    
    // 1. Generate On-Chain Transactions (3)
    transactions.push({
        timestamp: now - (86400 * 5), // 5 days ago
        amount: 500000,
        direction: 'in',
        hash: `d2b1f3a9e4c5...`,
        type: 'bitcoin'
    });
    transactions.push({
        timestamp: now - (86400 * 2), // 2 days ago
        amount: 125000,
        direction: 'out',
        hash: `a3c2b1d0e9f8...`,
        type: 'bitcoin'
    });
    transactions.push({
        timestamp: now - 3600, // 1 hour ago
        amount: 1200000,
        direction: 'in',
        hash: `f4e5d6c7b8a9...`,
        type: 'bitcoin'
    });

    // 2. Generate Lightning Transactions (22)
    for (let i = 0; i < 22; i++) {
        const isIncoming = Math.random() > 0.4;
        transactions.push({
            timestamp: now - (i * 3600 * 2 + Math.random() * 3600), // ~2 hours apart
            amount: Math.floor(Math.random() * 25000) + 1000,
            direction: isIncoming ? 'in' : 'out',
            hash: `ln_tx_${i}_...`,
            type: 'lightning'
        });
    }

    // Sort all transactions by timestamp descending (newest first)
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

export default function Treasury() {
  const [transactions, setTransactions] = useState([]);
  const [adminSettings, setAdminSettings] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(['all']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive items per page: 15 on mobile, 20 on desktop
  const getItemsPerPage = () => {
    // Tailwind's 'md' breakpoint is 768px.
    return window.innerWidth < 768 ? 15 : 20;
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);

  // Update items per page on window resize
  useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = getItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing page size
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]); // Depend on itemsPerPage to ensure handler always uses latest state

  useEffect(() => {
    loadAdminSettings();
  }, []);

  useEffect(() => {
    if (adminSettings) {
      fetchTransactions();
    }
  }, [adminSettings]);

  const loadAdminSettings = async () => {
    try {
      const settings = await AdminSettings.list();
      if (settings.length > 0) {
        setAdminSettings(settings[0]);
      } else {
        // Create default settings if none exist
        const defaultSettings = await AdminSettings.create({
          bitcoin_address: "bc1q7davwh4083qrw8dsnazavamul4ngam99zt7nfy",
          alby_lightning_address: "coherosphere@getalby.com"
        });
        setAdminSettings(defaultSettings);
      }
    } catch (err) {
      setError("Failed to load admin settings");
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay to feel more realistic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use the mock data generator instead of live API calls
      const allTransactions = generateMockTransactions();

      setTransactions(allTransactions);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to fetch transaction data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterToggle = (filterType) => {
    if (filterType === 'all') {
      setSelectedFilters(['all']);
    } else {
      setSelectedFilters(prev => {
        // Remove 'all' if it's selected and we're selecting something specific
        const withoutAll = prev.filter(f => f !== 'all');
        
        if (withoutAll.includes(filterType)) {
          // Remove the filter if it's already selected
          const newFilters = withoutAll.filter(f => f !== filterType);
          // If no filters left, default to 'all'
          return newFilters.length === 0 ? ['all'] : newFilters;
        } else {
          // Add the filter
          return [...withoutAll, filterType];
        }
      });
    }
    // Reset to first page when filter changes
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilters.includes('all')) {
      return true;
    }

    // Check direction filters
    const directionMatch = 
      (selectedFilters.includes('inflow') && transaction.direction === 'in') ||
      (selectedFilters.includes('outflow') && transaction.direction === 'out');

    // Check type filters
    const typeMatch = 
      (selectedFilters.includes('on-chain') && transaction.type === 'bitcoin') ||
      (selectedFilters.includes('lightning') && transaction.type === 'lightning');

    // Determine if any direction filters are active
    const hasActiveDirectionFilters = selectedFilters.some(f => ['inflow', 'outflow'].includes(f));
    // Determine if any type filters are active
    const hasActiveTypeFilters = selectedFilters.some(f => ['on-chain', 'lightning'].includes(f));

    if (hasActiveDirectionFilters && hasActiveTypeFilters) {
      // If both direction and type filters are selected, both must match
      return directionMatch && typeMatch;
    } else if (hasActiveDirectionFilters) {
      // If only direction filters are selected
      return directionMatch;
    } else if (hasActiveTypeFilters) {
      // If only type filters are selected
      return typeMatch;
    }

    return false; // Should not be reached if 'all' is handled or if at least one filter is always active.
  });

  // Add pagination logic
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
    // To get the true "running balance" (cumulative balance at that point in time),
    // we need to process transactions in chronological order (oldest first).
    // Given the `transactions` array is sorted NEWEST first:
    // 1. Calculate the final balance (sum of all transactions).
    // 2. For each transaction, the running balance is the final balance minus the sum of all transactions *newer* than it.
    
    // `allTransactions` is the full (unfiltered, newest first) list.
    // `currentIndex` is the index of the specific transaction within this `allTransactions` array.

    const finalBalance = allTransactions.reduce((sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount), 0);

    // Sum of all transactions *newer* than the current one (i.e., transactions from index 0 up to currentIndex - 1)
    const sumOfNewerTransactions = allTransactions
      .slice(0, currentIndex)
      .reduce((sum, tx) => sum + (tx.direction === 'in' ? tx.amount : -tx.amount), 0);

    return finalBalance - sumOfNewerTransactions;
  };

  const calculateStats = () => {
    const totalIncoming = transactions
      .filter(tx => tx.direction === 'in')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalOutgoing = transactions
      .filter(tx => tx.direction === 'out')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalBalance = totalIncoming - totalOutgoing;

    return {
      totalBalance,
      totalIncoming,
      totalOutgoing,
      transactionCount: transactions.length
    };
  };

  const stats = calculateStats();

  return (
    <div className="p-4 lg:p-8">
      {/* Header - Clean and Horizontal */}
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
            {/* Refresh Button removed */}
            <Button
              variant="outline"
              className="btn-secondary-coherosphere"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Complete financial transparency for coherosphere.
        </p>
      </div>

      {/* Connection Status */}
      <motion.div
        className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bitcoin className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 font-medium">On-Chain Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">1</span>
                <span className="text-slate-400 text-sm">/ 1 active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-slate-300 font-medium">Lightning Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">1</span>
                <span className="text-slate-400 text-sm">/ 1 active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6 bg-orange-500/10 border-orange-500/30">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Treasury Stats */}
      <TreasuryStats {...stats} />

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
            <Badge 
              variant="secondary" 
              className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('all') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {filterCounts.all}
            </Badge>
          </Button>
          <Button
            onClick={() => handleFilterToggle('inflow')}
            variant="ghost"
            className={`filter-chip h-auto ${selectedFilters.includes('inflow') ? 'active' : ''}`}
          >
            Inflow
            <Badge 
              variant="secondary" 
              className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('inflow') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {filterCounts.inflow}
            </Badge>
          </Button>
          <Button
            onClick={() => handleFilterToggle('outflow')}
            variant="ghost"
            className={`filter-chip h-auto ${selectedFilters.includes('outflow') ? 'active' : ''}`}
          >
            Outflow
            <Badge 
              variant="secondary" 
              className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('outflow') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {filterCounts.outflow}
            </Badge>
          </Button>
          <Button
            onClick={() => handleFilterToggle('on-chain')}
            variant="ghost"
            className={`filter-chip h-auto ${selectedFilters.includes('on-chain') ? 'active' : ''}`}
          >
            On-Chain
            <Badge 
              variant="secondary" 
              className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('on-chain') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {filterCounts['on-chain']}
            </Badge>
          </Button>
          <Button
            onClick={() => handleFilterToggle('lightning')}
            variant="ghost"
            className={`filter-chip h-auto ${selectedFilters.includes('lightning') ? 'active' : ''}`}
          >
            Lightning
            <Badge 
              variant="secondary" 
              className={`ml-[3px] transition-colors duration-200 ${selectedFilters.includes('lightning') ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {filterCounts.lightning}
            </Badge>
          </Button>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : paginatedTransactions.length === 0 ? (
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

            {/* Transaction Rows - NO WRAPPER! */}
            <div className="md:bg-slate-800/50 md:backdrop-blur-sm md:border-x md:border-b md:border-slate-700 md:rounded-b-xl md:rounded-t-none">
              {paginatedTransactions.map((transaction, index) => (
                <TransactionRow
                  key={`${transaction.type}-${transaction.hash}-${transaction.timestamp}`}
                  transaction={transaction}
                  index={index}
                  runningBalance={calculateRunningBalance(transactions, transactions.indexOf(transaction))}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                className="p-6 md:bg-slate-800/30 md:backdrop-blur-sm md:border md:border-t-0 md:border-slate-700 md:rounded-b-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Pagination Buttons */}
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
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, arr) => (
                        <React.Fragment key={page}>
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="text-slate-500 px-2">...</span>
                          )}
                          <Button
                            onClick={() => handlePageChange(page)}
                            variant="ghost"
                            className={`filter-chip h-auto w-10 ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))
                    }
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

                {/* Page Info - Now below pagination */}
                <div className="text-slate-400 text-sm text-center">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
