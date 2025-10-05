
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, DailyCheckIn } from '@/api/entities';
import { Wind, Frown, Meh, Smile, Laugh, Sparkles, Clock } from 'lucide-react';

const moods = [
  { icon: Frown, label: 'Struggling' },
  { icon: Meh, label: 'Okay' },
  { icon: Smile, label: 'Good' },
  { icon: Laugh, label: 'Great' },
  { icon: Sparkles, label: 'Vibrant' },
];

export default function MindfulnessCheckIn() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectionTimestamp, setSelectionTimestamp] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [user, setUser] = useState(null);

  const updateTimeRemaining = useCallback((timestamp = selectionTimestamp) => {
    if (!timestamp) return;
    
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const timeLeft = TWENTY_FOUR_HOURS - (now - timestamp);
    
    if (timeLeft <= 0) {
      // 24h period expired
      setIsLocked(false);
      setSelectedMood(null);
      setSelectionTimestamp(null);
      setTimeRemaining(null);
      
      // Clear from storage
      if (user) {
        User.updateMyUserData({
          daily_mood_selection: null,
          daily_mood_timestamp: null
        });
      } else {
        localStorage.removeItem('coherosphere_daily_mood');
      }
    } else {
      setTimeRemaining(timeLeft);
    }
  }, [selectionTimestamp, user]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('coherosphere_daily_mood');
      if (savedData) {
        const { mood, timestamp } = JSON.parse(savedData);
        const now = Date.now();
        const timeDiff = now - timestamp;
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        
        if (timeDiff < TWENTY_FOUR_HOURS) {
          // Still within 24h window
          setSelectedMood(mood);
          setSelectionTimestamp(timestamp);
          setIsLocked(true);
          updateTimeRemaining(timestamp);
        } else {
          // 24h expired, clear old selection
          localStorage.removeItem('coherosphere_daily_mood');
        }
      }
    } catch (error) {
      console.error('Error loading mood from localStorage:', error);
    }
  }, [updateTimeRemaining]);

  const loadMoodSelection = useCallback(async () => {
    try {
      // Try to get current user first
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Load from user profile if available
      if (currentUser && currentUser.daily_mood_selection !== null && currentUser.daily_mood_timestamp) {
        const savedTimestamp = new Date(currentUser.daily_mood_timestamp).getTime();
        const now = Date.now();
        const timeDiff = now - savedTimestamp;
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        
        if (timeDiff < TWENTY_FOUR_HOURS) {
          // Still within 24h window
          setSelectedMood(currentUser.daily_mood_selection);
          setSelectionTimestamp(savedTimestamp);
          setIsLocked(true);
          updateTimeRemaining(savedTimestamp);
        } else {
          // 24h expired, clear old selection
          await User.updateMyUserData({
            daily_mood_selection: null,
            daily_mood_timestamp: null
          });
        }
      }
    } catch (error) {
      // User not logged in or error fetching user, try localStorage
      console.log('User not logged in or error fetching user, using localStorage', error);
      loadFromLocalStorage();
    }
  }, [updateTimeRemaining, loadFromLocalStorage]);

  // Load saved mood selection on component mount
  useEffect(() => {
    loadMoodSelection();
  }, [loadMoodSelection]);

  // Update timer every minute when locked
  useEffect(() => {
    let interval;
    if (isLocked && selectionTimestamp) {
      interval = setInterval(() => {
        updateTimeRemaining();
      }, 60000); // Update every minute
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, selectionTimestamp, updateTimeRemaining]);

  const handleMoodSelection = async (moodIndex) => {
    if (isLocked) return; // Cannot change if locked
    
    const now = Date.now();
    const selectedMoodData = moods[moodIndex];
    
    setSelectedMood(moodIndex);
    setSelectionTimestamp(now);
    setIsLocked(true);
    updateTimeRemaining(now);
    
    try {
      // Save to user profile or localStorage (for 24h lock)
      if (user) {
        await User.updateMyUserData({
          daily_mood_selection: moodIndex,
          daily_mood_timestamp: new Date(now).toISOString()
        });

        // Create a permanent record in DailyCheckIn
        await DailyCheckIn.create({
          user_id: user.id,
          mood_selection: moodIndex,
          mood_label: selectedMoodData.label,
          timestamp: new Date(now).toISOString()
        });

        console.log(`Check-in recorded: ${selectedMoodData.label} for user ${user.id}`);
      } else {
        // Fallback to localStorage if user not logged in
        localStorage.setItem('coherosphere_daily_mood', JSON.stringify({
          mood: moodIndex,
          timestamp: now
        }));
      }
    } catch (error) {
      console.error('Error saving mood selection:', error);
      // You might want to show a user-friendly error message here
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return '';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const startBreathing = () => {
    setIsBreathing(true);
    setTimeout(() => setIsBreathing(false), 8000); // 2 cycles of 4s
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Daily Resonance Check-In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-6">How are you resonating today?</p>
            <div className="flex justify-around">
              {moods.map((mood, index) => (
                <motion.button
                  key={mood.label}
                  onClick={() => handleMoodSelection(index)}
                  disabled={isLocked && selectedMood !== index}
                  className={`flex flex-col items-center gap-2 text-center group relative ${
                    isLocked && selectedMood !== index ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  whileHover={!isLocked || selectedMood === index ? { scale: 1.1 } : {}}
                  whileTap={!isLocked || selectedMood === index ? { scale: 0.95 } : {}}
                  title={
                    isLocked && selectedMood !== index 
                      ? "You can update your resonance after 24h"
                      : mood.label
                  }
                >
                  <motion.div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
                      ${selectedMood === index
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                        : isLocked
                        ? 'bg-slate-900/50 opacity-50'
                        : 'bg-slate-900/50 group-hover:bg-slate-800'
                      }`
                    }
                    animate={selectedMood === index && isLocked ? { scale: [1, 1.05, 1] } : {}}
                    transition={selectedMood === index && isLocked ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                  >
                    <mood.icon
                      className={`w-8 h-8 transition-colors duration-200
                        ${selectedMood === index
                          ? 'text-white'
                          : isLocked
                          ? 'text-slate-500'
                          : 'text-slate-400 group-hover:text-white'
                        }`
                      }
                      strokeWidth={1.5}
                    />
                  </motion.div>
                  <span className={`text-xs font-medium transition-colors duration-200
                    ${selectedMood === index && isLocked 
                      ? 'text-orange-400' 
                      : isLocked 
                      ? 'text-slate-500'
                      : 'text-slate-400 group-hover:text-white'
                    }`
                  }>
                    {mood.label}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* Lock Status Message */}
            {isLocked && timeRemaining && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-300">
                    Next Check-In in {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 text-center">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Mindful Moment</CardTitle>
          </CardHeader>
          <CardContent>
            {isBreathing ? (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-to-r from-turquoise-500 to-cyan-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                   <Wind className="w-10 h-10 text-white" />
                </motion.div>
                <motion.p
                  className="text-lg font-semibold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  Breathe deeply...
                </motion.p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 mb-4">Take one minute to center yourself with a calming breath.</p>
                <Button onClick={startBreathing} className="bg-gradient-to-r from-turquoise-500 to-cyan-500 text-white">
                  Start Breathing Exercise
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
