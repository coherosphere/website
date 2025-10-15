
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCachingPolicy } from '@/components/caching/CachingPolicyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  History,
  Plus,
  Shield,
  DatabaseZap,
  Clock,
  Search,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachedData, useCachedMutation } from '@/components/caching/useCachedData';
import { useQueryClient } from '@tanstack/react-query';

const PRESET_OPTIONS = [
  { value: 'Live', label: '🔴 Live', description: 'Real-time (15s TTL, 60s SWR)' },
  { value: 'Fresh', label: '🟢 Fresh', description: 'Frequent updates (60s TTL, 5m SWR)' },
  { value: 'Balanced', label: '🔵 Balanced', description: 'Standard (5m TTL, 10m SWR)' },
  { value: 'Archive', label: '🟣 Archive', description: 'Long-term (24h TTL, 7d SWR)' },
  { value: 'Custom', label: '⚙️ Custom', description: 'Manual configuration' }
];

// Map of domains that are already integrated with useCachedData
const INTEGRATED_DOMAINS = {
  treasury: true,
  activity: true,
  engage: true,
  dashboard: true,
  learning: true,
  projects: true,
  governance: true,
  profile: true,
  globalHubs: true,
  faq: true,
  hub: true,
  resourceDetail: true,
  messages: true,
  calendar: true,
  donate: true,
  userResonance: true,
  manifesto: true, // ✅ Newly integrated
  shareKnowledge: true, // ✅ Newly integrated
  hostEvent: true, // ✅ Newly integrated
  startCircle: true, // ✅ Newly integrated
  createProject: true, // ✅ Newly integrated
  brand: true, // ✅ Newly integrated
  style: true, // ✅ Newly integrated
  terms: true, // ✅ Newly integrated
  chat: true, // ✅ Newly integrated
  hubResonance: true, // ✅ Newly integrated
  status: true, // ✅ Newly integrated
  resonanceAdmin: true, // ✅ Newly integrated
  resonanceCheck: true, // ✅ Newly integrated
  perfStats: true, // ✅ Newly integrated
  cachingPolicyAdmin: true, // ✅ Neu hinzugefügt
  onboarding: false,
  videoCall: false
};

// Mapping from domain names to actual routes
const DOMAIN_TO_ROUTE = {
  treasury: '/Treasury',
  activity: '/Activity',
  engage: '/Engage',
  projects: '/Projects',
  governance: '/Voting',
  learning: '/Learning',
  faq: '/FAQ',
  dashboard: '/Dashboard',
  profile: '/Profile',
  messages: '/Messages',
  brand: '/Brand',
  calendar: '/Calendar',
  style: '/Style', // Added Style route
  chat: '/Chat',
  createProject: '/CreateProject',
  donate: '/Donate',
  globalHubs: '/GlobalHubs',
  hostEvent: '/HostEvent',
  hub: '/Hub',
  hubResonance: '/HubResonance',
  manifesto: '/Manifesto',
  onboarding: '/Onboarding',
  perfStats: '/PerfStats',
  resonanceAdmin: '/ResonanceAdmin',
  resonanceCheck: '/ResonanceCheck',
  resourceDetail: '/ResourceDetail',
  shareKnowledge: '/ShareKnowledge',
  startCircle: '/StartCircle',
  status: '/Status',
  terms: '/Terms',
  userResonance: '/UserResonance',
  videoCall: '/VideoCall',
  cachingPolicyAdmin: '/CachingPolicyAdmin' // ✅ Neu hinzugefügt
};

