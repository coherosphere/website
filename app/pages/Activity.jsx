
import React, { useState, useEffect } from "react";
import { AdminSettings } from "@/api/entities";
import { motion } from "framer-motion";
import { Activity as ActivityIcon, RefreshCw, Settings, AlertTriangle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkNostrActivity } from "@/api/functions";

import ActivityItem from "@/components/activity/ActivityItem";
import ActivityFilters from "@/components/activity/ActivityFilters";
import ActivityStats from "@/components/activity/ActivityStats"; // Added import
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

const NOSTR_CACHE_KEY = 'coherosphere_nostr_status';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [adminSettings, setAdminSettings] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [relayInfo, setRelayInfo] = useState({ connected: 0, total: 0 });
  const [eventStats, setEventStats] = useState({});

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
        setCurrentPage(1); // Reset to first page when changing page size
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchActivities(); // Initial fetch uses cache if available
  }, []);

  const fetchActivities = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    // 1. Try to use cache first, unless a refresh is forced
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem(NOSTR_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_TTL) {
            console.log('Using cached Nostr data for Activity page.');
            setActivities(data.events || []);
            setRelayInfo({ connected: data.relayCount, total: data.totalRelays });
            setEventStats(data.eventStats || {});
            setLastRefresh(new Date(timestamp));
            setIsLoading(false);
            return; // Exit if fresh cache is used
          }
        }
      } catch (e) {
        console.error("Error parsing cached Nostr data:", e);
        // If cache is corrupted, proceed to fetch from network
        localStorage.removeItem(NOSTR_CACHE_KEY); 
      }
    }

    // 2. Fetch from network if cache is stale, missing, or refresh is forced
    try {
      const response = await checkNostrActivity();
      if (response && response.data) {
        const { events, relayCount, totalRelays, eventStats: stats, error: apiError } = response.data;
        
        if (apiError) {
          setError(apiError);
        } else {
          // Set state
          setActivities(events);
          setRelayInfo({ connected: relayCount, total: totalRelays });
          setEventStats(stats);
          const now = new Date();
          setLastRefresh(now);
          setCurrentPage(1);

          // Update cache with new data
          const cacheEntry = {
            data: response.data,
            timestamp: now.getTime()
          };
          localStorage.setItem(NOSTR_CACHE_KEY, JSON.stringify(cacheEntry));
        }
      } else {
        throw new Error("Invalid response from status check service.");
      }
    } catch (err) {
      console.error("Error fetching Nostr activities:", err);
      setError("Could not connect to the status check service. The backend might be down.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = selectedFilter === 'all' 
    ? activities 
    : activities.filter(activity => {
        if (selectedFilter === 'zap') return activity.type.startsWith('zap');
        return activity.type === selectedFilter;
      });

  // Add pagination logic
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

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

  const activityCounts = {
    all: activities.length,
    post: eventStats.posts || 0,
    mention: eventStats.mentions || 0,
    reply: eventStats.replies || 0,
    reaction: eventStats.reactions || 0,
    zap: (eventStats.zapsIn || 0) + (eventStats.zapsOut || 0),
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header - Clean and Horizontal */}
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
              onClick={() => fetchActivities(true)} // Force refresh on click
              disabled={isLoading}
              variant="outline"
              className="btn-secondary-coherosphere"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
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
        totalEvents={activities.length}
        posts={eventStats.posts || 0}
        mentions={eventStats.mentions || 0}
        replies={eventStats.replies || 0}
        reactions={eventStats.reactions || 0}
        zapsIn={eventStats.zapsIn || 0}
        zapsOut={eventStats.zapsOut || 0}
        totalZapAmountIn={eventStats.totalZapAmountIn || 0}
        totalZapAmountOut={eventStats.totalZapAmountOut || 0}
        isLoading={isLoading}
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
                <div className="text-slate-400 text-lg mt-4">Loading...</div>
              </div>
            </div>
            
            {/* Virtual placeholder */}
            <div className="min-h-[calc(100vh-500px)]" aria-hidden="true"></div>
          </>
        ) : paginatedActivities.length === 0 ? (
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
                    {/* Show page numbers around current page */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1) 
                      )
                      .map((page, index, arr) => (
                        <React.Fragment key={page}>
                          {/* Show dots if there's a gap */}
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
