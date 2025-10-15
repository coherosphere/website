
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin, Zap, Copy, Check, Heart, Shield, Users, Globe, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { checkApiStatus } from '@/api/functions';
import { generateQrCode } from '@/api/functions';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachedData } from '@/components/caching/useCachedData';
import DonateTransactionList from '@/components/donate/DonateTransactionList';

const BITCOIN_ADDRESS = "bc1q7davwh4083qrw8dsnazavamul4ngam99zt7nfy";

export default function DonatePage() {
  const [onChainCopied, setOnChainCopied] = useState(false);
  const [lightningCopied, setLightningCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('lightning');
  const [showQR, setShowQR] = useState(false);
  const [selectedQRImage, setSelectedQRImage] = useState(null);
  const [selectedQRType, setSelectedQRType] = useState('');
  
  // QR Code generation states
  const [lightningQR, setLightningQR] = useState(null);
  const [onChainQR, setOnChainQR] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const lightningAddress = "coherosphere@getalby.com";

  const { setLoading } = useLoading();

  // Use cached data for treasury transactions
  const {
    data: apiData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useCachedData(
    ['donate', 'transactions'],
    checkApiStatus,
    'donate'
  );

  // Stable state for transactions
  const [transactions, setTransactions] = useState([]);
  const lastTransactionHashRef = React.useRef(null);
  const hasInitializedRef = React.useRef(false);

  // Sync loading state with global loading context - ONLY on initial load
  useEffect(() => {
    setLoading(isLoadingTransactions);
  }, [isLoadingTransactions, setLoading]);

  // Generate QR codes on mount
  useEffect(() => {
    const generateQRCodes = async () => {
      setIsGeneratingQR(true);
      try {
        const lightningResponse = await generateQrCode({ data: `lightning:${lightningAddress}` });
        if (lightningResponse?.data && lightningResponse.data.qrCodeUrl) {
          setLightningQR(lightningResponse.data.qrCodeUrl);
        }

        const onChainResponse = await generateQrCode({ data: `bitcoin:${BITCOIN_ADDRESS}` });
        if (onChainResponse?.data && onChainResponse.data.qrCodeUrl) {
          setOnChainQR(onChainResponse.data.qrCodeUrl);
        }
      } catch (error) {
        console.error('Error generating QR codes:', error);
      } finally {
        setIsGeneratingQR(false);
      }
    };

    generateQRCodes();
  }, [lightningAddress]); // Removed onChainAddress from dependencies as it's now a global constant

  // Helper to calculate Bitcoin transaction amount and direction
  const getBitcoinTxAmount = useCallback((tx, address) => {
    let received = tx.vout?.reduce((sum, output) => 
        output.scriptpubkey_address === address ? sum + output.value : sum, 0) || 0;
    
    let sent = tx.vin?.reduce((sum, input) =>
        input.prevout?.scriptpubkey_address === address ? sum + input.prevout.value : sum, 0) || 0;

    const netAmount = received - sent;
    return { amount: Math.abs(netAmount), direction: netAmount >= 0 ? 'in' : 'out' };
  }, []); // Empty dependency array as it only depends on its args

  // Process and update transactions - EXACT SAME PATTERN AS TREASURY
  useEffect(() => {
    if (!apiData?.data) {
      console.log('[Donate] No API data yet');
      return;
    }

    const data = apiData.data;

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
    }).filter(tx => tx.amount > 0);

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

    // Create a stable hash from transaction IDs and amounts
    const transactionHash = allTransactions
      .map(tx => `${tx.id}:${tx.amount}:${tx.timestamp}`)
      .join('|');
    
    // For initial load, always set transactions
    if (!hasInitializedRef.current && allTransactions.length > 0) {
      console.log('📊 [Donate] Initial transactions load:', {
        count: allTransactions.length,
        hash: transactionHash.substring(0, 50) + '...'
      });
      lastTransactionHashRef.current = transactionHash;
      hasInitializedRef.current = true;
      setTransactions(allTransactions);
      return;
    }
    
    // For subsequent updates, only update if hash changed
    if (hasInitializedRef.current && transactionHash !== lastTransactionHashRef.current) {
      console.log('📊 [Donate] Transactions changed:', {
        oldHash: lastTransactionHashRef.current ? lastTransactionHashRef.current.substring(0, 50) + '...' : 'none',
        newHash: transactionHash.substring(0, 50) + '...',
        oldCount: transactions.length,
        newCount: allTransactions.length
      });
      lastTransactionHashRef.current = transactionHash;
      setTransactions(allTransactions);
    } else if (hasInitializedRef.current) {
      console.log('[Donate] No changes detected, skipping update');
    }
  }, [apiData, getBitcoinTxAmount]);

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

  const handleShowQR = (imageUrl, type) => {
    setSelectedQRImage(imageUrl);
    setSelectedQRType(type);
    setShowQR(true);
  };

  // Memoize relevant transactions to prevent re-renders
  const relevantTransactions = React.useMemo(() => {
    const filtered = transactions.filter(tx => 
      selectedTab === 'lightning' ? tx.type === 'lightning' : tx.type === 'bitcoin'
    );
    return filtered.slice(0, 5);
  }, [transactions, selectedTab]);

  const shouldShowSpinner = isLoadingTransactions && !apiData;

  return (
    <>
      {shouldShowSpinner ? (
        <>
          <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
            <div className="text-center">
              <CoherosphereNetworkSpinner 
                size={100}
                lineWidth={2}
                dotRadius={6}
                interval={1100}
                maxConcurrent={4}
              />
              <div className="text-slate-400 text-lg mt-4">Loading Donations...</div>
            </div>
          </div>
          <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
        </>
      ) : (
        <div className="p-4 lg:p-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-3">
              <Heart className="w-12 h-12 text-orange-500 flex-shrink-0" />
              <div>
                <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                  Fund the Sphere
                </h1>
                <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
              </div>
            </div>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Every sat you contribute resonates through the coherosphere.
              Together we build a resilient and meaningful future – transparent, decentralized, and aligned with our shared values.
            </p>
          </motion.div>

          {/* Two-column layout */}
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
                  onValueChange={(value) => setSelectedTab(value)}
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
                        <div 
                          className="p-4 bg-white rounded-lg w-64 h-64 cursor-pointer hover:ring-4 hover:ring-orange-500/50 transition-all duration-200 flex items-center justify-center"
                          onClick={() => lightningQR && handleShowQR(lightningQR, "Lightning")}
                        >
                          {isGeneratingQR ? (
                            <CoherosphereNetworkSpinner 
                              size={100}
                              lineWidth={2}
                              dotRadius={6}
                              interval={1100}
                              maxConcurrent={4}
                            />
                          ) : lightningQR ? (
                            <img 
                              src={lightningQR}
                              alt="Lightning QR Code"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-500">QR Code not available</div>
                          )}
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
                          <DonateTransactionList 
                            type="lightning" 
                            transactions={relevantTransactions}
                            isLoading={isLoadingTransactions}
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
                        <div 
                          className="p-4 bg-white rounded-lg w-64 h-64 cursor-pointer hover:ring-4 hover:ring-orange-500/50 transition-all duration-200 flex items-center justify-center"
                          onClick={() => onChainQR && handleShowQR(onChainQR, "On-Chain Bitcoin")}
                        >
                          {isGeneratingQR ? (
                            <CoherosphereNetworkSpinner 
                              size={120}
                              lineWidth={2}
                              dotRadius={4}
                              interval={1100}
                              maxConcurrent={4}
                            />
                          ) : onChainQR ? (
                            <img 
                              src={onChainQR}
                              alt="On-Chain QR Code"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-500">QR Code not available</div>
                          )}
                        </div>
                        <div className="w-full max-w-md">
                          <div className="flex items-center">
                            <Input
                              readOnly
                              value={BITCOIN_ADDRESS}
                              className="bg-slate-900 border-slate-600 text-slate-300 h-12 text-center text-sm md:text-base"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(BITCOIN_ADDRESS, 'on-chain')}
                              className="ml-2 text-slate-400 hover:text-white"
                            >
                              {onChainCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                            </Button>
                          </div>
                          <a href={`bitcoin:${BITCOIN_ADDRESS}`} className="w-full">
                            <Button size="lg" className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg h-14">
                              Open in Wallet
                            </Button>
                          </a>
                        </div>
                        
                        {/* On-Chain Transactions */}
                        <div className="w-full max-w-md">
                          <DonateTransactionList 
                            type="bitcoin" 
                            transactions={relevantTransactions}
                            isLoading={isLoadingTransactions}
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
      )}

      {/* QR Code Fullscreen Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedQRImage}
                alt={`${selectedQRType} QR Code`}
                className="w-full h-auto mx-auto rounded-lg"
              />
              <p className="text-center text-sm text-gray-600 mt-6 font-medium">
                {selectedQRType} Donation
              </p>
              <p className="text-center text-xs text-gray-400 mt-2">
                Click outside to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
