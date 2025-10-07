
import React, { useState, useEffect } from "react";
import { AdminSettings } from "@/api/entities";
import { motion } from "framer-motion";
import { Activity as ActivityIcon, RefreshCw, Settings, AlertTriangle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ActivityItem from "@/components/activity/ActivityItem";
import ActivityFilters from "@/components/activity/ActivityFilters";

// Generate realistic mock Nostr activities
const generateMockActivities = () => {
  const now = Date.now();
  const activities = [];
  
  // Sample users for interactions
  const users = [
    { name: "alice", npub: "npub1alice..." },
    { name: "bob", npub: "npub1bob..." },
    { name: "charlie", npub: "npub1charlie..." },
    { name: "diana", npub: "npub1diana..." },
    { name: "eve", npub: "npub1eve..." },
  ];

  // Generate posts
  const posts = [
    "Excited to see coherosphere growing into a true resonance space! 🌟",
    "Building the future of human-AI collaboration, one step at a time",
    "The beauty of decentralized communities is in their resilience",
    "Just deployed a new feature for our community governance system",
    "Reflecting on how technology can amplify human values rather than replace them",
  ];

  for (let i = 0; i < 15; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    activities.push({
      id: `post_${i}`,
      type: 'post',
      timestamp: now - (i * 3600000 + Math.random() * 1800000),
      content: posts[Math.floor(Math.random() * posts.length)],
      from_name: user.name,
      from_npub: user.npub,
      reactions: Math.floor(Math.random() * 20),
      reposts: Math.floor(Math.random() * 8),
      replies: Math.floor(Math.random() * 12),
    });
  }

  // Generate mentions
  for (let i = 0; i < 8; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    activities.push({
      id: `mention_${i}`,
      type: 'mention',
      timestamp: now - (i * 4200000 + Math.random() * 2100000),
      content: `Hey @coherosphere, loving the new resonance features! Keep up the great work.`,
      from_name: user.name,
      from_npub: user.npub,
      to_name: "coherosphere",
      to_npub: "npub1kc9weag...",
      reactions: Math.floor(Math.random() * 15),
      replies: Math.floor(Math.random() * 5),
    });
  }

  // Generate replies
  for (let i = 0; i < 12; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    activities.push({
      id: `reply_${i}`,
      type: 'reply',
      timestamp: now - (i * 3000000 + Math.random() * 1500000),
      content: "This is exactly what the world needs right now. How can I contribute?",
      from_name: user.name,
      from_npub: user.npub,
      reply_to: "Building the future of human-AI collaboration...",
      reactions: Math.floor(Math.random() * 10),
      reposts: Math.floor(Math.random() * 3),
    });
  }

  // Generate zap-in (received)
  for (let i = 0; i < 18; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    activities.push({
      id: `zapin_${i}`,
      type: 'zap-in',
      timestamp: now - (i * 2400000 + Math.random() * 1200000),
      content: "Thanks for building coherosphere! ⚡",
      from_name: user.name,
      from_npub: user.npub,
      to_name: "coherosphere",
      to_npub: "npub1kc9weag...",
      amount: Math.floor(Math.random() * 10000) + 1000,
    });
  }

  // Generate zap-out (sent)
  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    activities.push({
      id: `zapout_${i}`,
      type: 'zap-out',
      timestamp: now - (i * 5400000 + Math.random() * 2700000),
      content: "Supporting amazing community builders! ⚡",
      from_name: "coherosphere",
      from_npub: "npub1kc9weag...",
      to_name: user.name,
      to_npub: user.npub,
      amount: Math.floor(Math.random() * 5000) + 500,
    });
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
};

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [adminSettings, setAdminSettings] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const relays = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social',
    'wss://relay.primal.net',
    'wss://eden.nostr.land',
    'wss://nostr.wine',
    'wss://relay.nostr.band',
    'wss://relay.f7z.io'
  ];

  useEffect(() => {
    loadAdminSettings();
  }, []);

  useEffect(() => {
    if (adminSettings) {
      fetchActivities();
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
          alby_lightning_address: "coherosphere@getalby.com",
          nostr_npub: "npub1kc9weag9hjf0p0xz5naamts48rdkzymucvrd9ws8ns7n4x3qq5gsljlnck"
        });
        setAdminSettings(defaultSettings);
      }
    } catch (err) {
      setError("Failed to load admin settings");
    }
  };

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate fetching from Nostr relays
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockActivities = generateMockActivities();
      setActivities(mockActivities);
      setLastRefresh(new Date());
      setCurrentPage(1); // Reset to first page on refresh
    } catch (err) {
      console.error("Error fetching Nostr activities:", err);
      setError("Failed to fetch activity data from Nostr relays. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = selectedFilter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === selectedFilter);

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
    post: activities.filter(a => a.type === 'post').length,
    mention: activities.filter(a => a.type === 'mention').length,
    reply: activities.filter(a => a.type === 'reply').length,
    'zap-in': activities.filter(a => a.type === 'zap-in').length,
    'zap-out': activities.filter(a => a.type === 'zap-out').length,
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
        <div className="mt-3">
          <p className="text-lg text-slate-400 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            Real-time coherosphere community activity from the Nostr network.
          </p>
        </div>
      </div>

      {/* Relay Status */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-green-400" />
                <span className="text-slate-300 font-medium">Connected Relays</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">{relays.length}</span>
                <span className="text-slate-400 text-sm">/ {relays.length} active</span>
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

      {/* Activity Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <ActivityFilters
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange} // Use new handler
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
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
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
                        (page >= currentPage - 1 && page <= currentPage + 1) // Show current, prev, next
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
