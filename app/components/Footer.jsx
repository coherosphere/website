
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { useUser } from '@/components/auth/UserContext';
import {
  Brain,
  ArrowUp,
  Copy,
  Github,
  CheckCircle,
  X,
  Wifi,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { checkApiStatus } from '@/api/functions';
import { checkNostrActivity } from '@/api/functions';

// Twitter X Icon component
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer() {
  const [copyToast, setCopyToast] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState('idle');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  
  // Accordion state for mobile
  const [openAccordion, setOpenAccordion] = useState(null);

  const { currentUser, updateUserLocally } = useUser();

  // Load API status on component mount
  useEffect(() => {
    const loadApiStatus = async () => {
      const CACHE_KEY = 'coherosphere_api_status';
      const NOSTR_CACHE_KEY = 'coherosphere_nostr_status';
      const CACHE_TTL = 10 * 60 * 1000;

      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedNostrData = localStorage.getItem(NOSTR_CACHE_KEY);

        let useCache = false;

        if (cachedData && cachedNostrData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const { data: nostrData, timestamp: nostrTimestamp } = JSON.parse(cachedNostrData);
          const now = Date.now();

          if (now - timestamp < CACHE_TTL && now - nostrTimestamp < CACHE_TTL) {
            console.log('Using cached API status data');
            setApiStatus({ ...data, nostrStatus: nostrData });
            useCache = true;
          }
        }

        if (!useCache) {
          console.log('Fetching fresh API status data');
          const [apiResponse, nostrResponse] = await Promise.all([
            checkApiStatus(),
            checkNostrActivity()
          ]);

          const apiCacheEntry = {
            data: apiResponse.data,
            timestamp: Date.now()
          };
          const nostrCacheEntry = {
            data: nostrResponse.data,
            timestamp: Date.now()
          };

          localStorage.setItem(CACHE_KEY, JSON.stringify(apiCacheEntry));
          localStorage.setItem(NOSTR_CACHE_KEY, JSON.stringify(nostrCacheEntry));

          setApiStatus({ ...apiResponse.data, nostrStatus: nostrResponse.data });
        }
      } catch (error) {
        console.log('Failed to load API status:', error.message);

        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedNostrData = localStorage.getItem(NOSTR_CACHE_KEY);
        if (cachedData && cachedNostrData) {
          const { data } = JSON.parse(cachedData);
          const { data: nostrData } = JSON.parse(cachedNostrData);
          console.log('Using stale cached data as fallback');
          setApiStatus({ ...data, nostrStatus: nostrData });
        } else {
          setApiStatus(null);
        }
      }
    };

    loadApiStatus();

    const handleStatusUpdate = (event) => {
      console.log('Footer received fresh status data from Status page');
      setApiStatus({ ...event.detail.apiStatus, nostrStatus: event.detail.nostrStatus });
    };

    window.addEventListener('statusDataUpdated', handleStatusUpdate);

    return () => {
      window.removeEventListener('statusDataUpdated', handleStatusUpdate);
    };
  }, []);

  useEffect(() => {
    if (currentUser?.newsletter_subscribed) {
      setIsSubscribed(true);
    } else {
      setIsSubscribed(false);
    }
  }, [currentUser]);

  const handleNewsletterSubscribe = async () => {
    if (!currentUser || newsletterStatus === 'loading') {
      if (!currentUser) {
        setNewsletterStatus('error');
        console.warn("Attempted to subscribe/unsubscribe without a logged-in user.");
        setTimeout(() => setNewsletterStatus('idle'), 3000);
      }
      return;
    }

    setNewsletterStatus('loading');

    try {
      const newSubscriptionStatus = !isSubscribed;
      const updateData = {
        newsletter_subscribed: newSubscriptionStatus,
        newsletter_subscribed_date: newSubscriptionStatus ? new Date().toISOString() : null
      };

      await User.updateMyUserData(updateData);
      
      updateUserLocally(updateData);
      setIsSubscribed(newSubscriptionStatus);
      setNewsletterStatus('success');

      setTimeout(() => {
        setNewsletterStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Failed to update newsletter subscription:', error);
      setNewsletterStatus('error');
      setTimeout(() => {
        setNewsletterStatus('idle');
      }, 3000);
    }
  };

  const handleCopyNpub = () => {
    const npub = "npub1kc9weag9hjf0p0xz5naamts48rdkzymucvrd9ws8ns7n4x3qq5gsljlnck";
    navigator.clipboard.writeText(npub);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const footerLinks = {
    explore: [
      { label: 'Manifesto', href: createPageUrl('Manifesto') },
      { label: 'Resonance Board', href: createPageUrl('Dashboard') },
      { label: 'Active Projects', href: createPageUrl('Projects') },
      { label: 'Local Hub', href: createPageUrl('Hub') },
      { label: 'Global Hubs', href: createPageUrl('GlobalHubs') },
      { label: 'Learning', href: createPageUrl('Learning') }
    ],
    engage: [
      { label: 'Send a Message', href: createPageUrl('Messages') },
      { label: 'Share Knowledge', href: createPageUrl('ShareKnowledge') },
      { label: 'Host an Event', href: createPageUrl('HostEvent') },
      { label: 'Start a Learning Circle', href: createPageUrl('StartCircle') },
      { label: 'Start a Project', href: createPageUrl('CreateProject') },
      { label: 'Fund the Sphere', href: createPageUrl('Donate') }
    ],
    governance_treasury: [
      { label: 'Governance', href: createPageUrl('Voting') },
      { label: 'Treasury', href: createPageUrl('Treasury') },
      { label: 'Activity', href: createPageUrl('Activity') },
      { label: 'FAQ', href: createPageUrl('FAQ') },
      { label: 'Open Source', href: 'https://github.com/coherosphere' }
    ]
  };

  const socialLinks = [
    {
      label: 'Follow coherosphere on Nostr',
      href: 'https://primal.net/p/npub1kc9weag9hjf0p0xz5naamts48rdkzymucvrd9ws8ns7n4x3qq5gsljlnck',
      icon: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z" />
          <path d="M8 11.5L12 15l4-3.5" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      )
    },
    {
      label: 'Open coherosphere GitHub',
      href: 'https://github.com/coherosphere',
      icon: Github
    }
  ];

  // Get environment/build information (safely handle env variables)
  const getEnvInfo = () => {
    // Try to read from window object (can be injected at build time)
    if (typeof window !== 'undefined' && window.__BUILD_INFO__) {
      return window.__BUILD_INFO__;
    }
    
    // Default fallback values
    return {
      commit: 'dev',
      buildId: 'local',
      env: 'development'
    };
  };

  const envInfo = getEnvInfo();

  // Helper to get short commit hash
  const getShortCommit = (commit) => {
    if (commit === 'dev' || commit === 'local') return commit;
    return commit.substring(0, 7);
  };

  // Helper to get env badge color
  const getEnvBadgeColor = (env) => {
    switch(env.toLowerCase()) {
      case 'production':
      case 'prod':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'staging':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'development':
      case 'dev':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getNetworkIconStatus = () => {
    if (!apiStatus) return { color: 'text-slate-400', connected: 0, total: 0 };

    let totalConnected = 0;
    let totalServices = 0;

    if (apiStatus.mempool) {
      totalServices += 1;
      if (apiStatus.mempool.connected) totalConnected += 1;
    }

    if (apiStatus.alby) {
      totalServices += 1;
      if (apiStatus.alby.connected) totalConnected += 1;
    }

    if (apiStatus.nostrStatus) {
      totalServices += apiStatus.nostrStatus.totalRelays || 0;
      totalConnected += apiStatus.nostrStatus.relayCount || 0;
    }

    let color;
    if (totalServices === 0) {
      color = 'text-slate-400';
    } else if (totalConnected === 0) {
      color = 'text-red-400';
    } else if (totalConnected === totalServices) {
      color = 'text-green-400';
    } else {
      color = 'text-orange-400';
    }

    return { color, connected: totalConnected, total: totalServices };
  };

  const networkStatus = getNetworkIconStatus();

  return (
    <footer className="w-full bg-[#1B1F2A] relative overflow-hidden">
      {/* Subtle radial glow in corners */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-orange-500/[0.02] to-transparent rounded-full -translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-orange-500/[0.04] to-transparent rounded-full translate-x-48 -translate-y-48" />
      </div>

      <div className="relative z-10">
        {/* Top Row - Meta Actions */}
        <div className="px-4 lg:px-8 py-6">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Nostr News Button */}
              <Button
                onClick={handleNewsletterSubscribe}
                disabled={newsletterStatus === 'loading' || !currentUser}
                className={`bg-[#2A2D32] hover:bg-black active:bg-gradient-to-r active:from-orange-500 active:to-orange-600 text-white border-0 rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  !currentUser ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {newsletterStatus === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
                  </>
                ) : newsletterStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {isSubscribed ? 'Subscribed!' : 'Unsubscribed!'}
                  </>
                ) : newsletterStatus === 'error' ? (
                  <>
                    <X className="w-4 h-4" />
                    {!currentUser ? 'Login to subscribe' : 'Error'}
                  </>
                ) : (
                  <>
                    {isSubscribed ? 'Unsubscribe' : 'Nostr News'}
                    <Brain className="w-4 h-4" />
                  </>
                )}
              </Button>

              {/* Admin Telemetry - Only visible for admins */}
              {currentUser?.role === 'admin' && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
                  <Badge className={`text-xs ${getEnvBadgeColor(envInfo.env)}`}>
                    {envInfo.env.toUpperCase()}
                  </Badge>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-400 text-xs font-mono">
                    {getShortCommit(envInfo.commit)}
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-400 text-xs font-mono">
                    #{envInfo.buildId}
                  </span>
                </div>
              )}
            </div>

            {/* Back to Top */}
            <Button
              onClick={scrollToTop}
              className="bg-[#2A2D32] hover:bg-black text-white border-0 rounded-lg w-10 h-10 p-0 transition-all duration-200"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#2E3440] mt-3" />
        </div>

        {/* DESKTOP VIEW - Original Grid (hidden on mobile) */}
        <div className="hidden lg:block px-4 lg:px-8 pt-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {/* Column 1 - Explore */}
            <div className="h-full flex flex-col">
              <h3 className="text-white font-semibold mb-4">Explore</h3>
              <ul className="space-y-3">
                {footerLinks.explore.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white hover:underline transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2 - Engage */}
            <div className="h-full flex flex-col">
              <h3 className="text-white font-semibold mb-4">Engage</h3>
              <ul className="space-y-3">
                {footerLinks.engage.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white hover:underline transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 - Governance & Treasury */}
            <div className="h-full flex flex-col">
              <h3 className="text-white font-semibold mb-4">Governance & Treasury</h3>
              <ul className="space-y-3">
                {footerLinks.governance_treasury.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('http') ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white hover:underline transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white hover:underline transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 - Identity & Network */}
            <div className="h-full flex flex-col space-y-6">
              <h3 className="text-white font-semibold mb-[-10px]">Identity & Network</h3>

              {/* Nostr Public Key */}
              <div>
                <label className="text-gray-400 mt-1 mb-1 text-sm hover:text-white transition-colors duration-200 block">
                  Nostr Public Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="text-gray-400 text-xs font-mono truncate flex-1">
                    npub1kc9w...qq5gsljlnck
                  </code>
                  <button
                    onClick={handleCopyNpub}
                    className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded"
                    aria-label="Copy Nostr public key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Network Status */}
              <div className="text-gray-400 mt-1 mb-1 text-sm hover:text-white transition-colors duration-200 block">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className={`w-4 h-4 ${networkStatus.color}`} />
                  <span className="text-sm text-white font-medium">Network Status</span>
                </div>

                {apiStatus ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Bitcoin Block:</span>
                      <span className="font-mono">
                        {apiStatus.mempool?.blockHeight?.toLocaleString() || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link
                        to={createPageUrl('Status')}
                        className="text-gray-400 hover:text-orange-400 transition-colors hover:underline"
                      >
                        On-Chain API:
                      </Link>
                      <div className="flex items-center gap-1">
                        {apiStatus.mempool?.connected ? (
                          <span className="text-green-400">1/1</span>
                        ) : (
                          <span className="text-red-400">0/1</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link
                        to={createPageUrl('Status')}
                        className="text-gray-400 hover:text-orange-400 transition-colors hover:underline"
                      >
                        Lightning API:
                      </Link>
                      <div className="flex items-center gap-1">
                        {apiStatus.alby?.connected ? (
                          <span className="text-green-400">1/1</span>
                        ) : (
                          <span className="text-red-400">0/1</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link
                        to={createPageUrl('Status')}
                        className="text-gray-400 hover:text-orange-400 transition-colors hover:underline"
                      >
                        Nostr Relays:
                      </Link>
                      <div className="flex items-center gap-1">
                        {apiStatus.nostrStatus?.connected ? (
                          <>
                            {apiStatus.nostrStatus.relayCount < apiStatus.nostrStatus.totalRelays ? (
                              <span className="text-orange-400">
                                {apiStatus.nostrStatus.relayCount}/{apiStatus.nostrStatus.totalRelays}
                              </span>
                            ) : (
                              <span className="text-green-400">
                                {apiStatus.nostrStatus.relayCount}/{apiStatus.nostrStatus.totalRelays}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-red-400">
                            0/{apiStatus.nostrStatus?.totalRelays || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Loading status...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW - Accordion Structure (visible only on mobile) */}
        <div className="lg:hidden px-4 pt-6 pb-12 space-y-2">
          {/* Explore Accordion */}
          <div className="border-b border-[#2E3440]">
            <button
              onClick={() => toggleAccordion('explore')}
              className="w-full flex items-center justify-between py-4 text-white font-semibold transition-all duration-200 hover:bg-slate-800/30 px-3 -mx-3 rounded-lg focus:outline-none focus:bg-slate-800/50 focus:ring-2 focus:ring-orange-500/30"
            >
              <span>Explore</span>
              {openAccordion === 'explore' ? (
                <ChevronUp className="w-5 h-5 text-orange-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {openAccordion === 'explore' && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-3 pt-4 pb-4 pl-3"
                >
                  {footerLinks.explore.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white hover:underline transition-colors text-sm block py-1"
                        onClick={() => setOpenAccordion(null)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Engage Accordion */}
          <div className="border-b border-[#2E3440]">
            <button
              onClick={() => toggleAccordion('engage')}
              className="w-full flex items-center justify-between py-4 text-white font-semibold transition-all duration-200 hover:bg-slate-800/30 px-3 -mx-3 rounded-lg focus:outline-none focus:bg-slate-800/50 focus:ring-2 focus:ring-orange-500/30"
            >
              <span>Engage</span>
              {openAccordion === 'engage' ? (
                <ChevronUp className="w-5 h-5 text-orange-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {openAccordion === 'engage' && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-3 pt-4 pb-4 pl-3"
                >
                  {footerLinks.engage.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white hover:underline transition-colors text-sm block py-1"
                        onClick={() => setOpenAccordion(null)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Governance & Treasury Accordion */}
          <div className="border-b border-[#2E3440]">
            <button
              onClick={() => toggleAccordion('governance')}
              className="w-full flex items-center justify-between py-4 text-white font-semibold transition-all duration-200 hover:bg-slate-800/30 px-3 -mx-3 rounded-lg focus:outline-none focus:bg-slate-800/50 focus:ring-2 focus:ring-orange-500/30"
            >
              <span>Governance & Treasury</span>
              {openAccordion === 'governance' ? (
                <ChevronUp className="w-5 h-5 text-orange-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {openAccordion === 'governance' && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-3 pt-4 pb-4 pl-3"
                >
                  {footerLinks.governance_treasury.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('http') ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white hover:underline transition-colors text-sm block py-1"
                          onClick={() => setOpenAccordion(null)}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-gray-400 hover:text-white hover:underline transition-colors text-sm block py-1"
                          onClick={() => setOpenAccordion(null)}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Identity & Network Accordion */}
          <div className="border-b border-[#2E3440]">
            <button
              onClick={() => toggleAccordion('identity')}
              className="w-full flex items-center justify-between py-4 text-white font-semibold transition-all duration-200 hover:bg-slate-800/30 px-3 -mx-3 rounded-lg focus:outline-none focus:bg-slate-800/50 focus:ring-2 focus:ring-orange-500/30"
            >
              <span>Identity & Network</span>
              {openAccordion === 'identity' ? (
                <ChevronUp className="w-5 h-5 text-orange-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {openAccordion === 'identity' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-4 pb-4 space-y-4 pl-3"
                >
                  {/* Nostr Public Key */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-2">
                      Nostr Public Key
                    </label>
                    <div className="flex items-center gap-2 bg-[#2A2D32] rounded-lg p-3">
                      <code className="text-gray-400 text-xs font-mono truncate flex-1">
                        npub1kc9w...qq5gsljlnck
                      </code>
                      <button
                        onClick={handleCopyNpub}
                        className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none"
                        aria-label="Copy Nostr public key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Network Status - Compact */}
                  <div>
                    <Link
                      to={createPageUrl('Status')}
                      className="flex items-center justify-between bg-[#2A2D32] rounded-lg p-3 hover:bg-black transition-colors"
                      onClick={() => setOpenAccordion(null)}
                    >
                      <div className="flex items-center gap-2">
                        <Wifi className={`w-4 h-4 ${networkStatus.color}`} />
                        <span className="text-white text-sm font-medium">Network Status</span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {networkStatus.connected}/{networkStatus.total}
                      </span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Bar - Always visible on all devices */}
        <div className="px-4 lg:px-8 py-3 lg:py-6 border-t border-[#2E3440]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm">
            {/* Copyright */}
            <div className="text-gray-400 order-2 lg:order-1 lg:flex-1 text-center sm:text-left">
              <span className="hidden sm:inline">© 2025 coherosphere — Resonance · Resilience · Future</span>
              <span className="sm:hidden">© 2025 coherosphere</span>
            </div>

            {/* Legal Links & Social Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 order-3 lg:order-2">
              {/* Legal Links */}
              <div className="flex items-center gap-4 text-gray-400 justify-center">
                <Link to={createPageUrl('Brand')} className="hover:text-white hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded">
                  Brand
                </Link>
                <span className="text-gray-600">|</span>
                <Link to={createPageUrl('Style')} className="hover:text-white hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded">
                  Style
                </Link>
                <span className="text-gray-600">|</span>
                <Link to={createPageUrl('Terms')} className="hover:text-white hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded">
                  Terms
                </Link>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-[#9CA3AF] hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#1B1F2A] rounded p-1"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Empty placeholder for balance on desktop */}
            <div className="hidden lg:block order-1 lg:order-3 lg:flex-1"></div>
          </div>
        </div>
      </div>

      {/* Copy Toast */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Nostr address copied
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
