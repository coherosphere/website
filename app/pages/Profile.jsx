
import React, { useState, useEffect } from 'react';
import { User, Hub, Project, Resource, Event, LearningCircle } from '@/api/entities';
import { motion } from 'framer-motion';
import { UserCircle, Copy, QrCode, MapPin, Heart, Zap, Save, AlertTriangle, BookOpen, Calendar, Users, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import ProfileHeader from '@/components/profile/ProfileHeader';
import HubSelector from '@/components/profile/HubSelector';
import SupportedProjects from '@/components/profile/SupportedProjects';
import ValuesEditor from '@/components/profile/ValuesEditor';
import SkillsEditor from '@/components/profile/SkillsEditor';
import StatCard from '@/components/StatCard';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [supportedProjects, setSupportedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [error, setError] = useState(null);

  // User statistics
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

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load user data
      const userData = await User.me();
      setUser(userData);
      
      // Initialize form state
      setSelectedHubId(userData.hub_id || '');
      setValues(userData.values || ['Resilience', 'Innovation', 'Community']);
      setSkills(userData.skills || ['Web Development', 'Community Building']);

      // Load hubs
      const hubData = await Hub.list();
      setHubs(hubData);

      // Load ALL projects and filter for the ones the user actually supports
      const allProjects = await Project.list();
      
      const userSupportedProjects = allProjects.filter(project => 
        project.supporters && Array.isArray(project.supporters) && project.supporters.includes(userData.id)
      );

      console.log(`User ${userData.id} supports ${userSupportedProjects.length} projects.`);
      setSupportedProjects(userSupportedProjects);

      // Calculate user statistics
      const [resources, events, circles, projects] = await Promise.all([
        Resource.list().catch(() => []),
        Event.list().catch(() => []),
        LearningCircle.list().catch(() => []),
        Project.list().catch(() => [])
      ]);

      const userCreatedResources = resources.filter(r => r.creator_id === userData.id || r.created_by === userData.email);
      const userHostedEvents = events.filter(e => e.organizer_id === userData.id);
      const userStartedCircles = circles.filter(c => c.participants && c.participants.length > 0 && c.participants[0] === userData.id); // Assuming first participant is creator
      const userStartedProjects = projects.filter(p => p.creator_id === userData.id);

      setStats({
        sharedKnowledge: userCreatedResources.length,
        hostedEvents: userHostedEvents.length,
        startedCircles: userStartedCircles.length,
        supportedProjects: userSupportedProjects.length,
        startedProjects: userStartedProjects.length,
      });

    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Unable to load profile data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Update user profile with new values and skills
      await User.updateMyUserData({
        hub_id: selectedHubId,
        values: values,
        skills: skills,
        resonance_score: (user.resonance_score || 0) + 1
      });

      setSaveMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToNostr = () => {
    // This would integrate with Nostr in a real implementation
    setSaveMessage('Profile published to Nostr network!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  if (isLoading) {
    return (
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
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <div className="text-orange-400 text-xl font-semibold mb-4">{error}</div>
            <Button 
              onClick={loadProfileData}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
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
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
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
          {/* Profile Header */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ProfileHeader user={user} />
          </motion.div>

          {/* Hub Selection */}
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

          {/* Supported Projects */}
          <motion.div
            className="relative z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SupportedProjects 
              projects={supportedProjects} 
              user={user}
              onProjectsUpdate={loadProfileData}
            />
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Values Section */}
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

          {/* Skills Section */}
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
          variant="outline"
          className="btn-secondary-coherosphere flex-1 py-3"
        >
          <Zap className="w-4 h-4 mr-2" />
          Publish to Nostr
        </Button>
      </motion.div>
    </div>
  );
}
