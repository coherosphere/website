
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Project } from '@/api/entities';
import { 
  X, 
  Users, 
  Zap, 
  Calendar,
  Target,
  Heart,
  HeartOff,
  Vote,
  ExternalLink,
  TrendingUp,
  Clock
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProjectDetail({ project, isOpen, onClose, onSupport, onVote, onProjectUpdate }) {
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
          setUserSupportsProject(false); // No project or no supporters means user doesn't support
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setCurrentUser(null); // Ensure currentUser is null on error
        setUserSupportsProject(false);
      }
    };

    if (isOpen && project) {
      loadCurrentUser();
    } else if (!isOpen) {
      // Reset state when modal closes
      setCurrentUser(null);
      setUserSupportsProject(false);
    }
  }, [isOpen, project]);

  if (!project) return null;

  const progressPercentage = project.funding_needed > 0 
    ? Math.min(100, (project.funding_raised / project.funding_needed) * 100)
    : 0;

  // Calculate days left based on funding_closed_date
  const calculateDaysLeft = () => {
    if (!project.funding_closed_date) return null; // No closing date set
    
    const now = new Date();
    const closedDate = new Date(project.funding_closed_date);
    
    // Check if the closedDate is valid before proceeding
    if (isNaN(closedDate.getTime())) {
      console.warn('Invalid funding_closed_date:', project.funding_closed_date);
      return null;
    }

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

  // Updated timeline phases
  const timeline = [
    { 
      phase: 'Ideation', 
      status: project?.status === 'ideation' ? 'active' : 
              ['planning', 'voting', 'funding', 'launch', 'completion', 'success'].includes(project?.status) ? 'completed' : 'upcoming',
      description: 'Concept development and initial planning'
    },
    { 
      phase: 'Planning', 
      status: project?.status === 'planning' ? 'active' : 
              ['voting', 'funding', 'launch', 'completion', 'success'].includes(project?.status) ? 'completed' :
              project?.status === 'ideation' ? 'upcoming' : 'upcoming', // Changed 'completed' to 'upcoming' for correct flow
      description: 'Detailed project planning and resource allocation'
    },
    { 
      phase: 'Voting & Alignment', 
      status: project?.status === 'voting' ? 'active' : 
              ['funding', 'launch', 'completion', 'success'].includes(project?.status) ? 'completed' :
              ['ideation', 'planning'].includes(project?.status) ? 'upcoming' : 'upcoming', // Changed 'completed' to 'upcoming' for correct flow
      description: 'Community voting and consensus building'
    },
    { 
      phase: 'Funding', 
      status: project?.status === 'funding' ? 'active' : 
              ['launch', 'completion', 'success'].includes(project?.status) ? 'completed' :
              ['ideation', 'planning', 'voting'].includes(project?.status) ? 'upcoming' : 'upcoming', // Changed 'completed' to 'upcoming' for correct flow
      description: 'Securing necessary resources and support'
    },
    { 
      phase: 'Launch & Implementation', 
      status: project?.status === 'launch' ? 'active' : 
              ['completion', 'success'].includes(project?.status) ? 'completed' :
              ['ideation', 'planning', 'voting', 'funding'].includes(project?.status) ? 'upcoming' : 'upcoming', // Changed 'completed' to 'upcoming' for correct flow
      description: 'Project execution and active development'
    },
    { 
      phase: 'Completion & Resonance Check', 
      status: project?.status === 'completion' ? 'active' : 
              project?.status === 'success' ? 'completed' :
              ['ideation', 'planning', 'voting', 'funding', 'launch'].includes(project?.status) ? 'upcoming' : 'upcoming', // Changed 'completed' to 'upcoming' for correct flow
      description: 'Final delivery and community impact assessment'
    }
  ];

  const supporters = [
    { name: 'Alice', avatar: '🌟', contribution: 25000 },
    { name: 'Bob', avatar: '⚡', contribution: 15000 },
    { name: 'Charlie', avatar: '🔥', contribution: 30000 },
    { name: 'Diana', avatar: '💫', contribution: 12000 },
  ];

  // Filter timeline to only show visible phases (exclude success, fail, cancelled)
  const visibleTimeline = timeline;

  const handleSupportProject = async () => {
    try {
      if (!currentUser) {
        console.warn('Cannot support project: No current user identified.');
        return;
      }
      
      const currentSupporters = project.supporters || [];
      if (currentSupporters.includes(currentUser.id)) {
        console.log('User is already supporting this project');
        return;
      }

      const updatedSupporters = [...currentSupporters, currentUser.id];
      
      // Record resonance event for PROJECT_SUPPORT
      try {
        // Base magnitude for supporting a project
        let magnitude = 2.0;
        
        // Check if user is creator or contributor (prevent double-counting)
        const isCreator = project.creator_id === currentUser.id;
        const isContributor = false; // TODO: Add contributors field if needed
        
        if (!isCreator && !isContributor) {
          // Calculate alignment score
          let alignmentScore = 1.0;
          
          if (project.manifesto_compliance === true) {
            alignmentScore = 1.1;
          }
          
          const manifestoValues = ['resilience', 'transparency', 'collective', 'community', 'governance'];
          const projectValues = (project.values || []).map(v => v.toLowerCase());
          const hasStrongAlignment = projectValues.filter(v => 
            manifestoValues.some(mv => v.includes(mv))
          ).length >= 2;
          
          if (hasStrongAlignment) {
            alignmentScore = 1.2;
          }

          // Record for user
          await base44.functions.invoke('recordResonanceEvent', {
            entity_type: 'user',
            entity_id: currentUser.id,
            action_type: 'PROJECT_SUPPORT',
            magnitude: magnitude,
            alignment_score: alignmentScore,
            hub_id: project.hub_id,
            metadata: {
              project_id: project.id,
              project_title: project.title,
              project_category: project.category,
              has_manifesto_compliance: project.manifesto_compliance
            }
          });

          // Record for project
          await base44.functions.invoke('recordResonanceEvent', {
            entity_type: 'project',
            entity_id: project.id,
            action_type: 'PROJECT_SUPPORT',
            magnitude: magnitude * 0.5,
            alignment_score: alignmentScore,
            hub_id: project.hub_id,
            metadata: {
              supporter_id: currentUser.id,
              total_supporters: updatedSupporters.length
            }
          });

          // Hub bonus
          if (project.hub_id) {
            await base44.functions.invoke('recordResonanceEvent', {
              entity_type: 'hub',
              entity_id: project.hub_id,
              action_type: 'PROJECT_SUPPORT',
              magnitude: 0.3,
              alignment_score: alignmentScore,
              metadata: {
                project_id: project.id,
                supporter_id: currentUser.id
              }
            });
          }

          console.log(`✓ Project support resonance recorded`);
        }
      } catch (error) {
        console.error('Failed to record resonance:', error);
      }
      
      const updatedProject = await Project.update(project.id, {
        ...project, // Include all existing project data
        goal: project.goal || project.description || "Project goal", // Fallback for missing goal
        manifesto_compliance: project.manifesto_compliance || true, // Fallback
        community_commitment: project.community_commitment || true, // Fallback
        supporters: updatedSupporters
      });

      setUserSupportsProject(true); // Update local state immediately
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject);
      }
      if (onSupport) {
        onSupport(updatedProject);
      }

      console.log(`Successfully added support! Total supporters: ${updatedSupporters.length}`);
      
    } catch (error) {
      console.error('Error supporting project:', error);
      // You might want to show a user-friendly error message here
    }
  };

  const handleRemoveSupport = async () => {
    try {
      if (!currentUser) {
        console.warn('Cannot remove support: No current user identified.');
        return;
      }
      
      const currentSupporters = project.supporters || [];
      const updatedSupporters = currentSupporters.filter(id => id !== currentUser.id);
      
      const updatedProject = await Project.update(project.id, {
        ...project, // Include all existing project data
        goal: project.goal || project.description || "Project goal", // Fallback for missing goal
        manifesto_compliance: project.manifesto_compliance || true, // Fallback
        community_commitment: project.community_commitment || true, // Fallback
        supporters: updatedSupporters
      });

      setUserSupportsProject(false); // Update local state immediately
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject);
      }
      if (onSupport) {
        onSupport(updatedProject);
      }

      console.log(`Successfully removed support! Total supporters: ${updatedSupporters.length}`);
      
    } catch (error) {
      console.error('Error removing support from project:', error);
      // You might want to show a user-friendly error message here
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-slate-800/95 backdrop-blur-sm border-slate-700">
              <CardHeader className="relative pb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                  onClick={onClose}
                >
                  <X className="w-5 h-5" />
                </Button>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center">
                    <Target className="w-8 h-8 text-orange-400" />
                  </div>
                  
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white mb-2">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className={`border ${categoryColors[project.category]}`}>
                        {project.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>Created {new Date(project.created_date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Project Description</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Funding Progress */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Funding Progress</h3>
                  <div className="bg-slate-900/50 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-slate-300 font-medium">
                        {project.funding_raised?.toLocaleString() || 0} / {project.funding_needed?.toLocaleString() || 0} sats
                      </span>
                      <span className="text-orange-400 font-bold">
                        {Math.round(progressPercentage)}% funded
                      </span>
                    </div>
                    
                    <div className="relative">
                      <Progress value={progressPercentage} className="h-3 bg-slate-700" />
                      <div 
                        className="absolute top-0 left-0 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 shadow-lg shadow-orange-500/30"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Updated Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Project Timeline</h3>
                  <div className="space-y-4">
                    {visibleTimeline.map((phase, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${
                          phase.status === 'completed' ? 'bg-green-500 border-green-500' :
                          phase.status === 'active' ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30' :
                          'border-slate-500 bg-slate-800'
                        }`}>
                          {phase.status === 'completed' && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                          {phase.status === 'active' && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`font-medium ${
                                phase.status === 'completed' ? 'text-green-400' :
                                phase.status === 'active' ? 'text-orange-400' :
                                'text-slate-400'
                              }`}>
                                {phase.phase}
                              </span>
                              <p className="text-sm text-slate-500 mt-1">
                                {phase.description}
                              </p>
                            </div>
                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                              phase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              phase.status === 'active' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {phase.status === 'completed' ? 'Completed' :
                               phase.status === 'active' ? 'In Progress' :
                               'Upcoming'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resonance Contributors */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Resonance Contributors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supporters.map((supporter, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center text-lg">
                          {supporter.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{supporter.name}</div>
                          <div className="text-sm text-slate-400">
                            {supporter.contribution.toLocaleString()} sats
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{(project.supporters?.length || 0)}</div>
                    <div className="text-sm text-slate-400">Supporters</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <Zap className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{project.funding_raised?.toLocaleString() || 0}</div>
                    <div className="text-sm text-slate-400">Sats Raised</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-orange-400">
                      {project.realResonance ? project.realResonance.toFixed(1) : '0.0'}
                    </div>
                    <div className="text-sm text-slate-400">Resonance</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{daysLeft !== null ? daysLeft : '—'}</div>
                    <div className="text-sm text-slate-400">Days Left</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-700">
                  {currentUser && (
                    userSupportsProject ? (
                      <Button
                        onClick={handleRemoveSupport}
                        variant="outline"
                        className="flex-grow bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500 font-semibold py-3"
                        style={{ minWidth: '180px' }}
                      >
                        <HeartOff className="w-4 h-4 mr-2" />
                        Remove Support
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSupportProject}
                        className="flex-grow bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
                        style={{ minWidth: '180px' }}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Support Project
                      </Button>
                    )
                  )}
                  
                  <div className="flex-grow flex gap-4">
                    {/* Vote/Fund Button - only show for voting or funding status */}
                    {(project.status === 'voting' || project.status === 'funding') && (
                      <Button
                        variant="outline"
                        onClick={project.status === 'voting' ? () => onVote(project) : () => {/* TODO: Handle funding */}}
                        className="btn-secondary-coherosphere py-3 flex-1"
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
                    <Button
                      variant="outline"
                      className="btn-secondary-coherosphere py-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
