
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Server, Wifi, RefreshCw, CheckCircle, XCircle, AlertTriangle, Bitcoin, Zap, ArrowDownCircle, ArrowUpCircle, MessageSquare, MinusCircle, AtSign, Reply, ArrowRight, Heart, ThumbsUp, ThumbsDown, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkApiStatus } from '@/api/functions';
import { checkNostrActivity } from '@/api/functions';

// Helper function for Bitcoin transaction amount calculation
// This function is moved outside the component to be a pure utility.
const getBitcoinTxAmountHelper = (tx, address) => {
  let received = 0;
  let sent = 0;

  tx.vout?.forEach((output) => {
    if (output.scriptpubkey_address === address) {
      received += output.value;
    }
  });

  tx.vin?.forEach((input) => {
    if (input.prevout?.scriptpubkey_address === address) {
      sent += input.prevout.value;
    }
  });

  const netAmount = received - sent;
  return { amount: Math.abs(netAmount), direction: netAmount > 0 ? 'in' : 'out' };
};


const StatusIndicator = ({ status, name, message, extraInfo, relayStatuses, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 animate-pulse lg:h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-6 w-3/4 bg-slate-700 rounded mb-2"></div>
          <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-1/2 bg-slate-700 rounded mb-2"></div>
          <div className="h-4 w-full bg-slate-700 rounded"></div>
        </CardContent>
      </Card>);

  }

  const isFullyOperational = status === true;

  // Logic for Degraded Status
  let isDegraded = false;
  if (name === "Nostr Relays" && relayStatuses) {
    const total = relayStatuses.length;
    const connected = relayStatuses.filter((r) => r.status === 'connected').length;
    if (connected > 0 && connected < total) {
      isDegraded = true;
    }
  }

  const getStatusConfig = () => {
    if (isDegraded) {
      return {
        cardColor: 'border-orange-500/30',
        iconColor: 'text-orange-400',
        textColor: 'text-orange-400',
        Icon: MinusCircle,
        label: 'Degraded'
      };
    }
    if (isFullyOperational) {
      return {
        cardColor: 'border-green-500/30',
        iconColor: 'text-green-400',
        textColor: 'text-green-400',
        Icon: CheckCircle,
        label: 'Operational'
      };
    }
    return {
      cardColor: 'border-red-500/30',
      iconColor: 'text-red-400',
      textColor: 'text-red-400',
      Icon: XCircle,
      label: 'Error'
    };
  };

  const { cardColor, iconColor, textColor, Icon, label } = getStatusConfig();

  return (
    <Card className={`bg-slate-800/50 backdrop-blur-sm ${cardColor} lg:h-[400px] flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-medium text-white">{name}</CardTitle>
        <Icon className={`${iconColor} w-6 h-6`} />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className={`text-2xl font-bold ${textColor}`}>
          {label}
        </p>
        <p className="text-xs text-slate-400 mt-1">{message}</p>

        {/* API Status für On-Chain API and Lightning API */}
        {(name === "On-Chain API" || name === "Lightning API") &&
        <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-sm text-slate-300 mb-2">API Status:</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {name === "On-Chain API" ? "mempool.space/api" : "api.getalby.com"}
              </span>
              <div className="flex items-center gap-1">
                {isFullyOperational ?
              <>
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">OK</span>
                  </> :

              <>
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">Error</span>
                  </>
              }
              </div>
            </div>
          </div>
        }

        {relayStatuses && relayStatuses.length > 0 &&
        <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-sm text-slate-300 mb-2">Relay Status:</p>
            <div className="space-y-1">
              {relayStatuses.map((relay) =>
            <div key={relay.url} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 truncate flex-1 pr-2">
                    {relay.url.replace('wss://', '')}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {relay.status === 'connected' ?
                <>
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">OK</span>
                      </> :

                <>
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">Failed</span>
                      </>
                }
                  </div>
                </div>
            )}
            </div>
          </div>
        }
        {extraInfo &&
        <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-sm text-slate-300">{extraInfo}</p>
          </div>
        }
      </CardContent>
    </Card>);

};

const TransactionCard = ({ title, transactions, type, icon: Icon, address, error, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 animate-pulse lg:h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="h-6 w-3/4 bg-slate-700 rounded mb-2"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-10 w-full bg-slate-700 rounded"></div>
          <div className="h-10 w-full bg-slate-700 rounded"></div>
        </CardContent>
      </Card>);

  }

  const formatAmount = (sats) => {
    return new Intl.NumberFormat().format(sats);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return 'not confirmed';
    }
    try {
      let date;
      if (typeof timestamp === 'number') {
        date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'not confirmed';
      }

      if (isNaN(date.getTime())) return 'not confirmed';

      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) + ', ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'not confirmed';
    }
  };

  // The getBitcoinTxAmount function is no longer needed here,
  // as Bitcoin transactions are pre-processed by `processApiData`
  // with 'amount' and 'direction' properties already set.

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 lg:h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <Icon className="w-5 h-5 text-orange-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ?
        <p className="text-red-400 text-sm">Error: {error}</p> :
        transactions.length === 0 ?
        <p className="text-slate-400 text-sm">No recent transactions</p> :

        transactions.map((tx, index) => {
          // Both Bitcoin and Lightning transactions are now expected to have `amount`, `direction`, and `timestamp`
          const { amount, direction, timestamp } = tx;

          return (
            <div key={tx.id || tx.txid || index} className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {direction === 'in' ? (
                    <ArrowDownCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <div className="text-white text-sm font-medium">
                      {direction === 'in' ? 'Received' : 'Sent'}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {formatDate(timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${direction === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                    {direction === 'in' ? '+' : '-'}{formatAmount(amount)}
                  </div>
                  <div className="text-slate-400 text-xs">sats</div>
                </div>
              </div>);

        })
        }
      </CardContent>
    </Card>);

};

const NostrEventCard = ({ events, error, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 animate-pulse lg:h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="h-6 w-3/4 bg-slate-700 rounded mb-2"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-10 w-full bg-slate-700 rounded"></div>
          <div className="h-10 w-full bg-slate-700 rounded"></div>
        </CardContent>
      </Card>);

  }

  const formatDate = (timestamp) => {
    try {
      let date;
      if (typeof timestamp === 'number') {
        date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'Unknown date';
      }

      if (isNaN(date.getTime())) return 'Invalid date';

      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) + ', ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Date error';
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content || typeof content !== 'string') return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatAmount = (sats) => {
    return new Intl.NumberFormat().format(sats);
  };

  // Renders the appropriate monochrome icon for a reaction
  const getReactionIcon = (content) => {
    switch (content) {
      case '+':return <ThumbsUp className="w-4 h-4 inline-block text-slate-400" />;
      case '-':return <ThumbsDown className="w-4 h-4 inline-block text-slate-400" />;
      case '❤️':
      case '💜':
        return <Heart className="w-4 h-4 inline-block text-slate-400" />;
      default:
        // For other emojis, just display them, otherwise show a generic smile
        // Using `u` flag for unicode property escapes for emoji regex
        return content.match(/\p{Emoji}/u) ? <span className="text-slate-400">{content}</span> : <Smile className="w-4 h-4 inline-block text-slate-400" />;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'post':return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'mention':return <AtSign className="w-4 h-4 text-purple-400" />;
      case 'reply':return <Reply className="w-4 h-4 text-green-400" />;
      case 'zap-in':return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'zap-out':return <Zap className="w-4 h-4 text-orange-400" />;
      case 'reaction':return <Heart className="w-4 h-4 text-pink-400" />; // Use a generic reaction icon
      default:return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  const renderEventContent = (event) => {
    const isZapIn = event.type === 'zap-in';
    const isZapOut = event.type === 'zap-out'; // Simplified, original used event.direction === 'out'
    const isZap = isZapIn || isZapOut;
    // const isMention = event.type === 'mention'; // Not used in this specific update
    const isReaction = event.type === 'reaction';

    return (
      <div className="flex items-start justify-between w-full">
        {/* Left side: Icon, Type, Content */}
        <div className="flex items-start gap-3">
          <div className="mt-1">{getActivityIcon(event.type)}</div>
          <div>
            <div className="text-white text-sm font-medium capitalize">
              {event.type.replace('-', ' ')}
            </div>

            {/* Show content with special handling for reactions */}
            <div className="text-slate-400 text-xs mt-1 leading-relaxed">
              {isReaction ?
              <span className="flex items-center gap-1.5">
                  {getReactionIcon(event.content)}
                  <span>on a post</span>
                </span> :

              truncateContent(event.content) || (isZap ? isZapIn ? "Received Zap" : "Sent Zap" : "No content")
              }
            </div>
          </div>
        </div>

        {/* Right side: Amount and Time */}
        <div className="text-right ml-4 flex-shrink-0">
          {isZap && event.amount > 0 &&
          <div className={`font-semibold text-sm mb-1 ${isZapIn ? 'text-green-400' : 'text-red-400'}`}>
              {isZapIn ? '+' : '-'}{formatAmount(event.amount)} sats
            </div>
          }
          <div className="text-slate-500 text-xs">
            {formatDate(event.created_at)} {/* Using event.created_at as per existing data structure */}
          </div>
        </div>
      </div>);

  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 lg:h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          Latest Nostr Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ?
        <p className="text-red-400 text-sm">Error: {error}</p> :
        events.length === 0 ?
        <p className="text-slate-400 text-sm">No recent Nostr events found</p> :

        events.map((event, index) =>
        <div key={`${event.id || index}`} className="py-2 px-3 bg-slate-700/30 rounded-lg">
              {renderEventContent(event)}
            </div>
        )
        }
      </CardContent>
    </Card>);

};


export default function StatusPage() {
  const [bitcoinStatus, setBitcoinStatus] = useState(null);
  const [lightningStatus, setLightningStatus] = useState(null);
  const [nostrStatus, setNostrStatus] = useState(null);

  const [bitcoinTransactions, setBitcoinTransactions] = useState([]);
  const [lightningTransactions, setLightningTransactions] = useState([]);
  const [nostrEvents, setNostrEvents] = useState([]);

  const [bitcoinError, setBitcoinError] = useState(null);
  const [lightningError, setLightningError] = useState(null);
  const [nostrError, setNostrError] = useState(null);

  const [isLoadingBitcoin, setIsLoadingBitcoin] = useState(true);
  const [isLoadingLightning, setIsLoadingLightning] = useState(true);
  const [isLoadingNostr, setIsLoadingNostr] = useState(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const [lastCheckedTime, setLastCheckedTime] = useState(null);

  // Define the Bitcoin address constant here
  const BITCOIN_ADDRESS = "bc1q7davwh4083qrw8dsnazavamul4ngam99zt7nfy";

  const processApiData = useCallback((data) => {
    if (!data) return;

    setBitcoinStatus(data.mempool);
    setLightningStatus(data.alby);

    console.log(`Processing ${data.bitcoinTransactions?.length || 0} Bitcoin txs and ${data.lightningTransactions?.length || 0} Lightning txs`);

    const onChainTxs = (data.bitcoinTransactions || []).map((tx) => {
      // Use the external helper function to get amount and direction
      const { amount, direction } = getBitcoinTxAmountHelper(tx, BITCOIN_ADDRESS);
      return {
        id: tx.txid,
        hash: tx.txid,
        amount,
        direction,
        timestamp: tx.status?.block_time, // Access block_time safely
        type: 'bitcoin'
      };
    });

    const lightningTxs = (data.lightningTransactions || []).map((tx) => ({
      id: tx.id || tx.payment_hash,
      hash: tx.id || tx.payment_hash,
      amount: tx.amount,
      direction: tx.type === 'incoming' ? 'in' : 'out',
      timestamp: tx.created_at,
      type: 'lightning'
    }));

    // Limit to 3 most recent for each type on Status page
    setBitcoinTransactions(onChainTxs.slice(0, 3));
    setLightningTransactions(lightningTxs.slice(0, 3));
  }, [BITCOIN_ADDRESS]); // BITCOIN_ADDRESS is a dependency for useCallback

  const processNostrData = useCallback((data) => {
    if (!data) return;

    // Erwartete Datenstruktur von checkNostrActivity verarbeiten
    const relayStatuses = data.relayStatuses || [];
    const connectedCount = relayStatuses.filter((r) => r.status === 'connected').length;
    const totalCount = relayStatuses.length;

    setNostrStatus({
      connected: connectedCount > 0,
      message: connectedCount > 0 ? 'Connection successful' : 'Connection failed',
      events: data.events || [],
      relayStatuses: relayStatuses,
      relayCount: connectedCount,
      totalRelays: totalCount
    });

    // Limit to 3 most recent events for Status page
    setNostrEvents((data.events || []).slice(0, 3));
    setNostrError(data.error); // Keep original error setting
  }, []);

  // Separate loading functions for each service
  const fetchBitcoinAndLightningStatus = useCallback(async () => {
    setIsLoadingBitcoin(true);
    setIsLoadingLightning(true); // Both start loading together
    setBitcoinError(null);
    setLightningError(null);

    let apiData = null; // To store the successful response data for return
    try {
      const apiRes = await checkApiStatus();
      if (apiRes && apiRes.data) {
        apiData = apiRes.data; // Capture data for return

        // Process data using the new useCallback function
        processApiData(apiData);

        setIsLoadingBitcoin(false); // Bitcoin part finished loading
        setIsLoadingLightning(false); // Lightning part finished loading

      } else {
        const errorMsg = 'Invalid response from On-Chain/Lightning API.';
        setBitcoinError(errorMsg);
        setLightningError(errorMsg);
        setIsLoadingBitcoin(false);
        setIsLoadingLightning(false);
      }
    } catch (error) {
      const errorMsg = error?.message || 'Failed to fetch API status.';
      setBitcoinError(errorMsg);
      setLightningError(errorMsg);
      setIsLoadingBitcoin(false);
      setIsLoadingLightning(false);
    }
    return apiData; // Return the fetched data
  }, [processApiData]); // Added processApiData as a dependency

  const fetchNostrStatus = useCallback(async () => {
    setIsLoadingNostr(true);
    setNostrError(null);

    let nostrData = null; // To store the successful response data for return
    try {
      const nostrRes = await checkNostrActivity();
      if (nostrRes && nostrRes.data) {
        nostrData = nostrRes.data; // Capture data for return
        // Process data using the new useCallback function
        processNostrData(nostrData);
      } else {
        setNostrError('Invalid response from Nostr activity service.');
      }
    } catch (error) {
      setNostrError(error?.message || 'Failed to fetch Nostr activity.');
    } finally {
      setIsLoadingNostr(false);
    }
    return nostrData; // Return the fetched data
  }, [processNostrData]); // Added processNostrData as a dependency

  const fetchAllStatuses = useCallback(async () => {
    setIsRefreshingAll(true);
    setLastCheckedTime(new Date().toISOString());

    // Launch all loading processes independently and capture their promises
    const apiPromise = fetchBitcoinAndLightningStatus();
    const nostrPromise = fetchNostrStatus();

    // Wait for all "logical" fetches to complete.
    // The state updates might still be pending React's render cycle,
    // but the `apiDataResult` and `nostrDataResult` will contain the raw data returned by the fetch functions.
    const [apiDataResult, nostrDataResult] = await Promise.allSettled([
    apiPromise,
    nostrPromise]
    );

    setIsRefreshingAll(false);

    // --- Cache Update and Event Dispatch ---
    const CACHE_KEY = 'coherosphere_api_status';
    const NOSTR_CACHE_KEY = 'coherosphere_nostr_status';

    let cachedApiData = null;
    if (apiDataResult.status === 'fulfilled' && apiDataResult.value) {
      cachedApiData = apiDataResult.value;
      const apiCacheEntry = {
        data: cachedApiData,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(apiCacheEntry));
    } else {
      // If API call failed or was rejected, clear existing cache or handle error
      localStorage.removeItem(CACHE_KEY);
    }

    let cachedNostrData = null;
    if (nostrDataResult.status === 'fulfilled' && nostrDataResult.value) {
      cachedNostrData = nostrDataResult.value;
      const nostrCacheEntry = {
        data: cachedNostrData,
        timestamp: Date.now()
      };
      localStorage.setItem(NOSTR_CACHE_KEY, JSON.stringify(nostrCacheEntry));
    } else {
      // If Nostr call failed or was rejected, clear existing cache or handle error
      localStorage.removeItem(NOSTR_CACHE_KEY);
    }

    // Dispatch custom event to notify Footer of fresh data
    window.dispatchEvent(new CustomEvent('statusDataUpdated', {
      detail: {
        apiStatus: cachedApiData, // Use the directly fetched data for event
        nostrStatus: cachedNostrData // Use the directly fetched data for event
      }
    }));
  }, [fetchBitcoinAndLightningStatus, fetchNostrStatus]); // Only dependencies are the functions themselves

  useEffect(() => {
    fetchAllStatuses();
  }, [fetchAllStatuses]);

  const displayLastCheckedTime = lastCheckedTime ?
  new Date(lastCheckedTime).toLocaleTimeString('en-GB') :
  'N/A';

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>

        <div className="flex items-center gap-4">
          <Server className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              System Status
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Live monitoring ({isRefreshingAll ? '...' : displayLastCheckedTime}) of core API integrations.
        </p>
      </motion.div>

      {/* Refresh Controls */}
      <motion.div
        className="mb-8 flex items-center justify-end"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>

        <Button onClick={fetchAllStatuses} disabled={isRefreshingAll} className="btn-secondary-coherosphere">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingAll ? 'animate-spin' : ''}`} />
          {isRefreshingAll ? 'Refreshing...' : 'Refresh Status'}
        </Button>
      </motion.div>

      {/* Status Grid - Reorganized for Mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: On-Chain */}
        <div className="space-y-6 flex flex-col">
          <StatusIndicator
            name="On-Chain API"
            status={bitcoinStatus?.connected}
            message={bitcoinStatus?.message}
            extraInfo={
            <>
                {bitcoinStatus?.blockHeight &&
              <div>Current Block Height: {bitcoinStatus.blockHeight.toLocaleString()}</div>
              }
                {bitcoinStatus?.txCount24h !== undefined &&
              <div>Number of Transactions last 24h: {bitcoinStatus.txCount24h}</div>
              }
              </>
            }
            isLoading={isLoadingBitcoin} />

          <TransactionCard
            title="Recent Bitcoin Transactions"
            transactions={bitcoinTransactions}
            type="bitcoin"
            icon={Bitcoin}
            address={BITCOIN_ADDRESS}
            error={bitcoinError}
            isLoading={isLoadingBitcoin} />
        </div>

        {/* Column 2: Lightning */}
        <div className="space-y-6 flex flex-col">
          <StatusIndicator
            name="Lightning API"
            status={lightningStatus?.connected}
            message={lightningStatus?.message}
            extraInfo={lightningStatus?.txCount24h !== undefined ? `Number of Transactions last 24h: ${lightningStatus.txCount24h}` : null}
            isLoading={isLoadingLightning} />

          <TransactionCard
            title="Recent Lightning Transactions"
            transactions={lightningTransactions}
            type="lightning"
            icon={Zap}
            error={lightningError}
            isLoading={isLoadingLightning} />
        </div>

        {/* Column 3: Nostr */}
        <div className="space-y-6 flex flex-col">
          <StatusIndicator
            name="Nostr Relays"
            status={nostrStatus?.connected}
            message={nostrStatus?.message || (nostrStatus?.connected ? 'Connection successful' : 'Connection failed')}
            extraInfo={nostrStatus?.events ? `Number of Events: ${nostrStatus.events.length}` : null}
            relayStatuses={nostrStatus?.relayStatuses}
            isLoading={isLoadingNostr} />

          <NostrEventCard
            events={nostrEvents}
            error={nostrError}
            isLoading={isLoadingNostr} />
        </div>
      </motion.div>
    </div>);

}
