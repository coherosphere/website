import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachingPolicy } from './CachingPolicyContext';
import { useScreensaverStatus } from '@/components/screensaver/ScreensaverStatusContext';
import { useEffect, useRef } from 'react';

/**
 * Custom hook that combines React Query with our Caching Policy
 * 
 * @param {string} queryKey - Unique key for the query (e.g., ['treasury', 'transactions'])
 * @param {Function} queryFn - Function that fetches the data
 * @param {string} domain - Domain name from caching policy (e.g., 'treasury', 'activity')
 * @param {Object} options - Additional React Query options
 * @returns {Object} React Query result with data, isLoading, error, etc.
 */
export function useCachedData(queryKey, queryFn, domain, options = {}) {
  const { getSettingsForDomain, getGlobalSettings } = useCachingPolicy();
  const { isIdle } = useScreensaverStatus();
  const queryClient = useQueryClient();
  const wasIdleRef = useRef(isIdle);
  
  // Get caching settings from policy
  const cacheSettings = getSettingsForDomain(domain);
  const globalSettings = getGlobalSettings();
  
  // Convert seconds to milliseconds
  const staleTime = (cacheSettings.ttl || 300) * 1000;
  const gcTime = (cacheSettings.swr || 600) * 1000;
  const baseRefetchInterval = cacheSettings.polling ? cacheSettings.polling * 1000 : false;
  
  // Dynamic refetch interval based on screensaver status
  const refetchInterval = isIdle ? false : baseRefetchInterval;
  
  const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  const result = useQuery({
    queryKey: normalizedQueryKey,
    queryFn,
    
    // Stale-While-Revalidate configuration
    staleTime,
    gcTime,
    
    // Polling (if configured) - DISABLED when screensaver is active
    refetchInterval,
    refetchIntervalInBackground: !!refetchInterval,
    
    // Auto-revalidate on focus (from global settings)
    refetchOnWindowFocus: globalSettings.auto_revalidate_on_focus,
    
    // Retry configuration
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Allow additional options to override
    ...options,
  });

  // Refetch when screensaver becomes inactive (user returns)
  useEffect(() => {
    if (wasIdleRef.current && !isIdle) {
      // Screensaver was active, now inactive - trigger immediate refetch
      console.log(`[useCachedData] Screensaver deactivated, refetching data for ${domain}`);
      queryClient.invalidateQueries({ queryKey: normalizedQueryKey });
    }
    wasIdleRef.current = isIdle;
  }, [isIdle, domain, queryClient, normalizedQueryKey]);

  return result;
}

/**
 * Hook for mutations with automatic cache invalidation
 * 
 * @param {Function} mutationFn - Function that performs the mutation
 * @param {Object} options - Options including queryKey to invalidate
 * @returns {Object} React Query mutation result
 */
export function useCachedMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}