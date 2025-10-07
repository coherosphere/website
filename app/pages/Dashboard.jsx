
import React, { useState, useEffect, useCallback } from "react";
import { Hub, Project, User, AdminSettings, Proposal, SystemStats } from "@/api/entities"; // Add SystemStats import
import { motion, AnimatePresence } from "framer-motion";
import { Users, Lightbulb, Wallet, Globe2, RefreshCw, AlertTriangle, Vote, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectDetail from "../components/projects/ProjectDetail";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { updateSystemStats } from "@/api/functions"; // Add updateSystemStats import

import ResonanceHub from "../components/resonance/ResonanceHub";
import ConnectionLines from "../components/resonance/ConnectionLines";

// Function to generate mock treasury data
const generateMockTreasuryBalance = () => {
  // Mock transactions to get a semi-random balance
  const transactions = [
    { amount: 500000, direction: 'in' },
    { amount: 125000, direction: 'out' },
    { amount: 1200000, direction: 'in' },
    { amount: Math.floor(Math.random() * 25000), direction: 'in' },
    { amount: Math.floor(Math.random() * 15000), direction: 'out' },
  ];

  const totalIncoming = transactions
    .filter(tx => tx.direction === 'in')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalOutgoing = transactions
    .filter(tx => tx.direction === 'out')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return totalIncoming - totalOutgoing;
};

// New StatCard component for skeleton loading
const StatCard = ({ icon: Icon, value, label, color, isLoading }) => (
  <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
    <CardContent className="p-4 text-center">
      {isLoading ? (
        <>
          <div className={`w-8 h-8 rounded-full bg-slate-700 mx-auto mb-2 animate-pulse`}></div>
          <div className="h-6 w-3/4 bg-slate-700 rounded mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 w-1/2 bg-slate-700 rounded mx-auto animate-pulse"></div>
        </>
      ) : (
        <>
          <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-slate-400 text-sm">{label}</div>
        </>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  // Data States
  const [hubs, setHubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: '—',
    onlineUsers: '—',
    activeProjects: '—',
    totalBalance: '—',
    activeHubs: '—',
  });
  const [selectedHub, setSelectedHub] = useState(null);

  // UI/Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [isUpdatingStats, setIsUpdatingStats] = useState(false);

  // Project Detail Modal States
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Always ensure user is authenticated before proceeding
      const user = await User.me();
      setCurrentUser(user);

      // Initiate all data fetching promises
      const systemStatsInitialPromise = SystemStats.filter({ stat_key: 'global_stats' });
      const hubsPromise = Hub.list();
      const projectsPromise = Project.list();
      const proposalsPromise = Proposal.list();
      const usersPromise = User.list().catch(userError => {
        console.warn("Could not load all users (permissions?), falling back to current user.", userError);
        return [user];
      });

      // --- Handle System Stats Initialization and Quick Display ---
      setLoadingStatus("Loading System Stats...");
      let globalStats = null;
      try {
        let systemStatsRecords = await systemStatsInitialPromise;
        globalStats = systemStatsRecords.length > 0 ? systemStatsRecords[0] : null;

        if (!globalStats) {
          console.log('No system stats found, initializing...');
          await updateSystemStats(); // Initialize them
          // Re-fetch after initialization
          systemStatsRecords = await SystemStats.filter({ stat_key: 'global_stats' });
          globalStats = systemStatsRecords.length > 0 ? systemStatsRecords[0] : null;
        }

        // If we have globalStats, update the UI immediately with them
        if (globalStats) {
          setStats({
            totalMembers: globalStats.total_members || '—',
            onlineUsers: Math.max(1, Math.floor((globalStats.total_members || 1) * (0.3 + Math.random() * 0.4))),
            activeProjects: globalStats.active_projects || '—',
            totalBalance: generateMockTreasuryBalance().toLocaleString(), // Keep mock for now
            activeHubs: globalStats.total_hubs || '—',
          });
        }
      } catch (statsInitError) {
        console.error('Error initializing or fetching system stats:', statsInitError);
        // Continue without initial stats, they'll be calculated from other data
      }


      // --- Await all other data concurrently ---
      setLoadingStatus("Loading Community Data...");
      const [hubData, projectData, proposalData, userData] = await Promise.all([
        hubsPromise,
        projectsPromise,
        proposalsPromise,
        usersPromise
      ]);

      console.log(`Loaded ${hubData.length} hubs, ${projectData.length} projects, ${proposalData.length} proposals, ${userData.length} users.`);

      setHubs(hubData);
      setProjects(projectData);
      setProposals(proposalData);
      setUsers(userData);

      // --- Final Stat Calculation (overriding if necessary) ---
      // If globalStats was not successfully fetched/initialized, use userData.length as fallback for totalMembers
      const finalTotalMembers = globalStats && globalStats.total_members !== undefined ? globalStats.total_members : userData.length;
      const finalOnlineUsers = Math.max(1, Math.floor(finalTotalMembers * (0.3 + Math.random() * 0.4)));
      const finalActiveProjectsCount = projectData.filter(p => ['active', 'voting', 'proposed'].includes(p.status)).length;
      const finalTreasuryBalance = generateMockTreasuryBalance();
      const finalActiveHubs = hubData.length;

      setStats({
        totalMembers: finalTotalMembers,
        onlineUsers: finalOnlineUsers,
        activeProjects: finalActiveProjectsCount,
        totalBalance: finalTreasuryBalance.toLocaleString(),
        activeHubs: finalActiveHubs,
      });

      setError(null);
    } catch (err) {
      console.error("Dashboard data loading failed:", err);
      if (err.message?.includes('auth_required')) {
        setError("Authentication required. The page will reload as the session is established.");
      } else {
        setError("Could not connect to the network. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
    }
  }, []);

  const handleRefreshStats = useCallback(async () => {
    // Only allow admins to refresh stats
    if (!currentUser || currentUser.role !== 'admin') {
      console.warn("Non-admin user attempted to refresh stats.");
      return;
    }

    setIsUpdatingStats(true);
    try {
      setLoadingStatus("Updating System Stats...");
      await updateSystemStats();
      console.log('System stats refreshed successfully');
      // Reload dashboard data to reflect new stats
      await loadData(); // Re-call loadData to fetch the updated stats
    } catch (error) {
      console.error('Error refreshing system stats:', error);
      setError("Failed to update system stats. See console for details.");
    } finally {
      setIsUpdatingStats(false);
      setLoadingStatus(null);
    }
  }, [currentUser, loadData]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  // Separate useEffect for resize handling without causing infinite loops
  useEffect(() => {
    const handleResize = () => {
      // Simple flag-based re-render trigger instead of manipulating hubs array
      // This prevents infinite API calls while still triggering position recalculation
      setIsLoading(false); // Just trigger a small state change to force re-render
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array to avoid infinite loops

  const hubPositions = hubs.map((hub, index) => {
    if (hub.coordinates) {
      // IMPROVED CALIBRATION LOGIC
      const calibrationPoints = [
        { name: 'Tokyo', lat: 35.6762, lng: 139.6503, svgX: 85.5, svgY: 32 },
        { name: 'London', lat: 51.5074, lng: -0.1278, svgX: 49.8, svgY: 25 },
        { name: 'New York', lat: 40.7128, lng: -74.0060, svgX: 23.5, svgY: 28 },
        { name: 'São Paulo', lat: -23.5505, lng: -46.6333, svgX: 28, svgY: 65 },
        { name: 'Sydney', lat: -33.8688, lng: 151.2093, svgX: 88, svgY: 75 },
        { name: 'Cairo', lat: 30.0444, lng: 31.2357, svgX: 56, svgY: 42 }
      ];

      const distances = calibrationPoints.map(point => ({
        point,
        distance: Math.sqrt(
          Math.pow(hub.coordinates.lat - point.lat, 2) +
          Math.pow(hub.coordinates.lng - point.lng, 2)
        )
      })).sort((a, b) => a.distance - b.distance);

      const [p1_data, p2_data] = distances;
      const p1 = p1_data.point;
      const p2 = p2_data.point;

      // Inverse Distance Weighting for more accurate interpolation
      // Using Math.max(0.01, ...) to prevent division by zero if a hub is exactly on a calibration point
      const w1_inv_dist = 1 / Math.max(0.01, p1_data.distance);
      const w2_inv_dist = 1 / Math.max(0.01, p2_data.distance);
      const total_inv_dist = w1_inv_dist + w2_inv_dist;

      const weight1 = w1_inv_dist / total_inv_dist;
      const weight2 = w2_inv_dist / total_inv_dist;

      // Calculate the offset for each calibration point (difference between SVG and basic linear projection)
      const offsetX1 = p1.svgX - (((p1.lng + 180) / 360) * 100);
      const offsetY1 = p1.svgY - (((90 - p1.lat) / 180) * 100);
      const offsetX2 = p2.svgX - (((p2.lng + 180) / 360) * 100);
      const offsetY2 = p2.svgY - (((90 - p2.lat) / 180) * 100);

      // Interpolate the offset based on the weights
      const interpolatedOffsetX = (offsetX1 * weight1) + (offsetX2 * weight2);
      const interpolatedOffsetY = (offsetY1 * weight1) + (offsetY2 * weight2);

      // Calculate the basic linear projection for the current hub
      const basicX = ((hub.coordinates.lng + 180) / 360) * 100;
      const basicY = ((90 - hub.coordinates.lat) / 180) * 100;

      const originalY = basicY + interpolatedOffsetY;
      // Stretch y coordinate by 20% from the vertical center (50%)
      const stretchedY = 50 + (originalY - 50) * 1.2;

      // Apply the interpolated offset to the basic linear calculation
      return {
        x: Math.max(2, Math.min(98, basicX + interpolatedOffsetX)),
        y: Math.max(2, Math.min(98, stretchedY)) // Use stretched Y
      };
    }

    // Fallback circular positioning if no coordinates are available
    const angle = (index / (hubs.length || 1)) * 2 * Math.PI;
    const radius = 35 - (hubs.length > 10 ? 10 : 0) + (index % 2) * 5;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius
    };
  });

  const handleHubClick = (hub) => {
    setSelectedHub(hub);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  };

  const handleProjectSupport = async (updatedProject) => {
    // Update projects in local state
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      )
    );
  };

  const handleProjectVote = (project) => {
    console.log("Voting on project:", project.title);
  };

  const handleProjectUpdate = (updatedProject) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      )
    );

    if (selectedProject && selectedProject.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  // Get top 3 funded projects
  const topFundedProjects = projects
    .filter(p => p.funding_raised > 0)
    .sort((a, b) => (b.funding_raised || 0) - (a.funding_raised || 0))
    .slice(0, 3);

  // Get latest 2 governance proposals using the same logic as /Voting
  const getLatestProposals = () => {
    const statusPriority = {
      voting: 1,
      draft: 2,
      proposed: 2,
      passed: 3,
      rejected: 3,
      implemented: 3,
    };

    return [...proposals].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 4;
      const priorityB = statusPriority[b.status] || 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      if (a.status === 'voting') {
        const deadlineA = a.voting_deadline ? new Date(a.voting_deadline).getTime() : 0;
        const deadlineB = b.voting_deadline ? new Date(b.voting_deadline).getTime() : 0;
        // Sort voting proposals by deadline (more time left = higher priority)
        // If deadlines are equal, fall back to created date
        if (deadlineA !== deadlineB) {
          return deadlineB - deadlineA; // Descending order for deadline (more time left = higher)
        }
      } 
      
      // For proposals with same status priority or non-voting proposals, sort by creation date (newest first)
      const createdA = new Date(a.created_date).getTime();
      const createdB = new Date(b.created_date).getTime();
      return createdB - createdA; // Descending order for created_date
      
    }).slice(0, 2);
  };
  
  const latestProposals = getLatestProposals();

  const categoryColors = {
    resilience: 'bg-green-500/20 text-green-400 border-green-500/30',
    technology: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    community: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    learning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    environment: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    governance: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  };

  // Proposal category colors (for governance proposals)
  const proposalCategoryColors = {
    governance: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    treasury: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    policy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    technical: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    community: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const statusColors = {
    proposed: 'bg-slate-500/20 text-slate-400',
    voting: 'bg-blue-500/20 text-blue-400',
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-red-500/20 text-red-400',
    draft: 'bg-gray-500/20 text-gray-400', // Added draft status color
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Globe2 className="w-12 h-12 text-orange-500 flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                Resonance Board
              </h1>
              <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
            </div>
          </div>

          {/* Admin-only Stats Refresh Button */}
          {currentUser && currentUser.role === 'admin' && (
            <Button
              onClick={handleRefreshStats}
              disabled={isUpdatingStats}
              variant="outline"
              className="btn-secondary-coherosphere text-xs"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingStats ? 'animate-spin' : ''}`} />
              {isUpdatingStats ? 'Updating...' : 'Sync Stats'}
            </Button>
          )}
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Your global resonance map of communities and activity.
        </p>
      </div>

      {/* Global Stats - Enhanced with Skeleton Loading */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <StatCard
          icon={Users}
          value={stats.totalMembers}
          label="Members"
          color="text-orange-500"
          isLoading={isLoading}
        />
        <StatCard
          icon={Users}
          value={stats.onlineUsers}
          label="Online"
          color="text-green-500"
          isLoading={isLoading}
        />
        <StatCard
          icon={Lightbulb}
          value={stats.activeProjects}
          label="Active Projects"
          color="text-green-500"
          isLoading={isLoading}
        />
        <StatCard
          icon={Wallet}
          value={stats.totalBalance}
          label="Sats Raised"
          color="text-purple-500"
          isLoading={isLoading}
        />
        <StatCard
          icon={Globe2}
          value={stats.activeHubs}
          label="Resonance Hubs"
          color="text-purple-500"
          isLoading={isLoading}
        />
      </motion.div>

      {/* World Map Visualization */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <div className="relative bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          {/* Responsive container that maintains aspect ratio */}
          <div className="relative w-full" style={{ paddingBottom: '51.2%' }}> {/* 400.649/783.086 = ~51.2% */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence>
                {loadingStatus && (
                  <motion.div
                    key="loading-chip"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 flex items-center gap-2 z-20"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {loadingStatus}
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoading && hubs.length === 0 ? (
                <motion.div
                  className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : error ? (
                <div className="text-center p-8 z-10">
                  <AlertTriangle className="w-16 h-16 text-orange-400/80 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-orange-400 mb-2">Connection Error</h3>
                  <p className="text-slate-300 mb-6 max-w-sm">{error}</p>
                  <Button
                    onClick={loadData}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                  >
                    Retry
                  </Button>
                </div>
              ) : hubs.length === 0 ? (
                <div className="text-center p-8 z-10">
                  <Globe2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Setting Up Resonance Network</h3>
                  <p className="text-slate-400 max-w-md mb-6">
                    The global resonance map is being initialized. Hubs will appear as they come online.
                  </p>
                  <Button
                    onClick={loadData}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check for Updates
                  </Button>
                </div>
              ) : (
                <>
                  <svg
                    className="absolute inset-0 w-full h-full object-contain opacity-20 pointer-events-none"
                    id="Layer_1"
                    xmlSpace="preserve"
                    overflow="visible"
                    viewBox="0 0 783.086 400.649"
                    version="1.0"
                    enableBackground="new 0 0 783.086 400.649"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <g className="fill-slate-600">
                      <path d="m346.72 131.38l-3.377 4.501-2.25 2.251-4.501 2.475-0.676 2.026s-1.801 1.801-1.575 2.927 0.226 3.151 0.226 3.151-3.151 2.926-4.502 3.826c-1.351 0.9-3.152 2.926-3.152 2.926s-1.125 1.351-1.8 1.801c-0.675 0.449-1.8 1.8-2.701 3.151s-1.801 2.25-2.251 2.925-1.801 2.251-2.476 4.727c-0.675 2.477-2.476 5.402-2.476 5.402l-0.451 1.125c0.226 3.827 0.225 4.502 0.676 5.853 0.45 1.35 0.901 0.899 0.45 3.826-0.45 2.925-0.45 4.051-0.9 5.402-0.45 1.349-1.801 3.825-2.25 4.952-0.451 1.125 0.9 3.15 0.9 3.15s0.676 2.927 0.225 3.602c-0.45 0.676 0.225 2.026 0.225 2.026s2.701 1.575 3.602 2.476c0.9 0.9 2.476 2.251 2.701 2.926 0.226 0.676 2.026 3.827 2.251 4.502s2.026 3.15 2.476 3.826c0.45 0.676 2.701 3.152 2.701 3.152s2.926 2.249 3.602 3.15c0.675 0.9 2.701 1.35 3.375 2.025 0.676 0.675 2.251 0.449 3.151 1.126 0.901 0.675 2.701-0.451 3.602 0 0.9 0.45 3.377-0.45 4.052-0.9s2.25-2.025 3.376-1.351c1.125 0.674 1.8 0 2.701 0.225 0.899 0.225 2.25-0.899 3.15-0.899 0.901 0 3.151-0.901 3.826-0.901 0.676 0 2.927-1.352 3.828-1.352 0.899 0 2.025-0.898 3.15-0.449s0.675-0.899 2.701-0.225 2.701 0 3.376 0.674c0.676 0.676 1.577 0.002 2.252 0.902 0.675 0.899 1.8 1.574 2.025 2.475 0.224 0.901 1.575 1.802 1.575 1.802l1.351 0.224s1.802-1.35 2.251-0.449c0.45 0.9 2.476 0.676 2.476 0.676l2.025 2.25 0.676 0.9s1.351 3.602 1.125 4.952c-0.225 1.35-0.225 4.276-0.9 4.951-0.675 0.676-1.125 3.602-1.125 3.602s-0.901 0.9 1.125 2.701c2.026 1.802 3.377 3.376 4.052 4.275 0.676 0.901 2.477 3.378 2.7 4.953 0.226 1.575 0.676 2.475 1.577 4.501 0.9 2.026 2.025 2.251 2.25 4.503 0.226 2.25 0.675 2.251 0.45 3.825-0.225 1.576-0.9 1.801-0.225 2.926 0.675 1.126 1.574 3.152 1.351 3.827-0.225 0.675-0.676 3.601-0.676 3.601l-0.45 1.351-2.025 3.828-1.351 2.024c-0.45 1.575-1.35 3.151-1.125 5.402 0.224 2.251-1.125 2.25 0.675 4.5 1.801 2.252 2.7 4.728 3.826 6.754 1.126 2.025 1.801 4.051 2.025 5.401 0.226 1.351 1.126 1.802 1.576 3.602 0.449 1.801 0.675 2.7 0.675 3.826 0 1.125-0.226 4.052 0.226 4.727 0.449 0.675 0.675 2.702 0.9 3.602 0.225 0.901-0.676 1.126 0.675 2.702 1.351 1.575 2.251 2.475 3.151 3.601s0.675 0.675 1.351 2.251c0.675 1.575 1.575 2.477 1.801 3.826 0.225 1.35 0.449 4.726 1.125 6.302 0.675 1.576 1.575 3.152 1.575 3.152s2.477 1.575 3.377 1.35c0.899-0.225 2.701-2.249 4.052-1.575 1.351 0.675 2.476 0 3.601 0s2.251-1.351 3.377-1.351c1.125 0 2.7-1.801 3.602-1.35 0.9 0.449 2.024-0.452 3.15-1.577 1.126-1.124 1.801-2.024 3.826-3.825 2.026-1.801 1.801-1.802 3.151-2.927 1.351-1.126 2.702-3.602 4.277-4.052s2.025-2.024 2.475-3.15c0.451-1.126 0.675-1.801 1.351-2.702 0.676-0.899 0.225 0.228 1.351-2.7 1.126-2.927 2.478-4.051 3.603-4.727 1.125-0.675 1.8-2.025 2.475-2.251s1.801 0.675 1.351-1.351c-0.449-2.025 0-4.951-0.449-5.626-0.451-0.677-1.127 1.574-0.901-1.803 0.227-3.375 2.701-6.752 2.701-6.752s3.376-4.276 4.502-4.951 1.35-1.35 2.927-2.251c1.574-0.899 4.951-3.15 4.951-4.276s1.351-4.052 1.351-4.728c0-0.675 0-1.35-0.449-5.177-0.451-3.825 0.449-2.926-0.901-6.527s-1.577-8.103-2.476-9.228c-0.901-1.126-0.451-4.053-0.451-4.952 0-0.9 1.577-3.151 2.252-4.051 0.675-0.901 3.601-4.503 3.601-4.503s4.501-5.176 6.077-7.651c1.576-2.477 3.151-4.727 4.276-5.627 1.126-0.9 3.827-2.928 5.402-5.178 1.576-2.25 4.727-6.526 4.953-7.203 0.224-0.674 2.024-2.925 2.024-2.925s2.476-2.927 2.927-4.502c0.449-1.576 2.699-10.354 2.249-9.904-0.448 0.451-3.15 0.9-4.051 1.125-0.899 0.226 1.352 1.125-5.177 0.676-6.526-0.451-9.902 0.675-9.902 0.675-2.027-0.451-3.602 1.8-4.278-1.351-0.675-3.15-1.126-4.951-2.475-7.202-1.351-2.251-2.252-3.151-4.276-6.078-2.025-2.925-1.802-1.576-3.603-3.825-1.8-2.251-2.251-1.577-3.376-4.502-1.125-2.926-2.025-1.8-3.376-5.852-1.351-4.053-2.251-4.503-2.926-6.753-0.676-2.25-1.575-2.927-2.026-4.952-0.45-2.026-5.626-12.379-6.302-13.055-0.676-0.674-1.801-4.277-1.576-3.601 0.226 0.675 3.377 2.926 3.377 2.926s1.8-0.676 2.476-0.676c0.675 0 3.376 2.477 3.376 3.376 0 0.901 4.729 5.178 5.853 8.329 1.125 3.151 2.478 5.402 2.701 6.302s2.476 4.502 3.377 5.853c0.899 1.351 3.825 4.051 4.275 5.402s4.728 5.852 4.728 8.778c0 2.926 2.024 6.752 2.25 7.652s4.276 2.027 4.276 2.027l5.403-1.351s8.102-5.178 9.003-5.178c0.899 0 8.104-3.376 8.104-3.376s2.925-2.7 4.95-4.275c2.026-1.576 4.277-4.501 4.728-5.853 0.449-1.351 1.35-1.575 3.15-3.602 1.801-2.026 4.277-4.051 2.702-5.402-1.576-1.35-2.477-0.9-4.727-3.151-2.251-2.25-2.026-1.8-3.602-4.727-1.576-2.925 0.225-6.302-3.152-2.925-3.375 3.376-2.025 4.276-5.402 4.953-3.375 0.674-4.727 2.925-6.302 0.674s-3.15-0.9-4.052-4.277c-0.9-3.376-1.576-3.602-1.8-4.951-0.224-1.351 0-1.351-1.801-4.728-1.8-3.376-0.45-8.553 0.675-5.627 1.126 2.926 2.926 3.376 5.853 5.402 2.925 2.025 4.277 3.602 6.977 3.827 2.701 0.224 4.952 0 5.402 0.449 0.45 0.451 0.9-0.224 2.026 0.225 1.126 0.451 1.574-0.674 2.025 1.125 0.45 1.801 2.926 2.026 4.051 3.151 1.126 1.125 1.126 0.676 4.053 1.125 2.927 0.451 6.979 0.451 6.979 0.451l4.275-0.226 4.952 0.449s3.603 2.026 4.502 2.026c0.9 0 1.125 2.477 3.376 3.827 2.251 1.351 2.701 1.575 4.051 3.151 1.353 1.576 1.126 2.251 2.926 3.826 1.802 1.577 4.729-0.224 5.179-0.898 0.448-0.676 2.699-1.801 2.251 0-0.451 1.8 2.249 1.124 1.574 5.402-0.675 4.275-1.126 3.15 0 6.077 1.125 2.926 6.077 11.929 6.303 14.63s1.575 1.801 1.8 4.278c0.226 2.475 1.575 3.375 1.575 5.176s1.577 2.25 1.801 3.602c0.227 1.351 2.702 0.224 3.377 0 0.676-0.226 3.826-3.152 3.826-3.152s1.353-0.449 1.126-2.701c-0.226-2.249 0-1.8 0-5.176s-1.35-3.376-0.675-6.751c0.675-3.376 2.475-5.403 2.926-6.978 0.45-1.575 2.251-4.276 3.15-4.502 0.9-0.225 5.853-2.7 6.979-4.277 1.125-1.575 2.926-3.376 4.727-5.176 1.8-1.8 4.951-4.051 5.627-3.376 0.675 0.675 0.45 0.45 1.576 0.45 1.125 0 3.151 0.901 4.726 1.126 1.576 0.225 4.728 4.051 5.403 6.077s0.225 1.575 2.701 4.502c2.476 2.925 4.727 1.124 4.727 4.726s0 3.376 1.126 4.727c1.125 1.351 2.475-2.476 3.825-2.025s1.575-0.45 2.701 3.151c1.125 3.602 1.8 3.602 2.027 7.203 0.224 3.601-0.226 0.225-0.226 3.15 0 2.927-0.226 3.152 0.226 5.852 0.449 2.703 2.023 3.603 1.8 4.053 0 0 1.35-3.826 0.899-6.528-0.448-2.7 0-6.526 1.126-7.651 1.125-1.127 2.252-2.251 3.151 0.675 0.901 2.925 1.351 0.675 3.376 4.051 2.027 3.377 3.827 2.7 4.052 4.276s1.353 1.802 2.926 3.151c1.576 1.351 2.926-0.224 4.727-1.575 1.802-1.351 6.752-6.303 6.979-8.329 0.224-2.025 2.25-1.576-1.352-6.751-3.602-5.177-3.602-6.978-7.428-10.129-3.824-3.151-6.076-3.376-3.149-7.428 2.926-4.052 4.277-6.752 6.077-5.626 1.801 1.125 4.95 0.899 4.95 5.402 0 4.501-0.9 9.453 2.251 4.051s4.728-8.553 3.826-7.651c-0.899 0.9 2.026-1.801 2.026-1.801s0.226-2.026 4.053-2.926c3.825-0.902 4.95-1.351 6.302-2.026 1.35-0.676 5.177-5.178 5.852-7.203 0.675-2.026 2.476-5.627 2.026-7.202-0.45-1.577-2.702-9.228-3.152-9.004-0.449 0.226-0.224 0.226-3.149-2.925-2.928-3.151-4.953-5.402-5.403-6.753s-1.576-1.576-0.226-3.376c1.352-1.8 2.027-1.575 2.252-3.151 0.224-1.575 2.024-2.926-1.352-1.8-3.375 1.125-0.9 0.451-3.826 0.226-2.926-0.226-10.578 1.575-6.751-3.151 3.825-4.727 4.949-7.652 5.625-7.652 0.677 0 4.053-3.827 4.277-0.226 0.226 3.601 1.575 2.7 1.801 4.951s4.727-2.475 4.727-2.475 1.575 0.45 2.7 1.575c1.126 1.125 1.126 4.727 1.126 4.727s-0.9-1.126 1.576 0.675c2.477 1.802 5.176 0.9 5.176 4.727 0 3.826 0 4.052 1.576 4.952 1.577 0.9 3.15 0.451 4.503-0.675 1.35-1.125 3.6-5.177 3.6-5.177s0.225-1.576-3.376-3.827c-3.601-2.25-5.852-3.825-7.201-4.951-1.352-1.125-0.901-4.501 0.448-5.853 1.353-1.351 2.026-2.026 1.576-3.826-0.451-1.802 0.676-3.152 4.052-2.927 3.376 0.226 4.051-0.224 4.051-0.224s0.677 0.449 0.677-0.901c0-1.35 4.275-7.653 3.149-7.653-1.125 0 0.228-1.575-0.45-4.051-0.675-2.477 2.251-6.302-0.224-8.103-2.476-1.801-3.152-2.702-4.727-5.402-1.575-2.702-1.352-3.151-7.203-3.827-5.852-0.675-8.553 1.351-9.904-0.449-1.351-1.801-2.025 2.7-2.925-2.702s1.351-9.004 1.351-9.004 3.601-2.25 4.5-3.826c0.9-1.576 4.501-2.251 7.43-1.125 2.926 1.125 7.201 0.9 10.804 1.577 3.601 0.674 3.376 2.925 5.177 0 1.8-2.928 0-4.277 1.35-5.853 1.352-1.576 2.926-4.052 4.051-2.477 1.125 1.577 3.379 3.151 5.18 1.125 1.8-2.025 2.475-2.25 2.475-2.25l0.898 0.901s2.026-1.127 2.026 0.898c0 2.027 2.027 4.278 0.901 5.853-1.127 1.577-2.7 1.351-2.7 5.177 0 3.828 0 3.152 2.474 6.304 2.477 3.15 4.052 0.449 4.502 3.826 0.451 3.376 0.899 2.702 3.377 4.952 2.476 2.25 2.024 2.25 3.826 3.601 1.801 1.351 2.702 2.702 2.702 0.451s0.225-3.376 0-5.402c-0.227-2.025 1.801-3.602 0.448-6.978-1.35-3.376-0.224-3.151-2.925-5.627-2.702-2.475-4.503 0.451-5.401-3.151-0.901-3.601 4.275-5.177 5.627-5.627 1.35-0.449 3.374-3.151 3.824-1.35 0.451 1.8-3.375 8.328 3.153 1.35 6.526-6.977 3.601-4.051 3.601-4.051s3.376-0.45 4.051 0c0.674 0.451 2.478-2.026 1.8-1.8-0.675 0.226-7.2-3.602-7.2-3.602l-4.729-2.7s1.577-1.126 2.702-0.9c1.126 0.225 1.352-2.251 2.478-2.477 1.125-0.225 8.777 1.577 10.354 2.477 1.575 0.9 7.201 1.125 6.525 0.675-0.675-0.451-4.275-3.151-4.501-4.052-0.224-0.9-8.103-2.701-10.578-2.476-2.477 0.224-4.726 0.899-6.752 0.224-2.027-0.675-4.952-2.476-6.528-2.476-1.575 0-21.382-3.826-22.282-3.601s-2.252 4.501-2.927 3.826c-0.675-0.675-1.8-0.676-4.953-1.576-3.149-0.9-7.427-1.576-13.055-2.025-5.626-0.45-9.451 0.45-11.027-1.351-1.576-1.8-4.951-1.125-8.778-1.351-3.826-0.224-8.328 0-10.354 0s-6.751-0.224-7.877-0.45-2.476-1.801-3.826-2.025c-1.352-0.226-1.127-0.675-3.827-1.125-2.701-0.451-2.476-3.376-3.376-0.901-0.9 2.477-0.451 1.801-1.801 2.701-1.351 0.901-2.701 2.701-3.602 2.701-0.899 0-4.5 0.225-5.177-0.225-0.676-0.45-1.801-0.9-4.052-0.9s-2.251 0.224-5.177-0.226-5.177-0.226-7.878-1.575c-2.701-1.351-2.701-2.251-4.952-2.026-2.249 0.226-2.249-0.45-5.402-0.45-3.15 0-6.976 1.801-9.003 2.026-2.024 0.225-6.526-0.226-8.102-0.901-1.577-0.675-2.026-2.25-7.879-1.576-5.852 0.676-9.228 0.676-8.103-1.125 1.126-1.8 2.476-3.601 3.151-3.826 0.676-0.225 2.25-1.35 1.124-1.8-1.124-0.451-2.25-1.125-4.95-1.351-2.702-0.225-2.478 0.9-6.528 0.45-4.051-0.45 2.251-1.575-6.076-1.35-8.328 0.226-10.354 0.9-11.254 0.9-0.901 0-2.027-1.8-4.277 0.9-2.251 2.701-5.404 4.276-9.904 4.501-4.501 0.226-4.727-0.45-9.002 1.125-4.277 1.575-6.979-0.45-6.078 3.151 0.899 3.601 2.026 4.952 2.026 5.627s-2.026 5.177-4.501 2.476c-2.478-2.701-6.979-13.28-4.953-6.077 2.025 7.202 6.526 9.679 2.251 10.804-4.276 1.125-3.828-0.45-4.503-0.901-0.674-0.45 0-3.601-0.225-5.402-0.226-1.8-0.675-2.926-1.575-3.826-0.899-0.901-0.676-2.251-2.476-2.701-1.801-0.45-0.225-1.351-3.151-1.351s-5.401-1.801-4.726 2.251c0.674 4.051 1.349 1.351 3.149 5.177s5.177 1.125 2.702 3.826c-2.476 2.701-9.003 1.801-10.579 0.676-1.576-1.126-1.125 0.45-4.053-1.576-2.926-2.026-2.024-3.602-5.4-2.026s-4.502 4.502-5.853 3.376-4.501 1.575-5.627 0.226c-1.126-1.351-5.628-1.351-6.527 0-0.901 1.35-3.602 1.125-7.428 2.926-3.826 1.8-2.702 0.224-7.428 4.051-4.728 3.826-7.429 6.977-9.003 4.501-1.576-2.475-10.13-6.752-6.753-7.428 3.377-0.675 4.952-2.025 6.753-0.45s4.728 1.126 5.176 0c0.45-1.126 2.477-2.251-0.225-3.601-2.701-1.351-2.926-0.451-7.202-2.026-4.277-1.576 0-1.125-5.853-2.026-5.852-0.9-8.329-1.35-9.904-1.8-1.574-0.45-3.826 0-6.076-0.225-2.252-0.225-3.826-0.675-5.853-0.45-2.025 0.225-3.15-0.225-5.852 1.801s-4.728 2.926-6.528 4.501-6.526 4.727-7.877 5.853c-1.351 1.125-6.078 4.726-6.528 6.077s0.45 2.476-1.351 3.376c-1.801 0.9-3.601 0.9-4.952 1.125s0-2.026-1.351 0.225c-1.35 2.251-0.9 10.354 0.225 9.228s0.45-4.726 5.402-1.349c4.952 3.375 8.104 2.925 7.878 6.076-0.225 3.151 3.376 2.926 3.826 3.602 0.45 0.674 2.701-0.901 2.701-0.901s4.952-3.151 4.952-4.726c0-1.576 3.151-5.177 3.151-5.177s-2.252-1.125-2.252-3.376c0-2.25 0.677-2.927 1.126-5.178 0.45-2.25-2.476 0.001 4.277-4.277 6.751-4.276 7.202-1.349 7.202-1.349s0.899 0.9-0.226 2.25c-1.125 1.351-3.151 4.953-3.601 5.402-0.451 0.451 2.026 4.052 3.15 4.052 1.126 0 3.377-0.901 4.728-0.676 1.351 0.226 3.601-0.674 4.276-0.224 0.676 0.45 2.251 1.8 1.125 2.926-1.125 1.125-3.602 2.475-5.401 2.026-1.802-0.449-4.503-3.602-2.927 0.9s-0.225 5.627-1.576 5.402c-1.349-0.225-4.276-2.475-3.826 0.901 0.451 3.375-2.925 5.626-3.601 5.626s-2.025-0.225-2.025-0.225-2.027-0.226-3.151-0.226c-1.126 0-3.377 1.125-4.052 2.026c-0.676 0.9-1.576 0.226-2.701 0.226s0-1.351-2.251-1.801c-2.25-0.45-3.601-0.9-4.951 0-1.351 0.9-3.376 1.35-4.277 0.675-0.9-0.675 0.451-2.252-1.351-1.35-1.8 0.9-3.151 3.376-3.826 3.602-0.675 0.224 2.026 0-0.675 0.224-2.701 0.226-3.826 0.902-5.177 1.351-1.351 0.451 0.45 3.151-2.026 4.051s-0.674-1.125-3.151 0.9c-2.476 2.027-2.927 3.827-3.826 4.052-0.901 0.226-0.675 0.675-2.701 0.9s-1.8 0.45-2.927 0.675c-1.125 0.225 0.226 0.676-2.25 0.225-2.477-0.45-4.277 0.451-3.827 1.351s8.778 3.376 2.476 3.151-4.276 0.9-2.926 1.8c1.351 0.9 2.025 1.8 2.701 2.026 0.676 0.225 1.8 2.927 1.8 2.927s1.801-0.226 0.676 1.35c-1.125 1.576 0.45 2.026-0.676 4.052-1.125 2.026-1.125 0.675-2.025 1.125-0.9 0.449-2.251 2.026-4.728 0.675-2.476-1.351-4.275-2.026-7.202-2.25-2.926-0.226-0.901-0.675-2.926 0.899-2.026 1.577-2.476 3.377-2.25 5.402 0.225 2.025 0.45 4.727-0.226 6.078-0.675 1.35-0.675 2.701-0.226 4.727 0.451 2.025 1.802 2.927 1.802 2.927s3.151 0.449 3.826 0.675c0.675 0.225 2.026-0.45 3.826 0.674 1.801 1.126 3.602 1.577 4.727 0.226 1.125-1.35 5.627-2.926 6.979-4.276 1.35-1.351 2.25-1.8 1.575-3.151s1.351-4.727 2.476-5.402 3.601-1.351 3.601-1.351l2.701-4.051s2.251-2.477 3.376-2.251c1.125 0.225 7.427 2.477 6.978-0.449-0.45-2.927 0.45-3.827 1.125-2.702s2.476 0.675 2.476 0.675s0.9-0.449 1.575 0.226c0.675 0.674 1.575 3.602 2.926 4.276 1.351 0.676 2.476 1.351 3.377 1.8 0.9 0.451 1.801 0 3.602 1.576 1.8 1.576 3.601 2.477 3.825 3.151 0.227 0.675 1.802 2.251 1.802 2.251s1.575 0.45 1.125 1.351c-0.45 0.9-2.7 3.602-3.826 4.051-1.126 0.45-4.051-0.451-2.926 0.45 1.124 0.9 2.701 2.026 3.376 1.35 0.676-0.675 4.951-5.177 4.951-5.177s-0.225 0.225 0-1.126c0.226-1.349 0-2.925 1.126-2.25 1.125 0.676 1.801 1.576 2.251 0.676 0.45-0.901 0.9-0.45-0.226-1.125-1.126-0.676-3.826-4.502-5.177-4.727-1.351-0.226-4.728-2.477-4.728-2.477s-0.674-0.675-2.25-2.475c-1.576-1.801-2.025-1.351-2.477-2.927-0.449-1.575-1.801-3.601 0.676-3.151s4.051 2.025 6.302 3.376 1.802 1.8 3.827 3.151 2.252 2.702 3.826 2.477c1.575-0.225 3.377 0.9 3.377 2.926s0.449 4.276 0.899 4.727c0.451 0.451 1.8 1.351 2.251 2.251 0.45 0.9 1.351 3.151 2.025 4.051 0.676 0.9 1.351 1.576 2.026 2.702 0.675 1.125 0.9-0.226 1.575 0.225 0.676 0.45 1.576 0.224 1.576-0.676s0.224-2.476 0.224-2.476 3.153-0.9 2.253-1.351c-0.901-0.45-3.603-3.151-3.377-4.051 0.225-0.9 0-2.7 1.124-2.475 1.126 0.224 2.252 2.25 4.728 0.449s5.402-2.701 4.501 0c-0.899 2.701 0.227 3.15 0 6.077-0.224 2.927 0.902 2.026 2.478 3.602 1.575 1.576 2.7 1.802 3.825 2.251 1.126 0.451 2.926 0.226 4.728 0.451 1.801 0.225 2.926-0.676 4.502-0.225 1.574 0.45 5.176-0.226 5.852 0.225 0.676 0.45 3.377-0.9 3.601 0.675 0.225 1.576 1.126-0.225 0.451 3.376s-1.576 6.077-1.576 6.077c-2.476 4.727-3.376 5.853-4.502 6.078-1.124 0.225-1.8 0.9-3.825 0.675-2.026-0.226-4.502 0-7.428-0.675-2.926-0.676-8.329 0.675-10.579-0.676-2.251-1.35-5.402-0.225-6.754-1.8-1.35-1.576-3.6-1.351-4.501-2.251-0.9-0.9-1.35-3.375-1.35 0.226 0 3.602-2.026 3.826-2.476 5.627-0.451 1.8 0.674 0.9-1.802 0.675-2.476-0.226-3.151 1.125-6.752-1.575-3.602-2.701-5.402-2.701-7.202-3.827-1.802-1.126-3.602 2.025-5.402-1.575-1.801-3.602-4.277-0.676-4.502-3.602-0.225-2.927 0-2.7 0.225-4.501 0.227-1.801 2.701-3.376 1.576-4.051-1.126-0.675-0.226-1.801-1.801-1.125-1.576 0.675-3.826 0.9-5.627 1.575-1.801 0.676 4.051 0-4.727 0.676-8.778 0.675-11.255 1.575-11.255 1.575s-0.675-0.45-1.801 0.45c-1.125 0.9-2.701 2.251-4.276 1.576-1.575-0.676-2.476-0.451-3.826-0.225-1.351 0.225-2.25-1.125-3.826 0-1.576 1.124-3.376 1.575-4.052 1.124-0.7-0.46-1.83-2.26-1.83-2.26z" />
                      <path d="m497.3 279.48c-0.675 2.477-3.151 6.077-3.151 6.077l-4.503 2.251s-1.573 1.351-2.475 1.576c-0.9 0.224-3.151 1.351-3.151 1.351s-2.025-0.451-1.351 1.574c0.675 2.026 0.901 4.503 0.675 5.177-0.224 0.676-0.224 2.027-0.224 3.828 0 1.8-0.675 4.05-1.801 4.5-1.125 0.451-2.251 0.901-2.026 2.477 0.226 1.576 0.226 6.302 0.226 6.302l2.927 4.502s0.9-0.675 2.701-0.675c1.799 0 3.601-1.574 3.601-1.574s2.027 0.448 1.8-2.026c-0.225-2.477 0.902-5.402 0.675-6.078-0.224-0.675 2.027-3.602 2.027-4.276 0-0.676 2.251-3.825 2.251-4.952 0-1.125 1.575-2.926 1.8-4.275 0.225-1.352 0.45-4.502 0.9-5.402 0.451-0.9 0.676-1.801 0.676-2.701s0-2.701 0-2.701l-1.6-4.96z" />
                      <path d="m673.54 309.87c-0.675 0.899-1.125 10.579-1.575 11.704s-1.351 6.978-0.899 8.327c0.449 1.352 1.124 6.303 0.675 7.879-0.451 1.575 0.225 6.527-0.902 6.302-1.124-0.226-1.573 0.226-1.573 0.9 0 0.676 1.573 2.025 1.573 2.025s2.703 0.001 3.828-0.225c1.125-0.225 3.376-1.351 5.177-1.351s2.927-1.351 4.501-1.351c1.576 0 4.953-1.124 5.853-0.675s2.25-2.701 3.826-2.025c1.576 0.675 4.953-1.576 6.528-1.576 1.574 0 2.251-2.477 4.052-2.025 1.8 0.45 5.177-0.9 6.753-0.227 1.573 0.677 4.051-2.25 5.176 0 1.126 2.252 4.503 3.152 4.503 4.277s-0.228 3.602-0.228 3.602l2.702-0.226s4.275-2.701 4.952-2.701c0.675 0 2.251-2.25 2.251-1.124 0 1.124-1.352 3.602-1.801 4.726-0.45 1.126 0.449 2.477 0.449 2.477s2.253 1.125 1.352 3.15c-0.901 2.026 0.224 1.577 0 3.151-0.226 1.576 0 0.9 0.898 1.8 0.902 0.901 2.479 2.479 3.828 2.252 1.352-0.226 1.8-1.575 2.926-0.9 1.125 0.675 3.375 0.225 4.05 1.126 0.678 0.899-4.275 3.15 4.278-0.675 8.553-3.828 9.451-4.728 10.577-6.079 1.129-1.35 2.479-2.7 3.377-3.601 0.901-0.9 0.227-0.675 2.926-2.701 2.701-2.025 2.701-1.125 5.179-4.952 2.476-3.825 4.275-5.176 4.727-5.852 0.45-0.676 1.35-0.9 1.575-3.603 0.225-2.7 2.025-5.176 2.025-6.076 0-0.899 0.675-2.249 0.45-3.826-0.225-1.576 0.901-3.825-0.45-6.076-1.351-2.252 0.675-3.15-1.351-4.053-2.026-0.9-3.376-0.449-3.826-2.025-0.451-1.576-2.252-1.351-2.927-5.627s-3.376-4.728-3.376-4.728-2.701-1.125-2.026-1.574c0.677-0.451 0.901-3.603 0.677-4.503-0.226-0.9-0.226-2.926-0.9-4.275-0.675-1.352-1.126-3.151-1.801-4.728-0.675-1.575-1.8-2.026-2.251-3.826s-1.126-2.477-1.35-2.926c-0.227-0.45-0.678-2.7-1.126-0.226-0.45 2.476-1.352 7.202-1.352 7.202s-1.801 3.828-2.476 4.953c-0.675 1.124-1.35 4.051-2.475 3.825-1.126-0.225-1.803 1.127-2.701 0.9-0.901-0.226-2.251 0.226-2.926-0.449-0.675-0.676-2.476-2.476-3.377-2.702-0.9-0.224-1.575-2.024-2.251-2.024-0.677 0-1.801-1.577-1.575-2.477 0.224-0.9 0.449-2.925 0.675-3.826 0.224-0.9 1.576-2.927 1.576-2.927s0-1.35-1.126-1.35c-1.125 0-1.351 0-3.827-0.226-2.475-0.226-3.149-0.45-4.052-0.45-0.898 0 0.902-0.45-1.575 0.225-2.475 0.677-3.601 2.477-5.177 4.053-1.573 1.575-0.224 1.124-1.573 1.575-1.353 0.451-1.126-1.126-2.027 1.351-0.901 2.476 0.451 3.15-0.227 3.601-0.675 0.451-5.4-1.575-5.4-1.575s1.125-0.226 0.224-1.351c-0.899-1.126-1.8-2.7-3.149-2.025-1.353 0.675-2.479 1.126-3.377 2.251-0.901 1.125-0.901 2.025-1.576 2.925s-2.475 0.9-2.701 1.801c-0.225 0.901-0.225 3.151-0.899 3.376-0.675 0.226-0.9-0.898-1.575-1.124-0.675-0.225-0.451-2.026-0.9-0.9-0.45 1.125-0.9 0.899-1.575 2.7-0.677 1.801-0.901 3.377-1.576 3.602-0.675 0.226 0 0.45-2.027 1.576-2.024 1.125-2.475 1.125-5.4 2.476s-2.25 1.351-4.276 1.575c-2.025 0.226-2.477 0.901-3.827 1.126-1.352 0.225-2.25 0.449-3.602 1.8-1.35 1.351-2.475 1.8-3.375 2.026s-1.76 1.11-1.76 1.11z" />
                      <path d="m686.82 220.96c-0.899 1.352-3.825 5.402-4.95 5.628-1.126 0.224-2.252 1.351-3.152 1.125s-2.926 0-3.601 2.926-1.801 4.502-2.478 4.276c-0.675-0.225 1.125 4.276-2.7 2.477-3.825-1.801-2.475 1.576-2.926 2.477-0.45 0.899 0.675 3.376 0.9 4.276 0.227 0.9 0.9 2.476 1.801 3.825 0.9 1.351 1.575 2.926 3.151 2.478 1.576-0.452 6.526 0 6.526 0s1.803 0.675 2.927 0.675c1.125 0 1.351-0.45 2.025-0.45s2.025-2.252 1.801-2.476c-0.225-0.227-0.899-0.901 0.45-2.252 1.351-1.351 2.926-1.8 3.152-3.376 0.225-1.575-0.45-1.575 0.225-2.477 0.675-0.9 2.25-0.673 1.801-1.575-0.451-0.9 0.449-0.675-0.451-2.477-0.899-1.8-2.026-2.476-1.126-4.727 0.901-2.25 1.803-2.701 1.577-4.051-0.226-1.352 1.125-1.801-0.451-3.377-1.574-1.574-2.25-2.025-3.376-2.477l-1.11-0.46z" />
                      <path d="m730.94 243.47c0.902-0.225 4.052-2.476 4.278 1.576 0.225 4.051 0.448 2.925 1.801 5.176 1.35 2.251 2.248 2.928 3.824 1.802 1.575-1.127 3.376-1.127 3.826-3.151 0.451-2.026 0.451-2.026 1.801-2.026 1.353 0 1.801-0.225 2.479 0.677 0.674 0.898 1.122-0.002 4.05 1.574 2.926 1.576 5.401 1.124 7.204 2.701 1.801 1.575 2.701 1.352 5.176 2.251 2.476 0.9 1.35-0.45 3.601 2.026 2.252 2.475 1.353 3.15 2.476 4.276 1.125 1.125 2.027-0.901 1.576 1.8s-3.601 0 1.126 3.825c4.726 3.828 5.402 4.504 6.976 5.628 1.577 1.126 2.702 2.477 1.353 2.477-1.353 0-5.628 0-6.077-0.676-0.451-0.675-2.476-1.126-3.828-2.701-1.349-1.574-4.275-2.701-4.949-4.051-0.677-1.352-1.577-1.801-2.702-1.801s-2.25 1.35-3.827 2.926c-1.576 1.575-0.898-0.899-2.926-0.225-2.027 0.676-4.275-0.226-5.402-1.126-1.126-0.9-0.899-2.25-2.699-1.575-1.803 0.675-2.926 0.225-2.251-1.125 0.675-1.352 0.224-3.152 0.224-3.152s0.677-2.251-0.898-2.7c-1.576-0.449-1.576-2.025-3.152-2.477-1.577-0.449-4.051-1.575-4.051-1.575s-0.225 0-0.901-0.225c-0.675-0.226-0.675-0.226-2.476-0.675-1.8-0.451-3.152-0.002-4.051-1.126-0.902-1.125-0.451-2.701-0.451-2.701s3.601 0.45 0-2.251l-3.601-2.7s0.448-0.226 0.224-0.676c-0.23-0.46 2.25-0.01 2.25-0.01z" />
                      <path d="m629.65 224.78s1.125 1.127 2.926 0.901c1.8-0.226 3.149 3.601 4.277 4.951 1.124 1.351 1.801 2.026 4.276 3.602 2.475 1.575 2.25-1.351 5.627 3.376 3.376 4.726 1.8 1.801 3.376 4.726 1.575 2.929 2.476 4.503 3.376 5.18 0.899 0.675 1.576 2.474 1.802 3.15 0.224 0.675 1.799 2.7 1.799 3.376 0 0.675 0.451 2.476-0.899 4.051-1.351 1.576-2.477 1.801-2.477 1.801s-2.701-1.351-3.601-2.701c-0.901-1.35-2.025-2.476-3.602-5.176-1.575-2.702-3.376-5.628-4.276-6.978-0.9-1.352-2.251-2.703-2.926-4.052-0.675-1.352-2.476-5.402-3.376-5.853s-1.126-1.8-2.702-3.376c-1.574-1.576-1.35-2.926-2.025-3.826s-2.25-2.928-2.25-2.928l0.66-0.22z" />
                      <path d="m191.87 400.35c-1.576-0.9-4.952-2.476-6.077-3.376s-4.501-5.854-4.501-5.854l-2.477-4.727s-2.925-3.601-2.25-4.951c0.675-1.351 2.026-2.251 2.026-2.926s1.35-2.477 0.224-3.151c-1.125-0.676-1.125-0.9-1.801-2.926-0.675-2.025-0.675-3.828-1.575-4.277-0.901-0.449-1.576-3.376-2.476-3.601-0.9-0.226-1.801-1.801-1.801-1.801l-1.351-18.232s-0.451-8.327-0.9-10.129c-0.451-1.8 0.675-5.626-0.451-9.003-1.125-3.376 0.226-7.427-0.45-8.778-0.675-1.351 0.45-5.176-0.225-8.777s2.701-8.103 0-9.453c-2.701-1.352-0.675-3.377-2.926-3.377-2.25 0-3.826-1.126-5.852-2.7-2.026-1.576-5.853-4.503-6.978-5.629-1.125-1.124-4.727-4.051-5.852-4.951s-2.251-4.727-3.151-5.853c-0.9-1.124-1.35-4.5-2.701-6.526-1.351-2.025-3.151-5.401-3.602-6.077-0.45-0.675-5.402-6.527-5.402-6.527l0.45-3.601s3.376-2.026 2.926-2.701c-0.45-0.676 0.226-1.352-1.351-2.701-1.576-1.352-1.351-3.828 0-4.952 1.351-1.127 3.376-4.728 3.376-4.728l3.376-5.626s2.702-2.928 2.702-4.953s3.826-3.375 1.575-5.176c-2.251-1.802-1.125-3.377-1.801-4.728-0.676-1.35-0.225-2.25 1.801-3.601s5.627-6.302 5.627-6.302 2.701-0.676 3.376-0.676 1.801-7.204 3.827-2.477c2.026 4.727 2.701 2.251 2.026 5.627-0.676 3.376 0.9 2.702 1.8 1.802 0.9-0.902-0.451 0.675 1.35-3.378 1.8-4.051 1.126-5.401 2.251-4.275s1.575 1.351 3.601 2.026c2.025 0.675 2.701 0.449 3.375 1.8 0.675 1.351 0.451-0.45 4.277 0.226s9.228-1.351 8.553 0.899c-0.675 2.251-2.026-0.225 1.125 2.251 3.151 2.477 3.602 2.926 5.402 3.377 1.8 0.45 3.376 0.225 6.078 2.926 2.701 2.7 3.376 2.926 4.051 4.275 0.675 1.352 1.8 0.451 2.926 1.801 1.125 1.352 2.701 1.352 4.276 1.352s0-1.352 2.476 0.45c2.477 1.8 4.277 2.024 5.402 5.626 1.125 3.604 3.376 3.377 1.575 6.979-1.8 3.602-5.401 5.177-3.826 4.952 1.575-0.226 4.502-1.577 5.402-1.351 0.9 0.224 1.35-0.675 2.701 0s1.576-0.9 1.351 0.675c-0.226 1.576-0.226 0-0.226 1.576 0 1.575-0.45-1.576 2.251-0.9 2.701 0.675 1.125-1.352 4.276 1.575 3.152 2.927 3.152 2.027 4.276 3.602 1.126 1.574 2.251-0.899 2.927-0.225s2.701 0.224 4.727 0.675c2.026 0.449 0.675-1.35 3.827 0.675 3.15 2.025 6.302 1.35 6.977 3.151 0.675 1.8 2.477 1.125 3.376 2.251s1.35-0.451 2.251 1.126c0.9 1.574 3.602 1.124 3.151 2.699-0.451 1.577 0.674 0.676 0.224 2.926-0.449 2.253-2.026 5.854-3.375 6.753-1.351 0.901-1.35 2.026-2.251 3.151-0.9 1.127-0.675-1.125-1.801 2.026-1.125 3.152-0.9 3.602-1.8 6.527s-0.225 0-0.9 2.926c-0.675 2.926-0.225 4.727-0.9 8.104-0.675 3.375-0.45 3.376-0.9 5.852s1.125-1.124-0.901 4.051c-2.025 5.178-2.25 4.951-2.925 7.203-0.676 2.252 0.225 0.45-2.251 1.801-2.476 1.352-1.125 0.9-4.052 1.801-2.925 0.9-6.527 1.802-7.652 2.026s-5.627 1.575-4.276 4.275c1.351 2.702 1.351 3.152 0 6.529-1.351 3.375-3.376 4.502-3.376 6.076 0 1.575-0.901 3.15-1.125 4.276-0.226 1.126 2.025-1.126-0.675 2.251-2.701 3.376-2.926 2.476-3.827 4.502-0.9 2.025 0 0.449-0.9 2.025-0.9 1.575-3.151 2.25-3.151 2.25s0.224 1.126-0.676 0.676c-0.901-0.449-0.675 0.225-4.052-0.676-3.376-0.9-3.826-3.149-4.276-1.575-0.45 1.575 0.225 2.477 2.251 4.052 2.025 1.576 5.402 2.025 4.501 3.602-0.9 1.576-0.9 1.576-1.575 2.476-0.676 0.901 0.9 0.225-0.676 0.901-1.575 0.675-2.476 3.602-3.151 3.602s-1.126 1.125-2.026 0.675c-0.9-0.451-3.15-2.026-3.601-1.126-0.45 0.899-1.351-1.126-1.126 2.025 0.226 3.151 0.676 4.952-0.45 5.628-1.125 0.675-3.827 0-3.827 0l-0.45-1.126-1.575 0.45s-0.675 2.701 0.45 3.151 0.9 0.899 2.025 2.25c1.126 1.351 0.451 3.827 0.451 3.827s0 0.676-1.125 1.801c-1.125 1.125-1.576 2.026-1.801 2.701-0.226 0.675-1.576 3.602 0.45 3.376 2.025-0.226 3.602-1.351 3.602 2.251 0 3.601 0.9 2.702-0.225 5.177-1.126 2.476-2.026 2.701-2.251 4.951-0.224 2.251 0.226 2.476 0.676 3.827s1.576 0.675 0.45 1.351c-1.12 0.64-4.49-0.03-4.49-0.03z" />
                      <path d="m133.8 217.13l-1.575-2.25s-0.675-1.352-1.801-1.576s-3.602-3.151-3.602-3.151-1.125-0.9-1.125-2.475c0-1.576-0.901-4.051-0.226-6.752 0.676-2.7 0.901-6.077 0.676-6.978-0.226-0.9 1.125-1.125-0.45-2.026-1.576-0.9-4.727-1.125-6.753-1.125-2.025 0-4.502 0.676-4.952 0.9-0.45 0.225 2.476-6.752 2.926-7.877s2.476-6.078 2.476-6.752c0-0.676 0.675-0.901-0.675-1.8-1.35-0.901-3.601-1.351-4.952-0.676-1.35 0.676-1.125-0.9-2.25 1.8-1.125 2.702-2.251 5.628-3.602 6.078-1.35 0.451-4.051 1.801-4.051 1.801s-3.376-0.225-4.502-0.45c-1.125-0.225-5.852-2.701-6.752-4.276-0.9-1.576-1.35-4.953-1.35-6.527 0-1.576 2.475-6.302 2.25-7.428-0.225-1.125 2.477-5.627 2.251-6.303-0.226-0.675 0.45-2.926 1.125-3.826s4.052-2.026 4.952-2.926c0.9-0.901 2.476-2.025 4.051-2.476s2.927-0.9 4.052-0.9 4.051-2.476 4.501 0c0.451 2.475 2.477 1.575 3.602 1.8 1.125 0.226 1.351 1.351 3.151-1.575 1.801-2.927 3.601-3.827 3.601-3.152 0 0.676 2.926-0.224 3.376 0.451s1.351-0.451 2.926 0.9c1.576 1.351 3.826 1.576 3.601 2.25-0.225 0.675 0.9 0.675 0.9 1.351 0 0.675 0.901-1.576 0.901 2.475 0 4.052 1.125 6.528 1.125 6.528s1.575 3.377 2.25 2.701c0.675-0.675 2.025-2.475 2.025-2.475s2.251-1.351 0.676-6.078c-1.576-4.726-0.45-6.077-0.9-7.653-0.451-1.576-0.451-2.477 2.25-4.502s9.228-6.527 10.804-7.427c1.575-0.9 5.176-3.376 5.176-3.376s1.35-0.675 1.576-2.476c0.225-1.8 4.501-4.952 4.727-5.852s3.152-3.15 3.152-3.15 3.15-1.802 2.925-2.926c-0.225-1.125 4.052-3.15 4.727-3.15s4.277 1.124 4.277-0.902c0-2.025 0-2.476 2.251-4.276 2.25-1.8 5.176-4.502 6.302-4.502 1.125 0 4.952-2.024 6.527-2.475 1.576-0.451 6.528-2.702 2.026 0-4.502 2.7-1.576 1.125-2.476 3.376-0.899 2.25-1.576 5.177 2.701 1.8 4.277-3.376 4.051-4.052 5.627-4.276 1.576-0.225 0.45 0.675 3.826-0.451 3.377-1.125 3.602-1.575 3.602-1.575s1.576-1.351 0.675-2.025c-0.9-0.676 0.901-1.576-2.476-0.226-3.376 1.351-3.151 1.576-5.402 0.9-2.25-0.675-5.627-0.451-3.151-2.702 2.476-2.25 5.627-2.926 3.601-3.826-2.025-0.9-7.202 0.226-7.877 0.45-0.676 0.225-2.251-0.225-3.602 0-1.35 0.225-0.9-1.799 0-2.25 0.901-0.451 3.827-1.802 7.428-2.702s12.38-1.125 14.405-1.125s4.726 0.451 6.302-0.675c1.575-1.125 4.727-2.925 5.177-3.827 0.451-0.9 2.251-2.25 2.251-2.25s2.025-2.026 0.9-2.926c-1.125-0.9-2.251-2.926-3.151-2.476s-0.224 3.152-2.025 0.225c-1.801-2.925-1.576-3.376-2.476-4.051s-1.801-0.226-1.125-3.376c0.675-3.151 0.45-4.502 0.45-4.502s0.675-2.7 0-2.925c-0.676-0.226-1.125-0.9-2.25-0.226-1.126 0.675-7.428 3.827-8.778 4.502-1.351 0.675-3.152-2.701-2.477-4.276 0.676-1.577 0.225-0.676-0.675-2.926-0.9-2.251-4.501-2.702-5.852-2.702s-4.501-2.026-5.402-0.675c-0.9 1.35-5.626 5.626-6.528 6.077-0.9 0.451-2.25-3.826-2.925 3.151-0.676 6.979 2.476 9.004-1.125 9.454s-6.753 2.475-6.753 2.475-2.925 0.226-2.925 2.026c0 1.802-1.125 6.077-2.477 6.527-1.35 0.451-4.727-0.224-5.852-1.575s0.225-6.302 0.225-6.302l2.026-2.026s-14.405-2.25-14.181-3.151c0.226-0.9-4.276-2.475-4.726-3.826s-0.676-4.277-0.225-5.402c0.45-1.125 6.527-6.527 9.678-7.652 3.151-1.126 8.553-3.601 10.129-4.052 1.576-0.45 4.276-0.225 5.177-1.35 0.9-1.126 1.125-3.151 1.125-3.151s-0.45-3.152 0.45-2.702c0.9 0.451 2.476 1.126 2.701 1.801 0.226 0.675 0.226 2.251 1.801 0.449 1.576-1.8 3.602-2.476 5.402-3.375 1.801-0.901 4.501-0.675 6.078-1.575 1.575-0.9 4.276-1.801 4.501-4.052 0.225-2.25-0.675-1.575-1.801-1.801-1.125-0.224 0.45 0.226-3.376 2.026-3.827 1.8-2.701 0.45-5.402 1.8-2.701 1.351-2.927 1.576-3.151 0.451-0.226-1.126 0.45-2.926 0.45-2.926s0.226-0.226-1.35-0.675c-1.576-0.45-1.576 0.225-1.801-1.8-0.225-2.026 1.125-4.952-1.125-4.052-2.251 0.9-4.276-0.675-5.852 3.826s-6.978 9.229-8.329 8.103c-1.35-1.125-1.575-1.351-2.701-1.351s-2.701-1.35-4.727-1.575-8.104-0.225-9.678 0c-1.576 0.226-3.376-0.9-4.728 0.451-1.35 1.35-3.375 3.151-3.375 3.827 0 0.675-2.026-2.477-2.701-2.251-0.675 0.225-2.477-0.9-4.501-0.9-2.026 0-3.377-1.126-4.051-1.126-0.675 0 0.674-1.801 0-2.026-0.675-0.224-15.307-0.675-15.307-0.675s-4.726-1.8-6.526-1.575c-1.801 0.225-6.752 0.449-10.58 1.125-3.827 0.675-9.454 2.926-11.254 3.151-1.801 0.226-5.852 0.226-6.527-0.9-0.676-1.125 0.225-0.9-0.676-1.125-0.9-0.224-0.224-0.675-2.25-2.25-2.026-1.576 0.901-2.926-3.151-2.926-4.051 0-6.527-0.226-10.128 0-3.602 0.225-11.029 2.025-11.929 1.8s-8.103 1.126-9.229 0.451c-1.125-0.676-6.753 2.475-7.877 2.25-1.125-0.225-5.402 0.226-6.527 0.901-1.126 0.676-6.528 2.025-4.727 3.151 1.8 1.125 1.575 2.25 1.8 2.926 0.226 0.675-1.8 2.25-1.8 2.25s-0.451 0-2.926-0.9c-2.476-0.901-5.177-1.35-6.303-0.675-1.125 0.675-3.151 2.027-2.701 2.927 0.451 0.9 3.601 2.926 4.052 2.25 0.45-0.675 1.576-2.025 2.926-1.8 1.351 0.226 3.377-0.9 1.576 1.351-1.801 2.25-3.377 3.376-4.502 3.602-1.125 0.224-3.826 0.449-6.302 0.675-2.477 0.226-2.252-0.9-4.502 1.351-2.25 2.25-3.151 0.9-3.601 3.376-0.45 2.475-0.9 2.475 0 3.151 0.9 0.675-1.801 0.9 0.225 1.575 2.025 0.676 4.501 1.351 4.276 2.025-0.226 0.676 2.251-0.899 0.9 0.9-1.351 1.802-2.25 3.376 0.45 1.576 2.701-1.8 4.276-0.451 6.527-1.576s4.502-1.35 5.852-2.25c1.351-0.901 2.026-2.25 4.052-2.927 2.026-0.675 0.675 0.226 0.9 1.351s0 1.35 1.351 0.449c1.35-0.9 1.35-0.224 3.151-1.35 1.8-1.125 3.826-2.251 5.177-1.576 1.35 0.676 1.8 0.676 2.701 0.676 0.9 0-1.125-0.226 0.9 0 2.026 0.224-0.9-0.676 5.852 0.9 6.753 1.575 8.554 0.45 9.003 2.926 0.451 2.476 1.351-0.226 2.476 1.35 1.125 1.575 1.801 0.226 2.476 2.926 0.675 2.702 0 10.129-0.45 11.029s-0.675 0.9-0.45 2.926c0.225 2.025 2.926 11.705 2.026 12.379s-2.926 0.9-2.926 0.9l-1.125 4.051s-1.8 3.376-3.376 5.177c-1.576 1.8-3.601 4.052-4.727 5.626-1.125 1.576-2.026 4.278-3.601 5.853s-2.926 0.9-2.476 4.276 0 6.977 0.45 9.454c0.451 2.476 1.576 5.852 2.476 7.203 0.9 1.35 1.576 1.35 3.151 2.475 1.576 1.125 3.602 2.477 3.376 3.602-0.225 1.125 0.225 8.104 0.225 8.104s1.351 2.25 1.575 4.726c0.226 2.477 1.801 4.952 1.801 4.952l1.351 2.927s0.675 0.226 1.576 2.025c0.9 1.801 0.9 1.801 1.125 2.7 0.226 0.902 0.226 0.676 0.226 0.902 0 0.224-0.226-3.827-0.676-4.953-0.45-1.125-0.45-2.475-0.9-3.826s0.225-2.927-1.125-4.952-1.35-2.251-2.025-4.277c-0.675-2.025-1.576-4.276-0.675-4.727 0.9-0.449 1.575-3.375 3.376 0 1.8 3.376 2.026 2.477 2.251 5.178 0.224 2.701 0.9 3.602 1.575 4.726 0.675 1.125 2.25 4.953 3.151 6.527 0.9 1.576 0-0.9 2.025 2.251 2.026 3.151 2.252 3.826 3.377 6.302s1.801 2.476 2.476 4.276c0.675 1.802 0.225 1.351-0.226 3.376-0.45 2.025 0.45 4.277 0.45 4.277s3.151 1.125 3.376 1.8c0.225 0.675 3.376 1.8 3.827 2.701 0.45 0.901 3.376 2.025 3.376 2.025s2.476 1.576 3.375 2.026c0.901 0.45 3.603 0.901 3.603 0.901s1.8 0.451 2.475 0.675c0.675 0.225 2.701 0.225 2.701 0.225s1.801-1.35 2.476-0.9c0.675 0.449 2.251-0.901 2.926 0.224 0.675 1.126 2.026 1.126 2.701 2.027 0.675 0.9 1.35 0.9 2.476 2.025s2.251 0.9 3.376 1.8c1.125 0.9 2.025 0.9 3.376 0.9 1.35 0 1.35 0 2.251 0.226 0.899 0.225 1.35-0.676 2.25 0.451 0.9 1.125 1.575 1.8 2.25 2.925s2.251 1.125 2.476 2.926c0.225 1.8 0.675 1.577 0.675 3.151 0 1.576 0.9 2.251 1.576 2.702 0.674 0.449 3.15 2.699 3.15 2.699l3.376 0.676 2.701 2.026 2.85 0.9z" />
                      <path d="m205.94 8.03l13.505-1.688s4.726 0 7.09-1.688c2.363-1.688 0-1.688 7.09-3.038 7.09-1.351 5.065-2.026 8.779-1.351 3.713 0.676 4.726 0.676 8.778 1.351 4.051 0.675 5.064-0.337 8.777 0.675 3.714 1.013 5.402 0.675 8.441 0.675h9.453c4.727 0 9.116-2.701 10.804-1.013s2.701 1.013 8.441 1.688c5.739 0.675 8.103-0.676 10.466 0 2.364 0.675 6.416-0.337 11.142 0s7.09-0.337 8.778-0.337 3.375-2.364 5.739-0.338c2.364 2.026 5.402-0.675 5.739 2.026 0.338 2.701 4.727 0.675 0.338 2.701s-3.714 1.688-6.753 4.389c-3.038 2.701 2.026 5.064-4.389 7.428-6.415 2.363-7.428-1.351-9.116 2.701-1.688 4.051 0 5.064-0.337 7.09-0.338 2.025-1.013 2.363-3.039 4.051-2.025 1.688-2.025 0-6.752 1.013s-8.103 2.026-10.128 2.026c-2.026 0-6.415 1.688-7.766 2.363-1.351 0.676 2.364 1.688-4.727 3.714-7.09 2.026-8.779 1.689-10.804 4.389-2.026 2.702-1.351 3.04-2.701 4.728-1.351 1.688-5.402 8.441-7.428 6.753-2.025-1.688-3.039-1.351-4.727-3.039s-2.701-4.051-3.714-5.402-1.351-4.727-1.688-6.753-3.377-6.752 0-6.077c3.376 0.675 5.402 0.338 6.415-0.337 1.013-0.676 2.026-3.039 2.026-3.039s-0.337-3.714-1.351-5.74c-1.013-2.026-0.337-3.714-2.025-5.739-1.688-2.026-1.688-1.688-4.052-3.714-2.363-2.026-1.688-3.039-5.402-3.376s-4.727-1.351-6.078-1.013c-1.35 0.337-5.739-2.364-1.013-2.701 4.727-0.338 9.116 0.337 9.116 0.337s6.077-2.701 4.052-3.038c-2.025-0.338 3.038-3.377-1.688-2.364-4.727 1.013-10.128 2.364-11.479 2.701-1.35 0.337-4.727 0.675-8.103 1.688-3.375 1.013-7.428 0.676-9.453 3.039-2.026 2.363 0 2.701-2.026 2.363-2.025-0.337 1.688-2.363-3.038 0-4.727 2.364-3.376 2.026-5.739 1.351-2.364-0.675-4.052-1.688-4.052-1.688s3.04-0.338-1.35-0.675c-4.389-0.337-4.389-0.337-6.077-2.364-1.688-2.026-0.675-2.026 0.337-2.701 1-0.676 1.68-2.027 1.68-2.027z" />
                      <path d="m198.51 23.223c-1.688 1.688-5.74 4.052-4.726 5.065 1.013 1.013 1.688 4.727 3.714 3.714 2.025-1.013-0.338-4.389 7.427-1.688 7.766 2.701 7.09-0.337 8.778 3.714s3.038 7.089 2.025 8.103c-1.012 1.013-1.35 2.026-4.727 3.039-3.376 1.013-4.727 2.364-2.363 4.051 2.363 1.688 6.753 3.376 8.778 4.39 2.026 1.012 8.103 1.351 5.064-2.025s0.675-4.39 0.675-4.39 5.74 4.39 3.715-0.675c-2.026-5.064-3.377-5.064-2.026-5.064s4.051 1.688 4.051 1.688l1.351-2.701-1.351-4.389-4.389-4.389s3.713-3.376-1.351-4.051-4.727-0.675-7.428-2.364c-2.701-1.688-3.038-2.363-8.103-1.35-5.064 1.013-6.752 1.688-6.752 1.688l-2.35-2.366z" />
                      <path d="m123.22 27.275c2.026-2.026 7.428-6.752 9.454-5.402 2.025 1.35 5.063-1.013 7.427 1.013 2.363 2.026 5.064 4.389 7.09 5.064s4.389-1.688 6.415-0.675c2.025 1.013 9.115-5.064 7.765-0.337-1.351 4.727 1.688 6.077-2.026 6.415s-7.765 3.039-9.454 2.026c-1.688-1.013-3.039-2.026-5.74-0.675-2.701 1.35-1.35 1.35-4.389 0.675-3.038-0.675-3.713 0.675-4.388-0.338-0.676-1.012-2.701-0.675-2.364-3.714 0.337-3.038 1.35-2.701-0.676-2.701-2.025 0-3.713 0.338-5.064-0.675-1.34-1.013-4.04-0.676-4.04-0.676z" />
                    </g>
                  </svg>
                  <ConnectionLines hubs={hubs} positions={hubPositions} />
                  {hubs.map((hub, index) => (
                    <ResonanceHub
                      key={hub.id}
                      hub={hub}
                      position={hubPositions[index]}
                      onHubClick={handleHubClick}
                      intensity={hub.resonance_intensity}
                    />
                  ))}

                  <AnimatePresence mode="wait">
                    {selectedHub && (
                      <motion.div
                        key={selectedHub.id}
                        className="absolute top-4 left-4 right-4 mx-auto lg:left-4 lg:right-auto lg:mx-0 lg:max-w-sm bg-slate-900/95 backdrop-blur-sm border border-slate-600 rounded-xl p-4 lg:p-6 max-w-xs z-10"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedHub(null)}
                          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-lg lg:text-xl font-bold text-orange-400 mb-2 pr-8">{selectedHub.name}</h3>
                        <p className="text-slate-300 mb-4 text-sm lg:text-base">{selectedHub.location}</p>
                        {selectedHub.description && (
                          <p className="text-slate-400 text-xs lg:text-sm mb-4">{selectedHub.description}</p>
                        )}
                        <div className="flex gap-4 text-xs lg:text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>{selectedHub.member_count} members</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Lightbulb className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>{selectedHub.active_projects} projects</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Add invisible overlay that closes info box when clicked */}
                  {selectedHub && (
                    <div
                      className="absolute inset-0 cursor-pointer z-0"
                      onClick={() => setSelectedHub(null)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Most Funded Projects Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Most Funded Projects</h2>
          <Link
            to={createPageUrl("Projects")}
            className="text-orange-400 hover:text-orange-300 font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <span className="hidden sm:inline">View All Projects</span>
            <span className="sm:hidden">View All</span>
            <Lightbulb className="w-4 h-4" />
          </Link>
        </div>

        {topFundedProjects.length === 0 ? (
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No funded projects yet. Be the first to support a project!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topFundedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                className="h-full" // Ensure the motion div takes full cell height
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="h-full bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 hover:border-orange-500/50 transition-all duration-300 cursor-pointer flex flex-col" // Add h-full, flex, flex-col
                  onClick={() => handleProjectClick(project)}
                >
                  <CardContent className="p-6 flex flex-col flex-grow"> {/* Add flex, flex-col, flex-grow */}
                    <div className="flex-grow"> {/* This div will expand */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-slate-300 text-sm line-clamp-3">
                          {project.description}
                        </p>
                      </div>

                      {/* Flex wrap for badges to prevent overflow on small screens */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className={`border text-xs ${statusColors[project.status]}`}>
                          {project.status}
                        </Badge>
                        <Badge variant="outline" className={`border text-xs ${categoryColors[project.category]}`}>
                          {project.category}
                        </Badge>
                      </div>
                    </div>

                    {/* This div will be pushed to the bottom */}
                    <div className="flex items-center justify-between text-sm mt-auto">
                      <div className="text-slate-400">
                        {project.supporters?.length || 0} supporters
                      </div>
                      <div className="text-orange-400 font-semibold">
                        {project.funding_raised?.toLocaleString() || 0} sats
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Latest Governance Proposal Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Latest Proposals</h2>
          <Link
            to={createPageUrl("Voting")}
            className="text-orange-400 hover:text-orange-300 font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <span className="hidden sm:inline">View All Proposals</span>
            <span className="sm:hidden">View All</span>
            <Vote className="w-4 h-4" />
          </Link>
        </div>

        {latestProposals.length === 0 ? (
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-8 text-center">
              <Vote className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No active proposals at the moment. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {latestProposals.map(proposal => {
              const isInactive = !['voting', 'draft', 'proposed'].includes(proposal.status);
              return (
                <Card
                  key={proposal.id}
                  className={`group transition-all duration-300 ${
                    isInactive
                      ? 'bg-slate-800/20 border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 hover:border-orange-500/50 cursor-pointer'
                  }`}
                  onClick={() => !isInactive && window.open(createPageUrl("Voting"), '_self')}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isInactive
                          ? 'bg-slate-700/20 border-slate-700/30'
                          : 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30 group-hover:shadow-lg group-hover:shadow-orange-500/20'
                      }`}>
                        <Vote className={`w-6 h-6 ${isInactive ? 'text-slate-500' : 'text-orange-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold break-words ${
                          isInactive ? 'text-slate-400' : 'text-white group-hover:text-orange-400'
                        }`}>
                          {proposal.title}
                        </h3>
                      </div>
                    </div>

                    <p className={`text-sm mb-4 line-clamp-3 flex-grow ${isInactive ? 'text-slate-500' : 'text-slate-300'}`}>
                      {proposal.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`border text-xs ${proposalCategoryColors[proposal.category]} ${isInactive ? 'opacity-70' : ''}`}>
                          {proposal.category}
                        </Badge>
                        <Badge variant="outline" className={`border text-xs ${statusColors[proposal.status]} ${isInactive ? 'opacity-70' : ''}`}>
                          {proposal.status}
                        </Badge>
                      </div>
                      <div className={`font-semibold ${isInactive ? 'text-slate-500' : 'text-orange-400'}`}>
                        {isInactive ? 'View Details' : 'Vote Now →'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Project Detail Modal */}
      <ProjectDetail
        project={selectedProject}
        isOpen={isProjectDetailOpen}
        onClose={() => {
          setIsProjectDetailOpen(false);
          setSelectedProject(null);
        }}
        onSupport={handleProjectSupport}
        onVote={handleProjectVote}
        onProjectUpdate={handleProjectUpdate}
      />
    </div>
  );
}
