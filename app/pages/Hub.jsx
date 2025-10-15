import React, { useState, useEffect } from "react";
import { Hub, Project, Event, User } from "@/api/entities";
import { motion } from "framer-motion";
import { MapPin, Users, Lightbulb, Calendar, Plus, Zap, UserCircle, AlertTriangle, Bitcoin, ArrowLeft, Globe2, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';

import ProjectCard from "@/components/projects/ProjectCard";
import ProjectDetail from "@/components/projects/ProjectDetail";
import EventCard from "@/components/hub/EventCard";
import MemberCard from "@/components/hub/MemberCard";
import EventDetail from "@/components/hub/EventDetail";
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachedData } from '@/components/caching/useCachedData';

// Mock data for members as we can't insert into User entity
const mockMembers = [
  { id: '1', display_name: 'ResonantDev', bio: 'Building bridges between worlds.', avatar_url: 'https://i.pravatar.cc/150?u=dev1', skills: ['React', 'Solidity', 'Design'] },
  { id: '2', display_name: 'CommunityWeaver', bio: 'Connecting people and ideas.', avatar_url: 'https://i.pravatar.cc/150?u=dev2', skills: ['Facilitation', 'Writing'] },
  { id: '3', display_name: 'EcoSAGE', bio: 'Nurturing resilient ecosystems.', avatar_url: 'https://i.pravatar.cc/150?u=dev3', skills: ['Permaculture', 'Systems Thinking'] },
  { id: '4', display_name: 'TechAlchemist', bio: 'Transmuting code into value.', avatar_url: 'https://i.pravatar.cc/150?u=dev4', skills: ['AI', 'Nostr', 'Bitcoin'] },
  { id: '5', display_name: 'StorySeer', bio: 'Weaving narratives of the future.', avatar_url: 'https://i.pravatar.cc/150?u=dev5', skills: ['Filmmaking', 'Storytelling'] },
  { id: '6', display_name: 'SoundHealer', bio: 'Harmonizing communities with sound.', avatar_url: 'https://i.pravatar.cc/150?u=dev6', skills: ['Music', 'Meditation'] }
];

