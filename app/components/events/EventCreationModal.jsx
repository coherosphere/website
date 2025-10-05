import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Event, User } from '@/api/entities';
import { X, Calendar, MapPin, Users, Zap, Save, Eye, Send } from 'lucide-react';

import EventFormBasics from './EventFormBasics';
import EventFormTimePlace from './EventFormTimePlace';
import EventFormResonance from './EventFormResonance';
import EventFormReview from './EventFormReview';
import EventPreview from './EventPreview';

const STEPS = [
  { id: 1, title: 'Basics', icon: Calendar },
  { id: 2, title: 'Time & Place', icon: MapPin },
  { id: 3, title: 'Resonance', icon: Users },
  { id: 4, title: 'Review & Publish', icon: Send }
];

export default function EventCreationModal({ isOpen, onClose, hubId, onEventCreated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Form Data
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    end_time: '',
    location: '',
    location_type: 'physical', // 'physical' or 'online'
    online_url: '',
    physical_address: '',
    coordinates: null,
    capacity: 20,
    rsvp_enabled: true,
    values: [],
    requested_skills: [],
    contribution_types: ['time'],
    publish_to_nostr: false,
    hub_id: hubId
  });

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        setEventData(prev => ({ ...prev, organizer_id: user.id }));
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    if (isOpen) {
      loadUser();
      // Load draft from localStorage
      const savedDraft = localStorage.getItem('event_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setEventData(prev => ({ ...prev, ...draft, hub_id: hubId }));
        } catch (e) {
          console.warn('Could not load draft:', e);
        }
      }
    }
  }, [isOpen, hubId]);

  // Auto-save draft
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      localStorage.setItem('event_draft', JSON.stringify(eventData));
      setLastSaved(new Date());
    }, 5000);

    return () => clearTimeout(timer);
  }, [eventData, isOpen]);

  const updateEventData = (updates) => {
    setEventData(prev => ({ ...prev, ...updates }));
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return eventData.title.length > 0 && eventData.description.length >= 10;
      case 2:
        return eventData.date && (
          (eventData.location_type === 'physical' && eventData.physical_address) ||
          (eventData.location_type === 'online' && eventData.online_url)
        );
      case 3:
        return true; // Resonance step is optional
      case 4:
        return eventData.title && eventData.date && eventData.location;
      default:
        return false;
    }
  };

  const canPublish = () => {
    return STEPS.every(step => isStepValid(step.id));
  };

  const handleNext = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('event_draft', JSON.stringify(eventData));
      setLastSaved(new Date());
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!canPublish()) return;

    setIsPublishing(true);
    try {
      // Create the event
      const newEvent = await Event.create({
        ...eventData,
        location: eventData.location_type === 'physical' 
          ? eventData.physical_address 
          : eventData.online_url,
        attendees: []
      });

      // Clear draft
      localStorage.removeItem('event_draft');

      // Optional: Publish to Nostr
      if (eventData.publish_to_nostr) {
        // Would integrate with Nostr here
        console.log('Publishing to Nostr...');
      }

      if (onEventCreated) {
        onEventCreated(newEvent);
      }

      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <EventFormBasics
            eventData={eventData}
            onUpdate={updateEventData}
            organizer={currentUser}
          />
        );
      case 2:
        return (
          <EventFormTimePlace
            eventData={eventData}
            onUpdate={updateEventData}
          />
        );
      case 3:
        return (
          <EventFormResonance
            eventData={eventData}
            onUpdate={updateEventData}
          />
        );
      case 4:
        return (
          <EventFormReview
            eventData={eventData}
            onUpdate={updateEventData}
            organizer={currentUser}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="w-full max-w-7xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-slate-800/95 backdrop-blur-sm border-slate-700 h-full">
            <CardHeader className="relative pb-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-turquoise-500/20 to-cyan-500/20 border border-turquoise-500/30 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-turquoise-400" />
                </div>
                
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    Create New Event
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            currentStep === step.id 
                              ? 'bg-turquoise-500 text-white' 
                              : currentStep > step.id
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {currentStep > step.id ? '✓' : step.id}
                          </div>
                          {index < STEPS.length - 1 && (
                            <div className={`w-6 h-0.5 transition-colors ${
                              currentStep > step.id ? 'bg-green-500' : 'bg-slate-600'
                            }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="text-sm text-slate-400">
                      Step {currentStep} of 4: {STEPS[currentStep - 1]?.title}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Panel - Form */}
                <div className="p-6 overflow-y-auto">
                  {renderStepContent()}
                  
                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-6 border-t border-slate-700 mt-8">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="btn-secondary-coherosphere"
                      >
                        Previous
                      </Button>
                      {currentStep < 4 ? (
                        <Button
                          onClick={handleNext}
                          disabled={!isStepValid(currentStep)}
                          className="bg-turquoise-500 hover:bg-turquoise-600"
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          onClick={handlePublish}
                          disabled={!canPublish() || isPublishing}
                          className="bg-gradient-to-r from-turquoise-500 to-cyan-500 hover:from-turquoise-600 hover:to-cyan-600"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isPublishing ? 'Publishing...' : 'Publish Event'}
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      className="btn-secondary-coherosphere"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                  </div>

                  {lastSaved && (
                    <p className="text-xs text-slate-500 mt-2">
                      Draft saved {lastSaved.toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Right Panel - Live Preview */}
                <div className="hidden lg:block bg-slate-900/50 p-6 border-l border-slate-700">
                  <div className="sticky top-0">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-slate-400" />
                      Live Preview
                    </h3>
                    <EventPreview 
                      eventData={eventData}
                      organizer={currentUser}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}