
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircleGauge, Clock, AlertCircle, RefreshCw, ExternalLink, MousePointerClick, Snail, Rabbit, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachingPolicy } from '@/components/caching/CachingPolicyContext';
import { useCachedData } from '@/components/caching/useCachedData';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import StatCard from '@/components/StatCard';

// Mapping from page paths to domain names
const PAGE_TO_DOMAIN = {
  '/Dashboard': 'dashboard',
  '/Projects': 'projects',
  '/Treasury': 'treasury',
  '/Activity': 'activity',
  '/Voting': 'governance',
  '/Learning': 'learning',
  '/FAQ': 'faq',
  '/Hub': 'hub',
  '/Profile': 'profile',
  '/Messages': 'messages',
  '/Engage': 'engage',
  '/GlobalHubs': 'globalHubs',
  '/Calendar': 'calendar',
  '/Donate': 'donate',
  '/Brand': 'brand',
  '/Chat': 'chat',
  '/CreateProject': 'createProject',
  '/HostEvent': 'hostEvent',
  '/HubResonance': 'hubResonance',
  '/Manifesto': 'manifesto',
  '/Onboarding': 'onboarding',
  '/PerfStats': 'perfStats',
  '/ResonanceAdmin': 'resonanceAdmin',
  '/ResonanceCheck': 'resonanceCheck',
  '/ResourceDetail': 'resourceDetail', // ✅ Added mapping
  '/ShareKnowledge': 'shareKnowledge',
  '/StartCircle': 'startCircle',
  '/Status': 'status',
  '/Terms': 'terms',
  '/UserResonance': 'userResonance',
  '/VideoCall': 'videoCall',
};

