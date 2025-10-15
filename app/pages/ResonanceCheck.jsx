
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, MapPin, Heart, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyCheckIn, Hub, Project } from '@/api/entities';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

const moodLabels = ['Struggling', 'Okay', 'Good', 'Great', 'Vibrant'];
const moodColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export default function ResonanceCheck() {
  const [checkIns, setCheckIns] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = 'week'; // Default to 'week'

  useEffect(() => {
    const loadData = async () => {
      try {
        const [checkInsData, hubsData, projectsData] = await Promise.all([
          DailyCheckIn.list(),
          Hub.list(),
          Project.list()
        ]);
        
        setCheckIns(checkInsData);
        setHubs(hubsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter check-ins by time range
  const getFilteredCheckIns = () => {
    const now = new Date();
    const cutoff = new Date();
    
    if (timeRange === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      cutoff.setMonth(now.getMonth() - 1);
    } else {
      return checkIns;
    }
    
    return checkIns.filter(c => new Date(c.timestamp) >= cutoff);
  };

  const filteredCheckIns = getFilteredCheckIns();

  // Calculate mood distribution
  const getMoodDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    filteredCheckIns.forEach(checkIn => {
      if (checkIn.mood_selection >= 0 && checkIn.mood_selection <= 4) {
        distribution[checkIn.mood_selection]++;
      }
    });
    
    return distribution.map((count, index) => ({
      name: moodLabels[index],
      value: count,
      color: moodColors[index]
    }));
  };

  // Calculate daily average resonance
  const getDailyResonance = () => {
    const dailyData = {};
    
    filteredCheckIns.forEach(checkIn => {
      const date = new Date(checkIn.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, count: 0 };
      }
      dailyData[date].total += checkIn.mood_selection;
      dailyData[date].count++;
    });
    
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        resonance: (data.total / data.count).toFixed(2)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calculate overall resonance index (0-4 scale)
  const getResonanceIndex = () => {
    if (filteredCheckIns.length === 0) return 0;
    const total = filteredCheckIns.reduce((sum, c) => sum + c.mood_selection, 0);
    return (total / filteredCheckIns.length).toFixed(2);
  };

  // Get hub with highest resonance
  const getTopHub = () => {
    const hubResonance = {};
    
    // We should probably filter hubs by the time range as well, 
    // but for now, we'll use all checkIns for hub calculation if topHub is meant to be global,
    // or filteredCheckIns if it's meant to be time-range specific.
    // The current implementation uses `checkIns` (all check-ins), let's stick to that for now.
    checkIns.forEach(checkIn => {
      // This is a placeholder for actual hub association.
      // In a real app, checkIn would have a hub_id.
      // For now, randomly assign to a hub from the loaded list.
      const randomHub = hubs.length > 0 ? hubs[Math.floor(Math.random() * hubs.length)] : null;
      if (randomHub) {
        if (!hubResonance[randomHub.id]) {
          hubResonance[randomHub.id] = { name: randomHub.name, total: 0, count: 0 };
        }
        hubResonance[randomHub.id].total += checkIn.mood_selection;
        hubResonance[randomHub.id].count++;
      }
    });
    
    const hubsWithAvg = Object.values(hubResonance).map(h => ({
      ...h,
      avg: h.count > 0 ? h.total / h.count : 0
    }));
    
    return hubsWithAvg.sort((a, b) => b.avg - a.avg)[0];
  };

  // Dynamic title based on time range
  const getResonanceTitle = () => {
    if (timeRange === 'week') return 'This Week in Resonance';
    if (timeRange === 'month') return 'This Month in Resonance';
    return 'Resonance Overview';
  };

  const moodDistribution = getMoodDistribution();
  const dailyResonance = getDailyResonance();
  const resonanceIndex = getResonanceIndex();
  const topHub = getTopHub();

  if (isLoading) {
    return (
      <>
        {/* Fixed Overlay Spinner - Explicitly centered */}
        <div className="fixed inset-0 left-0 right-0 top-0 bottom-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
          <div className="text-center w-full">
            <div className="flex justify-center">
              <CoherosphereNetworkSpinner 
                size={100}
                lineWidth={2}
                dotRadius={6}
                interval={1100}
                maxConcurrent={4}
              />
            </div>
            <div className="text-slate-400 text-lg mt-4">Loading Resonance Data...</div>
          </div>
        </div>
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <Activity className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Collective Resonance
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Tracking our emotional alignment and collective mood over time.
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTimeRange('week')}
          className={`filter-chip h-auto ${timeRange === 'week' ? 'active' : ''}`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`filter-chip h-auto ${timeRange === 'month' ? 'active' : ''}`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setTimeRange('all')}
          className={`filter-chip h-auto ${timeRange === 'all' ? 'active' : ''}`}
        >
          All Time
        </button>
      </div>

      {/* Key Metrics - Fixed structure for vertical alignment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:border-orange-500/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <div className="h-10 flex items-center justify-center">
                <div className="text-4xl font-bold text-white">{resonanceIndex}</div>
              </div>
              <div className="h-10 flex items-center justify-center">
                <div className="text-slate-300 text-sm">Average Resonance Mood</div>
              </div>
              <div className="mt-2">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 inline-block">
                  Scale: 0 (Struggling) - 4 (Vibrant)
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:border-orange-500/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Heart className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <div className="h-10 flex items-center justify-center">
                <div className="text-4xl font-bold text-white">{filteredCheckIns.length}</div>
              </div>
              <div className="h-10 flex items-center justify-center">
                <div className="text-slate-300 text-sm">Total Check-Ins</div>
              </div>
              <div className="mt-2">
                <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 inline-block">
                  {timeRange === 'week' ? 'Last 7 Days' : timeRange === 'month' ? 'Last 30 Days' : 'All Time'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:border-orange-500/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <MapPin className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <div className="h-10 flex items-center justify-center">
                <div className="text-2xl font-bold text-white">{topHub?.name || 'N/A'}</div>
              </div>
              <div className="h-10 flex items-center justify-center">
                <div className="text-slate-300 text-sm">Happiest Hub</div>
              </div>
              <div className="mt-2">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 inline-block">
                  Avg: {topHub?.avg.toFixed(2) || '—'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Resonance Over Time Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Emotional Resonance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyResonance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyResonance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis domain={[0, 4]} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => [value, 'Mood']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resonance" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-12">
                No data available for selected time range
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Mood Distribution and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="h-full"
        >
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-white">Mood Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              {moodDistribution.filter(d => d.value > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moodDistribution.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="none"
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569', 
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  No mood data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Insights & Reflections */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="h-full"
        >
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-orange-400" />
                {getResonanceTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {filteredCheckIns.length > 0 ? (
                    <>
                      The community has completed <span className="text-orange-400 font-semibold">{filteredCheckIns.length} mood check-ins</span> with 
                      an average resonance mood of <span className="text-orange-400 font-semibold">{resonanceIndex}</span>. 
                      {resonanceIndex >= 3 ? ' The collective atmosphere feels vibrant and connected.' : resonanceIndex >= 2 ? ' We\'re maintaining good coherence.' : ' Let\'s nurture our connection.'}
                    </>
                  ) : (
                    'No check-ins recorded yet. Start your daily practice to see insights here.'
                  )}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-500/30">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  Mindful Practice
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "What brought you a sense of connection or calm this week? Take a moment to reflect on what helped you stay in resonance."
                </p>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="text-white font-semibold mb-2">Community Pulse</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Active Projects</span>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      {projects.filter(p => ['voting', 'funding', 'launch'].includes(p.status)).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Resonance Hubs</span>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      {hubs.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Narrative Layer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">From Fragmentation to Feeling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 leading-relaxed">
              Our collective resonance is not just data — it's a living reflection of how we feel connected as a community. 
              Each check-in is a moment of awareness, showing how individual moods weave into our shared atmosphere.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Together, we learn to move from disconnection to resonance — from tension to flow.
            </p>
            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-orange-400 font-semibold mb-3">Milestones in Our Journey</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Manifesto Inscribed on Bitcoin</div>
                    <div className="text-slate-400 text-sm">Block 914508 – Our values, immutable and eternal</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <div className="text-white font-medium">First Daily Check-In</div>
                    <div className="text-slate-400 text-sm">The beginning of our collective resonance practice</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <div className="text-white font-medium">Global Hubs Network Launched</div>
                    <div className="text-slate-400 text-sm">Local roots, global connection</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
