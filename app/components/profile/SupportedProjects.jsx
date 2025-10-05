
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Zap, Plus, X } from 'lucide-react';
import { Project } from '@/api/entities';

export default function SupportedProjects({ projects, user, onProjectsUpdate }) {
  const handleWithdrawSupport = async (projectId) => {
    try {
      if (!user) return;
      
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      // Remove user from supporters array
      const updatedSupporters = (project.supporters || []).filter(id => id !== user.id);
      
      // Update the project in the database - include all required fields with fallbacks
      await Project.update(projectId, {
        ...project, // Include all existing project data
        goal: project.goal || project.description || "Project goal", // Fallback for missing goal
        manifesto_compliance: project.manifesto_compliance || true, // Fallback
        community_commitment: project.community_commitment || true, // Fallback
        supporters: updatedSupporters
      });
      
      console.log(`Successfully removed support from project: ${project.title}`);
      
      // Trigger parent component to reload data
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
      
    } catch (error) {
      console.error('Error withdrawing support from project:', error);
    }
  };

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
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-3">
            <Heart className="w-5 h-5 text-red-400" />
            Supported Projects
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {projects.length}
            </Badge>
          </CardTitle>
          <Button
            asChild
            size="sm"
            className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
          >
            <Link to={createPageUrl('Projects?filter=no-support')}>
              <Plus className="w-4 h-4 mr-1" />
              new
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Heart className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p>You haven't supported any projects yet.</p>
            <p className="text-sm mt-1">Find projects that resonate with your values!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => {
              const progressPercentage = project.funding_needed > 0 
                ? Math.min(100, (project.funding_raised / project.funding_needed) * 100)
                : 0;
              
              return (
                <div
                  key={project.id}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-orange-500/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white break-words">{project.title}</h4>
                      <div className="flex items-center gap-2 mt-2 mb-2 flex-wrap">
                        <Badge variant="outline" className={`border text-xs ${statusColors[project.status]}`}>
                          {project.status}
                        </Badge>
                        {project.category && (
                          <Badge variant="outline" className={`border text-xs ${categoryColors[project.category]}`}>
                            {project.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWithdrawSupport(project.id)}
                      className="text-slate-500 hover:text-red-400 ml-2"
                      title="Remove support"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Heart className="w-3 h-3" />
                      <span>{project.supporters?.length || 0} supporters</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Zap className="w-3 h-3" />
                      <span>{(project.funding_raised || 0).toLocaleString()} sats raised</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Funding Progress</span>
                      <span className="text-slate-300">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={progressPercentage} 
                        className="h-2 bg-slate-700"
                      />
                      <div 
                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${progressPercentage}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
