
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Check, Loader2, MapPin, Globe } from 'lucide-react';
import { LearningCircle } from '@/api/entities';

export default function LearningCircleCard({ circle, index, currentUser, onUpdate }) {
  const [isJoining, setIsJoining] = useState(false);

  const nextSessionDate = new Date(circle.next_session);
  const formattedString = `Next: ${new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long', // Changed from 'short' to 'long'
    year: 'numeric',
  }).format(nextSessionDate)} at ${new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(nextSessionDate)}`;

  const isParticipant = currentUser && circle.participants?.includes(currentUser.id);

  const handleJoinLeave = async () => {
    if (!currentUser || isJoining) return;

    setIsJoining(true);
    try {
      let updatedParticipants;
      if (isParticipant) {
        // Leave the circle
        updatedParticipants = circle.participants.filter(pId => pId !== currentUser.id);
      } else {
        // Join the circle
        updatedParticipants = [...(circle.participants || []), currentUser.id];
      }
      
      await LearningCircle.update(circle.id, { participants: updatedParticipants });
      
      // Notify parent to refetch data
      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error("Failed to update circle participants:", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-white mb-2">{circle.topic}</h3>
          <p className="text-slate-400 leading-relaxed mb-4">{circle.description}</p>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {circle.participants && circle.participants.slice(0, 5).map((p, i) => (
                    <img
                      key={p}
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${p}&backgroundColor=FF8C42,1B1F2A,3DDAD7&size=32`}
                      alt={`participant ${i}`}
                      className="w-8 h-8 rounded-full border-2 border-slate-700"
                      style={{ marginLeft: i > 0 ? '-12px' : 0 }}
                    />
                  ))}
                  {circle.participants && circle.participants.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border-2 border-slate-600" style={{ marginLeft: '-12px' }}>
                      +{circle.participants.length - 5}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>{formattedString}</span>
                </div>
              </div>
              
              {(circle.physical_address || circle.online_url) && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    {circle.location_type === 'physical' ? (
                      <MapPin className="w-4 h-4 text-turquoise-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-turquoise-400" />
                    )}
                    <span className="truncate">{circle.location_type === 'physical' ? circle.physical_address : circle.online_url}</span>
                  </div>
              )}
            </div>

            <Button 
              onClick={handleJoinLeave}
              disabled={!currentUser || isJoining}
              className={`w-[120px] font-semibold whitespace-nowrap transition-all duration-300 text-white ${
                isParticipant 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isParticipant ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Joined
                </>
              ) : (
                'Join Circle'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
