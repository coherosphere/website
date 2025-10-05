
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Event } from '@/api/entities';
import { createPageUrl } from '@/utils';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Globe,
  Clock,
  Edit3,
  UserPlus,
  UserMinus,
  Share,
  ExternalLink,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetail({ event, isOpen, onClose, onEventUpdate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAttending, setIsAttending] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (event) {
          setIsAttending(event.attendees?.includes(user.id) || false);
          setIsOrganizer(event.organizer_id === user.id);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setCurrentUser(null);
        setIsAttending(false);
        setIsOrganizer(false);
      }
    };

    if (isOpen && event) {
      loadCurrentUser();
    }
  }, [isOpen, event]);

  if (!event) return null;

  const handleToggleAttendance = async () => {
    if (!currentUser) return;

    try {
      const currentAttendees = event.attendees || [];
      const updatedAttendees = isAttending
        ? currentAttendees.filter(id => id !== currentUser.id)
        : [...currentAttendees, currentUser.id];

      const updatedEvent = await Event.update(event.id, {
        attendees: updatedAttendees
      });

      setIsAttending(!isAttending);
      if (onEventUpdate) {
        onEventUpdate(updatedEvent);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const handleEdit = () => {
    // Navigate to edit mode using correct page name
    // NOTE: `createPageUrl` is assumed to be globally available or imported elsewhere.
    window.location.href = createPageUrl('CreateEvent') + `?eventId=${event.id}&edit=true&hubId=${event.hub_id}`;
  };

  const handleShare = () => {
    const eventUrl = `${window.location.origin}/event/${event.id}`;
    navigator.clipboard.writeText(eventUrl);
    // Could show a toast notification
  };

  const eventDate = new Date(event.date);
  const isOnline = event.location?.includes('http') || event.location === 'Online Event';
  const attendeeCount = event.attendees?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-slate-800/95 backdrop-blur-sm border-slate-700">
              <CardHeader className="relative pb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                  onClick={onClose}
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Event Header */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Date Block */}
                  <div className="flex-shrink-0 text-center bg-slate-900/50 rounded-lg p-4 border border-slate-700 lg:w-24">
                    <div className="text-sm text-white font-bold uppercase tracking-wider">
                      {format(eventDate, 'MMM')}
                    </div>
                    <div className="text-4xl text-white font-bold">
                      {format(eventDate, 'd')}
                    </div>
                    <div className="text-sm text-slate-400">
                      {format(eventDate, 'yyyy')}
                    </div>
                  </div>

                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white mb-3">
                      {event.title}
                    </CardTitle>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-turquoise-400" />
                        <span>{format(eventDate, 'EEEE, d MMMM yyyy HH:mm')}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        {isOnline ? (
                          <Globe className="w-4 h-4 text-turquoise-400" />
                        ) : (
                          <MapPin className="w-4 h-4 text-turquoise-400" />
                        )}
                        <span>{isOnline ? 'Online Event' : event.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>{attendeeCount} attending</span>
                      </div>
                    </div>

                    {/* Organizer Badge */}
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      <Zap className="w-3 h-3 mr-1" />
                      {isOrganizer ? 'You are the organizer' : 'Organized via Nostr'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Event Description</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Values and Skills if available */}
                {(event.values?.length > 0 || event.requested_skills?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Resonance Elements</h3>
                    <div className="space-y-3">
                      {event.values?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Values</h4>
                          <div className="flex flex-wrap gap-2">
                            {event.values.map(value => (
                              <Badge key={value} className="bg-red-500/20 text-red-400 border-red-500/30">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {event.requested_skills?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Requested Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {event.requested_skills.map(skill => (
                              <Badge key={skill} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Location Details */}
                {!isOnline && event.location && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Location</h3>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-turquoise-400" />
                        <span className="text-slate-300 font-medium">{event.location}</span>
                      </div>
                      <div className="w-full h-32 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-600">
                        <span className="text-slate-400 text-sm">Map preview would appear here</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Online Link */}
                {isOnline && event.location?.includes('http') && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Join Online</h3>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <a
                        href={event.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-turquoise-400 hover:text-turquoise-300 font-medium"
                      >
                        <Globe className="w-4 h-4" />
                        {event.location}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-slate-700">
                  {isOrganizer ? (
                    <>
                      <Button
                        onClick={handleEdit}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Event
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="btn-secondary-coherosphere"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleToggleAttendance}
                        className={`flex-1 font-semibold ${
                          isAttending
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            : 'bg-gradient-to-r from-turquoise-500 to-cyan-500 hover:from-turquoise-600 hover:to-cyan-600 text-white'
                        }`}
                      >
                        {isAttending ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Leave Event
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Join Event
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="btn-secondary-coherosphere"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
