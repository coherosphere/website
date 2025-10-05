
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Users, Zap, Link as LinkIcon, QrCode, Heart, BrainCircuit, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function EventFormReview({ formData, onChange, onPublish, onBack, isPublishing, isEditMode, organizer }) {
  const eventLink = `https://coherosphere.app/event/${Date.now()}`;

  return (
    <div className="space-y-6">
      {/* Event Summary */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-turquoise-400" />
            Event Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{formData.title}</h3>
            <p className="text-slate-300 leading-relaxed">{formData.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {formData.date ? format(new Date(formData.date), 'EEEE, d MMMM yyyy HH:mm') : 'No date set'}
                {formData.end_time && ` - ${format(new Date(formData.end_time), 'HH:mm')}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>
                {formData.location_type === 'physical'
                  ? formData.physical_address || 'No address set'
                  : formData.online_url || 'No URL set'
                }
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-slate-400" />
              <span>
                Capacity: {formData.capacity} • RSVP {formData.rsvp_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
            {organizer && (
              <>
                <img
                  src={organizer.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${organizer.email}&backgroundColor=FF6A00,FF8C42&size=40`}
                  alt="Organizer"
                  className="w-8 h-8 rounded-full border border-slate-600"
                />
                <div>
                  <span className="text-sm text-slate-300 font-medium">
                    Organized by {organizer.display_name || organizer.full_name}
                  </span>
                  <Badge className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Nostr
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resonance Elements */}
      {(formData.values.length > 0 || formData.requested_skills.length > 0 || formData.contribution_types.length > 1) && (
        <Card className="bg-slate-900/30 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Resonance Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.values.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Values</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.values.map(value => (
                    <Badge key={value} className="bg-red-500/20 text-red-400 border-red-500/30">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.requested_skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Requested Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.requested_skills.map(skill => (
                    <Badge key={skill} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.contribution_types.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Contribution Types</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.contribution_types.map(type => (
                    <Badge key={type} className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Link & QR Code */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-slate-400" />
            Event Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <code className="flex-1 text-sm text-slate-300 bg-slate-800/50 px-3 py-2 rounded font-mono break-all overflow-hidden">
              {eventLink}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="btn-secondary-coherosphere"
            >
              <QrCode className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nostr Integration */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Nostr Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 font-medium">Publish announcement to Nostr</p>
              <p className="text-sm text-slate-400">
                Share this event with the broader Nostr network to reach more people.
              </p>
            </div>
            <Switch
              checked={formData.publish_to_nostr}
              onCheckedChange={(checked) => onChange({ publish_to_nostr: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-slate-700">
        <Button
          onClick={onBack}
          variant="outline"
          className="btn-secondary-coherosphere"
        >
          Previous
        </Button>
        <Button
          onClick={onPublish}
          disabled={isPublishing}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
        >
          <Send className="w-4 h-4 mr-2" />
          {isPublishing ? 'Publishing...' : (isEditMode ? 'Update Event' : 'Publish Event')}
        </Button>
      </div>
    </div>
  );
}
