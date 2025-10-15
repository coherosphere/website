
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Info,
  AlertCircle,
  Calendar as CalendarIcon,
  Shield,
  HelpCircle,
  Copy,
  Users,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfYear } from 'date-fns';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachedData } from '@/components/caching/useCachedData';

export default function HubResonance() {
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingHub, setViewingHub] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [resonanceScore, setResonanceScore] = useState(null);
  const [snapshots, setSnapshots] = useState([]);

  // Filter states
  const [timeRange, setTimeRange] = useState('30d');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Conversations cache for loading Nostr addresses
  const [conversationsCache, setConversationsCache] = useState({});

  const { setLoading } = useLoading();

  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  const hubIdParam = urlParams.get('hubId');

  // Load current user first
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setIsAdmin(user.role === 'admin');
      } catch (err) {
        console.error('Error loading current user:', err);
      }
    };
    loadCurrentUser();
  }, []);

  // Load all hubs using useCachedData - removed currentUser dependency
  const { data: allHubs = [], isLoading: hubsLoading, error: hubsError } = useCachedData(
    ['hubResonance', 'hubs'],
    () => base44.entities.Hub.list(),
    'hubResonance',
    {
      enabled: !!hubIdParam, // Only check if hubId exists
      staleTime: 5 * 60 * 1000
    }
  );

  // Set viewing hub when hubs are loaded and handle errors
  useEffect(() => {
    if (!hubIdParam) {
      setError('No hub ID provided. Please select a hub from the Global Hubs page.');
      setViewingHub(null); // Ensure viewingHub is null
      return;
    }

    if (hubsLoading) {
      // Still loading, don't set error yet
      return;
    }

    if (hubsError) {
      console.error('Error loading hubs:', hubsError);
      setError('Failed to load hub data. Please try again.');
      setViewingHub(null);
      return;
    }

    // Check if hubs were loaded but the list is empty
    if (allHubs.length === 0) {
      setError('Hub not found or no hubs available. Please select a valid hub.');
      setViewingHub(null);
      return;
    }

    const targetHub = allHubs.find(h => h.id === hubIdParam);
    if (targetHub) {
      setViewingHub(targetHub);
      setError(null); // Clear any previous errors if hub is found
    } else {
      setError('Hub not found. Please select a valid hub.');
      setViewingHub(null);
    }
  }, [hubIdParam, allHubs, hubsLoading, hubsError]);

  // Load resonance score via function call
  useEffect(() => {
    const loadResonanceScore = async () => {
      if (!hubIdParam || !viewingHub) { // Only load if hubId and viewingHub are available
        setResonanceScore(null); // Reset score if hubIdParam is missing
        setSnapshots([]);
        return;
      }

      try {
        const scoreResponse = await base44.functions.invoke('getResonanceScore', {
          entity_type: 'hub',
          entity_id: hubIdParam
        });

        if (scoreResponse.data && scoreResponse.data.exists) {
          setResonanceScore(scoreResponse.data);
          setSnapshots(scoreResponse.data.sparkline || []);
        } else {
          setResonanceScore(null);
          setSnapshots([]);
        }
      } catch (err) {
        console.error('Error loading resonance score:', err);
        // Do not set global error here, as the hub loading error takes precedence
      }
    };

    loadResonanceScore();
  }, [hubIdParam, viewingHub]);

  // Load all events for this hub using useCachedData
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useCachedData(
    ['hubResonance', 'events', hubIdParam],
    () => base44.entities.ResonanceEvent.filter({
      entity_type: 'hub',
      entity_id: hubIdParam
    }),
    'hubResonance',
    {
      enabled: !!hubIdParam,
      staleTime: 60 * 1000 // 1 minute stale time for events
    }
  );

  // Sync loading state with global loading context
  const isLoading = hubsLoading || eventsLoading;
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Handle events specific errors (if no more critical hub error is present)
  useEffect(() => {
    if (!error && eventsError) { // Only set events error if no other error is currently active
      console.error('Error loading resonance events:', eventsError);
      setError('Failed to load resonance events. Please try again.');
    }
  }, [eventsError, error]); // Added 'error' to dependencies to react when previous error clears

  // Load conversation details to get recipient npub if not in metadata
  const getRecipientNpub = async (event) => {
    if (event.metadata?.recipient_npub) {
      return event.metadata.recipient_npub;
    }

    if (conversationsCache[event.entity_id]) {
      return conversationsCache[event.entity_id];
    }

    try {
      const conversations = await base44.entities.Conversation.filter({
        id: event.entity_id
      });

      if (conversations.length > 0) {
        const conv = conversations[0];
        const recipientNpub = conv.user_a_npub || conv.user_b_npub;

        setConversationsCache(prev => ({
          ...prev,
          [event.entity_id]: recipientNpub
        }));

        return recipientNpub;
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }

    return null;
  };

  // Calculate breakdown from events
  const getBreakdown = () => {
    if (!events.length) return {};

    const categories = {
      Projects: ['PROJECT_SUPPORT', 'PROJECT_CREATED', 'PROJECT_MILESTONE'],
      Knowledge: ['KNOWLEDGE_PUBLISHED', 'KNOWLEDGE_REVIEWED'],
      Governance: ['GOVERNANCE_VOTE', 'GOVERNANCE_PROPOSAL'],
      Events: ['EVENT_HOSTED', 'LEARNING_CIRCLE_HOSTED'],
      Messaging: ['MESSAGE_SENT', 'MESSAGE_TRUSTED_THREAD'],
      Care: ['COMMUNITY_CARE', 'DAILY_CHECKIN_COMPLETED'],
      Treasury: ['TREASURY_CONTRIBUTION'],
      Nostr: ['NOSTR_SIGNAL', 'NOSTR_POST'],
      Development: ['DEVELOPMENT_MERGE']
    };

    const breakdown = {};
    let total = 0;

    events.forEach(event => {
      if (event.status !== 'approved') return;

      const category = Object.keys(categories).find(cat =>
        categories[cat].includes(event.action_type)
      ) || 'Other';

      if (!breakdown[category]) breakdown[category] = 0;
      breakdown[category] += event.magnitude * (event.alignment_score || 0.5);
      total += event.magnitude * (event.alignment_score || 0.5);
    });

    Object.keys(breakdown).forEach(key => {
      breakdown[key] = ((breakdown[key] / total) * 100).toFixed(1);
    });

    return breakdown;
  };

  // Filter events
  const getFilteredEvents = () => {
    let filtered = [...events];

    // Time range filter
    const now = new Date();
    let cutoffDate = now;
    switch (timeRange) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case '180d':
        cutoffDate = subDays(now, 180);
        break;
      case 'ytd':
        cutoffDate = startOfYear(now);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0);
    }

    filtered = filtered.filter(e => new Date(e.timestamp) >= cutoffDate);

    // Action type filter
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.action_type === actionTypeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      const categoryMap = {
        projects: ['PROJECT_SUPPORT', 'PROJECT_CREATED', 'PROJECT_MILESTONE'],
        knowledge: ['KNOWLEDGE_PUBLISHED', 'KNOWLEDGE_REVIEWED'],
        governance: ['GOVERNANCE_VOTE', 'GOVERNANCE_PROPOSAL'],
        events: ['EVENT_HOSTED', 'LEARNING_CIRCLE_HOSTED'],
        messaging: ['MESSAGE_SENT', 'MESSAGE_TRUSTED_THREAD'],
        care: ['COMMUNITY_CARE', 'DAILY_CHECKIN_COMPLETED'],
        treasury: ['TREASURY_CONTRIBUTION'],
        nostr: ['NOSTR_SIGNAL', 'NOSTR_POST'],
        development: ['DEVELOPMENT_MERGE']
      };
      filtered = filtered.filter(e => categoryMap[categoryFilter]?.includes(e.action_type));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.action_type.toLowerCase().includes(query) ||
        JSON.stringify(e.metadata || {}).toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case 'resonance-desc':
        filtered.sort((a, b) => (b.magnitude * b.alignment_score) - (a.magnitude * a.alignment_score));
        break;
      case 'resonance-asc':
        filtered.sort((a, b) => (a.magnitude * a.alignment_score) - (b.magnitude * a.alignment_score));
        break;
    }

    return filtered;
  };

  const filteredEvents = getFilteredEvents();
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Prepare chart data with smoothing always enabled
  const getChartData = () => {
    if (!snapshots.length) return [];

    const now = new Date();
    let cutoffDate = now;
    switch (timeRange) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case '180d':
        cutoffDate = subDays(now, 180);
        break;
      case 'ytd':
        cutoffDate = startOfYear(now);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0);
    }

    let data = snapshots
      .filter(s => new Date(s.date) >= cutoffDate)
      .map(s => ({
        date: format(new Date(s.date), 'MMM dd'),
        score: s.score,
        intensity: s.intensity
      }));

    // Always apply smoothing
    if (data.length > 7) {
      const smoothed = [];
      for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - 3);
        const end = Math.min(data.length, i + 4);
        const window = data.slice(start, end);
        const avg = window.reduce((sum, d) => sum + d.score, 0) / window.length;
        smoothed.push({ ...data[i], score: avg });
      }
      data = smoothed;
    }

    return data;
  };

  const chartData = getChartData();
  const breakdown = getBreakdown();

  // Custom Tooltip for Chart
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{label}</p>
          <p className="text-orange-400 text-sm">
            Score: {payload[0].value.toFixed(2)}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Daily Snapshot (End-of-Day)
          </p>
        </div>
      );
    }
    return null;
  };

  // Action type labels
  const actionTypeLabels = {
    PROJECT_SUPPORT: 'Project Supported',
    PROJECT_CREATED: 'Project Created',
    PROJECT_MILESTONE: 'Project Milestone',
    GOVERNANCE_VOTE: 'Governance Vote',
    GOVERNANCE_PROPOSAL: 'Proposal Created',
    KNOWLEDGE_PUBLISHED: 'Knowledge Published',
    KNOWLEDGE_REVIEWED: 'Knowledge Reviewed',
    LEARNING_CIRCLE_HOSTED: 'Learning Circle Hosted',
    EVENT_HOSTED: 'Event Hosted',
    COMMUNITY_CARE: 'Community Care',
    MESSAGE_SENT: 'Message Sent',
    MESSAGE_TRUSTED_THREAD: 'Trusted Thread',
    NOSTR_SIGNAL: 'Nostr Signal',
    NOSTR_POST: 'Nostr Post',
    TREASURY_CONTRIBUTION: 'Treasury Contribution',
    DEVELOPMENT_MERGE: 'Development Merge',
    DAILY_CHECKIN_COMPLETED: 'Daily Check-In'
  };

  // Helper component for Nostr pubkey display
  const NostrPubkeyDisplay = ({ pubkey }) => {
    if (!pubkey) return null;
    const shortPubkey = `${pubkey.substring(0, 10)}...${pubkey.substring(pubkey.length - 8)}`;

    const handleCopy = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(pubkey);
    };

    return (
      <div className="flex items-center gap-1 mt-1">
        <code className="text-xs text-slate-400 font-mono">{shortPubkey}</code>
        <button
          onClick={handleCopy}
          className="text-slate-500 hover:text-orange-400 transition-colors"
          title="Copy Nostr pubkey"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Action', 'Context', 'Resonance (Initial Contribution)', 'Alignment', 'Category', 'Actor', 'Version', 'Status'];
    const note = ['# Note: Individual event resonance values represent initial contributions before decay and complex weighting rules are applied.'];
    const rows = filteredEvents.map(event => {
      let contextText = event.entity_id.substring(0, 8);
      if (event.action_type === 'GOVERNANCE_VOTE' && event.metadata?.proposal_title) {
        contextText = event.metadata.proposal_title;
      } else if (event.action_type === 'EVENT_HOSTED' && event.metadata?.event_title) {
        contextText = event.metadata.event_title;
      } else if (event.action_type === 'LEARNING_CIRCLE_HOSTED' && event.metadata?.circle_topic) {
        contextText = event.metadata.circle_topic;
      } else if (event.metadata?.project_title) {
        contextText = event.metadata.project_title;
      } else if (event.metadata?.title) {
        contextText = event.metadata.title;
      }

      if (['MESSAGE_SENT', 'MESSAGE_TRUSTED_THREAD'].includes(event.action_type)) {
        const npub = event.metadata?.recipient_npub || conversationsCache[event.entity_id];
        if (npub && npub !== 'loading' && npub !== 'error') {
          contextText = `Message to: ${npub}`;
        }
      }

      return [
        format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        actionTypeLabels[event.action_type] || event.action_type,
        contextText,
        (event.magnitude * event.alignment_score).toFixed(2),
        (event.alignment_score * 100).toFixed(0) + '%',
        getCategoryForAction(event.action_type),
        event.actor_user_id || 'System',
        `v${event.weight_version}`,
        event.status
      ];
    });

    const csv = [note.join(','), headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resonance-transactions-${viewingHub?.name || 'hub'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const getCategoryForAction = (actionType) => {
    const categories = {
      Projects: ['PROJECT_SUPPORT', 'PROJECT_CREATED', 'PROJECT_MILESTONE'],
      Knowledge: ['KNOWLEDGE_PUBLISHED', 'KNOWLEDGE_REVIEWED'],
      Governance: ['GOVERNANCE_VOTE', 'GOVERNANCE_PROPOSAL'],
      Events: ['EVENT_HOSTED', 'LEARNING_CIRCLE_HOSTED'],
      Messaging: ['MESSAGE_SENT', 'MESSAGE_TRUSTED_THREAD'],
      Care: ['COMMUNITY_CARE', 'DAILY_CHECKIN_COMPLETED'],
      Treasury: ['TREASURY_CONTRIBUTION'],
      Nostr: ['NOSTR_SIGNAL', 'NOSTR_POST'],
      Development: ['DEVELOPMENT_MERGE']
    };

    return Object.keys(categories).find(cat => categories[cat].includes(actionType)) || 'Other';
  };

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 left-0 right-0 top-0 bottom-0">
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
            <div className="text-slate-400 text-lg mt-4">Loading Hub Resonance Data...</div>
          </div>
        </div>

        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <MapPin className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Hub Resonance
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Hub resonance journey — contributions, alignment, and impact over time.
        </p>
      </div>

      {/* Admin Banner */}
      {isAdmin && (
        <Alert className="mb-6 bg-purple-500/10 border-purple-500/30">
          <Shield className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-purple-400 flex items-center justify-between">
            <span>Viewing as Admin — {viewingHub?.name}'s Resonance</span>
            <Link to={createPageUrl('ResonanceAdmin')}>
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                Open Resonance Control
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Hub Header with KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Hub Icon & Info */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center resonance-glow border-2 border-orange-400/50">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{viewingHub?.name}</h2>
                  <p className="text-slate-400 text-sm">{viewingHub?.location}</p>
                  {viewingHub?.description && (
                    <p className="text-slate-500 text-xs mt-1 max-w-md">{viewingHub.description}</p>
                  )}
                </div>
              </div>

              {/* KPIs */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-400">
                    {Math.round(resonanceScore?.score_total || 0)}
                  </div>
                  <div className="text-slate-400 text-sm">Total Resonance</div>
                </div>
                <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(resonanceScore?.score_7d || 0)}
                  </div>
                  <div className="text-slate-400 text-sm">7d</div>
                </div>
                <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(resonanceScore?.score_30d || 0)}
                  </div>
                  <div className="text-slate-400 text-sm">30d</div>
                </div>
                <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    {(resonanceScore?.intensity || 0) >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <div className="text-2xl font-bold text-white">
                      {Math.abs(resonanceScore?.intensity || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-slate-400 text-sm">Trend</div>
                </div>
              </div>
            </div>

            {/* Additional Hub Stats */}
            <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Users className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{viewingHub?.member_count || 0}</div>
                <div className="text-slate-400 text-xs">Members</div>
              </div>
              <div className="text-center">
                <Lightbulb className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{viewingHub?.active_projects || 0}</div>
                <div className="text-slate-400 text-xs">Active Projects</div>
              </div>
              <div className="text-center">
                <CalendarIcon className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{events.filter(e => e.action_type === 'EVENT_HOSTED').length}</div>
                <div className="text-slate-400 text-xs">Events Hosted</div>
              </div>
              <div className="text-center">
                <Info className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{events.length}</div>
                <div className="text-slate-400 text-xs">Total Transactions</div>
              </div>
            </div>

            {/* Breakdown */}
            {Object.keys(breakdown).length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-white font-semibold mb-3">Contribution Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(breakdown).map(([category, percentage]) => (
                    <Badge
                      key={category}
                      className="bg-orange-500/20 text-orange-300 border-orange-500/30"
                    >
                      {category}: {percentage}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Explainer Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <Info className="w-8 h-8 text-white flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-3">How Hub Resonance Works</h3>
              <ul className="space-y-2 text-white/90 text-sm leading-relaxed">
                <li>• <strong>What:</strong> Hub resonance reflects the collective impact and activity within this local community space.</li>
                <li>• <strong>How:</strong> Aggregated from all actions taken by hub members and events hosted at this hub.</li>
                <li>• <strong>Influence:</strong> Projects launched, events hosted, knowledge shared, and community care activities contribute to hub resonance.</li>
                <li>• <strong>Growth:</strong> A thriving hub shows sustained resonance through diverse, aligned community contributions over time.</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Time Range Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setTimeRange('7d')}
            variant="ghost"
            className={`filter-chip h-auto ${timeRange === '7d' ? 'active' : ''}`}
          >
            7 Days
          </Button>
          <Button
            onClick={() => setTimeRange('30d')}
            variant="ghost"
            className={`filter-chip h-auto ${timeRange === '30d' ? 'active' : ''}`}
          >
            30 Days
          </Button>
          <Button
            onClick={() => setTimeRange('90d')}
            variant="ghost"
            className={`filter-chip h-auto ${timeRange === '90d' ? 'active' : ''}`}
          >
            90 Days
          </Button>
          <Button
            onClick={() => setTimeRange('180d')}
            variant="ghost"
            className={`filter-chip h-auto ${timeRange === '180d' ? 'active' : ''}`}
          >
            180 Days
          </Button>
          <Button
            onClick={() => setTimeRange('ytd')}
            variant="ghost"
            className={`filter-chip h-auto ${timeRange === 'ytd' ? 'active' : ''}`}
          >
            Year to Date
          </Button>
          <Button
            onClick={() => setTimeRange('all')}
            variant="ghost"
            className={`filter-chip h-auto ${timeRange === 'all' ? 'active' : ''}`}
          >
            All Time
          </Button>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-8"
      >
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-white">Resonance Timeline</CardTitle>
              <TooltipProvider>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-600 max-w-xs">
                    <p className="text-sm text-slate-300">
                      Shows daily snapshots of hub resonance score at end-of-day.
                      The timeline is smoothed for better trend visibility.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ fill: '#f97316', r: 4 }}
                    name="Resonance"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-12">
                No timeline data available for selected range
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <CardTitle className="text-white">Resonance Transactions</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="btn-secondary-coherosphere"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="knowledge">Knowledge</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="messaging">Messaging</SelectItem>
                  <SelectItem value="care">Care</SelectItem>
                  <SelectItem value="treasury">Treasury</SelectItem>
                  <SelectItem value="nostr">Nostr</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="resonance-desc">Resonance (High)</SelectItem>
                  <SelectItem value="resonance-asc">Resonance (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Table */}
            {paginatedEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                {events.length === 0 ? (
                  <>
                    <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p>No resonance transactions yet for this hub.</p>
                    <p className="text-sm mt-2">Hub activity will generate resonance over time!</p>
                  </>
                ) : (
                  <p>No transactions match your filters.</p>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/30 border-b border-slate-700">
                      <tr className="text-left text-slate-300 text-sm">
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Context</th>
                        <th className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>Resonance</span>
                            <TooltipProvider>
                              <UiTooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-800 border-slate-600 max-w-sm">
                                  <p className="text-xs text-slate-300">
                                    This value represents the initial, unweighted contribution of this event
                                    before decay and complex weighting rules are applied.
                                  </p>
                                </TooltipContent>
                              </UiTooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                        <th className="p-3 text-right">Alignment</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Actor</th>
                        <th className="p-3">Version</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEvents.map((event, index) => {
                        let contextText = event.entity_id.substring(0, 8);
                        let contextElement = null;
                        let nostrPubkey = null;

                        if (event.action_type === 'GOVERNANCE_VOTE' && event.metadata?.proposal_title) {
                          contextText = event.metadata.proposal_title;
                        } else if (event.action_type === 'EVENT_HOSTED' && event.metadata?.event_title) {
                          contextText = event.metadata.event_title;
                        } else if (event.action_type === 'LEARNING_CIRCLE_HOSTED' && event.metadata?.circle_topic) {
                          contextText = event.metadata.circle_topic;
                        } else if (event.metadata?.project_title) {
                          contextText = event.metadata.project_title;
                        } else if (event.metadata?.title) {
                          contextText = event.metadata.title;
                        }

                        // Check for Nostr Pubkey display
                        if (['MESSAGE_SENT', 'MESSAGE_TRUSTED_THREAD'].includes(event.action_type)) {
                          nostrPubkey = event.metadata?.recipient_npub || conversationsCache[event.entity_id];

                          if (nostrPubkey && nostrPubkey !== 'loading' && nostrPubkey !== 'error') {
                            contextElement = (
                              <div>
                                <div className="text-slate-400">Message to:</div>
                                <NostrPubkeyDisplay pubkey={nostrPubkey} />
                              </div>
                            );
                          } else if (nostrPubkey === 'loading') {
                            contextElement = (
                              <div>
                                <div className="text-slate-400">Message to:</div>
                                <div className="text-slate-500 text-xs italic">Loading...</div>
                              </div>
                            );
                          } else if (nostrPubkey === 'error') {
                            contextElement = (
                              <div>
                                <div className="text-slate-400">Message to:</div>
                                <div className="text-red-400 text-xs italic">Failed to load</div>
                              </div>
                            );
                          } else {
                            contextElement = (
                              <div>
                                <div className="text-slate-400">Message to:</div>
                                <div className="text-slate-500 text-xs italic">Loading...</div>
                              </div>
                            );
                            getRecipientNpub(event);
                          }
                        }

                        return (
                          <tr
                            key={event.id}
                            className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="p-3 text-slate-300 text-sm">
                              {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="p-3 text-white font-medium">
                              {actionTypeLabels[event.action_type] || event.action_type}
                            </td>
                            <td className="p-3 text-slate-400 text-sm">
                              {contextElement || contextText}
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-orange-400 font-semibold">
                                +{(event.magnitude * event.alignment_score).toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-slate-300">
                                {(event.alignment_score * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-slate-700 text-slate-300">
                                {getCategoryForAction(event.action_type)}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-slate-400 text-xs">
                                {event.actor_user_id ? event.actor_user_id.substring(0, 8) : 'System'}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                v{event.weight_version}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge
                                className={
                                  event.status === 'approved'
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : event.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                                }
                              >
                                {event.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {paginatedEvents.map((event) => {
                    let contextText = event.entity_id.substring(0, 8);
                    let nostrPubkey = null;

                    if (event.action_type === 'GOVERNANCE_VOTE' && event.metadata?.proposal_title) {
                      contextText = event.metadata.proposal_title;
                    } else if (event.action_type === 'EVENT_HOSTED' && event.metadata?.event_title) {
                      contextText = event.metadata.event_title;
                    } else if (event.action_type === 'LEARNING_CIRCLE_HOSTED' && event.metadata?.circle_topic) {
                      contextText = event.metadata.circle_topic;
                    } else if (event.metadata?.project_title) {
                      contextText = event.metadata.project_title;
                    } else if (event.metadata?.title) {
                      contextText = event.metadata.title;
                    }

                    // Check for Nostr Pubkey display
                    if (['MESSAGE_SENT', 'MESSAGE_TRUSTED_THREAD'].includes(event.action_type)) {
                      nostrPubkey = event.metadata?.recipient_npub || conversationsCache[event.entity_id];
                      contextText = 'Message to:';

                      if (!nostrPubkey || nostrPubkey === 'loading') {
                        if (!nostrPubkey) {
                          getRecipientNpub(event);
                        }
                      }
                    }

                    return (
                      <Card key={event.id} className="bg-slate-700/30 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="text-white font-medium mb-1">
                                {actionTypeLabels[event.action_type] || event.action_type}
                              </div>
                              <div className="text-slate-400 text-sm mb-2">
                                {contextText}
                                {nostrPubkey && nostrPubkey !== 'loading' && nostrPubkey !== 'error' ? (
                                  <NostrPubkeyDisplay pubkey={nostrPubkey} />
                                ) : (['MESSAGE_SENT', 'MESSAGE_TRUSTED_THREAD'].includes(event.action_type)) ? (
                                  nostrPubkey === 'error' ? (
                                    <div className="text-red-400 text-xs italic mt-1">Failed to load</div>
                                  ) : (
                                    <div className="text-slate-500 text-xs italic mt-1">Loading...</div>
                                  )
                                ) : null}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                              </div>
                              {event.actor_user_id && (
                                <div className="text-slate-500 text-xs mt-1">
                                  Actor: {event.actor_user_id.substring(0, 8)}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-orange-400 font-semibold text-lg">
                                +{(event.magnitude * event.alignment_score).toFixed(2)}
                              </div>
                              <div className="text-slate-400 text-xs">
                                {(event.alignment_score * 100).toFixed(0)}% aligned
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-slate-700 text-slate-300 text-xs">
                              {getCategoryForAction(event.action_type)}
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                event.status === 'approved'
                                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                  : event.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                  : 'bg-red-500/20 text-red-300 border-red-500/30'
                              }`}
                            >
                              {event.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pt-6 mt-6 border-t border-slate-700">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="ghost"
                        className={`filter-chip h-auto ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        ←
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                          .map((page, index, arr) => (
                            <React.Fragment key={page}>
                              {index > 0 && arr[index - 1] !== page - 1 && <span className="text-slate-500 px-2">...</span>}
                              <Button
                                onClick={() => setCurrentPage(page)}
                                variant="ghost"
                                className={`filter-chip h-auto w-10 ${currentPage === page ? 'active' : ''}`}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          ))}
                      </div>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="ghost"
                        className={`filter-chip h-auto ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        →
                      </Button>
                    </div>
                    <div className="text-slate-400 text-sm text-center">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} transactions
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
