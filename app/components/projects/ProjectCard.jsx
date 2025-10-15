
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Project } from '@/api/entities';
import {
  Users,
  Zap,
  Vote,
  Heart,
  Calendar,
  Target,
  TrendingUp,
  HeartOff,
  Clock // Added Clock icon
} from 'lucide-react';
import { base44 } from '@/api/base44Client'; // Added import for base44

export default function ProjectCard({ project, index, onCardClick, onSupport, onVote, isDisabled = false }) {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [userSupportsProject, setUserSupportsProject] = React.useState(false);

  React.useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Check if user supports this project
        if (project && project.supporters) {
          setUserSupportsProject(project.supporters.includes(user.id));
        } else {
          setUserSupportsProject(false);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setCurrentUser(null);
        setUserSupportsProject(false);
      }
    };

    loadCurrentUser();
  }, [project]); // Re-run when project changes to update support status for the new project

  // Update userSupportsProject when project.supporters changes (e.g., after an update)
  React.useEffect(() => {
    if (currentUser && project && project.supporters) {
      setUserSupportsProject(project.supporters.includes(currentUser.id));
    }
  }, [project, currentUser]); // Fixed dependency array to include 'project'

  const progressPercentage = project.funding_needed > 0
    ? Math.min(100, (project.funding_raised / project.funding_needed) * 100)
    : 0;

  // Calculate days left based on funding_closed_date
  const calculateDaysLeft = () => {
    if (!project.funding_closed_date) return null; // No closing date set

    const now = new Date();
    const closedDate = new Date(project.funding_closed_date);

    // Set time to 00:00:00 for accurate day calculation
    now.setHours(0, 0, 0, 0);
    closedDate.setHours(0, 0, 0, 0);

    const diffTime = closedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Use ceil to count partial days as full days

    // If diffDays is negative (date is in the past) or 0 (today), show 0 days left
    return Math.max(0, diffDays);
  };

  const daysLeft = calculateDaysLeft();

  const categoryColors = {
    resilience: 'bg-green-500/20 text-green-400 border-green-500/30',
    technology: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    community: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    learning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    environment: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    governance: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  };

  const statusColors = {
    proposed: 'bg-slate-500/20 text-slate-400',
    voting: 'bg-blue-500/20 text-blue-400',
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-red-500/20 text-red-400',
    funding: 'bg-blue-500/20 text-white',
  };

  const resonanceTags = project.values || ['Resilience', 'Innovation', 'Community'];

  const handleSupportProject = async (e) => {
    e.stopPropagation();

    // Don't allow support for disabled projects
    if (isDisabled) return;

    try {
      // Get current user if not already loaded
      const user = currentUser || await User.me();
      if (!user) {
        console.error('User not authenticated.');
        return;
      }

      const currentSupporters = project.supporters || [];
      const isCurrentlySupporting = currentSupporters.includes(user.id);

      let updatedSupporters;
      if (isCurrentlySupporting) {
        // Remove support
        updatedSupporters = currentSupporters.filter(id => id !== user.id);
        console.log('Removing support from project');
      } else {
        // Add support
        updatedSupporters = [...currentSupporters, user.id];
        console.log('Adding support to project');
        
        // Record resonance event for PROJECT_SUPPORT
        try {
          // Base magnitude for supporting a project
          let magnitude = 2.0;
          
          // Check if user is creator or contributor (prevent double-counting)
          const isCreator = project.creator_id === user.id;
          const isContributor = false; // TODO: Add contributors field to project if needed
          
          if (!isCreator && !isContributor) {
            // Calculate alignment score based on project's manifesto compliance
            let alignmentScore = 1.0;
            
            // Check manifesto alignment
            if (project.manifesto_compliance === true) {
              alignmentScore = 1.1;
            }
            
            // Bonus if project has strong manifesto values
            const manifestoValues = ['resilience', 'transparency', 'collective', 'community', 'governance'];
            const projectValues = (project.values || []).map(v => v.toLowerCase());
            const hasStrongAlignment = projectValues.filter(v => 
              manifestoValues.some(mv => v.includes(mv))
            ).length >= 2;
            
            if (hasStrongAlignment) {
              alignmentScore = 1.2;
            }

            // Record for the supporter (User entity)
            await base44.functions.invoke('recordResonanceEvent', {
              entity_type: 'user',
              entity_id: user.id,
              action_type: 'PROJECT_SUPPORT',
              magnitude: magnitude,
              alignment_score: alignmentScore,
              hub_id: project.hub_id,
              metadata: {
                project_id: project.id,
                project_title: project.title,
                project_category: project.category,
                project_status: project.status,
                has_manifesto_compliance: project.manifesto_compliance,
                has_strong_alignment: hasStrongAlignment
              }
            });

            // Record for the project itself
            await base44.functions.invoke('recordResonanceEvent', {
              entity_type: 'project',
              entity_id: project.id,
              action_type: 'PROJECT_SUPPORT',
              magnitude: magnitude * 0.5, // Project gets half the points
              alignment_score: alignmentScore,
              hub_id: project.hub_id,
              metadata: {
                supporter_id: user.id,
                total_supporters: updatedSupporters.length
              }
            });

            // If project is in a hub, give hub a small bonus
            if (project.hub_id) {
              await base44.functions.invoke('recordResonanceEvent', {
                entity_type: 'hub',
                entity_id: project.hub_id,
                action_type: 'PROJECT_SUPPORT',
                magnitude: 0.3,
                alignment_score: alignmentScore,
                metadata: {
                  project_id: project.id,
                  supporter_id: user.id
                }
              });
            }

            console.log(`✓ Project support resonance recorded (${magnitude} points)`);
          } else {
            console.log('User is creator/contributor - no support bonus to prevent double-counting');
          }
        } catch (error) {
          console.error('Failed to record resonance event:', error);
          // Don't fail the support action if resonance recording fails
        }
      }

      // Update the project in the database - include all required fields with fallbacks
      const updatedProject = await Project.update(project.id, {
        ...project, // Include all existing project data
        goal: project.goal || project.description || "Project goal", // Fallback for missing goal
        manifesto_compliance: project.manifesto_compliance || true, // Fallback
        community_commitment: project.community_commitment || true, // Fallback
        supporters: updatedSupporters
      });

      // Update local state
      setUserSupportsProject(!isCurrentlySupporting);

      // Call the callback to update the parent component's state
      if (onSupport) {
        onSupport(updatedProject);
      }

      console.log(`Successfully ${isCurrentlySupporting ? 'removed' : 'added'} support! Total supporters: ${updatedSupporters.length}`);

    } catch (error) {
      console.error('Error updating project support:', error);
      // You might want to show a user-friendly error message here
    }
  };

  const handleVoteClick = (e) => {
    e.stopPropagation();
    if (isDisabled) return;
    onVote(project);
  };

  const handleCardClickWrapper = () => {
    if (isDisabled) return;
    onCardClick(project);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={isDisabled ? {} : { y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card
        className={`group transition-all duration-300 overflow-hidden h-full flex flex-col ${
          isDisabled
            ? 'bg-slate-800/20 border-slate-800 opacity-50 cursor-not-allowed'
            : 'bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 hover:border-orange-500/50 cursor-pointer'
        }`}
        onClick={handleCardClickWrapper}
      >
        <CardContent className="p-6 flex flex-col flex-grow">
          {/* Content that can grow */}
          <div className="flex-grow">
            {/* Header with icon and status */}
            <div className="flex items-start gap-3 mb-4">
              {/* Project Icon */}
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isDisabled
                  ? 'bg-slate-700/20 border-slate-700/30'
                  : 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30 group-hover:shadow-lg group-hover:shadow-orange-500/20'
              }`}>
                <Target className={`w-6 h-6 ${isDisabled ? 'text-slate-500' : 'text-orange-400'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={`text-xl font-bold transition-colors duration-300 break-words ${
                  isDisabled
                    ? 'text-slate-500'
                    : 'text-white group-hover:text-orange-400'
                }`}>
                  {project.title}
                </h3>

                {/* Tags moved under title for better mobile layout */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className={`border ${statusColors[project.status]} ${
                    isDisabled ? 'opacity-50' : ''
                  }`}>
                    {project.status}
                  </Badge>
                  <Badge variant="outline" className={`border ${categoryColors[project.category]} ${
                    isDisabled ? 'opacity-50' : ''
                  }`}>
                    {project.category}
                  </Badge>
                  <Badge variant="outline" className={`border-slate-700 text-slate-400 ${
                    isDisabled ? 'opacity-50' : ''
                  }`}>
                    <Calendar className="w-3 h-3 mr-1.5" />
                    <span>{new Date(project.created_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className={`leading-relaxed mb-4 line-clamp-3 ${
              isDisabled ? 'text-slate-500' : 'text-slate-300'
            }`}>
              {project.description}
            </p>

            {/* Resonance Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {resonanceTags.slice(0, 3).map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className={`text-xs ${
                    isDisabled
                      ? 'bg-slate-700/30 text-slate-500'
                      : 'bg-slate-700/50 text-slate-300'
                  }`}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Progress Visualization */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${
                  isDisabled ? 'text-slate-500' : 'text-slate-300'
                }`}>Funding Progress</span>
                <span className={`text-sm ${
                  isDisabled ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {project.funding_raised?.toLocaleString() || 0} / {project.funding_needed?.toLocaleString() || 0} sats
                </span>
              </div>

              {/* Custom Progress Bar with Resonance Effect */}
              <div className="relative">
                <Progress
                  value={progressPercentage}
                  className={`h-2 ${isDisabled ? 'bg-slate-800' : 'bg-slate-700'}`}
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${
                    isDisabled
                      ? 'bg-slate-600'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fixed bottom section with stats and buttons */}
          <div className="mt-auto">
            {/* Activity Indicators */}
            <div className="grid grid-cols-4 gap-4 text-center mb-4">
              <div className="text-sm">
                <div className={`flex items-center justify-center gap-1 ${
                  isDisabled ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  <Users className="w-3 h-3" />
                  <span>{project.supporters?.length || 0}</span>
                </div>
                <span className={`text-xs ${isDisabled ? 'text-slate-600' : 'text-slate-500'}`}>Supporters</span>
              </div>
              <div className="text-sm">
                <div className={`flex items-center justify-center gap-1 ${
                  isDisabled ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  <Zap className="w-3 h-3" />
                  <span>{project.funding_raised?.toLocaleString() || 0}</span>
                </div>
                <span className={`text-xs ${isDisabled ? 'text-slate-600' : 'text-slate-500'}`}>Sats Raised</span>
              </div>
              <div className="text-sm">
                <div className={`flex items-center justify-center gap-1 ${
                  isDisabled ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  <span>{project.realResonance ? project.realResonance.toFixed(1) : '0.0'}</span>
                </div>
                <span className={`text-xs ${isDisabled ? 'text-slate-600' : 'text-slate-500'}`}>Resonance</span>
              </div>
              {/* New "Days Left" indicator */}
              <div className="text-sm">
                <div className={`flex items-center justify-center gap-1 ${
                  isDisabled ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span>{daysLeft !== null ? daysLeft : '—'}</span>
                </div>
                <span className={`text-xs ${isDisabled ? 'text-slate-600' : 'text-slate-500'}`}>Days Left</span>
              </div>
            </div>

            {/* Action Buttons - pushed to the bottom */}
            <div className="flex gap-3 mt-auto">
              {userSupportsProject ? (
                <Button
                  onClick={handleSupportProject}
                  disabled={isDisabled}
                  variant="outline"
                  className={`flex-1 font-semibold ${
                    isDisabled
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed hover:bg-slate-700'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <HeartOff className="w-4 h-4 mr-2" />
                  Remove Support
                </Button>
              ) : (
                <Button
                  onClick={handleSupportProject}
                  disabled={isDisabled}
                  className={`flex-1 font-semibold ${
                    isDisabled
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed hover:bg-slate-700'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                  }`}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Support Project
                </Button>
              )}

              {/* Vote/Fund Button - only show for voting or funding status */}
              {(project.status === 'voting' || project.status === 'funding') && (
                <Button
                  variant="outline"
                  onClick={project.status === 'voting' ? handleVoteClick : () => {/* TODO: Handle funding */}}
                  disabled={isDisabled}
                  className={isDisabled ? 'cursor-not-allowed opacity-50' : 'btn-secondary-coherosphere'}
                >
                  {project.status === 'voting' ? (
                    <>
                      <Vote className="w-4 h-4 mr-2" />
                      Vote
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Fund
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
