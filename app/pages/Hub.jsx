
import React, { useState, useEffect } from "react";
import { Hub, Project, Event, User } from "@/api/entities";
import { motion } from "framer-motion";
import { MapPin, Users, Lightbulb, Calendar, Plus, Zap, UserCircle, AlertTriangle, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ProjectCard from "@/components/projects/ProjectCard";
import ProjectDetail from "@/components/projects/ProjectDetail";
import EventCard from "@/components/hub/EventCard";
import MemberCard from "@/components/hub/MemberCard";
import EventDetail from "@/components/hub/EventDetail";

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
  const [hub, setHub] = useState(null);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState(mockMembers);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  const [stats, setStats] = useState({
    members: mockMembers.length,
    projects: 0,
    events: 0,
    satsRaised: 0,
    satsNeeded: 0,
  });


  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Step 1: Get current user to find their selected hub
        const currentUser = await User.me();
        const userHubId = currentUser.hub_id;

        if (!userHubId) {
          if (isMounted) {
            setError("No local hub selected. Please choose your hub in your profile.");
            setIsLoading(false); // Stop loading if no hub ID
          }
          return; // Exit early
        }

        // Step 2: Fetch all hubs and find the one matching the user's preference
        const hubs = await Hub.list();
        if (!isMounted) return;

        const currentHub = hubs.find(h => h.id === userHubId);
        
        if (currentHub) {
          if (!isMounted) return;
          setHub(currentHub);

          await new Promise(resolve => setTimeout(resolve, 200));
          
          const projectData = await Project.filter({ hub_id: currentHub.id });
          if (!isMounted) return;
          setProjects(projectData);

          const satsRaised = projectData.reduce((sum, p) => sum + (p.funding_raised || 0), 0);
          const satsNeeded = projectData.reduce((sum, p) => sum + (p.funding_needed || 0), 0);
          
          await new Promise(resolve => setTimeout(resolve, 200));
          const eventData = await Event.filter({ hub_id: currentHub.id });
          if (isMounted) {
            setEvents(eventData);
            setStats({
              members: mockMembers.length, // Using mock data length
              projects: projectData.length,
              events: eventData.length,
              satsRaised,
              satsNeeded,
            });
          }
        } else {
          // If the hub ID from the user profile doesn't match any existing hub
          if(isMounted) {
            setError("Your selected hub could not be found. Please choose a new one in your profile.");
          }
        }
      } catch (err) {
        console.error("Error loading hub data:", err);
        if (isMounted) {
          setError("Failed to load hub data. Please try refreshing the page.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (project) => {
    if (project.status === 'completed' || project.status === 'cancelled') {
      return;
    }
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleSupport = async (project) => {
    try {
      // Get current user
      const currentUser = await User.me();
      
      // Check if user is already supporting this project
      const currentSupporters = project.supporters || [];
      if (currentSupporters.includes(currentUser.id)) {
        console.log('User is already supporting this project');
        return; // User already supports this project
      }

      // Add user to supporters array
      const updatedSupporters = [...currentSupporters, currentUser.id];
      
      // Update the project in the database
      const updatedProject = await Project.update(project.id, {
        supporters: updatedSupporters
      });

      // Update the local projects state
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        )
      );

      console.log(`Successfully added support! Total supporters: ${updatedSupporters.length}`);
      
    } catch (error) {
      console.error('Error supporting project:', error);
      // You might want to show a user-friendly error message here
    }
  };

  const handleVote = (project) => {
    if (project.status === 'completed' || project.status === 'cancelled') {
      return;
    }
    console.log("Voting on project:", project.title);
    // TODO: Implement voting functionality
  };

  const handleProjectUpdate = (updatedProject) => {
    // Update the local projects state with the updated project
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      )
    );
    
    // Also update the selected project if it's the same one
    if (selectedProject && selectedProject.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  const handleEventViewDetails = (event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleEventUpdate = (updatedEvent) => {
    setEvents(prevEvents => 
      prevEvents.map(e => 
        e.id === updatedEvent.id ? updatedEvent : e
      )
    );
    
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
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
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
              Local Hub: {hub.name}
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {hub.location} • Your local resonance space – projects, events, and members connected to the global coherosphere.
        </p>
      </div>

      {/* Stats & Actions */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
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
              <Zap className="w-4 h-4 mr-2" /> Host an Event
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Tab Navigation - Updated to use filter-chip style */}
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
              {members.length}
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
              }`
            }
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
            {members.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
            {members.length === 0 && <p className="col-span-full text-center text-slate-400 py-10">No members found in this hub.</p>}
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
