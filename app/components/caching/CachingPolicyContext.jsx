
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CachingPolicy } from '@/api/entities';

const CachingPolicyContext = createContext();

const POLICY_CACHE_KEY = 'coherosphere_caching_policy';
const POLICY_CACHE_TTL = 60 * 1000; // 1 minute - Policy wird nicht oft geändert

// Default fallback policy if backend fails
const DEFAULT_POLICY = {
  version: 0,
  label: 'Default Fallback',
  published: true,
  domains: {
    treasury: { preset: 'Live', ttl: 15, swr: 60, polling: 30 },
    activity: { preset: 'Fresh', ttl: 60, swr: 300 },
    engage: { preset: 'Balanced', ttl: 300, swr: 600 },
    projects: { preset: 'Balanced', ttl: 300, swr: 600 },
    governance: { preset: 'Fresh', ttl: 60, swr: 300 },
    learning: { preset: 'Archive', ttl: 3600, swr: 86400 },
    faq: { preset: 'Archive', ttl: 86400, swr: 604800 },
    dashboard: { preset: 'Balanced', ttl: 300, swr: 600 },
    profile: { preset: 'Fresh', ttl: 120, swr: 300 },
    messages: { preset: 'Live', ttl: 30, swr: 60, polling: 15 },
    donate: { preset: 'Live', ttl: 15, swr: 60, polling: 30 } // Added 'donate' domain
  },
  routes: {},
  global_settings: {
    serve_stale_if_slow: true,
    auto_revalidate_on_focus: true,
    show_freshness_indicator: false
  },
  presets: {
    Live: { ttl: 15, swr: 60, polling: 30 },
    Fresh: { ttl: 60, swr: 300 },
    Balanced: { ttl: 300, swr: 600 },
    Archive: { ttl: 86400, swr: 604800 }
  }
};

export function CachingPolicyProvider({ children }) {
  const [policy, setPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPolicy = useCallback(async (forceRefresh = false) => {
    // Try cache first
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(POLICY_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < POLICY_CACHE_TTL) {
            console.log('[CachingPolicy] Using cached policy');
            setPolicy(data);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('[CachingPolicy] Error reading cache:', e);
        localStorage.removeItem(POLICY_CACHE_KEY);
      }
    }

    // Load from backend
    try {
      console.log('[CachingPolicy] Loading from backend...');
      const policies = await CachingPolicy.filter({ published: true });
      
      if (policies.length > 0) {
        // Get the highest version number that is published
        const activePolicy = policies.reduce((latest, current) => 
          current.version > latest.version ? current : latest
        );
        
        console.log(`[CachingPolicy] Loaded policy v${activePolicy.version}: ${activePolicy.label}`);
        setPolicy(activePolicy);
        
        // Cache it
        localStorage.setItem(POLICY_CACHE_KEY, JSON.stringify({
          data: activePolicy,
          timestamp: Date.now()
        }));
      } else {
        console.warn('[CachingPolicy] No published policy found, using default');
        setPolicy(DEFAULT_POLICY);
      }
    } catch (error) {
      console.error('[CachingPolicy] Error loading policy, using default:', error);
      setPolicy(DEFAULT_POLICY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicy();

    // Optional: Listen for policy changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === POLICY_CACHE_KEY && e.newValue) {
        try {
          const { data } = JSON.parse(e.newValue);
          console.log('[CachingPolicy] Policy updated in another tab');
          setPolicy(data);
        } catch (error) {
          console.error('[CachingPolicy] Error parsing policy from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadPolicy]);

  const getSettingsForDomain = useCallback((domainName) => {
    if (!policy) return DEFAULT_POLICY.domains.engage || { ttl: 300, swr: 600 };
    
    const domainConfig = policy.domains[domainName];
    if (!domainConfig) {
      console.warn(`[CachingPolicy] No config for domain '${domainName}', using default`);
      // Use DEFAULT_POLICY for the specific domain if not found in the loaded policy, or a generic fallback if not even in default
      return DEFAULT_POLICY.domains[domainName] || DEFAULT_POLICY.domains.engage || { ttl: 300, swr: 600 };
    }

    // If preset is used, resolve it
    if (domainConfig.preset && domainConfig.preset !== 'Custom') {
      const presetValues = policy.presets?.[domainConfig.preset] || DEFAULT_POLICY.presets[domainConfig.preset];
      return {
        ...presetValues,
        preset: domainConfig.preset
      };
    }

    // Otherwise use explicit values
    return domainConfig;
  }, [policy]);

  const getSettingsForRoute = useCallback((route) => {
    if (!policy || !policy.routes) return null;
    
    // Simple exact match for now (could be enhanced with pattern matching)
    const routeConfig = policy.routes[route];
    if (!routeConfig) return null;

    // Resolve preset if used
    if (routeConfig.preset && routeConfig.preset !== 'Custom') {
      const presetValues = policy.presets?.[routeConfig.preset] || DEFAULT_POLICY.presets[routeConfig.preset];
      return {
        ...presetValues,
        preset: routeConfig.preset
      };
    }

    return routeConfig;
  }, [policy]);

  const getGlobalSettings = useCallback(() => {
    return policy?.global_settings || DEFAULT_POLICY.global_settings;
  }, [policy]);

  const refreshPolicy = useCallback(() => {
    console.log('[CachingPolicy] Manual refresh triggered');
    return loadPolicy(true);
  }, [loadPolicy]);

  const value = {
    policy,
    isLoading,
    getSettingsForDomain,
    getSettingsForRoute,
    getGlobalSettings,
    refreshPolicy
  };

  return (
    <CachingPolicyContext.Provider value={value}>
      {children}
    </CachingPolicyContext.Provider>
  );
}

export function useCachingPolicy() {
  const context = useContext(CachingPolicyContext);
  if (!context) {
    throw new Error('useCachingPolicy must be used within CachingPolicyProvider');
  }
  return context;
}