export default function CachingPolicyAdmin() {
  const [activePolicy, setActivePolicy] = useState(null);
  const [editedPolicy, setEditedPolicy] = useState(null);
  const [message, setMessage] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [domainSearchQuery, setDomainSearchQuery] = useState('');

  const { policy: contextPolicy, refreshPolicy } = useCachingPolicy();
  const { setLoading } = useLoading();
  const queryClient = useQueryClient();

  // Use cached data for current user
  const { data: currentUser, isLoading: userLoading } = useCachedData(
    ['cachingPolicyAdmin', 'currentUser'],
    () => base44.auth.me(),
    'cachingPolicyAdmin'
  );

  // Use cached data for all policies
  const { data: allPolicies = [], isLoading: policiesLoading, refetch: refetchPolicies } = useCachedData(
    ['cachingPolicyAdmin', 'policies'],
    () => base44.entities.CachingPolicy.list('-version'),
    'cachingPolicyAdmin',
    {
      enabled: currentUser?.role === 'admin' // Only fetch if user is admin
    }
  );

  const isLoading = userLoading || policiesLoading;

  // Manage global loading indicator
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Initialize active and edited policies when data loads
  useEffect(() => {
    if (allPolicies.length > 0) {
      // Find published policy
      const published = allPolicies.find(p => p.published);
      let policyToEdit = null;
      
      if (published) {
        setActivePolicy(published);
        policyToEdit = JSON.parse(JSON.stringify(published));
      } else {
        // If no published policy, default to the latest one for editing
        const latestPolicy = allPolicies.reduce((prev, current) => (prev.version > current.version ? prev : current));
        policyToEdit = JSON.parse(JSON.stringify(latestPolicy));
      }

      // Add missing domains from INTEGRATED_DOMAINS
      if (policyToEdit && policyToEdit.domains) {
        Object.keys(INTEGRATED_DOMAINS).forEach(domain => {
          if (!policyToEdit.domains[domain]) {
            console.log(`[CachingPolicyAdmin] Adding missing domain: ${domain}`);
            policyToEdit.domains[domain] = { 
              preset: 'Balanced', 
              ttl: 300, 
              swr: 600, 
              polling: null 
            };
          }
        });
      }

      setEditedPolicy(policyToEdit);
    } else if (allPolicies.length === 0 && !policiesLoading) {
      // If no policies at all, provide a basic structure to start a new one
      setEditedPolicy({
        id: 'new-policy',
        version: 1,
        label: 'Initial Draft',
        notes: 'First caching policy version',
        published: false,
        created_date: new Date().toISOString(),
        global_settings: {
          serve_stale_if_slow: true,
          auto_revalidate_on_focus: true,
          freshness_overlay_enabled: false,
          freshness_overlay_visible_to: 'admins',
          freshness_overlay_whitelist_users: [],
        },
        presets: {
          Live: { ttl: 15, swr: 60, polling: null },
          Fresh: { ttl: 60, swr: 300, polling: null },
          Balanced: { ttl: 300, swr: 600, polling: null },
          Archive: { ttl: 86400, swr: 604800, polling: null },
        },
        domains: Object.keys(INTEGRATED_DOMAINS).reduce((acc, domain) => {
          acc[domain] = { preset: 'Balanced', ttl: 300, swr: 600, polling: null };
          return acc;
        }, {}),
      });
    }
  }, [allPolicies, policiesLoading]);

  // Mutation for creating a new policy
  const createPolicyMutation = useCachedMutation(
    (policyData) => base44.entities.CachingPolicy.create(policyData),
    {
      invalidateQueries: [['cachingPolicyAdmin', 'policies']],
      onSuccess: () => {
        // Specific success messages are handled in confirmSave/handleCreateNewVersion
        setShowSaveDialog(false); // Close dialog if opened by confirmSave
        refreshPolicy(); // To update the context policy
      },
      onError: (error) => {
        console.error('Error creating policy:', error);
        setMessage({ type: 'error', text: 'Failed to create policy' });
      }
    }
  );

  // Mutation for updating an existing policy
  const updatePolicyMutation = useCachedMutation(
    ({ id, data }) => base44.entities.CachingPolicy.update(id, data),
    {
      invalidateQueries: [['cachingPolicyAdmin', 'policies']],
      onSuccess: () => {
        // Specific success messages are handled in confirmSave/handlePublishVersion
        setShowSaveDialog(false); // Close dialog if opened by confirmSave
        refreshPolicy(); // To update the context policy
      },
      onError: (error) => {
        console.error('Error updating policy:', error);
        setMessage({ type: 'error', text: 'Failed to save policy' });
      }
    }
  );

  const handleDomainPresetChange = (domain, preset) => {
    const newDomains = { ...editedPolicy?.domains };
    
    if (preset === 'Custom') {
      newDomains[domain] = {
        preset: 'Custom',
        ttl: newDomains[domain]?.ttl || 300,
        swr: newDomains[domain]?.swr || 600,
        polling: newDomains[domain]?.polling || null
      };
    } else {
      const presetValues = editedPolicy?.presets[preset];
      newDomains[domain] = {
        preset,
        ...presetValues
      };
    }

    setEditedPolicy({ ...editedPolicy, domains: newDomains });
  };

  const handleDomainValueChange = (domain, field, value) => {
    const newDomains = { ...editedPolicy?.domains };
    newDomains[domain] = {
      ...newDomains[domain],
      [field]: field === 'polling' && value === '' ? null : Number(value)
    };
    setEditedPolicy({ ...editedPolicy, domains: newDomains });
  };

  const handleGlobalSettingChange = (setting, value) => {
    setEditedPolicy(prevPolicy => ({
      ...prevPolicy,
      global_settings: {
        ...prevPolicy?.global_settings,
        [setting]: value
      }
    }));
  };

  const hasChanges = () => {
    if (!activePolicy || !editedPolicy) return false;
    return JSON.stringify(activePolicy) !== JSON.stringify(editedPolicy);
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      setMessage({ type: 'info', text: 'No changes to save' });
      return;
    }
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    try {
      setMessage({ type: 'info', text: 'Saving changes...' });
      
      if (editedPolicy.id === 'new-policy') {
        const nextVersion = allPolicies.length > 0 ? Math.max(...allPolicies.map(p => p.version)) + 1 : 1;
        const newPolicyData = {
          ...editedPolicy,
          id: undefined, // Let backend assign ID
          version: nextVersion,
          label: editedPolicy.label || `Version ${nextVersion}`,
          notes: editedPolicy.notes || 'Created from unsaved draft',
          created_date: new Date().toISOString(),
          published: false,
        };
        await createPolicyMutation.mutateAsync(newPolicyData);
        setMessage({ type: 'success', text: 'New policy created and saved successfully!' });
      } else {
        await updatePolicyMutation.mutateAsync({ id: editedPolicy.id, data: editedPolicy });
        setMessage({ type: 'success', text: 'Policy updated successfully! Changes will apply to all new requests immediately.' });
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleCreateNewVersion = async () => {
    if (!newVersionLabel.trim()) {
      setMessage({ type: 'error', text: 'Version label is required' });
      return;
    }

    try {
      const nextVersion = allPolicies.length > 0 ? Math.max(...allPolicies.map(p => p.version)) + 1 : 1;

      const newPolicy = {
        ...editedPolicy,
        id: undefined, // Ensure a new ID is generated
        created_date: new Date().toISOString(),
        version: nextVersion,
        label: newVersionLabel,
        notes: newVersionNotes,
        published: false
      };

      await createPolicyMutation.mutateAsync(newPolicy);

      setMessage({ type: 'success', text: `Version ${nextVersion} created successfully` });
      setIsCreatingNew(false);
      setNewVersionLabel('');
      setNewVersionNotes('');
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handlePublishVersion = async (policyToPublish) => {
    try {
      if (activePolicy && activePolicy.id !== policyToPublish.id) {
        await updatePolicyMutation.mutateAsync({
          id: activePolicy.id,
          data: {
            ...activePolicy,
            published: false
          }
        });
      }

      await updatePolicyMutation.mutateAsync({
        id: policyToPublish.id,
        data: {
          ...policyToPublish,
          published: true
        }
      });

      setMessage({ type: 'success', text: `Policy v${policyToPublish.version} is now active` });
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleDiscard = () => {
    if (activePolicy) {
      setEditedPolicy(JSON.parse(JSON.stringify(activePolicy)));
      setMessage({ type: 'info', text: 'Changes discarded' });
    } else {
      // If no active policy, and we're editing a new draft, reset to empty/initial state
      refetchPolicies(); // Re-fetch to get initial state or truly empty state if no policies exist
      setMessage({ type: 'info', text: 'Changes discarded' });
    }
  };

  const filteredDomains = Object.entries(editedPolicy?.domains || {})
    .sort(([domainA], [domainB]) => {
      const routeA = DOMAIN_TO_ROUTE[domainA] || `/${domainA}`;
      const routeB = DOMAIN_TO_ROUTE[domainB] || `/${domainB}`;
      return routeA.localeCompare(routeB);
    })
    .filter(([domain]) => {
      if (!domainSearchQuery.trim()) return true;
      
      const query = domainSearchQuery.toLowerCase();
      const domainName = domain.toLowerCase();
      const routeName = (DOMAIN_TO_ROUTE[domain] || `/${domain}`).toLowerCase();
      
      return domainName.includes(query) || routeName.includes(query);
    });

  if (isLoading) {
    return (
      <>
        {/* Fixed Overlay Spinner - Horizontal Centered */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <CoherosphereNetworkSpinner
              size={100}
              lineWidth={2}
              dotRadius={6}
              interval={1100}
              maxConcurrent={4}
            />
            <div className="text-slate-400 text-lg mt-4">Loading Caching Policy...</div>
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

  if (!editedPolicy) {
    return (
      <div className="p-8">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-400/80 mx-auto mb-4" /> {/* Updated color */}
            <h2 className="text-2xl font-bold text-white mb-2">No Policy Found</h2>
            <p className="text-slate-400 mb-4">No caching policy has been configured yet.</p>
            <Button onClick={() => setIsCreatingNew(true)} className="bg-gradient-to-r from-orange-500 to-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Policy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <DatabaseZap className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Caching Policy
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Configure how data is cached across the app to balance performance and freshness.
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

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-lg px-4 py-1">
            Version {editedPolicy?.version}
          </Badge>
          {activePolicy?.published && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              Active
            </Badge>
          )}
          {hasChanges() && (
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              Unsaved Changes
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {hasChanges() && (
            <Button onClick={handleDiscard} variant="outline" className="btn-secondary-coherosphere">
              Discard
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges()} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button onClick={() => setIsCreatingNew(true)} variant="outline" className="btn-secondary-coherosphere">
            <Plus className="w-4 h-4 mr-2" />
            New Version
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Global Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-white font-semibold">Serve Stale if Slow</Label>
              <p className="text-slate-400 text-sm mt-1">If backend is slow, serve stale cache instead of waiting</p>
            </div>
            <Switch
              checked={editedPolicy?.global_settings?.serve_stale_if_slow || false}
              onCheckedChange={(value) => handleGlobalSettingChange('serve_stale_if_slow', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-white font-semibold">Auto-Revalidate on Focus</Label>
              <p className="text-slate-400 text-sm mt-1">Automatically revalidate data when user returns to tab</p>
            </div>
            <Switch
              checked={editedPolicy?.global_settings?.auto_revalidate_on_focus || false}
              onCheckedChange={(value) => handleGlobalSettingChange('auto_revalidate_on_focus', value)}
            />
          </div>

          {/* New Freshness Overlay Settings */}
          <div className="border-t border-slate-700 pt-4 mt-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Freshness Overlay (Advanced Monitoring)
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-white font-semibold">Enable Freshness Overlay</Label>
                  <p className="text-slate-400 text-sm mt-1">Show live cache metrics overlay on all pages</p>
                </div>
                <Switch
                  checked={editedPolicy?.global_settings?.freshness_overlay_enabled || false}
                  onCheckedChange={(value) => handleGlobalSettingChange('freshness_overlay_enabled', value)}
                />
              </div>

              {editedPolicy?.global_settings?.freshness_overlay_enabled && (
                <>
                  <div>
                    <Label className="text-white font-semibold mb-2 block">Visible To</Label>
                    <Select
                      value={editedPolicy?.global_settings?.freshness_overlay_visible_to || 'admins'}
                      onValueChange={(value) => handleGlobalSettingChange('freshness_overlay_visible_to', value)}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="admins">Admins Only</SelectItem>
                        <SelectItem value="whitelist">User Whitelist</SelectItem>
                        <SelectItem value="all">All Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editedPolicy?.global_settings?.freshness_overlay_visible_to === 'whitelist' && (
                    <div>
                      <Label className="text-white font-semibold mb-2 block">Whitelist Users</Label>
                      <p className="text-slate-400 text-xs mb-2">Enter user IDs or emails, separated by commas</p>
                      <Textarea
                        value={(editedPolicy?.global_settings?.freshness_overlay_whitelist_users || []).join(', ')}
                        onChange={(e) => {
                          const users = e.target.value.split(',').map(u => u.trim()).filter(u => u);
                          handleGlobalSettingChange('freshness_overlay_whitelist_users', users);
                        }}
                        placeholder="user@example.com, abc123def456, ..."
                        className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                        rows={3}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 mb-8">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">Domains Configuration</CardTitle>
              <p className="text-slate-400 text-sm mt-2">
                Configure caching behavior per application domain. Choose a preset or customize values.
              </p>
            </div>
            
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search domains..."
                value={domainSearchQuery}
                onChange={(e) => setDomainSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
              />
              {domainSearchQuery && (
                <button
                  onClick={() => setDomainSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDomains.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {domainSearchQuery ? (
                <>
                  <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p>No domains found for "{domainSearchQuery}"</p>
                  <Button
                    onClick={() => setDomainSearchQuery('')}
                    variant="outline"
                    className="btn-secondary-coherosphere"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                'No domains configured.'
              )}
            </div>
          ) : (
            <>
              {domainSearchQuery && (
                <div className="mb-4 text-sm text-slate-400">
                  Found {filteredDomains.length} domain{filteredDomains.length !== 1 ? 's' : ''} for "{domainSearchQuery}"
                </div>
              )}
              <div className="space-y-6">
                {filteredDomains.map(([domain, config]) => (
                  <div key={domain} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-lg">{DOMAIN_TO_ROUTE[domain] || `/${domain}`}</h3>
                            {INTEGRATED_DOMAINS[domain] ? (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                ✓ Integrated
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                                ⏳ Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mt-1">
                            {PRESET_OPTIONS.find(p => p.value === config.preset)?.description || 'Custom configuration'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${
                        config.preset === 'Live' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        config.preset === 'Fresh' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        config.preset === 'Balanced' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        config.preset === 'Archive' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      }`}>
                        {config.preset || 'Custom'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-slate-300 mb-2 block">Cache Preset</Label>
                        <Select
                          value={config.preset || 'Custom'}
                          onValueChange={(value) => handleDomainPresetChange(domain, value)}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select preset" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            {PRESET_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-300 mb-2 block">
                          TTL (seconds)
                          <span className="text-slate-500 ml-2 text-xs">Cache lifetime</span>
                        </Label>
                        <Input
                          type="number"
                          value={config.ttl || 0}
                          onChange={(e) => handleDomainValueChange(domain, 'ttl', e.target.value)}
                          disabled={config.preset !== 'Custom'}
                          className="bg-slate-800 border-slate-700 text-white disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-300 mb-2 block">
                          SWR (seconds)
                          <span className="text-slate-500 ml-2 text-xs">Stale-while-revalidate</span>
                        </Label>
                        <Input
                          type="number"
                          value={config.swr || 0}
                          onChange={(e) => handleDomainValueChange(domain, 'swr', e.target.value)}
                          disabled={config.preset !== 'Custom'}
                          className="bg-slate-800 border-slate-700 text-white disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-300 mb-2 block">
                          Polling (seconds)
                          <span className="text-slate-500 ml-2 text-xs">Optional auto-refresh</span>
                        </Label>
                        <Input
                          type="number"
                          value={config.polling || ''}
                          onChange={(e) => handleDomainValueChange(domain, 'polling', e.target.value)}
                          disabled={config.preset !== 'Custom'}
                          placeholder="None"
                          className="bg-slate-800 border-slate-700 text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allPolicies.map((policy) => (
              <div key={policy.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">Version {policy.version}: {policy.label}</h3>
                    {policy.published && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
                    )}
                  </div>
                  {policy.notes && <p className="text-slate-400 text-sm">{policy.notes}</p>}
                  <p className="text-slate-500 text-xs mt-1">
                    Created {new Date(policy.created_date).toLocaleDateString()}
                  </p>
                </div>
                {!policy.published && (
                  <Button
                    onClick={() => handlePublishVersion(policy)}
                    variant="outline"
                    size="sm"
                    className="btn-secondary-coherosphere"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Save className="w-5 h-5 text-orange-500" />
              Save Caching Policy Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              <strong className="text-orange-400">This will apply to all new requests immediately.</strong>
              <br /><br />
              Active users will continue using their cached data until it expires based on the TTL.
              New page loads and API calls will use the updated policy.
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSave}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCreatingNew} onOpenChange={setIsCreatingNew}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Create New Policy Version
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 space-y-4">
              <div>
                <Label className="text-white mb-2 block">Version Label</Label>
                <Input
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                  placeholder="e.g., Spring 2025 Performance Tune"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Notes</Label>
                <Textarea
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  placeholder="Describe the changes in this version..."
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateNewVersion}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              Create Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
