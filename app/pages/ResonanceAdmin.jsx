
import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Activity,
  History,
  PlayCircle,
  Save,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Users as UsersIcon,
  RotateCcw,
  Globe2, // New import for Hubs tab icon
  MapPin // New import for Hubs card icon
} from 'lucide-react';
import { motion } from 'framer-motion';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ResonanceAdmin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalEvents: 0,
    eventsToday: 0,
    activeVersion: null,
    totalEntities: 0
  });
  const [versions, setVersions] = useState([]);
  const [activeVersion, setActiveVersion] = useState(null);
  const [actionWeights, setActionWeights] = useState([]);
  const [alignmentRules, setAlignmentRules] = useState([]);

  // Original values from DB for comparison
  const [originalActionWeights, setOriginalActionWeights] = useState([]);
  const [originalAlignmentRules, setOriginalAlignmentRules] = useState([]);

  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [events, setEvents] = useState([]);
  const [eventFilters, setEventFilters] = useState({
    entity_type: 'all',
    action_type: 'all',
    status: 'all'
  });
  const [currentEventsPage, setCurrentEventsPage] = useState(1);
  const getEventsPerPage = () => window.innerWidth < 768 ? 15 : 20;
  const [eventsPerPage, setEventsPerPage] = useState(getEventsPerPage());
  const [auditLogs, setAuditLogs] = useState([]);
  const [message, setMessage] = useState(null);
  const [agentStatus, setAgentStatus] = useState({
    calculator: { lastRun: null, status: 'unknown' },
    snapshot: { lastRun: null, status: 'unknown' }
  });
  const [showInitializeWarning, setShowInitializeWarning] = useState(false);
  const [users, setUsers] = useState([]);
  const [userScores, setUserScores] = useState({});
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const getUsersPerPage = () => window.innerWidth < 768 ? 10 : 15;
  const [usersPerPage, setUsersPerPage] = useState(getUsersPerPage());

  // New state for Hubs
  const [hubs, setHubs] = useState([]);
  const [hubScores, setHubScores] = useState({});
  const [currentHubPage, setCurrentHubPage] = useState(1);
  const [hubSearchTerm, setHubSearchTerm] = useState('');
  const getHubsPerPage = () => window.innerWidth < 768 ? 10 : 15;
  const [hubsPerPage, setHubsPerPage] = useState(getHubsPerPage());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleResize = () => setEventsPerPage(getEventsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentEventsPage]);

  useEffect(() => {
    const handleResize = () => setUsersPerPage(getUsersPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentUserPage]);

  useEffect(() => {
    const handleResize = () => setHubsPerPage(getHubsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentHubPage]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(actionWeights) !== JSON.stringify(originalActionWeights) ||
           JSON.stringify(alignmentRules) !== JSON.stringify(originalAlignmentRules);
  }, [actionWeights, originalActionWeights, alignmentRules, originalAlignmentRules]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user.role !== 'admin') {
        setMessage({ type: 'error', text: 'Access denied. Admin role required.' });
        setIsLoading(false);
        return;
      }

      await Promise.all([
        loadOverviewStats(),
        loadVersions(),
        loadEvents(),
        loadAuditLogs(),
        loadAgentStatus(),
        loadUsers(),
        loadHubs()
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverviewStats = async () => {
    try {
      const [allEvents, allScores, publishedVersions] = await Promise.all([
        base44.entities.ResonanceEvent.list('-timestamp', 1000),
        base44.entities.ResonanceScore.list(),
        base44.entities.ResonanceWeightVersion.filter({ is_published: true })
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventsToday = allEvents.filter(e => new Date(e.timestamp) >= today).length;

      setStats({
        totalEvents: allEvents.length,
        eventsToday,
        activeVersion: publishedVersions.length > 0 ? publishedVersions[0] : null,
        totalEntities: allScores.length
      });
    } catch (error) {
      console.error('Error loading overview stats:', error);
    }
  };

  const loadVersions = async () => {
    try {
      const allVersions = await base44.entities.ResonanceWeightVersion.list('-version');
      setVersions(allVersions);

      const published = allVersions.find(v => v.is_published);
      if (published) {
        setActiveVersion(published);
        await loadWeightsAndRules(published.version);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const loadWeightsAndRules = async (version) => {
    try {
      const [weights, rules] = await Promise.all([
        base44.entities.ResonanceActionWeight.filter({ version }),
        base44.entities.ResonanceAlignmentRule.filter({ version })
      ]);

      // Store both current and original values
      setActionWeights(JSON.parse(JSON.stringify(weights)));
      setOriginalActionWeights(JSON.parse(JSON.stringify(weights)));
      setAlignmentRules(JSON.parse(JSON.stringify(rules)));
      setOriginalAlignmentRules(JSON.parse(JSON.stringify(rules)));
    } catch (error) {
      console.error('Error loading weights and rules:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const allEvents = await base44.entities.ResonanceEvent.list('-timestamp', 100);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await base44.entities.ResonanceAdminAudit.list('-timestamp', 50);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadAgentStatus = async () => {
    try {
      const scores = await base44.entities.ResonanceScore.list('-last_updated', 1);
      const calculatorLastRun = scores.length > 0 ? scores[0].last_updated : null;

      const snapshots = await base44.entities.ResonanceSnapshotDaily.list('-last_calculated', 1);
      const snapshotLastRun = snapshots.length > 0 ? snapshots[0].last_calculated : null;

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const calculatorStatus = calculatorLastRun && new Date(calculatorLastRun) > oneHourAgo ? 'active' : 'pending';
      const snapshotStatus = snapshotLastRun && new Date(snapshotLastRun) > oneDayAgo ? 'active' : 'pending';

      setAgentStatus({
        calculator: {
          lastRun: calculatorLastRun,
          status: calculatorStatus
        },
        snapshot: {
          lastRun: snapshotLastRun,
          status: snapshotStatus
        }
      });
    } catch (error) {
      console.error('Error loading agent status:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers);

      const allUserScores = await base44.entities.ResonanceScore.filter({ entity_type: 'user' });
      const scoresMap = allUserScores.reduce((acc, score) => {
        acc[score.entity_id] = score;
        return acc;
      }, {});
      setUserScores(scoresMap);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadHubs = async () => {
    try {
      const allHubs = await base44.entities.Hub.list();
      setHubs(allHubs);

      const allHubScores = await base44.entities.ResonanceScore.filter({ entity_type: 'hub' });
      const scoresMap = allHubScores.reduce((acc, score) => {
        acc[score.entity_id] = score;
        return acc;
      }, {});
      setHubScores(scoresMap);
    } catch (error) {
      console.error('Error loading hubs:', error);
      setHubs([]);
    }
  };

  // LOCAL STATE UPDATE HANDLERS (don't persist to DB immediately)
  const handleUpdateWeight = (weightId, updates) => {
    setActionWeights(prev =>
      prev.map(w => w.id === weightId ? { ...w, ...updates } : w)
    );
  };

  const handleUpdateNormalizerType = (weightId, newType) => {
    const newNormalizer = {
      type: newType,
      params: newType === 'cap' ? { max: 100 } : {}
    };
    handleUpdateWeight(weightId, { impact_normalizer: newNormalizer });
  };

  const handleUpdateNormalizerCapMax = (weightId, maxValue) => {
    const weight = actionWeights.find(w => w.id === weightId);
    const newNormalizer = {
      ...weight.impact_normalizer,
      params: { max: maxValue }
    };
    handleUpdateWeight(weightId, { impact_normalizer: newNormalizer });
  };

  const handleUpdateDecayDays = (weightId, days) => {
    const newDecay = {
      type: 'half_life',
      days: days
    };
    handleUpdateWeight(weightId, { decay: newDecay });
  };

  // Discard all local changes and reload from DB
  const handleDiscardChanges = async () => {
    if (activeVersion) {
      await loadWeightsAndRules(activeVersion.version);
      setMessage({ type: 'success', text: 'Changes discarded' });
    }
  };

  // Create new version with current (modified) weights
  const handleCreateVersion = async () => {
    if (!newVersionLabel.trim()) {
      setMessage({ type: 'error', text: 'Version label is required' });
      return;
    }

    try {
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

      // Create new version entry
      await base44.entities.ResonanceWeightVersion.create({
        version: nextVersion,
        label: newVersionLabel,
        notes: newVersionNotes,
        created_by: currentUser.id,
        is_published: false
      });

      // Save current actionWeights state as new version in DB
      for (const weight of actionWeights) {
        const { id, created_date, ...weightData } = weight;
        await base44.entities.ResonanceActionWeight.create({
          ...weightData,
          version: nextVersion
        });
      }

      // Save current alignmentRules state as new version in DB
      for (const rule of alignmentRules) {
        const { id, created_date, ...ruleData } = rule;
        await base44.entities.ResonanceAlignmentRule.create({
          ...ruleData,
          version: nextVersion
        });
      }

      setMessage({ type: 'success', text: `Version ${nextVersion} created successfully with your changes` });
      setNewVersionLabel('');
      setNewVersionNotes('');
      setIsCreatingVersion(false);

      // Reload versions
      await loadVersions();
    } catch (error) {
      console.error('Error creating version:', error);
      setMessage({ type: 'error', text: 'Failed to create version' });
    }
  };

  const handlePublishVersion = async (version) => {
    try {
      if (activeVersion) {
        await base44.entities.ResonanceWeightVersion.update(activeVersion.id, {
          ...activeVersion,
          is_published: false
        });
      }

      const versionToPublish = versions.find(v => v.version === version);
      await base44.entities.ResonanceWeightVersion.update(versionToPublish.id, {
        ...versionToPublish,
        is_published: true
      });

      await base44.entities.ResonanceAdminAudit.create({
        timestamp: new Date().toISOString(),
        actor_user_id: currentUser.id,
        change: { action: 'publish_version', version },
        version_from: activeVersion?.version || null,
        version_to: version,
        note: `Published version ${version}`
      });

      setMessage({ type: 'success', text: `Version ${version} is now active` });
      await loadVersions();
    } catch (error) {
      console.error('Error publishing version:', error);
      setMessage({ type: 'error', text: 'Failed to publish version' });
    }
  };

  const handleRecalculateScores = async () => {
    try {
      setMessage({ type: 'info', text: 'Recalculating scores... This may take a moment.' });
      await base44.functions.invoke('calculateResonanceScores', {});
      setMessage({ type: 'success', text: 'Scores recalculated successfully' });
      await loadOverviewStats();
      await loadAgentStatus();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      setMessage({ type: 'error', text: 'Failed to recalculate scores' });
    }
  };

  const handleGenerateDailySnapshot = async () => {
    try {
      setMessage({ type: 'info', text: 'Creating today\'s snapshot...' });
      const response = await base44.functions.invoke('generateResonanceSnapshots', {
        mode: 'daily'
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Snapshot created: ${response.data.snapshots_created} entries for ${response.data.entities_processed} entities`
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to create snapshot' });
      }
      await loadAgentStatus();
    } catch (error) {
      console.error('Error generating snapshot:', error);
      setMessage({ type: 'error', text: 'Failed to generate snapshot' });
    }
  };

  const handleBackfillSnapshots = async () => {
    try {
      setMessage({ type: 'info', text: 'Backfilling snapshots for last 90 days... This may take several minutes.' });

      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);

      const response = await base44.functions.invoke('generateResonanceSnapshots', {
        mode: 'backfill',
        start_date: ninetyDaysAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0]
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Backfill complete: ${response.data.snapshots_created} snapshots for ${response.data.dates_processed} days across ${response.data.entities_processed} entities`
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to backfill snapshots' });
      }
      await loadAgentStatus();
    } catch (error) {
      console.error('Error backfilling snapshots:', error);
      setMessage({ type: 'error', text: 'Failed to backfill snapshots' });
    }
  };

  const handleSyncMissingActions = async () => {
    try {
      setMessage({ type: 'info', text: 'Syncing missing action types...' });
      const response = await base44.functions.invoke('syncMissingActions', {});

      if (response.data.added > 0) {
        setMessage({
          type: 'success',
          text: `Added ${response.data.added} missing action types: ${response.data.added_actions.join(', ')}`
        });
      } else {
        setMessage({ type: 'success', text: 'All action types are already configured' });
      }

      await loadVersions();
    } catch (error) {
      console.error('Error syncing actions:', error);
      setMessage({ type: 'error', text: 'Failed to sync action types' });
    }
  };

  const handleInitializeSystem = async () => {
    try {
      await base44.functions.invoke('initializeResonanceSystem', {});
      setMessage({ type: 'success', text: 'System initialized successfully' });
      await loadData();
      setShowInitializeWarning(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to initialize system' });
      setShowInitializeWarning(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (eventFilters.entity_type !== 'all' && event.entity_type !== eventFilters.entity_type) return false;
    if (eventFilters.action_type !== 'all' && event.action_type !== eventFilters.action_type) return false;
    if (eventFilters.status !== 'all' && event.status !== eventFilters.status) return false;
    return true;
  });

  const totalEventsPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startEventsIndex = (currentEventsPage - 1) * eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startEventsIndex, startEventsIndex + eventsPerPage);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (userSearchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.nostr_pubkey?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }

    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }

    // Sort by resonance score (highest first)
    filtered = [...filtered].sort((a, b) => {
      const scoreA = userScores[a.id]?.score_total || 0;
      const scoreB = userScores[b.id]?.score_total || 0;
      return scoreB - scoreA; // Descending order
    });

    return filtered;
  }, [users, userSearchTerm, userRoleFilter, userScores]);

  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startUsersIndex = (currentUserPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startUsersIndex, startUsersIndex + usersPerPage);

  // Filter and sort hubs
  const filteredHubs = useMemo(() => {
    let filtered = hubs;

    if (hubSearchTerm) {
      filtered = filtered.filter(hub =>
        hub.name?.toLowerCase().includes(hubSearchTerm.toLowerCase()) ||
        hub.location?.toLowerCase().includes(hubSearchTerm.toLowerCase())
      );
    }

    // Sort by resonance score (highest first)
    filtered = [...filtered].sort((a, b) => {
      const scoreA = hubScores[a.id]?.score_total || 0;
      const scoreB = hubScores[b.id]?.score_total || 0;
      return scoreB - scoreA;
    });

    return filtered;
  }, [hubs, hubSearchTerm, hubScores]);

  const totalHubsPages = Math.ceil(filteredHubs.length / hubsPerPage);
  const startHubsIndex = (currentHubPage - 1) * hubsPerPage;
  const paginatedHubs = filteredHubs.slice(startHubsIndex, startHubsIndex + hubsPerPage);

  const handleEventsPageChange = (page) => {
    setCurrentEventsPage(page);
  };

  const handleUsersPageChange = (page) => {
    setCurrentUserPage(page);
  };

  const handleHubsPageChange = (page) => {
    setCurrentHubPage(page);
  };

  useEffect(() => {
    setCurrentEventsPage(1);
  }, [eventFilters.entity_type, eventFilters.action_type, eventFilters.status]);

  useEffect(() => {
    setCurrentUserPage(1);
  }, [userSearchTerm, userRoleFilter]);

  useEffect(() => {
    setCurrentHubPage(1);
  }, [hubSearchTerm]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <>
        {/* Fixed Overlay Spinner - Horizontal Centered */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
          <div className="flex flex-col items-center"> {/* Added flex-col and items-center here */}
            <CoherosphereNetworkSpinner
              size={100}
              lineWidth={2}
              dotRadius={6}
              interval={1100}
              maxConcurrent={4}
            />
            <div className="text-slate-400 text-lg mt-4">Loading Resonance Admin...</div>
          </div>
        </div>

        {/* Virtual placeholder */}
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">This area is restricted to administrators only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          {/* Change: Replaced Settings icon with Activity icon */}
          <Activity className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">Resonance Control</h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Configure resonance weights, monitor events, and manage system versions.
        </p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="weights" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <Settings className="w-4 h-4 mr-2" />
            Weights & Rules
            {hasUnsavedChanges && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs px-1.5 py-0">
                ●
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <Activity className="w-4 h-4 mr-2" />
            Events Log
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <History className="w-4 h-4 mr-2" />
            Versions & Audit
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <UsersIcon className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="hubs" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <Globe2 className="w-4 h-4 mr-2" />
            Hubs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.totalEvents}</div>
                <div className="text-slate-400 text-sm">Total Events</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.eventsToday}</div>
                <div className="text-slate-400 text-sm">Events Today</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.totalEntities}</div>
                <div className="text-slate-400 text-sm">Scored Entities</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">
                  {stats.activeVersion ? `v${stats.activeVersion.version}` : '—'}
                </div>
                <div className="text-slate-400 text-sm">Active Version</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">System Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Recalculate All Scores</h3>
                  <p className="text-slate-400 text-sm mb-2">Recompute resonance scores for all entities based on current weights</p>
                  <div className="flex items-center gap-3 text-xs">
                    <div className={`w-2 h-2 rounded-full ${agentStatus.calculator.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-slate-400">
                      Agent: <span className="text-slate-300 font-mono">resonance_calculator</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      Last run: <span className="text-slate-300">{formatRelativeTime(agentStatus.calculator.lastRun)}</span>
                      {agentStatus.calculator.lastRun && (
                        <span className="text-slate-500 ml-1">
                          ({format(new Date(agentStatus.calculator.lastRun), 'dd MMMM yyyy, HH:mm')})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleRecalculateScores}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Manual Recalculate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Generate Daily Snapshot</h3>
                  <p className="text-slate-400 text-sm mb-2">Create today's historical snapshot for all entities (for timeline charts)</p>
                  <div className="flex items-center gap-3 text-xs">
                    <div className={`w-2 h-2 rounded-full ${agentStatus.snapshot.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-slate-400">
                      Agent: <span className="text-slate-300 font-mono">daily_resonance_snapshot</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      Last run: <span className="text-slate-300">{formatRelativeTime(agentStatus.snapshot.lastRun)}</span>
                      {agentStatus.snapshot.lastRun && (
                        <span className="text-slate-500 ml-1">
                          ({format(new Date(agentStatus.snapshot.lastRun), 'dd MMMM yyyy, HH:mm')})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateDailySnapshot}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Manual Snapshot
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Backfill Historical Snapshots</h3>
                  <p className="text-slate-400 text-sm">Generate snapshots for last 90 days (one-time setup, may take several minutes)</p>
                </div>
                <Button
                  onClick={handleBackfillSnapshots}
                  variant="outline"
                  className="btn-secondary-coherosphere"
                >
                  <History className="w-4 h-4 mr-2" />
                  Manual 90d Backfill
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Sync Missing Action Types</h3>
                  <p className="text-slate-400 text-sm">Add any new action types (like MESSAGE_SENT, DAILY_CHECKIN) to current version</p>
                </div>
                <Button
                  onClick={handleSyncMissingActions}
                  variant="outline"
                  className="btn-secondary-coherosphere"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manual Actions Sync
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Initialize Resonance System</h3>
                  <p className="text-slate-400 text-sm">Set up default weights and create first version (run once)</p>
                </div>
                <Button
                  onClick={() => setShowInitializeWarning(true)}
                  variant="outline"
                  className="btn-secondary-coherosphere"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Initialize
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weights" className="space-y-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Action Weights Configuration</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  Version {activeVersion?.version || '—'}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    Unsaved Changes
                  </Badge>
                )}
                {hasUnsavedChanges && (
                  <Button
                    onClick={handleDiscardChanges}
                    variant="outline"
                    className="btn-secondary-coherosphere"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Discard
                  </Button>
                )}
                <Button
                  onClick={() => setIsCreatingVersion(true)}
                  variant="outline"
                  className="btn-secondary-coherosphere"
                  size="sm"
                >
                  New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Explanation Box */}
              <div className="mb-6 p-4 bg-slate-900/30 border border-slate-600 rounded-lg">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-400" />
                  Understanding Resonance Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="text-orange-300 font-semibold mb-1">Weight</h5>
                    <p className="text-slate-400 text-xs mb-1.5">How important is this action?</p>
                    <p className="text-slate-300 leading-relaxed">
                      The base multiplier for this action type. Higher weights mean greater impact on resonance scores.
                    </p>
                    <p className="text-slate-500 text-xs mt-1.5 italic">Example: Event hosted &gt; Message sent</p>
                  </div>
                  <div>
                    <h5 className="text-orange-300 font-semibold mb-1">Normalizer</h5>
                    <p className="text-slate-400 text-xs mb-1.5">How does impact scale with size?</p>
                    <p className="text-slate-300 leading-relaxed">
                      How raw magnitude values are scaled. Linear (1:1), Logarithmic (diminishing returns), Square Root (moderate curve), or Cap (hard limit).
                    </p>
                    <p className="text-slate-500 text-xs mt-1.5 italic">Example: Diminishing returns for huge contributions</p>
                  </div>
                  <div>
                    <h5 className="text-orange-300 font-semibold mb-1">Decay</h5>
                    <p className="text-slate-400 text-xs mb-1.5">How long does the impact last?</p>
                    <p className="text-slate-300 leading-relaxed">
                      How quickly the action's impact fades over time. Measured in days until the score is reduced by 50% (half-life).
                    </p>
                    <p className="text-slate-500 text-xs mt-1.5 italic">Example: Mood check (short) vs Knowledge (long)</p>
                  </div>
                </div>
              </div>

              {hasUnsavedChanges && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-300 font-semibold mb-1">Unsaved Changes</h4>
                      <p className="text-yellow-200/80 text-sm">
                        You have modified weights or rules. These changes are only local until you create a new version.
                        Click "New Version" to save them permanently, or "Discard" to revert.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isCreatingVersion && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
                  <div>
                    <Label className="text-white">Version Label</Label>
                    <Input
                      value={newVersionLabel}
                      onChange={(e) => setNewVersionLabel(e.target.value)}
                      placeholder="e.g., Spring 2025 Adjustment"
                      className="mt-1 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Notes</Label>
                    <Textarea
                      value={newVersionNotes}
                      onChange={(e) => setNewVersionNotes(e.target.value)}
                      placeholder="Describe the changes in this version..."
                      className="mt-1 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateVersion} className="bg-gradient-to-r from-orange-500 to-orange-600">
                      <Save className="w-4 h-4 mr-2" />
                      Create Version
                    </Button>
                    <Button onClick={() => setIsCreatingVersion(false)} variant="outline" className="btn-secondary-coherosphere">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {actionWeights.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No weights configured. Initialize the system or create a new version.
                  </p>
                ) : (
                  actionWeights.map((weight) => (
                    <div key={weight.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{weight.action_type}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-orange-400">{weight.base_weight}</div>
                          <div className="text-slate-400 text-xs">Base Weight</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Desktop: 3 columns with improved alignment, Mobile: stacked */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-end">
                          {/* Weight Slider */}
                          <div className="flex flex-col gap-2">
                            <Label className="text-slate-300 text-sm">Weight</Label>
                            <div className="flex items-center gap-3 h-10">
                              <Slider
                                value={[weight.base_weight]}
                                onValueChange={(value) => handleUpdateWeight(weight.id, { base_weight: value[0] })}
                                max={10}
                                step={0.1}
                                className="flex-1 resonance-slider"
                              />
                              <span className="text-white w-12 text-right text-sm font-medium">{weight.base_weight}</span>
                            </div>
                          </div>

                          {/* Normalizer Dropdown */}
                          <div className="flex flex-col gap-2">
                            <Label className="text-slate-300 text-sm">Normalizer</Label>
                            <Select
                              value={weight.impact_normalizer?.type || 'linear'}
                              onValueChange={(value) => handleUpdateNormalizerType(weight.id, value)}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="linear">Linear</SelectItem>
                                <SelectItem value="log">Logarithmic</SelectItem>
                                <SelectItem value="sqrt">Square Root</SelectItem>
                                <SelectItem value="cap">Cap (with max)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Decay Slider */}
                          <div className="flex flex-col gap-2">
                            <Label className="text-slate-300 text-sm">Decay (days)</Label>
                            <div className="flex items-center gap-3 h-10">
                              <Slider
                                value={[weight.decay?.days || 90]}
                                onValueChange={(value) => handleUpdateDecayDays(weight.id, value[0])}
                                min={7}
                                max={365}
                                step={1}
                                className="flex-1 resonance-slider"
                              />
                              <span className="text-white w-12 text-right text-sm font-medium">{weight.decay?.days || 90}</span>
                            </div>
                          </div>
                        </div>

                        {/* Cap Max Value (wenn Normalizer = cap) */}
                        {weight.impact_normalizer?.type === 'cap' && (
                          <div className="flex flex-col gap-2 lg:ml-4">
                            <Label className="text-slate-300 text-sm">Max Value (Cap)</Label>
                            <div className="flex items-center gap-3 max-w-md h-10">
                              <Slider
                                value={[weight.impact_normalizer?.params?.max || 100]}
                                onValueChange={(value) => handleUpdateNormalizerCapMax(weight.id, value[0])}
                                min={10}
                                max={1000}
                                step={10}
                                className="flex-1 resonance-slider"
                              />
                              <span className="text-white w-12 text-right text-sm font-medium">{weight.impact_normalizer?.params?.max || 100}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Resonance Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <Select value={eventFilters.entity_type} onValueChange={(value) => setEventFilters({...eventFilters, entity_type: value})}>
                  <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="hub">Hub</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="knowledge">Knowledge</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={eventFilters.action_type} onValueChange={(value) => setEventFilters({...eventFilters, action_type: value})}>
                  <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="PROJECT_SUPPORT">Project Support</SelectItem>
                    <SelectItem value="PROJECT_CREATED">Project Created</SelectItem>
                    <SelectItem value="EVENT_HOSTED">Event Hosted</SelectItem>
                    <SelectItem value="LEARNING_CIRCLE_HOSTED">Learning Circle</SelectItem>
                    <SelectItem value="GOVERNANCE_VOTE">Governance Vote</SelectItem>
                    <SelectItem value="KNOWLEDGE_PUBLISHED">Knowledge Published</SelectItem>
                    <SelectItem value="MESSAGE_SENT">Message Sent</SelectItem>
                    <SelectItem value="MESSAGE_TRUSTED_THREAD">Trusted Thread</SelectItem>
                    <SelectItem value="DAILY_CHECKIN_COMPLETED">Daily Check-In</SelectItem>
                    <SelectItem value="NOSTR_SIGNAL">Nostr Signal</SelectItem>
                    <SelectItem value="NOSTR_POST">Nostr Post</SelectItem>
                    <SelectItem value="TREASURY_CONTRIBUTION">Treasury</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={eventFilters.status} onValueChange={(value) => setEventFilters({...eventFilters, status: value})}>
                  <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {paginatedEvents.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No events match the current filters.</p>
                ) : (
                  paginatedEvents.map((event) => (
                    <div key={event.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-orange-500/50 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-slate-700 text-slate-300">
                              {event.entity_type}
                            </Badge>
                            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                              {event.action_type}
                            </Badge>
                            {event.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : event.status === 'pending' ? (
                              <Clock className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div className="text-slate-400 text-sm">
                            Entity: <span className="text-white">{event.entity_id.substring(0, 8)}...</span>
                            {event.actor_user_id && (
                              <> • Actor: <span className="text-white">{event.actor_user_id.substring(0, 8)}...</span></>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs mt-1">
                            Magnitude: {event.magnitude} • Alignment: {event.alignment_score.toFixed(2)} • {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalEventsPages > 1 && (
                <motion.div
                  className="pt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Button
                      onClick={() => handleEventsPageChange(currentEventsPage - 1)}
                      disabled={currentEventsPage === 1}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentEventsPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      ←
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalEventsPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalEventsPages || (page >= currentEventsPage - 1 && page <= currentEventsPage + 1))
                        .map((page, index, arr) => (
                          <React.Fragment key={page}>
                            {index > 0 && arr[index - 1] !== page - 1 && <span className="text-slate-500 px-2">...</span>}
                            <Button onClick={() => handleEventsPageChange(page)} variant="ghost" className={`filter-chip h-auto w-10 ${currentEventsPage === page ? 'active' : ''}`}>{page}</Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button
                      onClick={() => handleEventsPageChange(currentEventsPage + 1)}
                      disabled={currentEventsPage === totalEventsPages}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentEventsPage === totalEventsPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      →
                    </Button>
                  </div>
                  <div className="text-slate-400 text-sm text-center">
                    Showing {startEventsIndex + 1}-{Math.min(startEventsIndex + eventsPerPage, filteredEvents.length)} of {filteredEvents.length} events
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {versions.map((version) => (
                  <div key={version.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">Version {version.version}: {version.label}</h3>
                          {version.is_published && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{version.notes}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          Created {new Date(version.created_date).toLocaleDateString()}
                        </p>
                      </div>
                      {!version.is_published && (
                        <Button
                          onClick={() => handlePublishVersion(version.version)}
                          variant="outline"
                          className="btn-secondary-coherosphere"
                          size="sm"
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No audit logs yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-white text-sm">{log.note}</div>
                          <div className="text-slate-500 text-xs mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge className="bg-slate-700 text-slate-300">
                          v{log.version_to}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Community Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <Input
                  type="text"
                  placeholder="Search by name, email, npub..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-[250px] bg-slate-800 border-slate-700 text-white"
                />
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {paginatedUsers.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No users match the current filters.</p>
                ) : (
                  paginatedUsers.map((user) => (
                    <div key={user.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-grow">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.nostr_pubkey || user.email || user.id}&backgroundColor=FF6A00,FF8C42&size=48`}
                          alt={user.full_name || user.email || 'User'}
                          className="w-12 h-12 rounded-full border border-slate-600"
                        />
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{user.display_name || user.full_name || 'Anonymous User'}</h3>
                          {user.email && <p className="text-slate-400 text-sm">{user.email}</p>}
                          {user.nostr_pubkey && (
                            <p className="text-slate-500 text-xs font-mono">
                              npub: {user.nostr_pubkey.substring(0, 10)}...{user.nostr_pubkey.substring(user.nostr_pubkey.length - 8)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-wrap gap-2 items-center justify-end">
                        {user.hub_id && (
                          <Badge className="bg-slate-700 text-slate-300">Hub: {user.hub_id.substring(0, 8)}...</Badge>
                        )}
                        <Badge className={user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-slate-700 text-slate-300'}>
                          {user.role}
                        </Badge>
                        {userScores[user.id] && (
                          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                            Resonance: {Math.round(userScores[user.id].score_total)}
                          </Badge>
                        )}
                        <Link to={createPageUrl('UserResonance') + `?userId=${user.id}`}>
                          <Button variant="outline" size="sm" className="btn-secondary-coherosphere">
                            View Resonance
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalUsersPages > 1 && (
                <motion.div
                  className="pt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Button
                      onClick={() => handleUsersPageChange(currentUserPage - 1)}
                      disabled={currentUserPage === 1}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentUserPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      ←
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalUsersPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalUsersPages || (page >= currentUserPage - 1 && page <= currentUserPage + 1))
                        .map((page, index, arr) => (
                          <React.Fragment key={page}>
                            {index > 0 && arr[index - 1] !== page - 1 && <span className="text-slate-500 px-2">...</span>}
                            <Button
                              onClick={() => handleUsersPageChange(page)}
                              variant="ghost"
                              className={`filter-chip h-auto w-10 ${currentUserPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button
                      onClick={() => handleUsersPageChange(currentUserPage + 1)}
                      disabled={currentUserPage === totalUsersPages}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentUserPage === totalUsersPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      →
                    </Button>
                  </div>
                  <div className="text-slate-400 text-sm text-center">
                    Showing {startUsersIndex + 1}-{Math.min(startUsersIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hubs" className="space-y-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Global Hubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <Input
                  type="text"
                  placeholder="Search by name or location..."
                  value={hubSearchTerm}
                  onChange={(e) => setHubSearchTerm(e.target.value)}
                  className="w-[250px] bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-4">
                {paginatedHubs.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No hubs match the current filters.</p>
                ) : (
                  paginatedHubs.map((hub) => (
                    <div key={hub.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-grow">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{hub.name}</h3>
                          <p className="text-slate-400 text-sm">{hub.location}</p>
                          {hub.description && (
                            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{hub.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-wrap gap-2 items-center justify-end">
                        <Badge className="bg-slate-700 text-slate-300">
                          {hub.member_count || 0} members
                        </Badge>
                        <Badge className="bg-slate-700 text-slate-300">
                          {hub.active_projects || 0} projects
                        </Badge>
                        {hubScores[hub.id] && (
                          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                            Resonance: {Math.round(hubScores[hub.id].score_total)}
                          </Badge>
                        )}
                        <Link to={createPageUrl('HubResonance') + `?hubId=${hub.id}`}>
                          <Button variant="outline" size="sm" className="btn-secondary-coherosphere">
                            View Resonance
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalHubsPages > 1 && (
                <motion.div
                  className="pt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Button
                      onClick={() => handleHubsPageChange(currentHubPage - 1)}
                      disabled={currentHubPage === 1}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentHubPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      ←
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalHubsPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalHubsPages || (page >= currentHubPage - 1 && page <= currentHubPage + 1))
                        .map((page, index, arr) => (
                          <React.Fragment key={page}>
                            {index > 0 && arr[index - 1] !== page - 1 && <span className="text-slate-500 px-2">...</span>}
                            <Button
                              onClick={() => handleHubsPageChange(page)}
                              variant="ghost"
                              className={`filter-chip h-auto w-10 ${currentHubPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button
                      onClick={() => handleHubsPageChange(currentHubPage + 1)}
                      disabled={currentHubPage === totalHubsPages}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentHubPage === totalHubsPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      →
                    </Button>
                  </div>
                  <div className="text-slate-400 text-sm text-center">
                    Showing {startHubsIndex + 1}-{Math.min(startHubsIndex + hubsPerPage, filteredHubs.length)} of {filteredHubs.length} hubs
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showInitializeWarning} onOpenChange={setShowInitializeWarning}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Initialize Resonance System
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              This action will set up the default resonance weights and create the initial version configuration.
              This should only be run once during system setup.
              <br /><br />
              <strong className="text-orange-400">Are you sure you want to proceed?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInitializeSystem}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              Initialize System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
