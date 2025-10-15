
import React, { useState, useEffect, useCallback } from "react";
import { AdminSettings } from "@/api/entities";
import { motion } from "framer-motion";
import { Activity as ActivityIcon, RefreshCw, Settings, AlertTriangle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkNostrActivity } from "@/api/functions";

import ActivityItem from "@/components/activity/ActivityItem";
import ActivityFilters from "@/components/activity/ActivityFilters";
import ActivityStats from "@/components/activity/ActivityStats";
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachingPolicy } from '@/components/caching/CachingPolicyContext';
import { useCachedData } from '@/components/caching/useCachedData';

export default function Activity() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { setLoading } = useLoading();
  const { getSettingsForDomain } = useCachingPolicy();

  // Responsive items per page: 10 on mobile, 20 on desktop
  const getItemsPerPage = () => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 10 : 20;
  };

  const [itemsPerPage, setItemsPerPage] = React.useState(getItemsPerPage());

  // Update items per page on window resize
  React.useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = getItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [itemsPerPage]);

  // Use cached data with automatic polling
  const {
    data: apiData,
    isLoading: isLoadingActivities,
    error: activitiesError,
    refetch: refetchActivities
  } = useCachedData(
    ['activity', 'nostr'],
    checkNostrActivity,
    'activity'
  );

  // Stable state for activities
  const [activities, setActivities] = useState([]);
  const [relayInfo, setRelayInfo] = useState({ connected: 0, total: 0 });
  const [eventStats, setEventStats] = useState({});
  const lastActivityHashRef = React.useRef(null);
  const hasInitializedRef = React.useRef(false);

  // Sync loading state with global loading context
  useEffect(() => {
    setLoading(isLoadingActivities);
  }, [isLoadingActivities, setLoading]);

  // Process and update activities ONLY when data actually changes
  useEffect(() => {
    if (!apiData?.data) {
      console.log('[Activity] No API data yet');
      return;
    }

    const data = apiData.data;

    // Check for API error
    if (data.error) {
      setError(data.error);
      return;
    } else {
      setError(null);
    }

    const newActivities = data.events || [];
    const newRelayInfo = { connected: data.relayCount || 0, total: data.totalRelays || 0 };
    const newEventStats = data.eventStats || {};

    // Create a stable hash from activities
    const activityHash = newActivities
      .map(activity => `${activity.id}:${activity.type}:${activity.timestamp}`)
      .join('|');

    // For initial load, always set data
    if (!hasInitializedRef.current && newActivities.length > 0) {
      console.log('[Activity] Initial activities load:', {
        count: newActivities.length,
        hash: activityHash.substring(0, 50) + '...'
      });
      lastActivityHashRef.current = activityHash;
      hasInitializedRef.current = true;
      setActivities(newActivities);
      setRelayInfo(newRelayInfo);
      setEventStats(newEventStats);
      return;
    }

    // For subsequent updates, only update if hash changed
    if (hasInitializedRef.current && activityHash !== lastActivityHashRef.current) {
      console.log('[Activity] Activities changed:', {
        oldHash: lastActivityHashRef.current ? lastActivityHashRef.current.substring(0, 50) + '...' : 'none',
        newHash: activityHash.substring(0, 50) + '...',
        oldCount: activities.length,
        newCount: newActivities.length
      });
      lastActivityHashRef.current = activityHash;
      setActivities(newActivities);
      setRelayInfo(newRelayInfo);
      setEventStats(newEventStats);
    } else if (hasInitializedRef.current) {
      console.log('[Activity] No changes detected, skipping update');
    }
  }, [apiData]);

  // Memoize filtered activities
  const filteredActivities = React.useMemo(() => {
    if (selectedFilter === 'all') {
      return activities;
    }
    
    return activities.filter(activity => {
      if (selectedFilter === 'zap') return activity.type.startsWith('zap');
      return activity.type === selectedFilter;
    });
  }, [activities, selectedFilter]);

  // Memoize paginated activities
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  const paginatedActivities = React.useMemo(() => {
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, startIndex, itemsPerPage]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Memoize activity counts
  const activityCounts = React.useMemo(() => ({
    all: activities.length,
    post: eventStats.posts || 0,
    mention: eventStats.mentions || 0,
    reply: eventStats.replies || 0,
    reaction: eventStats.reactions || 0,
    zap: (eventStats.zapsIn || 0) + (eventStats.zapsOut || 0),
  }), [activities.length, eventStats]);

  // Memoize stats
  const stats = React.useMemo(() => ({
    totalEvents: activities.length,
    posts: eventStats.posts || 0,
    mentions: eventStats.mentions || 0,
    replies: eventStats.replies || 0,
    reactions: eventStats.reactions || 0,
    zapsIn: eventStats.zapsIn || 0,
    zapsOut: eventStats.zapsOut || 0,
    totalZapAmountIn: eventStats.totalZapAmountIn || 0,
    totalZapAmountOut: eventStats.totalZapAmountOut || 0,
  }), [activities.length, eventStats]);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <ActivityIcon className="w-12 h-12 text-orange-500 flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                Nostr Activity Feed
              </h1>
              <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => refetchActivities()}
              disabled={isLoadingActivities}
              variant="outline"
              className="btn-secondary-coherosphere"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingActivities ? 'animate-spin' : ''}`} />
              {isLoadingActivities ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-lg text-slate-400 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            Real-time coherosphere community activity from the Nostr network.
          </p>
        </div>
      </div>

      {/* Activity Stats */}
      <ActivityStats
        totalEvents={stats.totalEvents}
        posts={stats.posts}
        mentions={stats.mentions}
        replies={stats.replies}
        reactions={stats.reactions}
        zapsIn={stats.zapsIn}
        zapsOut={stats.zapsOut}
        totalZapAmountIn={stats.totalZapAmountIn}
        totalZapAmountOut={stats.totalZapAmountOut}
        isLoading={isLoadingActivities}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6 bg-orange-500/10 border-orange-500/30">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Activity Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <ActivityFilters
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
          activityCounts={activityCounts}
        />
      </motion.div>

      {/* Activity Stream */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {/* Show empty state only when NOT loading and no activities */}
        {!isLoadingActivities && paginatedActivities.length === 0 ? (
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-12 text-center">
              <ActivityIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                {selectedFilter === 'all' ? 'No activities found' : `No ${selectedFilter.replace('-', ' ')} activities found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                index={index}
              />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                className="pt-8"
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

                {/* Page Info */}
                <div className="text-slate-400 text-sm text-center">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredActivities.length)} of {filteredActivities.length} activities
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
