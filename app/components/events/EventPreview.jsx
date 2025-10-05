
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Globe, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function EventPreview({ formData, organizer }) {
  const hasContent = formData.title || formData.description || formData.date;
  const safeValues = formData.values || [];
  const safeSkills = formData.requested_skills || [];

  if (!hasContent) {
    return (
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Event preview will appear here as you fill in the details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          {/* Date Block */}
          <div className="flex gap-4">
            {formData.date ? (
              <div className="flex-shrink-0 text-center bg-slate-900/50 rounded-lg p-3 border border-slate-700 w-20">
                <div className="text-xs text-white font-bold uppercase tracking-wider">
                  {format(new Date(formData.date), 'MMM')}
                </div>
                <div className="text-2xl text-white font-bold">
                  {format(new Date(formData.date), 'd')}
                </div>
                <div className="text-xs text-slate-400">
                  {format(new Date(formData.date), 'yyyy')}
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 text-center bg-slate-900/50 rounded-lg p-3 border border-slate-700 w-20">
                <div className="text-xs text-slate-500">Date</div>
                <div className="text-xl text-slate-600 font-bold">?</div>
              </div>
            )}

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {formData.title || 'Event Title'}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3 line-clamp-3">
                {formData.description || 'Event description will appear here...'}
              </p>
              
              <div className="space-y-2 text-sm">
                {formData.date && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3 h-3 text-turquoise-400" />
                    <span>
                      {format(new Date(formData.date), 'EEEE, d MMMM yyyy HH:mm')}
                      {formData.end_time && ` - ${format(new Date(formData.end_time), 'HH:mm')}`}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-slate-400">
                  {formData.location_type === 'online' ? (
                    <Globe className="w-3 h-3 text-turquoise-400" />
                  ) : (
                    <MapPin className="w-3 h-3 text-turquoise-400" />
                  )}
                  <span>
                    {formData.location_type === 'physical' 
                      ? formData.physical_address || 'Physical location TBD'
                      : formData.location_type === 'online'
                      ? 'Online Event'
                      : 'Location TBD'
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span>
                    Capacity: {formData.capacity || 20}
                    {formData.rsvp_enabled ? ' • RSVP Required' : ''}
                  </span>
                </div>
              </div>

              {/* Values and Skills Preview */}
              {(safeValues.length > 0 || safeSkills.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {safeValues.slice(0, 3).map(value => (
                    <Badge key={value} className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                      {value}
                    </Badge>
                  ))}
                  {safeSkills.slice(0, 2).map(skill => (
                    <Badge key={skill} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(safeValues.length + safeSkills.length) > 5 && (
                    <Badge className="bg-slate-700/50 text-slate-400 text-xs">
                      +{(safeValues.length + safeSkills.length) - 5}
                    </Badge>
                  )}
                </div>
              )}

              {/* Organizer */}
              {organizer && (
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <img
                      src={organizer.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${organizer.email}&backgroundColor=FF6A00,FF8C42&size=24`}
                      alt="Organizer"
                      className="w-5 h-5 rounded-full border border-slate-600"
                    />
                    <span className="text-xs text-slate-400">
                      Organized by {organizer.display_name || organizer.full_name}
                    </span>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      <Zap className="w-2 h-2 mr-1" />
                      Nostr
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
