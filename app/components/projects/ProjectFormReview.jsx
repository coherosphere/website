
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hub } from '@/api/entities';
import { Lightbulb, MapPin, DollarSign, Target, CheckCircle, XCircle } from 'lucide-react';

export default function ProjectFormReview({ eventData }) {
  const [selectedHub, setSelectedHub] = React.useState(null);

  React.useEffect(() => {
    const loadHub = async () => {
      if (eventData.hub_id) {
        try {
          const hubs = await Hub.list();
          const hub = hubs.find(h => h.id === eventData.hub_id);
          setSelectedHub(hub);
        } catch (error) {
          console.error('Error loading hub:', error);
        }
      }
    };

    loadHub();
  }, [eventData.hub_id]);

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

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-orange-400" />
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{eventData.title}</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              <strong className="text-slate-200 block mb-1">Idea:</strong>
              {eventData.description}
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-slate-200 block mb-1">Goal:</strong>
              {eventData.goal}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
            <Badge variant="outline" className={`border ${categoryColors[eventData.category]}`}>
              {eventData.category}
            </Badge>
            <Badge variant="outline" className={`border ${statusColors[eventData.status]}`}>
              {eventData.status}
            </Badge>
            {eventData.manifesto_compliance ? (
              <Badge variant="outline" className="border bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Manifesto Compliant
              </Badge>
            ) : (
              <Badge variant="outline" className="border bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1.5" />
                Not Manifesto Compliant
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <DollarSign className="w-4 h-4 text-orange-400" />
              <span>Funding Goal: {formatNumber(eventData.funding_needed || 0)} sats</span>
            </div>
            {selectedHub && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Hub: {selectedHub.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hub Details */}
      {selectedHub && (
        <Card className="bg-slate-900/30 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              Local Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-lg font-semibold text-white">{selectedHub.name}</h4>
                <p className="text-slate-400">{selectedHub.location}</p>
              </div>
              
              {selectedHub.description && (
                <p className="text-sm text-slate-300">{selectedHub.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{selectedHub.member_count || 0}</div>
                  <div className="text-slate-400">Members</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{selectedHub.active_projects || 0}</div>
                  <div className="text-slate-400">Active Projects</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready to Publish */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">
            <Target className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Publish</h3>
            <p className="text-slate-400">
              Your project will be visible to the community and available for support once published.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
