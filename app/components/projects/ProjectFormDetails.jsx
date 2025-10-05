
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Hub } from '@/api/entities';
import { Bitcoin, MapPin, Users, Target } from 'lucide-react';

export default function ProjectFormDetails({ eventData, onUpdate }) {
  const [hubs, setHubs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadHubs = async () => {
      try {
        const hubData = await Hub.list();
        setHubs(hubData);
      } catch (error) {
        console.error('Error loading hubs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHubs();
  }, []);

  const formatNumber = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleFundingChange = (value) => {
    const numValue = parseInt(value.replace(/,/g, '')) || 0;
    onUpdate({ funding_needed: numValue });
  };

  const selectedHub = hubs.find(h => h.id === eventData.hub_id);

  return (
    <div className="space-y-6">
      {/* Hub Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Local Hub *
        </label>
        <p className="text-xs text-slate-400 mb-4">
          Choose which local hub this project belongs to
        </p>
        
        {isLoading ? (
          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-slate-400">
            Loading hubs...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hubs.map((hub) => (
              <Button
                key={hub.id}
                variant="ghost"
                onClick={() => onUpdate({ hub_id: hub.id })}
                className={`filter-chip h-auto p-4 flex flex-col items-start gap-2 ${
                  eventData.hub_id === hub.id ? 'active' : ''
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{hub.name}</span>
                </div>
                <div className="text-xs text-slate-400 text-left">
                  {hub.location}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{hub.member_count || 0} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>{hub.active_projects || 0} projects</span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Funding Goal */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Funding Goal (in sats) *
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="100,000"
            value={formatNumber(eventData.funding_needed || 0)}
            onChange={(e) => handleFundingChange(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 pl-12"
          />
          <div className="absolute left-3 top-3 text-orange-400">
            <Bitcoin className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          How much funding do you need to complete this project?
        </p>
        
        {/* Funding Presets */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {[10000, 50000, 100000, 250000, 500000, 1000000].map((amount) => (
            <Button
              key={amount}
              variant="ghost"
              onClick={() => onUpdate({ funding_needed: amount })}
              className="filter-chip h-auto text-sm"
            >
              {formatNumber(amount)} sats
            </Button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Project Status
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'proposed', label: 'Proposed', color: 'bg-slate-500/20 text-slate-400' },
            { key: 'voting', label: 'Voting', color: 'bg-blue-500/20 text-blue-400' },
            { key: 'active', label: 'Active', color: 'bg-green-500/20 text-green-400' },
          ].map((status) => (
            <Button
              key={status.key}
              variant="ghost"
              onClick={() => onUpdate({ status: status.key })}
              className={`filter-chip h-auto p-3 ${
                eventData.status === status.key ? 'active' : ''
              }`}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Hub Info */}
      {selectedHub && (
        <Card className="bg-slate-900/30 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              Selected Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">{selectedHub.name}</span>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Selected
                </Badge>
              </div>
              <p className="text-sm text-slate-400">{selectedHub.location}</p>
              {selectedHub.description && (
                <p className="text-sm text-slate-400">{selectedHub.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
