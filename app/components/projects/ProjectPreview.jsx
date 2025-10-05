
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Users, Zap, TrendingUp } from 'lucide-react';

export default function ProjectPreview({ projectData }) {
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
  };

  const formatNumber = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const hasContent = projectData.title || projectData.description;

  if (!hasContent) {
    return (
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-8 text-center">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Project preview will appear here as you fill in the details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300">
      <CardContent className="p-6">
        {/* Header with icon and status */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-orange-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white break-words mb-2">
              {projectData.title || 'Project Title'}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {projectData.status && (
                <Badge variant="outline" className={`border text-xs ${statusColors[projectData.status]}`}>
                  {projectData.status}
                </Badge>
              )}
              {projectData.category && (
                <Badge variant="outline" className={`border text-xs ${categoryColors[projectData.category]}`}>
                  {projectData.category}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Idea and Goal */}
        <div className="space-y-3 mb-4">
          <p className="text-slate-300 leading-relaxed line-clamp-3 text-sm">
            <strong className="text-slate-200 block text-xs">Idea:</strong>
            {projectData.description || 'Project idea will appear here...'}
          </p>
          <p className="text-slate-300 leading-relaxed line-clamp-2 text-sm">
            <strong className="text-slate-200 block text-xs">Goal:</strong>
            {projectData.goal || 'Project goal will appear here...'}
          </p>
        </div>

        {/* Funding Progress Placeholder */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-300">Funding Progress</span>
            <span className="text-sm text-slate-400">
              0 / {formatNumber(projectData.funding_needed || 0)} sats
            </span>
          </div>
          
          <div className="relative">
            <Progress value={0} className="h-2 bg-slate-700" />
            <div 
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {/* Activity Indicators Placeholder */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="text-sm">
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <Users className="w-3 h-3" />
              <span>0</span>
            </div>
            <span className="text-xs text-slate-500">Supporters</span>
          </div>
          <div className="text-sm">
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <Zap className="w-3 h-3" />
              <span>0</span>
            </div>
            <span className="text-xs text-slate-500">Sats Raised</span>
          </div>
          <div className="text-sm">
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <TrendingUp className="w-3 h-3" />
              <span>0/10</span>
            </div>
            <span className="text-xs text-slate-500">Resonance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
