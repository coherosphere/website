
import React, { useState, useEffect } from 'react';
import { User, Hub, Project, Resource, Event, LearningCircle } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { UserCircle, Copy, QrCode, MapPin, Heart, Activity, Save, AlertTriangle, BookOpen, Calendar, Users, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ProfileHeader from '@/components/profile/ProfileHeader';
import HubSelector from '@/components/profile/HubSelector';
import SupportedProjects from '@/components/profile/SupportedProjects';
import ValuesEditor from '@/components/profile/ValuesEditor';
import SkillsEditor from '@/components/profile/SkillsEditor';
import StatCard from '@/components/StatCard';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import RecentConversations from '@/components/profile/RecentConversations';
import { useCachedData } from '@/components/caching/useCachedData';
import ScreensaverToggle from '@/components/profile/ScreensaverToggle';
import { useUser } from '@/components/auth/UserContext';

export default function Profile() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [canPostToNostr, setCanPostToNostr] = useState(true);
  const [daysUntilNextPost, setDaysUntilNextPost] = useState(0);
  const [resonanceScore, setResonanceScore] = useState(0);
  const [isLoadingResonance, setIsLoadingResonance] = useState(true);
  const [stats, setStats] = useState({
    sharedKnowledge: 0,
    hostedEvents: 0,
    startedCircles: 0,
    supportedProjects: 0,
    startedProjects: 0,
  });

  // Form state
  const [selectedHubId, setSelectedHubId] = useState('');
  const [values, setValues] = useState([]);
  const [skills, setSkills] = useState([]);
  const [screensaverEnabled, setScreensaverEnabled] = useState(true);

  const { refreshUser } = useUser(); // Add this to get refreshUser function

  // Use cached data
  const { data: user, isLoading: userLoading, refetch: refetchUser } = useCachedData(
    ['profile', 'user'],
    () => User.me(),
    'profile'
  );

  const { data: hubs = [], isLoading: hubsLoading } = useCachedData(
    ['profile', 'hubs'],
    () => Hub.list(),
    'profile'
  );

  const { data: allProjects = [], isLoading: projectsLoading } = useCachedData(
    ['profile', 'projects'],
    () => Project.list(),
    'profile'
  );

  const { data: resources = [], isLoading: resourcesLoading } = useCachedData(
    ['profile', 'resources'],
    () => Resource.list().catch(() => []),
    'profile'
  );

  const { data: events = [], isLoading: eventsLoading } = useCachedData(
    ['profile', 'events'],
    () => Event.list().catch(() => []),
    'profile'
  );

  const { data: circles = [], isLoading: circlesLoading } = useCachedData(
    ['profile', 'circles'],
    () => LearningCircle.list().catch(() => []),
    'profile'
  );

  const isLoading = userLoading || hubsLoading || projectsLoading || resourcesLoading || eventsLoading || circlesLoading;

  // Initialize form state when user data loads
  useEffect(() => {
    if (user) {
      setSelectedHubId(user.hub_id || '');
      setValues(user.values || ['Resilience', 'Innovation', 'Community']);
      setSkills(user.skills || ['Web Development', 'Community Building']);
      setScreensaverEnabled(user.screensaver_enabled !== false); // Default to true if not set or is null/undefined
      
      console.log('[Profile] User screensaver_enabled:', user.screensaver_enabled);
    }
  }, [user]);

  // Check Nostr posting cooldown
  useEffect(() => {
    if (user?.last_nostr_post_date) {
      const lastPostDate = new Date(user.last_nostr_post_date);
      const now = new Date();
      const timeDiff = now.getTime() - lastPostDate.getTime();
      const daysSinceLastPost = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const daysRemaining = 20 - daysSinceLastPost;

      if (daysRemaining > 0) {
        setCanPostToNostr(false);
        setDaysUntilNextPost(daysRemaining);
      } else {
        setCanPostToNostr(true);
        setDaysUntilNextPost(0);
      }
    } else {
      setCanPostToNostr(true);
      setDaysUntilNextPost(0);
    }
  }, [user]);

  // Load resonance score
  useEffect(() => {
    const loadResonance = async () => {
      if (!user) return;
      
      setIsLoadingResonance(true);
      try {
        const scoreResponse = await base44.functions.invoke('getResonanceScore', {
          entity_type: 'user',
          entity_id: user.id
        });

        if (scoreResponse.data && scoreResponse.data.exists) {
          setResonanceScore(Math.round(scoreResponse.data.score_total));
        } else {
          setResonanceScore(0);
        }
      } catch (error) {
        console.error('Error loading resonance score:', error);
        setResonanceScore(0);
      } finally {
        setIsLoadingResonance(false);
      }
    };

    loadResonance();
  }, [user]);

  // Calculate stats
  useEffect(() => {
    if (!user) return;

    const supportedProjects = allProjects.filter(project =>
      project.supporters && Array.isArray(project.supporters) && project.supporters.includes(user.id)
    );

    const userCreatedResources = resources.filter(r => r.creator_id === user.id || r.created_by === user.email);
    const userHostedEvents = events.filter(e => e.organizer_id === user.id);
    const userStartedCircles = circles.filter(c => c.participants && c.participants.length > 0 && c.participants[0] === user.id);
    const userStartedProjects = allProjects.filter(p => p.creator_id === user.id);

    setStats({
      sharedKnowledge: userCreatedResources.length,
      hostedEvents: userHostedEvents.length,
      startedCircles: userStartedCircles.length,
      supportedProjects: supportedProjects.length,
      startedProjects: userStartedProjects.length,
    });
  }, [user, allProjects, resources, events, circles]);

  const supportedProjects = React.useMemo(() => {
    if (!user) return [];
    return allProjects.filter(project =>
      project.supporters && Array.isArray(project.supporters) && project.supporters.includes(user.id)
    );
  }, [user, allProjects]);

  const handleSaveChanges = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      console.log('[Profile] Saving screensaver_enabled:', screensaverEnabled);
      
      await User.updateMyUserData({
        hub_id: selectedHubId,
        values: values,
        skills: skills,
        screensaver_enabled: screensaverEnabled,
        resonance_score: (user.resonance_score || 0) + 1
      });

      setSaveMessage('Profile updated successfully!');
      await refetchUser(); // Refetch user data
      
      // CRITICAL: Also refresh the UserContext so IdleScreensaver gets the new value
      await refreshUser();
      
      console.log('[Profile] User data saved and UserContext refreshed');

      setTimeout(() => setSaveMessage(null), 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToNostr = async () => {
    if (!user || !canPostToNostr) return;

    setSaveMessage('Publishing to Nostr...');

    try {
      const content = "I'm on coherosphere — where humans, technology, and values resonate together. join https://coherosphere.com";

      const response = await base44.functions.invoke('publishNostrNote', {
        content
      });

      if (response.data.publishStatus === 'published') {
        await User.updateMyUserData({
          last_nostr_post_date: new Date().toISOString()
        });

        try {
          await base44.functions.invoke('recordResonanceEvent', {
            entity_type: 'user',
            entity_id: user.id,
            action_type: 'NOSTR_SIGNAL',
            magnitude: 1.0,
            alignment_score: 1.0,
            metadata: {
              content: content,
              relays_published: response.data.successCount,
              total_relays: response.data.totalRelays,
              publish_status: response.data.publishStatus
            }
          });

          console.log('✓ Nostr signal resonance recorded (+1 point)');
        } catch (error) {
          console.error('Failed to record resonance event:', error);
        }

        await refetchUser();

        setSaveMessage(`✓ Published to Nostr! (${response.data.successCount}/${response.data.totalRelays} relays) +1 Resonance`);
      } else if (response.data.publishStatus === 'partial') {
        setSaveMessage(`⚠ Partially published to ${response.data.successCount}/${response.data.totalRelays} relays`);
      } else {
        setSaveMessage('✗ Failed to publish to Nostr. Please try again.');
      }

      setTimeout(() => setSaveMessage(null), 5000);

    } catch (err) {
      console.error('Error publishing to Nostr:', err);
      setSaveMessage('Failed to publish to Nostr. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleProjectsUpdate = async () => {
    // React Query will handle refetch automatically
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
            <div className="text-slate-400 text-lg mt-4">Loading...</div>
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
          <UserCircle className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              My Profile
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Your resonance identity – hubs, projects, values, and skills.
        </p>
      </div>

      {/* Stats Bar */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <Link to={createPageUrl('UserResonance')} className="block">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-orange-500/50 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 h-full cursor-pointer group">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-8 h-8 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {isLoadingResonance ? (
                  <div className="h-8 w-12 mx-auto bg-slate-700 animate-pulse rounded" />
                ) : (
                  resonanceScore
                )}
              </div>
              <div className="text-slate-300 text-sm flex items-center justify-center gap-1">
                User Resonance
                <TrendingUp className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <StatCard
          icon={BookOpen}
          value={stats.sharedKnowledge}
          label="Shared Knowledge"
          color="text-green-500"
          isLoading={false}
        />
        <StatCard
          icon={Calendar}
          value={stats.hostedEvents}
          label="Hosted Events"
          color="text-blue-500"
          isLoading={false}
        />
        <StatCard
          icon={Users}
          value={stats.startedCircles}
          label="Started Circles"
          color="text-purple-500"
          isLoading={false}
        />
        <StatCard
          icon={Heart}
          value={stats.supportedProjects}
          label="Supported Projects"
          color="text-red-400"
          isLoading={false}
        />
        <StatCard
          icon={Lightbulb}
          value={stats.startedProjects}
          label="Started Projects"
          color="text-orange-500"
          isLoading={false}
        />
      </motion.div>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-green-400">
              {saveMessage}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Two-Column Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ProfileHeader user={user} />
          </motion.div>

          <motion.div
            className="relative z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <HubSelector
              hubs={hubs}
              selectedHubId={selectedHubId}
              onHubChange={setSelectedHubId}
            />
          </motion.div>

          <motion.div
            className="relative z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SupportedProjects
              projects={supportedProjects}
              user={user}
              onProjectsUpdate={handleProjectsUpdate}
            />
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <motion.div
            className="relative z-25"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <RecentConversations user={user} />
          </motion.div>

          <motion.div
            className="relative z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ValuesEditor
              values={values}
              onValuesChange={setValues}
            />
          </motion.div>

          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <SkillsEditor
              skills={skills}
              onSkillsChange={setSkills}
            />
          </motion.div>

          <motion.div
            className="relative z-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <ScreensaverToggle
              enabled={screensaverEnabled}
              onToggle={() => setScreensaverEnabled(!screensaverEnabled)}
            />
          </motion.div>
        </div>
      </div>

      {/* Action Buttons - Full Width Below Grid */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t border-slate-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          onClick={handlePublishToNostr}
          disabled={!canPostToNostr}
          variant="outline"
          className="btn-secondary-coherosphere flex-1 py-3"
          title={!canPostToNostr ? `Available again in ${daysUntilNextPost} days` : ''}
        >
          <Activity className="w-4 h-4 mr-2" />
          {!canPostToNostr ? `Resonate again in ${daysUntilNextPost}d` : 'Resonate on Nostr'}
        </Button>
      </motion.div>
    </div>
  );
}
