
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, Target, BookOpen, MapPin, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function CircleFormReview({ circleData }) {
  return (
    <div className="space-y-6">
      {/* Circle Summary */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            Circle Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{circleData.topic || 'Circle Topic'}</h3>
              <p className="text-slate-300 leading-relaxed mb-3">{circleData.description || 'Circle description will appear here...'}</p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {circleData.frequency} meetings
                </Badge>
                {circleData.max_participants && (
                  <Badge variant="outline" className="border bg-slate-500/20 text-slate-400 border-slate-500/30">
                    Max {circleData.max_participants} participants
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Next Session */}
            {circleData.next_session && (
              <div>
                <div className="flex items-center gap-2 text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Next Session:</span>
                </div>
                <p className="text-orange-400 font-semibold">
                  {format(new Date(circleData.next_session), 'EEEE, MMMM do, yyyy \'at\' h:mm a')}
                </p>
              </div>
            )}
            {/* Location */}
            {(circleData.location_type === 'physical' && circleData.physical_address) ||
             (circleData.location_type === 'online' && circleData.online_url) ? (
              <div>
                <div className="flex items-center gap-2 text-slate-300 mb-2">
                  {circleData.location_type === 'physical' ? (
                    <MapPin className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Globe className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium">Location:</span>
                </div>
                <p className="text-purple-400 font-semibold truncate">
                  {circleData.location_type === 'physical'
                    ? circleData.physical_address
                    : circleData.online_url}
                </p>
              </div>
            ) : null}
          </div>

        </CardContent>
      </Card>

      {/* Learning Details */}
      {(circleData.learning_goals || circleData.prerequisites) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Goals */}
          {circleData.learning_goals && (
            <Card className="bg-slate-900/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Target className="w-4 h-4 text-slate-400" />
                  Learning Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {circleData.learning_goals}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Prerequisites */}
          {circleData.prerequisites && (
            <Card className="bg-slate-900/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Prerequisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {circleData.prerequisites}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ready to Create */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Create</h3>
            <p className="text-slate-400">
              Your learning circle will be created and made available for community members to join.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
