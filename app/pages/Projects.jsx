
import React, { useState, useEffect } from "react";
import { Project, User } from "@/api/entities";
import { motion } from "framer-motion";
import { Lightbulb, Plus, AlertTriangle, Clock, Vote, CheckCircle, Zap, GitMerge, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ProjectCard from "@/components/projects/ProjectCard";
import ProjectFilters from "@/components/projects/ProjectFilters";
import ProjectDetail from "@/components/projects/ProjectDetail";
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [scope, setScope] = useState('global');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    ideation: 0,
    voting: 0,
    funding: 0,
    implementation: 0,
    success: 0,
    satsRaised: 0,
    satsNeeded: 0,
  });

  useEffect(() => {
    // Read filter from URL on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam === 'no-support') {
      setSelectedCategory('no-support');
    }

    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load current user first
        const user = await User.me();
        if (isMounted) {
          setCurrentUser(user);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Load projects from API
        const data = await Project.list();
        if (isMounted) {
          setProjects(data);
          
          // Calculate stats
          const statusCounts = {
            ideation: data.filter(p => p.status === 'ideation').length,
            voting: data.filter(p => p.status === 'voting').length,
            funding: data.filter(p => p.status === 'funding').length,
            implementation: data.filter(p => p.status === 'launch').length,
            success: data.filter(p => p.status === 'success').length,
            satsRaised: data.reduce((sum, p) => sum + (p.funding_raised || 0), 0),
            satsNeeded: data.reduce((sum, p) => sum + (p.funding_needed || 0), 0),
          };
          setStats(statusCounts);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isMounted) {
          setError("Failed to load projects. Please try refreshing the page.");
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
    // Don't allow interaction with completed or cancelled projects
    if (project.status === 'success' || project.status === 'cancelled') { // Changed 'completed' to 'success'
      return;
    }
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleSupport = async (updatedProject) => {
    // Update the local projects state with the updated project
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      )
    );
  };

  const handleVote = (project) => {
    // Don't allow voting on completed or cancelled projects
    if (project.status === 'success' || project.status === 'cancelled') { // Changed 'completed' to 'success'
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

  const filteredAndSortedProjects = () => {
    let processedProjects = [...projects];

    // 1. Apply Scope Filter
    if (scope === 'local' && currentUser && currentUser.hub_id) {
      processedProjects = processedProjects.filter(p => p.hub_id === currentUser.hub_id);
    }
    // If scope is 'global' or user has no hub, we use all projects.

    // 2. Apply Category & Support Filter
    if (selectedCategory === 'my-supported') {
      processedProjects = processedProjects.filter(project => 
        currentUser && project.supporters?.includes(currentUser.id)
      );
    } else if (selectedCategory === 'no-support') {
      processedProjects = processedProjects.filter(project => 
        currentUser && !project.supporters?.includes(currentUser.id)
      );
    } else if (selectedCategory !== 'all') {
      processedProjects = processedProjects.filter(project => project.category === selectedCategory);
    }
    // If 'all', we don't filter by category.

    // 3. Apply Sorting
    switch (sortBy) {
      case 'most-supported':
        processedProjects.sort((a, b) => (b.supporters?.length || 0) - (a.supporters?.length || 0));
        break;
      case 'highest-resonance':
        processedProjects.sort((a, b) => (b.resonance_level || 0) - (a.resonance_level || 0));
        break;
      case 'most-funded':
        processedProjects.sort((a, b) => (b.funding_raised || 0) - (a.funding_raised || 0));
        break;
      case 'newest':
      default:
        processedProjects.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
    }

    return processedProjects;
  };

  const projectCounts = {
    all: projects.length,
    'my-supported': currentUser ? projects.filter(p => p.supporters?.includes(currentUser.id)).length : 0,
    'no-support': currentUser ? projects.filter(p => !p.supporters?.includes(currentUser.id)).length : projects.length, // If no user, all projects are 'unsupported by current user'
    resilience: projects.filter(p => p.category === 'resilience').length,
    technology: projects.filter(p => p.category === 'technology').length,
    community: projects.filter(p => p.category === 'community').length,
    learning: projects.filter(p => p.category === 'learning').length,
    environment: projects.filter(p => p.category === 'environment').length,
    governance: projects.filter(p => p.category === 'governance').length,
  };

  const displayProjects = filteredAndSortedProjects();

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <div className="text-orange-400 text-xl font-semibold mb-4">{error}</div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Lightbulb className="w-12 h-12 text-orange-500 flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                Community Projects
              </h1>
              <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
            </div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Discover and support initiatives that resonate with your values.
        </p>
      </motion.div>

      {/* Project Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.ideation}</div>
                <div className="text-slate-400 text-sm">Ideation</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <Vote className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.voting}</div>
                <div className="text-slate-400 text-sm">Voting</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.funding}</div>
                <div className="text-slate-400 text-sm">Funding</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <GitMerge className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.implementation}</div>
                <div className="text-slate-400 text-sm">Implementation</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.success}</div>
                <div className="text-slate-400 text-sm">Success</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <Bitcoin className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.satsRaised.toLocaleString()}</div>
                <div className="text-slate-400 text-sm">Sats Raised</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <Bitcoin className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.satsNeeded.toLocaleString()}</div>
                <div className="text-slate-400 text-sm">Sats Needed</div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Interaction Buttons */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link to={createPageUrl('CreateProject')} className="flex-1">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 text-base">
            <Plus className="w-5 h-5 mr-2" /> Start a Project
          </Button>
        </Link>
      </motion.div>


      {/* Filters */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <ProjectFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          scope={scope}
          onScopeChange={setScope}
          projectCounts={projectCounts}
          currentUser={currentUser}
        />
      </motion.div>

      {/* Projects Grid */}
      {isLoading ? (
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
          <div className="min-h-[calc(100vh-500px)]" aria-hidden="true"></div>
        </>
      ) : displayProjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Lightbulb className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {selectedCategory === 'my-supported' ? 'You haven\'t supported any projects yet. Start by supporting some!' :
               selectedCategory === 'no-support' ? 'You currently support all available projects!' :
               selectedCategory === 'all' ? 'No projects found at the moment.' : 
               `No ${selectedCategory} projects found.`}
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {displayProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onCardClick={handleCardClick}
                onSupport={handleSupport}
                onVote={handleVote}
                isDisabled={project.status === 'success' || project.status === 'cancelled'}
              />
            ))}
          </motion.div>
      )}

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
    </div>
  );
}
