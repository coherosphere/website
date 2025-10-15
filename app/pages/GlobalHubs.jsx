
import React, { useState, useEffect } from "react";
import { Hub, Project, Event, ResonanceScore } from "@/api/entities";
import { motion } from "framer-motion";
import { Globe2, MapPin, Users, Lightbulb, Calendar, Activity, Copy, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { useCachedData } from '@/components/caching/useCachedData';
import { useLoading } from '@/components/loading/LoadingContext';

export default function GlobalHubs() {
  const [copiedId, setCopiedId] = useState(null);
  const { setLoading } = useLoading();

  // Use cached data with correct 'globalHubs' domain
  const { data: hubs = [], isLoading: hubsLoading } = useCachedData(
    ['globalHubs', 'hubs'],
    () => Hub.list(),
    'globalHubs' 
  );

  const { data: allProjects = [], isLoading: projectsLoading } = useCachedData(
    ['globalHubs', 'projects'],
    () => Project.list(),
    'globalHubs' 
  );

  const { data: allEvents = [], isLoading: eventsLoading } = useCachedData(
    ['globalHubs', 'events'],
    () => Event.list(),
    'globalHubs' 
  );

  const { data: allResonanceScores = [], isLoading: resonanceLoading } = useCachedData(
    ['globalHubs', 'resonance'],
    () => ResonanceScore.filter({ entity_type: 'hub' }),
    'globalHubs' 
  );

  const isLoading = hubsLoading || projectsLoading || eventsLoading || resonanceLoading;

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Enrich hubs with stats
  const hubsWithStats = React.useMemo(() => {
    const resonanceMap = new Map();
    allResonanceScores.forEach(score => {
      resonanceMap.set(score.entity_id, score);
    });

    const enriched = hubs.map((hub) => {
      const hubProjects = allProjects.filter(p => p.hub_id === hub.id);
      const hubEvents = allEvents.filter(e => e.hub_id === hub.id);

      const activeProjects = hubProjects.filter(p => 
        ['active', 'voting', 'proposed', 'ideation', 'planning', 'funding', 'launch'].includes(p.status)
      ).length;

      const resonanceScore = resonanceMap.get(hub.id);
      const realResonance = resonanceScore ? (resonanceScore.intensity || resonanceScore.score_total) : 0;

      return {
        ...hub,
        totalProjects: hubProjects.length,
        activeProjects: activeProjects,
        totalEvents: hubEvents.length,
        upcomingEvents: hubEvents.filter(e => new Date(e.date) > new Date()).length,
        realResonance: realResonance
      };
    });

    enriched.sort((a, b) => {
      if (b.realResonance !== a.realResonance) {
        return b.realResonance - a.realResonance;
      }
      return (b.member_count || 0) - (a.member_count || 0);
    });

    return enriched;
  }, [hubs, allProjects, allEvents, allResonanceScores]);

  const handleCopyId = (hubId) => {
    navigator.clipboard.writeText(hubId);
    setCopiedId(hubId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <>
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
        
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <Globe2 className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Global Resonance Hubs
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Overview of all resonance hubs around the world - their communities, projects, and events.
        </p>
      </div>

      {/* Stats Summary */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Globe2 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{hubs.length}</div>
            <div className="text-slate-400 text-sm">Total Hubs</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {hubsWithStats.reduce((sum, h) => sum + (h.member_count || 0), 0)}
            </div>
            <div className="text-slate-400 text-sm">Total Members</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {hubsWithStats.reduce((sum, h) => sum + (h.totalProjects || 0), 0)}
            </div>
            <div className="text-slate-400 text-sm">Total Projects</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {hubsWithStats.reduce((sum, h) => sum + (h.totalEvents || 0), 0)}
            </div>
            <div className="text-slate-400 text-sm">Total Events</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hubsWithStats.map((hub, index) => (
          <motion.div
            key={hub.id}
            className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300 h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center resonance-glow"
                      style={{
                        boxShadow: `0 0 ${20 * Math.max(1, hub.realResonance / 10)}px rgba(255, 106, 0, ${0.3 * Math.max(0.5, Math.min(1, hub.realResonance / 20))})`
                      }}
                    >
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white mb-1">{hub.name}</CardTitle>
                      <p className="text-sm text-slate-400">{hub.location}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                {hub.description && (
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {hub.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 flex-grow">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Members</span>
                    </div>
                    <div className="text-lg font-bold text-white">{hub.member_count || 0}</div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-xs">Projects</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {hub.totalProjects || 0}
                      {hub.activeProjects > 0 && (
                        <span className="text-xs text-green-400 ml-1">({hub.activeProjects} active)</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Events</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {hub.totalEvents || 0}
                      {hub.upcomingEvents > 0 && (
                        <span className="text-xs text-cyan-400 ml-1">({hub.upcomingEvents} upcoming)</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs">Resonance</span>
                    </div>
                    <div className="text-lg font-bold text-orange-400">
                      {hub.realResonance > 0 ? hub.realResonance.toFixed(1) : '0.0'}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">Hub ID:</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
                        {hub.id.substring(0, 8)}...{hub.id.substring(hub.id.length - 8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-white"
                        onClick={() => handleCopyId(hub.id)}
                      >
                        {copiedId === hub.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Link to={`${createPageUrl("Hub")}?hubId=${hub.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-orange-400 transition-colors"
                          title="View this hub"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {hubs.length === 0 && (
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-12 text-center">
            <Globe2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Hubs Found</h3>
            <p className="text-slate-400">The resonance network is being initialized...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
