
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

export default function EventCard({ event, index, onViewDetails }) {
  const eventDate = new Date(event.date);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Date Block */}
            <div className="flex-shrink-0 text-center bg-slate-900/50 rounded-lg p-4 border border-slate-700 w-full sm:w-24">
              <div className="text-sm text-orange-400 font-bold uppercase tracking-wider">
                {eventDate.toLocaleString('default', { month: 'short' })}
              </div>
              <div className="text-4xl text-white font-bold">
                {eventDate.getDate()}
              </div>
              <div className="text-sm text-slate-400">
                {eventDate.getFullYear()}
              </div>
            </div>

            {/* Event Details */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
              <p className="text-slate-300 leading-relaxed mb-4 line-clamp-2">
                {event.description}
              </p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4 text-turquoise-400" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{event.attendees?.length || 0} attending</span>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  onClick={() => onViewDetails?.(event)}
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                >
                  View Details <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
