
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Event, User } from '@/api/entities';
import { ArrowLeft, Calendar, MapPin, Users, Zap, Save, Eye, Send, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import EventFormBasics from '@/components/events/EventFormBasics';
import EventFormTimePlace from '@/components/events/EventFormTimePlace';
import EventFormResonance from '@/components/events/EventFormResonance';
import EventFormReview from '@/components/events/EventFormReview';
import EventPreview from '@/components/events/EventPreview';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

const STEPS = [
  { id: 1, title: 'Basics', icon: Calendar },
  { id: 2, title: 'Time & Place', icon: MapPin },
  { id: 3, title: 'Resonance', icon: Users },
  { id: 4, title: 'Review & Publish', icon: Send }
];

export default function HostEvent() {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'workshop',
    date: '',
    start_time: '',
    end_time: '',
    location_type: 'physical',
    location: '',
    max_participants: '',
    requirements: '',
    goals: [],
    // Add missing fields to initial state
    values: [],
    requested_skills: [],
    contribution_types: ['time'],
    publish_to_nostr: false,
    hub_id: '',
    created_by: ''
  });
  // showPreview state is removed as the preview is now always visible on large screens
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEventId, setEditEventId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  // Removed: const [isSavingDraft, setIsSavingDraft] = useState(false); 

  useEffect(() => {
    const loadUserAndData = async () => {
      setIsLoading(true); // Set loading to true at the start
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        const urlParams = new URLSearchParams(window.location.search);
        const hubId = urlParams.get('hubId');
        const eventId = urlParams.get('eventId');
        
        if (hubId) {
          setFormData(prev => ({ ...prev, hub_id: hubId }));
        }
        
        if (eventId) {
          setIsEditMode(true);
          setEditEventId(eventId);
          
          const existingEvent = await Event.get(eventId);
          if (existingEvent) {
            setFormData({
              title: existingEvent.title || '',
              description: existingEvent.description || '',
              category: existingEvent.category || 'workshop',
              date: existingEvent.date || '',
              start_time: existingEvent.start_time || '',
              end_time: existingEvent.end_time || '',
              location_type: existingEvent.location_type || 'physical',
              location: existingEvent.location || '',
              max_participants: existingEvent.max_participants || '',
              requirements: existingEvent.requirements || '',
              goals: existingEvent.goals || [],
              // Add missing fields when loading existing event
              values: existingEvent.values || [],
              requested_skills: existingEvent.requested_skills || [],
              contribution_types: existingEvent.contribution_types || ['time'],
              publish_to_nostr: existingEvent.publish_to_nostr || false,
              hub_id: existingEvent.hub_id || hubId || '',
              created_by: existingEvent.created_by || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false); // Set loading to false when done
      }
    };

    loadUserAndData();
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFormDataChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const eventData = {
        ...formData,
        created_by: currentUser?.email || '',
        status: 'published'
      };

      let result;
      if (isEditMode && editEventId) {
        result = await Event.update(editEventId, eventData);
      } else {
        result = await Event.create(eventData);
      }

      setIsSuccess(true);
      
      setTimeout(() => {
        // Redirect to event page if created/updated, otherwise to Hub
        if (result && result.id) {
          navigate(createPageUrl('Event', { id: result.id }));
        } else {
          navigate(createPageUrl('Hub'));
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error publishing event:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Removed: handleSaveDraft function

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <EventFormBasics
            formData={formData}
            onChange={handleFormDataChange}
            onNext={handleNext}
            organizer={currentUser}
          />
        );
      case 2:
        return (
          <EventFormTimePlace
            formData={formData}
            onChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <EventFormResonance
            formData={formData}
            onChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <EventFormReview
            formData={formData}
            onPublish={handlePublish}
            onBack={handleBack}
            isPublishing={isPublishing}
            isEditMode={isEditMode}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Fixed Overlay Spinner */}
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
        
        {/* Virtual placeholder */}
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  if (isSuccess) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 p-8 text-center max-w-md">
          <CardContent>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {isEditMode ? 'Event Updated!' : 'Event Published!'}
            </h2>
            <p className="text-slate-400 mb-4">
              {isEditMode ? 'Your event has been successfully updated.' : 'Your event is now live and visible to the community.'}
            </p>
            <div className="animate-pulse text-orange-400">Redirecting to hub...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StepIcon = STEPS[currentStep - 1]?.icon;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Calendar className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {isEditMode ? 'Edit Event' : 'Host an Event'}
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        
        {/* Step Indicator - Desktop */}
        <div className="hidden lg:flex justify-center">
          <div className="flex items-center space-x-4 bg-slate-800/30 backdrop-blur-sm rounded-full px-6 py-3">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-orange-500 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-orange-400' : 
                    isCompleted ? 'text-green-400' : 
                    'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 h-px mx-4 transition-colors ${
                      isCompleted ? 'bg-green-400' : 'bg-slate-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Step Indicator - Mobile */}
        <div className="lg:hidden flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors flex-shrink-0 ${
                    isActive ? 'bg-orange-500 text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-6 h-0.5 transition-colors flex-shrink-0 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-600'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-sm text-slate-400">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.title}
            </span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left Panel - Form */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            {StepIcon && <StepIcon className="w-5 h-5 text-slate-400" />}
            {STEPS[currentStep - 1]?.title}
          </h3>
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-6">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </CardContent>
            {/* Removed: Consistent Card Footer for actions like Save Draft */}
          </Card>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="hidden xl:block">
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-400" />
              Live Preview
            </h3>
            <EventPreview 
              formData={formData}
              organizer={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
