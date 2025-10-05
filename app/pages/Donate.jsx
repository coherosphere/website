
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin, Zap, Copy, Check, Heart, Shield, Users, Globe, Eye, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { checkApiStatus } from '@/api/functions';

export default function Donate() {
  const [onChainCopied, setOnChainCopied] = useState(false);
  const [lightningCopied, setLightningCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('lightning');
  const [transactions, setTransactions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onChainAddress = "bc1q7davwh4083qrw8dsnazavamul4ngam99zt7nfy";
  const lightningAddress = "coherosphere@getalby.com";

  useEffect(() => {
    console.log('Main useEffect running');

    // Lokales Flag innerhalb des useEffect
    let isFetching = false;

    // fetchTransactions-Funktion innerhalb von useEffect definieren
    const fetchTransactions = async () => {
      console.log('fetchTransactions called. isFetching:', isFetching);
      
      // Prevent overlapping requests mit lokalem Flag
      if (isFetching) {
        console.log('Already refreshing, skipping (local flag)');
        return;
      }
      
      isFetching = true; // Set local flag to true immediately
      setIsRefreshing(true); // Update state for UI feedback
      console.log('Starting refresh');

      try {
        const response = await checkApiStatus();
        console.log('API response received');
        
        if (response?.data) {
          // Process Bitcoin transactions
          const bitcoinTxs = (response.data.bitcoinTransactions || []).map(tx => {
            let received = 0;
            let sent = 0;

            tx.vout?.forEach((output) => {
              if (output.scriptpubkey_address === onChainAddress) {
                received += output.value;
              }
            });

            tx.vin?.forEach((input) => {
              if (input.prevout && input.prevout.scriptpubkey_address === onChainAddress) {
                sent += input.prevout.value;
              }
            });

            const netAmount = received - sent;
            return {
              id: tx.txid,
              type: 'bitcoin',
              amount: Math.abs(netAmount),
              direction: netAmount >= 0 ? 'in' : 'out',
              timestamp: tx.status.block_time,
              hash: tx.txid
            };
          }).filter(tx => tx.amount > 0);

          // Process Lightning transactions  
          const lightningTxs = (response.data.lightningTransactions || []).map(tx => ({
            id: tx.id || tx.payment_hash,
            type: 'lightning',
            amount: tx.amount,
            direction: tx.type === 'incoming' ? 'in' : 'out',
            timestamp: tx.created_at,
            hash: tx.id || tx.payment_hash
          }));

          // Combine and sort by timestamp (newest first)
          const allTxs = [...bitcoinTxs, ...lightningTxs].sort((a, b) => b.timestamp - a.timestamp);
          console.log('Setting transactions:', allTxs.length);
          setTransactions(allTxs);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        console.log('Finishing refresh');
        isFetching = false; // Lokales Flag zurücksetzen
        setIsRefreshing(false); // Update state for UI feedback
      }
    };

    fetchTransactions(); // Initial fetch
    
    const interval = setInterval(() => {
      console.log('Interval tick');
      fetchTransactions();
    }, 10000);
    
    return () => {
      console.log('Cleaning up interval');
      clearInterval(interval);
    };
  }, []); // Leere dependency array - keine Dependencies nötig!

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'on-chain') {
      setOnChainCopied(true);
      setTimeout(() => setOnChainCopied(false), 2000);
    } else {
      setLightningCopied(true);
      setTimeout(() => setLightningCopied(false), 2000);
    }
  };

  const formatAmount = (sats) => {
    return new Intl.NumberFormat().format(sats);
  };

  const formatDate = (timestamp) => {
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

  // Filter transactions based on selected tab
  const getRelevantTransactions = () => {
    const filtered = transactions.filter(tx => 
      selectedTab === 'lightning' ? tx.type === 'lightning' : tx.type === 'bitcoin'
    );
    return filtered.slice(0, 5); // Show only last 5 transactions
  };

  const TransactionSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
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

  const TransactionList = ({ transactions, type, isRefreshing }) => {
    const showSkeleton = transactions.length === 0 && isRefreshing;

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
          {isRefreshing && transactions.length > 0 && (
            <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
          )}
        </div>
        
        {showSkeleton ? (
          <TransactionSkeleton />
        ) : transactions.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-8">
            No recent {type === 'lightning' ? 'Lightning' : 'Bitcoin'} transactions found
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                  className="flex items-center justify-between py-3 px-4 bg-slate-600/40 rounded-lg hover:bg-slate-600/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {tx.direction === 'in' ? (
                      <ArrowDownCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4 text-red-400" />
                    )}
                    <div className="text-left"> {/* Added text-left */}
                      <div className="text-white text-sm font-medium"> {/* Removed text-left from here as parent handles it */}
                        {tx.direction === 'in' ? 'Received' : 'Sent'}
                      </div>
                      <div className="text-slate-400 text-xs"> {/* Removed text-left from here as parent handles it */}
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
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <Heart className="w-12 h-12 text-orange-500" />
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Participate in the Coherosphere
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 max-w-3xl">
          Your contribution directly funds community-driven projects that align with our <Link to={createPageUrl('Manifesto')} className="text-orange-400 hover:underline">manifesto</Link>. 
          By donating, you strengthen our collective ability to build a resilient and meaningful future. All funds are managed transparently in the community <Link to={createPageUrl('Treasury')} className="text-orange-400 hover:underline">treasury</Link>.
        </p>
      </motion.div>

      {/* Two-column layout: Content left (1/3), Donation options right (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Narrative Content */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Why Donate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Why Support Us?</h2>
            <p className="text-slate-300 leading-relaxed">
              Your donation is not charity – it is <span className="text-orange-400 font-semibold">participation</span>. 
              Every sat flows into projects, hubs, and learning spaces that build resilience and meaning in the age of AI.
            </p>
          </motion.div>

          {/* Transparency & Treasury */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Full Transparency</h2>
            <div className="text-slate-300 leading-relaxed space-y-3 mb-4">
              <p>Bitcoin on-chain transactions are publicly verifiable on the blockchain.</p>
              <p>Lightning payments happen off-chain – yet we make them visible: all movements are disclosed in our live Treasury dashboard.</p>
              <p>This way, every satoshi is accounted for, whether on-chain or Lightning.</p>
            </div>
            <Link
              to={createPageUrl('Treasury')}
              className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Live Treasury
            </Link>
          </motion.div>

          {/* Values Callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Our Values</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Decentralized</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Intelligent</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Resilient</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Collective</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Trustless</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Solid</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Progressive</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300 text-sm">Inviting</span>
              </div>
            </div>
          </motion.div>

          {/* Closing Invitation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Join the Movement</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Join us. Every sat you contribute resonates through the coherosphere.
            </p>
            <div className="flex items-center gap-2 text-orange-400">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">Make Your Mark</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Donation Options */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Tabs 
              defaultValue="lightning" 
              className="w-full"
              onValueChange={(value) => {
                console.log('Tab changed to:', value);
                setSelectedTab(value);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/80 border border-slate-700 h-14">
                <TabsTrigger value="lightning" className="h-12 text-lg data-[state=active]:bg-orange-500/90 data-[state=active]:text-white">
                  <Zap className="w-5 h-5 mr-2" /> Lightning
                </TabsTrigger>
                <TabsTrigger value="on-chain" className="h-12 text-lg data-[state=active]:bg-orange-500/90 data-[state=active]:text-white">
                  <Bitcoin className="w-5 h-5 mr-2" /> On-Chain
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="lightning" className="mt-6">
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-center">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">Lightning Donation</CardTitle>
                    <CardDescription className="text-slate-400">
                      Instant, low-fee payments. Scan with any Lightning-enabled wallet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-6">
                    <div className="p-4 bg-white rounded-lg w-64 h-64">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d16297dc6ef6561cfa083f/67ce0ecfa_lighntingqr.png" 
                        alt="Lightning QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="w-full max-w-md">
                      <div className="flex items-center">
                        <Input
                          readOnly
                          value={lightningAddress}
                          className="bg-slate-900 border-slate-600 text-slate-300 h-12 text-center"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(lightningAddress, 'lightning')}
                          className="ml-2 text-slate-400 hover:text-white"
                        >
                          {lightningCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        </Button>
                      </div>
                      <a href={`lightning:${lightningAddress}`} className="w-full">
                        <Button size="lg" className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg h-14">
                          Open in Wallet
                        </Button>
                      </a>
                    </div>
                    
                    {/* Lightning Transactions */}
                    <div className="w-full max-w-md">
                      <TransactionList 
                        type="lightning" 
                        transactions={getRelevantTransactions()}
                        isRefreshing={isRefreshing}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="on-chain" className="mt-6">
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-center">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">On-Chain Bitcoin Donation</CardTitle>
                    <CardDescription className="text-slate-400">
                      For larger contributions directly to our treasury address.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-6">
                    <div className="p-4 bg-white rounded-lg w-64 h-64">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d16297dc6ef6561cfa083f/14a7019a8_onchainqr.png" 
                        alt="On-Chain QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="w-full max-w-md">
                      <div className="flex items-center">
                        <Input
                          readOnly
                          value={onChainAddress}
                          className="bg-slate-900 border-slate-600 text-slate-300 h-12 text-center text-sm md:text-base"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(onChainAddress, 'on-chain')}
                          className="ml-2 text-slate-400 hover:text-white"
                        >
                          {onChainCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        </Button>
                      </div>
                      <a href={`bitcoin:${onChainAddress}`} className="w-full">
                         <Button size="lg" className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg h-14">
                          Open in Wallet
                        </Button>
                      </a>
                    </div>
                    
                    {/* On-Chain Transactions */}
                    <div className="w-full max-w-md">
                      <TransactionList 
                        type="bitcoin" 
                        transactions={getRelevantTransactions()}
                        isRefreshing={isRefreshing}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