export default function HubPage() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  const [isExternalHub, setIsExternalHub] = useState(false);
  const [hubId, setHubId] = useState(null);
  const [hub, setHub] = useState(null);
  const [stats, setStats] = useState({
    members: mockMembers.length,
    projects: 0,
    events: 0,
    satsRaised: 0,
    satsNeeded: 0,
    hubResonance: 0,
  });

  const { setLoading } = useLoading();

  // Determine which hub to load (from URL or user's selected hub)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hubIdParam = urlParams.get('hubId');
    
    if (hubIdParam) {
      setIsExternalHub(true);
      setHubId(hubIdParam);
    } else {
      setIsExternalHub(false);
      setHubId('user'); // Will fetch user first to get their hub_id
    }
  }, []);

  // Use cached data for current user (only if not external hub)
  const { data: currentUser, isLoading: userLoading } = useCachedData(
    ['hub', 'currentUser'],
    () => User.me(),
    'hub',
    { enabled: hubId === 'user' } // Only fetch if we need user's hub
  );

  // Determine actual hub ID after user is loaded
  const actualHubId = hubId === 'user' ? currentUser?.hub_id : hubId;

  // Use cached data for hubs
  const { data: allHubs = [], isLoading: hubsLoading } = useCachedData(
    ['hub', 'hubs'],
    () => Hub.list(),
    'hub',
    { enabled: !!actualHubId } // Only fetch when we have a hub ID
  );

  // Use cached data for projects
  const { data: projects = [], isLoading: projectsLoading } = useCachedData(
    ['hub', 'projects', actualHubId],
    () => Project.filter({ hub_id: actualHubId }),
    'hub',
    { enabled: !!actualHubId }
  );

  // Use cached data for events
  const { data: events = [], isLoading: eventsLoading } = useCachedData(
    ['hub', 'events', actualHubId],
    () => Event.filter({ hub_id: actualHubId }),
    'hub',
    { enabled: !!actualHubId }
  );

  // Use cached data for resonance score
  const { data: resonanceData, isLoading: resonanceLoading } = useCachedData(
    ['hub', 'resonance', actualHubId],
    async () => {
      try {
        const response = await base44.functions.invoke('getResonanceScore', {
          entity_type: 'hub',
          entity_id: actualHubId
        });
        return response.data;
      } catch (error) {
        console.error('Error loading hub resonance:', error);
        return null;
      }
    },
    'hub',
    { enabled: !!actualHubId }
  );

  const isLoading = (hubId === 'user' && userLoading) || hubsLoading || projectsLoading || eventsLoading || resonanceLoading;

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Set hub when data is loaded
  useEffect(() => {
    if (!actualHubId || allHubs.length === 0) return;

    const currentHub = allHubs.find(h => h.id === actualHubId);
    
    if (!currentHub) {
      if (isExternalHub) {
        setError("Hub not found. Please select a valid hub from the Global Hubs page.");
      } else {
        setError("Your selected hub could not be found. Please choose a new one in your profile.");
      }
      return;
    }

    setHub(currentHub);
    setError(null);
  }, [actualHubId, allHubs, isExternalHub]);

  // Calculate stats when data changes
  useEffect(() => {
    if (!hub) return;

    const satsRaised = projects.reduce((sum, p) => sum + (p.funding_raised || 0), 0);
    const satsNeeded = projects.reduce((sum, p) => sum + (p.funding_needed || 0), 0);
    const hubResonanceScore = resonanceData?.exists ? (resonanceData.score_total || 0) : 0;

    setStats({
      members: mockMembers.length,
      projects: projects.length,
      events: events.length,
      satsRaised,
      satsNeeded,
      hubResonance: hubResonanceScore,
    });
  }, [hub, projects, events, resonanceData]);

  const handleCardClick = (project) => {
    if (project.status === 'completed' || project.status === 'cancelled') {
      return;
    }
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleSupport = async (project) => {
    try {
      const currentUser = await User.me();
      
      const currentSupporters = project.supporters || [];
      if (currentSupporters.includes(currentUser.id)) {
        console.log('User is already supporting this project');
        return;
      }

      const updatedSupporters = [...currentSupporters, currentUser.id];
      
      await Project.update(project.id, {
        ...project,
        goal: project.goal || project.description || "Project goal",
        manifesto_compliance: project.manifesto_compliance || true,
        community_commitment: project.community_commitment || true,
        supporters: updatedSupporters
      });

      console.log(`Successfully added support! Total supporters: ${updatedSupporters.length}`);
      
    } catch (error) {
      console.error('Error supporting project:', error);
    }
  };

  const handleVote = (project) => {
    if (project.status === 'completed' || project.status === 'cancelled') {
      return;
    }
    console.log("Voting on project:", project.title);
  };

  const handleProjectUpdate = (updatedProject) => {
    if (selectedProject && selectedProject.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  const handleEventViewDetails = (event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleEventUpdate = (updatedEvent) => {
    if (selectedEvent && selectedEvent.id === updatedEvent.id) {
      setSelectedEvent(updatedEvent);
    }
  };

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <div className="text-orange-400 text-xl font-semibold mb-4">{error}</div>
            {error.includes("profile") ? (
              <Link to={createPageUrl("Profile")}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Go to Profile
                </Button>
              </Link>
            ) : error.includes("Hub not found") ? (
              <Link to={createPageUrl("GlobalHubs")}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Globe2 className="w-4 h-4 mr-2" />
                  Go to Global Hubs
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !hub) {
    return (
      <>
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
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
      {/* Header - Clean and Horizontal */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <MapPin className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {isExternalHub ? `Hub: ${hub.name}` : `Local Hub: ${hub.name}`}
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {hub.location} • {isExternalHub ? 'Explore this resonance space and its community.' : 'Your local resonance space – projects, events, and members connected to the global coherosphere.'}
          </p>
          
          {isExternalHub && (
            <Link to={createPageUrl("Hub")}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to my hub
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats & Actions */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <Link to={`${createPageUrl('HubResonance')}?hubId=${hub.id}`} className="block">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-orange-500/50 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 h-full cursor-pointer group">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-8 h-8 text-orange-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-orange-400">{Math.round(stats.hubResonance)}</div>
                <div className="text-slate-300 text-sm flex items-center justify-center gap-1">
                  Hub Resonance
                  <TrendingUp className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.members}</div>
              <div className="text-slate-400 text-sm">Members</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.projects}</div>
              <div className="text-slate-400 text-sm">Projects</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.events}</div>
              <div className="text-slate-400 text-sm">Events</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <Bitcoin className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.satsRaised.toLocaleString()}</div>
              <div className="text-slate-400 text-sm">Sats Raised</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
               <Bitcoin className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.satsNeeded.toLocaleString()}</div>
              <div className="text-slate-400 text-sm">Sats Needed</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <Link to={createPageUrl('CreateProject') + `?hubId=${hub.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Start a Project
            </Button>
          </Link>
          <Link to={createPageUrl('HostEvent') + `?hubId=${hub.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-turquoise-500 to-cyan-500 hover:from-turquoise-600 hover:to-cyan-600 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Host an Event
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setActiveTab('members')}
            variant="ghost"
            className={`
              filter-chip h-auto p-2 px-4 rounded-full transition-colors duration-200 
              flex items-center justify-center space-x-[3px]
              ${activeTab === 'members' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' 
                : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`
            }
          >
            <span>Members</span>
            <Badge 
              variant="secondary" 
              className={`transition-colors duration-200 
              ${activeTab === 'members'
                ? 'bg-black/20 text-white' 
                : 'bg-slate-700 text-slate-300'
              }`}
            >
              {mockMembers.length}
            </Badge>
          </Button>
          <Button
            onClick={() => setActiveTab('projects')}
            variant="ghost"
            className={`
              filter-chip h-auto p-2 px-4 rounded-full transition-colors duration-200 
              flex items-center justify-center space-x-[3px]
              ${activeTab === 'projects' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' 
                : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`
            }
          >
            <span>Projects</span>
            <Badge 
              variant="secondary" 
              className={`transition-colors duration-200 
              ${activeTab === 'projects'
                ? 'bg-black/20 text-white' 
                : 'bg-slate-700 text-slate-300'
              }`}
            >
              {projects.length}
            </Badge>
          </Button>
          <Button
            onClick={() => setActiveTab('events')}
            variant="ghost"
            className={`
              filter-chip h-auto p-2 px-4 rounded-full transition-colors duration-200 
              flex items-center justify-center space-x-[3px]
              ${activeTab === 'events' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' 
                : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
          >
            <span>Events</span>
            <Badge 
              variant="secondary" 
              className={`transition-colors duration-200 
              ${activeTab === 'events'
                ? 'bg-black/20 text-white' 
                : 'bg-slate-700 text-slate-300'
              }`}
            >
              {events.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'members' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {mockMembers.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
            {mockMembers.length === 0 && <p className="col-span-full text-center text-slate-400 py-10">No members found in this hub.</p>}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                index={index} 
                onCardClick={handleCardClick} 
                onSupport={handleSupport} 
                onVote={handleVote}
                isDisabled={project.status === 'completed' || project.status === 'cancelled'}
              />
            ))}
            {projects.length === 0 && (
              <p className="col-span-full text-center text-slate-400 py-10">
                No local projects found. Why not start one?
              </p>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            {events.map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                index={index}
                onViewDetails={handleEventViewDetails}
              />
            ))}
            {events.length === 0 && <p className="text-center text-slate-400 py-10">No upcoming events. Why not organize one?</p>}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      <ProjectDetail
        project={selectedProject}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProject(null);
        }}
        onSupport={handleSupport}
        onVote={handleVote}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Event Detail Modal */}
      <EventDetail
        event={selectedEvent}
        isOpen={isEventDetailOpen}
        onClose={() => {
          setIsEventDetailOpen(false);
          setSelectedEvent(null);
        }}
        onEventUpdate={handleEventUpdate}
      />
    </div>
  );
}