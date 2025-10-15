import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCachingPolicy } from './CachingPolicyContext';
import { useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OVERLAY_STATE_KEY = 'coherosphere_freshness_overlay_state';

export default function FreshnessOverlay() {
  const queryClient = useQueryClient();
  const { getSettingsForDomain } = useCachingPolicy();
  const location = useLocation();
  
  // Load expanded state from localStorage - default to true (expanded)
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem(OVERLAY_STATE_KEY);
      if (saved) {
        const { expanded } = JSON.parse(saved);
        return expanded !== undefined ? expanded : true;
      }
    } catch (e) {
      console.error('[FreshnessOverlay] Error loading state:', e);
    }
    return true; // Default to expanded
  });

  const [freshness, setFreshness] = useState(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(OVERLAY_STATE_KEY, JSON.stringify({
        expanded: isExpanded
      }));
    } catch (e) {
      console.error('[FreshnessOverlay] Error saving state:', e);
    }
  }, [isExpanded]);

  // Determine current domain from path
  const getCurrentDomain = () => {
    const path = location.pathname;
    const domainMap = {
      '/Treasury': 'treasury',
      '/Activity': 'activity',
      '/Engage': 'engage',
      '/Projects': 'projects',
      '/Voting': 'governance',
      '/Learning': 'learning',
      '/FAQ': 'faq',
      '/Dashboard': 'dashboard',
      '/Profile': 'profile',
      '/Messages': 'messages',
      '/GlobalHubs': 'globalHubs',
      '/Hub': 'hub',
      '/Calendar': 'calendar',
      '/Donate': 'donate',
      '/Status': 'status',
      '/Chat': 'chat',
      '/ResonanceAdmin': 'resonanceAdmin',
      '/UserResonance': 'userResonance',
      '/HubResonance': 'hubResonance',
      '/ResonanceCheck': 'resonanceCheck',
      '/PerfStats': 'perfStats',
      '/CachingPolicyAdmin': 'cachingPolicyAdmin',
    };

    for (const [route, domain] of Object.entries(domainMap)) {
      if (path.startsWith(route)) return domain;
    }
    return 'dashboard';
  };

  const currentDomain = getCurrentDomain();
  const cacheSettings = getSettingsForDomain(currentDomain);

  // Calculate freshness from all active queries
  useEffect(() => {
    const calculateFreshness = () => {
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.getAll();
      
      if (allQueries.length === 0) {
        setFreshness({
          ageSeconds: 0,
          totalQueries: 0,
          freshQueries: 0,
          staleQueries: 0,
          cacheHitRate: 0,
          noQueriesActive: true
        });
        return;
      }

      let mostRecentUpdate = 0;
      let staleCount = 0;
      let freshCount = 0;

      allQueries.forEach(query => {
        const state = query.state;
        if (state.dataUpdatedAt > mostRecentUpdate) {
          mostRecentUpdate = state.dataUpdatedAt;
        }
        
        if (state.isStale) {
          staleCount++;
        } else {
          freshCount++;
        }
      });

      if (mostRecentUpdate === 0) {
        setFreshness({
          ageSeconds: 0,
          totalQueries: allQueries.length,
          freshQueries: freshCount,
          staleQueries: staleCount,
          cacheHitRate: 0,
          noQueriesActive: false
        });
        return;
      }

      const ageSeconds = Math.floor((Date.now() - mostRecentUpdate) / 1000);
      const cacheHitRate = allQueries.length > 0 
        ? Math.round((freshCount / allQueries.length) * 100) 
        : 0;

      setFreshness({
        ageSeconds,
        totalQueries: allQueries.length,
        freshQueries: freshCount,
        staleQueries: staleCount,
        cacheHitRate,
        noQueriesActive: false
      });
    };

    calculateFreshness();
    const interval = setInterval(calculateFreshness, 1000);

    return () => clearInterval(interval);
  }, [queryClient, location.pathname]);

  if (!freshness) {
    return null;
  }

  const formatAge = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const getAgeColor = (seconds) => {
    const ttl = cacheSettings.ttl || 300;
    if (seconds <= ttl) return 'text-green-400';
    if (seconds <= ttl * 2) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-40"
      >
        {/* Bottom Bar */}
        <div 
          className="w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 shadow-[0_-4px_16px_rgba(0,0,0,0.3)]"
          style={{
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95))'
          }}
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            {/* Left Section: Icon + Title */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-white font-semibold text-sm hidden sm:inline">Cache Monitor</span>
            </div>

            {/* Center Section: Metrics */}
            <div className="flex items-center gap-3 sm:gap-6 flex-1 justify-center text-sm overflow-x-auto">
              {freshness.noQueriesActive ? (
                <span className="text-slate-400 italic text-xs">No cached queries on this page</span>
              ) : (
                <>
                  {/* Last Updated */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs hidden sm:inline">Updated:</span>
                    <span className={`font-mono font-semibold ${getAgeColor(freshness.ageSeconds)}`}>
                      {formatAge(freshness.ageSeconds)}
                    </span>
                  </div>

                  <span className="text-slate-600">•</span>

                  {/* Cache Hit Rate */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs hidden sm:inline">Hit:</span>
                    <span className="text-green-400 font-mono font-semibold">
                      {freshness.cacheHitRate}%
                    </span>
                  </div>

                  <span className="text-slate-600">•</span>

                  {/* Active Queries */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs hidden sm:inline">Queries:</span>
                    <span className="text-white font-mono text-sm">
                      {freshness.totalQueries}
                    </span>
                  </div>

                  <span className="text-slate-600">•</span>

                  {/* Fresh / Stale */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs hidden sm:inline">Fresh/Stale:</span>
                    <span className="font-mono text-sm">
                      <span className="text-green-400">{freshness.freshQueries}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-yellow-400">{freshness.staleQueries}</span>
                    </span>
                  </div>

                  <span className="text-slate-600">•</span>

                  {/* Cache Preset */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs hidden sm:inline">Preset:</span>
                    <span className="text-slate-300 font-semibold text-sm">
                      {cacheSettings.preset || 'Custom'}
                    </span>
                  </div>

                  <span className="text-slate-600">•</span>

                  {/* TTL / SWR */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs hidden sm:inline">TTL/SWR:</span>
                    <span className="text-slate-300 font-mono text-xs">
                      {cacheSettings.ttl}s / {cacheSettings.swr}s
                    </span>
                  </div>

                  {cacheSettings.polling && (
                    <>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-slate-400 text-xs hidden sm:inline">Poll:</span>
                        <span className="text-blue-400 font-mono text-xs">
                          {cacheSettings.polling}s
                        </span>
                      </div>
                    </>
                  )}

                  <span className="text-slate-600">•</span>

                  {/* Domain */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs hidden sm:inline">Domain:</span>
                    <span className="text-slate-400 font-mono text-xs">
                      {currentDomain}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Right Section: Empty spacer for symmetry */}
            <div className="w-16 flex-shrink-0"></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}