
import React, { useState, useEffect } from 'react';
import { User, Hub, Project } from '@/api/entities';
import { motion } from 'framer-motion';
import { UserCircle, Copy, QrCode, MapPin, Heart, Zap, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import ProfileHeader from '@/components/profile/ProfileHeader';
import HubSelector from '@/components/profile/HubSelector';
import SupportedProjects from '@/components/profile/SupportedProjects';
import ValuesEditor from '@/components/profile/ValuesEditor';
import SkillsEditor from '@/components/profile/SkillsEditor';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [supportedProjects, setSupportedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [error, setError] = useState(null);

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
      setSelectedHubId(userData.hub_id || ''); // Changed from userData.location to userData.hub_id
      setValues(userData.values || ['Resilience', 'Innovation', 'Community']);
      setSkills(userData.skills || ['Web Development', 'Community Building']);

      // Load hubs
      await new Promise(resolve => setTimeout(resolve, 200));
      const hubData = await Hub.list();
      setHubs(hubData);

      // FIX: Load ALL projects and filter for the ones the user actually supports
      await new Promise(resolve => setTimeout(resolve, 200));
      const allProjects = await Project.list();
      
      const userSupportedProjects = allProjects.filter(project => 
        project.supporters && Array.isArray(project.supporters) && project.supporters.includes(userData.id)
      );

      console.log(`User ${userData.id} supports ${userSupportedProjects.length} projects.`);
      setSupportedProjects(userSupportedProjects);

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
        hub_id: selectedHubId, // Changed from location to hub_id
        values: values,
        skills: skills,
        resonance_score: (user.resonance_score || 0) + 1 // Small boost for engagement
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
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
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