export default function PerfStats() {
  const [timeRange, setTimeRange] = useState('24h');
  const [metricTypeFilter, setMetricTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('median');
  const [stats, setStats] = useState({});
  const [expandedItem, setExpandedItem] = useState(null);
  const [recentMeasurements, setRecentMeasurements] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const { setLoading } = useLoading();
  const { getSettingsForDomain } = useCachingPolicy();

  // Use cached data for current user
  const { data: currentUser, isLoading: userLoading } = useCachedData(
    ['perfStats', 'currentUser'],
    () => base44.auth.me(),
    'perfStats'
  );

  // Use cached data for performance metrics
  const { data: metricsResponse, isLoading: metricsLoading, refetch: refetchMetrics } = useCachedData(
    ['perfStats', 'metrics', timeRange, metricTypeFilter],
    async () => {
      const response = await base44.functions.invoke('getPerformanceMetrics', {
        timeRange,
        metricType: metricTypeFilter
      });
      return response.data;
    },
    'perfStats',
    {
      enabled: currentUser?.role === 'admin' // Only fetch if user is admin
    }
  );

  const isLoading = userLoading || metricsLoading;
  const metrics = metricsResponse?.metrics || [];

  // Manage global loading indicator
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Reset expanded items when filters change
  useEffect(() => {
    setRecentMeasurements({});
    setExpandedItem(null);
  }, [timeRange, metricTypeFilter]);

  // Calculate stats when metrics change
  useEffect(() => {
    if (metrics.length > 0) {
      calculateStats(metrics);
    } else {
      setStats({});
    }
  }, [metrics]);

  const calculateStats = (metricsData) => {
    const grouped = {};

    metricsData.forEach(metric => {
      const key = `${metric.page_name}::${metric.metric_type}`;
      if (!grouped[key]) {
        grouped[key] = {
          page_name: metric.page_name,
          metric_type: metric.metric_type,
          values: []
        };
      }
      grouped[key].values.push(metric.value_ms);
    });

    const statsObj = {};
    Object.keys(grouped).forEach(key => {
      const values = grouped[key].values.sort((a, b) => a - b);
      const count = values.length;
      
      if (count === 0) return;

      const min = values[0];
      const max = values[count - 1];
      const median = count % 2 === 0 
        ? (values[count / 2 - 1] + values[count / 2]) / 2
        : values[Math.floor(count / 2)];
      const avg = values.reduce((sum, v) => sum + v, 0) / count;

      statsObj[key] = {
        ...grouped[key],
        min,
        max,
        median,
        avg,
        count
      };
    });

    setStats(statsObj);
  };

  const getMetricColor = (value, metricType) => {
    if (metricType === 'frontend_load') {
      if (value < 500) return 'text-green-400';
      if (value < 1000) return 'text-yellow-400';
      if (value < 2000) return 'text-orange-400';
      return 'text-red-400';
    } else if (metricType === 'backend_function') {
      if (value < 100) return 'text-green-400';
      if (value < 500) return 'text-yellow-400';
      if (value < 1000) return 'text-orange-400';
      return 'text-red-400';
    }
    // Default fallback
    if (value < 100) return 'text-green-400';
    if (value < 500) return 'text-yellow-400';
    if (value < 1000) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMetricBadge = (value, metricType) => {
    if (metricType === 'frontend_load') {
      if (value < 500) return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', label: 'Fast' };
      if (value < 1000) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', label: 'Good' };
      if (value < 2000) return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300', label: 'Slow' };
      return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', label: 'Very Slow' };
    } else if (metricType === 'backend_function') {
      if (value < 100) return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', label: 'Fast' };
      if (value < 500) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', label: 'Good' };
      if (value < 1000) return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300', label: 'Slow' };
      return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', label: 'Very Slow' };
    }
    // Default fallback
    if (value < 100) return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', label: 'Fast' };
    if (value < 500) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', label: 'Good' };
    if (value < 1000) return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300', label: 'Slow' };
    return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', label: 'Very Slow' };
  };

  const getTimelineData = () => {
    let filteredMetrics = metrics;
    
    if (metricTypeFilter !== 'all') {
      filteredMetrics = metrics.filter(m => m.metric_type === metricTypeFilter);
    }
    
    if (filteredMetrics.length === 0) return [];

    const byDate = {};
    filteredMetrics.forEach(metric => {
      const date = format(startOfDay(parseISO(metric.timestamp)), 'yyyy-MM-dd');
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(metric.value_ms);
    });

    const timelineData = Object.keys(byDate)
      .sort()
      .map(date => {
        const values = byDate[date].sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        const median = values.length % 2 === 0
          ? (values[mid - 1] + values[mid]) / 2
          : values[mid];
        
        return {
          date: format(parseISO(date), 'MMM dd'),
          median: Math.round(median),
          count: values.length
        };
      });

    return timelineData;
  };

  const timelineData = getTimelineData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{label}</p>
          <p className="text-orange-400 text-sm">
            Median: {payload[0].value}ms
          </p>
          {payload[0].payload.count && (
            <p className="text-slate-400 text-xs mt-1">
              {payload[0].payload.count} measurements
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const sortedStats = Object.values(stats).sort((a, b) => {
    switch(sortBy) {
      case 'min':
        return b.min - a.min;
      case 'max':
        return b.max - a.max;
      case 'avg':
        return b.avg - a.avg;
      case 'median':
      default:
        return b.median - a.median;
    }
  });

  // Filter stats based on search query
  const filteredStats = sortedStats.filter(stat => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const pageName = stat.page_name.toLowerCase();
    const metricType = stat.metric_type.toLowerCase();
    const pageUrl = createPageUrl(stat.page_name).toLowerCase();
    
    return pageName.includes(query) || 
           metricType.includes(query) || 
           pageUrl.includes(query);
  });

  const getLatestMeasurements = (pageName, metricType) => {
    const key = `${pageName}::${metricType}`;
    
    if (recentMeasurements[key]) {
      return recentMeasurements[key];
    }

    const filtered = metrics.filter(m => 
      m.page_name === pageName && m.metric_type === metricType
    );

    const sorted = filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const latest = sorted.slice(0, 10);

    setRecentMeasurements(prev => ({
      ...prev,
      [key]: latest
    }));

    return latest;
  };

  const toggleExpand = (pageName, metricType) => {
    const key = `${pageName}::${metricType}`;
    if (expandedItem === key) {
      setExpandedItem(null);
    } else {
      setExpandedItem(key);
      if (!recentMeasurements[key]) {
        getLatestMeasurements(pageName, metricType);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'dd.MM.yyyy HH:mm:ss');
    } catch (error) {
      return timestamp;
    }
  };

  const getCachePreset = (pageUrl) => {
    const domain = PAGE_TO_DOMAIN[pageUrl];
    if (!domain) return null;
    
    const settings = getSettingsForDomain(domain);
    return settings?.preset || 'Unknown';
  };

  const getPresetBadgeClass = (preset) => {
    switch(preset) {
      case 'Live':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Fresh':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Balanced':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Archive':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Custom':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {currentUser?.role !== 'admin' ? (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">This area is restricted to administrators only.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <CircleGauge className="w-12 h-12 text-orange-500 flex-shrink-0" />
                <div>
                  <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                    Performance Statistics
                  </h1>
                  <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
                </div>
              </div>

              {currentUser && currentUser.role === 'admin' && (
                <Button
                  onClick={() => refetchMetrics()}
                  disabled={isLoading}
                  variant="outline"
                  className="btn-secondary-coherosphere"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Monitor page load times and identify performance bottlenecks across the app.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex gap-2">
              <Button
                onClick={() => setTimeRange('24h')}
                variant="ghost"
                className={`filter-chip h-auto ${timeRange === '24h' ? 'active' : ''}`}
              >
                Last 24 Hours
              </Button>
              <Button
                onClick={() => setTimeRange('7d')}
                variant="ghost"
                className={`filter-chip h-auto ${timeRange === '7d' ? 'active' : ''}`}
              >
                Last 7 Days
              </Button>
              <Button
                onClick={() => setTimeRange('30d')}
                variant="ghost"
                className={`filter-chip h-auto ${timeRange === '30d' ? 'active' : ''}`}
              >
                Last 30 Days
              </Button>
              <Button
                onClick={() => setTimeRange('all')}
                variant="ghost"
                className={`filter-chip h-auto ${timeRange === 'all' ? 'active' : ''}`}
              >
                All Time
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setMetricTypeFilter('all')}
                variant="ghost"
                className={`filter-chip h-auto ${metricTypeFilter === 'all' ? 'active' : ''}`}
              >
                All Types
              </Button>
              <Button
                onClick={() => setMetricTypeFilter('frontend_load')}
                variant="ghost"
                className={`filter-chip h-auto ${metricTypeFilter === 'frontend_load' ? 'active' : ''}`}
              >
                Frontend Load
              </Button>
              <Button
                onClick={() => setMetricTypeFilter('backend_function')}
                variant="ghost"
                className={`filter-chip h-auto ${metricTypeFilter === 'backend_function' ? 'active' : ''}`}
              >
                Backend Functions
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-slate-400 text-sm flex items-center mr-2">Sort by:</span>
            <Button
              onClick={() => setSortBy('median')}
              variant="ghost"
              className={`filter-chip h-auto ${sortBy === 'median' ? 'active' : ''}`}
            >
              Median
            </Button>
            <Button
              onClick={() => setSortBy('min')}
              variant="ghost"
              className={`filter-chip h-auto ${sortBy === 'min' ? 'active' : ''}`}
            >
              Min
            </Button>
            <Button
              onClick={() => setSortBy('avg')}
              variant="ghost"
              className={`filter-chip h-auto ${sortBy === 'avg' ? 'active' : ''}`}
            >
              Average
            </Button>
            <Button
              onClick={() => setSortBy('max')}
              variant="ghost"
              className={`filter-chip h-auto ${sortBy === 'max' ? 'active' : ''}`}
            >
              Max
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{metrics.length}</div>
                <div className="text-slate-400 text-sm">Total Measurements</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <MousePointerClick className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{Object.keys(stats).length}</div>
                <div className="text-slate-400 text-sm">Tracked Endpoints</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <Snail className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">
                  {sortedStats.length > 0 ? Math.round(sortedStats[0][sortBy]) : '—'}ms
                </div>
                <div className="text-slate-400 text-sm">Slowest {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <Rabbit className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">
                  {sortedStats.length > 0 ? Math.round(sortedStats[sortedStats.length - 1][sortBy]) : '—'}ms
                </div>
                <div className="text-slate-400 text-sm">Fastest {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</div>
              </CardContent>
            </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Timeline</CardTitle>
                <p className="text-slate-400 text-sm mt-1">
                  Daily median performance time for selected metric type across all pages
                </p>
              </CardHeader>
              <CardContent>
                {timelineData.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No timeline data available for the selected filters. Waiting for more measurements over time.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="median"
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={{ fill: '#f97316', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Median Load Time"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Thresholds Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mb-8"
          >
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Performance Thresholds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Frontend Load Thresholds */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <h3 className="text-white font-semibold">Frontend Page Loads</h3>
                      <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                        Core Web Vitals aligned
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-green-500/10 border border-green-500/20">
                        <span className="text-green-300 font-medium">Fast</span>
                        <span className="text-slate-400 font-mono">&lt; 500ms</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-yellow-300 font-medium">Good</span>
                        <span className="text-slate-400 font-mono">500–1000ms</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-orange-500/10 border border-orange-500/20">
                        <span className="text-orange-300 font-medium">Slow</span>
                        <span className="text-slate-400 font-mono">1000–2000ms</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-red-500/10 border border-red-500/20">
                        <span className="text-red-300 font-medium">Very Slow</span>
                        <span className="text-slate-400 font-mono">≥ 2000ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Backend Function Thresholds */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <h3 className="text-white font-semibold">Backend Functions</h3>
                      <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                        API response times
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-green-500/10 border border-green-500/20">
                        <span className="text-green-300 font-medium">Fast</span>
                        <span className="text-slate-400 font-mono">&lt; 100ms</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-yellow-300 font-medium">Good</span>
                        <span className="text-slate-400 font-mono">100–500ms</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-orange-500/10 border border-orange-500/20">
                        <span className="text-orange-300 font-medium">Slow</span>
                        <span className="text-slate-400 font-mono">500–1000ms</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-3 rounded bg-red-500/10 border border-red-500/20">
                        <span className="text-red-300 font-medium">Very Slow</span>
                        <span className="text-slate-400 font-mono">≥ 1000ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-white">Performance Breakdown</CardTitle>
                    <p className="text-slate-400 text-sm mt-1">
                      Click on an item to see the latest 10 measurements
                    </p>
                  </div>
                  
                  {/* Search Field */}
                  <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by page name or metric type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStats.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    {searchQuery ? (
                      <>
                        <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p>No results found for "{searchQuery}"</p>
                        <Button
                          onClick={() => setSearchQuery('')}
                          variant="outline"
                          className="mt-4 btn-secondary-coherosphere"
                        >
                          Clear search
                        </Button>
                      </>
                    ) : (
                      'No performance data available for the selected filters.'
                    )}
                  </div>
                ) : (
                  <>
                    {searchQuery && (
                      <div className="mb-4 text-sm text-slate-400">
                        Found {filteredStats.length} result{filteredStats.length !== 1 ? 's' : ''} for "{searchQuery}"
                      </div>
                    )}
                    <div className="space-y-2">
                      {filteredStats.map((stat, index) => {
                        const badgeInfo = getMetricBadge(stat.median, stat.metric_type);
                        const pageUrl = createPageUrl(stat.page_name);
                        const itemKey = `${stat.page_name}::${stat.metric_type}`;
                        const isExpanded = expandedItem === itemKey;
                        const measurements = isExpanded ? getLatestMeasurements(stat.page_name, stat.metric_type) : [];
                        const cachePreset = getCachePreset(pageUrl);
                        
                        return (
                          <motion.div
                            key={itemKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="bg-slate-900/50 rounded-lg border border-slate-700 hover:border-orange-500/50 transition-all overflow-hidden">
                              <button
                                onClick={() => toggleExpand(stat.page_name, stat.metric_type)}
                                className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <Link 
                                        to={pageUrl}
                                        className="text-white font-semibold text-lg hover:text-orange-400 transition-colors inline-flex items-center gap-2 group font-mono"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {pageUrl}
                                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </Link>
                                      {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-orange-400" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className="bg-slate-700 text-slate-300">
                                        {stat.metric_type}
                                      </Badge>
                                      <Badge className={`${badgeInfo.bg} ${badgeInfo.text} border ${badgeInfo.border}`}>
                                        {badgeInfo.label}
                                      </Badge>
                                      {cachePreset && (
                                        <Badge className={getPresetBadgeClass(cachePreset)}>
                                          {cachePreset}
                                        </Badge>
                                      )}
                                      <span className="text-slate-500 text-sm">{stat.count} measurements</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                    <div className={`text-2xl font-bold ${getMetricColor(stat.min, stat.metric_type)}`}>
                                      {Math.round(stat.min)}ms
                                    </div>
                                    <div className="text-slate-400 text-xs mt-1">Min</div>
                                  </div>

                                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                    <div className={`text-2xl font-bold ${getMetricColor(stat.median, stat.metric_type)}`}>
                                      {Math.round(stat.median)}ms
                                    </div>
                                    <div className="text-slate-400 text-xs mt-1">Median</div>
                                  </div>

                                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                    <div className={`text-2xl font-bold ${getMetricColor(stat.avg, stat.metric_type)}`}>
                                      {Math.round(stat.avg)}ms
                                    </div>
                                    <div className="text-slate-400 text-xs mt-1">Average</div>
                                  </div>

                                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                    <div className={`text-2xl font-bold ${getMetricColor(stat.max, stat.metric_type)}`}>
                                      {Math.round(stat.max)}ms
                                    </div>
                                    <div className="text-slate-400 text-xs mt-1">Max</div>
                                  </div>
                                </div>
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="border-t border-slate-700"
                                  >
                                    <div className="p-4 bg-slate-900/30">
                                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-orange-400" />
                                        Latest 10 Measurements
                                      </h4>
                                      {measurements.length === 0 ? (
                                        <p className="text-slate-400 text-sm">No measurements found for this period.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {measurements.map((measurement, idx) => (
                                            <div 
                                              key={measurement.id || idx}
                                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                                            >
                                              <div className="flex items-center gap-3 mb-1 sm:mb-0">
                                                <span className="text-slate-500 text-xs font-mono">#{idx + 1}</span>
                                                <span className="text-slate-300 text-sm font-mono">
                                                  {formatTimestamp(measurement.timestamp)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                {measurement.metadata?.error && (
                                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                                    Error
                                                  </Badge>
                                                )}
                                                <span className={`text-lg font-bold font-mono ${getMetricColor(measurement.value_ms, stat.metric_type)}`}>
                                                  {Math.round(measurement.value_ms)}ms
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
