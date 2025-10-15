
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LearningCircle, User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, Send, CheckCircle, Eye, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';

import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

import CircleFormBasics from '@/components/circles/CircleFormBasics';
import CircleFormReview from '@/components/circles/CircleFormReview';
import CirclePreview from '@/components/circles/CirclePreview';

const STEPS = [
  { id: 1, title: 'Circle Details', icon: FileText },
  { id: 2, title: 'Review & Create', icon: Send }
];

export default function StartCircle() {
  const [currentStep, setCurrentStep] = useState(1);
  const [circleData, setCircleData] = useState({
    topic: '',
    description: '',
    frequency: 'Weekly',
    next_session: '',
    participants: [],
    location_type: 'online', // New field
    physical_address: '',    // New field
    online_url: '',          // New field
    learning_goals: '',      // New field
    prerequisites: '',       // New field
    max_participants: null   // New field
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state for initial data fetch
  const [isProcessing, setIsProcessing] = useState(false); // isProcessing for form submission
  const [isPublished, setIsPublished] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const circleId = urlParams.get('id');
  const isEditMode = !!circleId;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); // Use isLoading for initial data fetch
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (isEditMode) {
          const [data] = await LearningCircle.filter({ id: circleId });
          if (data && (data.created_by === user.id || user.role === 'admin')) {
            setCircleData({
              ...data,
              participants: data.participants || [],
              // Initialize new fields with data values or defaults if not present
              location_type: data.location_type || 'online',
              physical_address: data.physical_address || '',
              online_url: data.online_url || '',
              learning_goals: data.learning_goals || '',
              prerequisites: data.prerequisites || '',
              max_participants: data.max_participants || null
            });
          } else {
            navigate(createPageUrl('Learning'));
          }
        } else {
          // Add current user as initial participant
          setCircleData(prev => ({ 
            ...prev, 
            participants: [user.id],
            created_by: user.id 
          }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false); // Use isLoading for initial data fetch
      }
    };
    loadData();
  }, [circleId, isEditMode, navigate]);

  const updateCircleData = (updates) => {
    setCircleData(prev => ({ ...prev, ...updates }));
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        const isLocationValid = 
          (circleData.location_type === 'physical' && circleData.physical_address.trim().length > 0) ||
          (circleData.location_type === 'online' && circleData.online_url.trim().length > 0);

        return circleData.topic.trim().length > 3 && 
               circleData.description.trim().length > 10 && 
               !!circleData.frequency && 
               !!circleData.next_session &&
               isLocationValid;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 2 && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePublish = async () => {
    if (!isStepValid(1)) return;
    setIsProcessing(true);
    try {
      let result;
      if (isEditMode) {
        result = await LearningCircle.update(circleId, circleData);
        setPublishedId(circleId);
      } else {
        result = await LearningCircle.create(circleData);
        setPublishedId(result.id);
        
        // Record resonance event for NEW learning circle
        try {
          const participantCount = circleData.participants?.length || 0;
          
          // Calculate magnitude based on participation
          let magnitude = 3.0; // Base weight
          
          // Bonus for 3+ members
          if (participantCount >= 3) {
            magnitude += 1.0;
            console.log('✓ Participation bonus applied (+1.0)');
          }

          // Calculate alignment score based on topic/goals
          let alignmentScore = 1.0;
          
          // Check if circle topic/goals align with manifesto values
          const manifestoValues = ['resilience', 'decentralization', 'dezentral', 'transparency', 'transparent', 'collective', 'kollektiv', 'trustless', 'solid', 'progressive'];
          const topic = (circleData.topic || '').toLowerCase();
          const description = (circleData.description || '').toLowerCase();
          const goals = (circleData.learning_goals || '').toLowerCase();
          
          const hasManifestoAlignment = manifestoValues.some(value => 
            topic.includes(value) || description.includes(value) || goals.includes(value)
          );
          
          if (hasManifestoAlignment) {
            alignmentScore = 1.2; // Bonus for manifesto alignment
            console.log('✓ Manifesto alignment bonus applied (1.2 alignment)');
          }

          // Record for the host (User entity)
          await base44.functions.invoke('recordResonanceEvent', {
            entity_type: 'user',
            entity_id: currentUser.id,
            action_type: 'LEARNING_CIRCLE_HOSTED',
            magnitude: magnitude,
            alignment_score: alignmentScore,
            metadata: {
              circle_id: result.id,
              circle_topic: result.topic,
              participant_count: participantCount,
              frequency: result.frequency,
              has_manifesto_alignment: hasManifestoAlignment,
              has_participation_bonus: participantCount >= 3
            }
          });

          // Record for the circle itself
          await base44.functions.invoke('recordResonanceEvent', {
            entity_type: 'circle',
            entity_id: result.id,
            action_type: 'LEARNING_CIRCLE_HOSTED',
            magnitude: magnitude,
            alignment_score: alignmentScore,
            metadata: {
              host_id: currentUser.id,
              participant_count: participantCount,
              topic: result.topic
            }
          });

          console.log(`✓ Learning circle resonance recorded (${magnitude} points, ${participantCount} participants)`);
        } catch (error) {
          console.error('Failed to record resonance event:', error);
          // Don't fail the publish if resonance recording fails
        }
      }
      setIsPublished(true);
    } catch (error) {
      console.error("Failed to create circle:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CircleFormBasics
            circleData={circleData}
            onUpdate={updateCircleData}
          />
        );
      case 2:
        return (
          <CircleFormReview
            circleData={circleData}
            onUpdate={updateCircleData}
          />
        );
      default:
        return null;
    }
  };
  
  // Conditional render for initial loading spinner
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

  if (isPublished) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-center">
            <CardContent className="p-10">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">{isEditMode ? 'Circle Updated' : 'Circle Created'}</h2>
              <p className="text-slate-300 mb-6">Your learning circle is now active and ready for participants to join.</p>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="btn-secondary-coherosphere" 
                  onClick={() => navigate(createPageUrl('Learning'))}
                >
                  Back to Learning
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
                  onClick={() => navigate(createPageUrl('Learning'))} // This should probably navigate to the published circle's page
                >
                  View Circle
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const StepIcon = STEPS[currentStep - 1]?.icon;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Users className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {isEditMode ? 'Edit Learning Circle' : 'Start a Learning Circle'}
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Learn together. Grow together. Build collective resilience.
        </p>
        
        {/* Step Indicator - Desktop */}
        <div className="hidden lg:flex justify-center mt-6">
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
        <div className="lg:hidden flex flex-col gap-3 mt-6">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors flex-shrink-0 ${
                    isActive ? 'bg-orange-500 text-white' :
                    isCompleted ? 'bg-green-500' :
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

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left Panel - Form */}
        <div>
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              {StepIcon && <StepIcon className="w-5 h-5 text-slate-400" />}
              {STEPS[currentStep - 1]?.title}
            </h3>
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-6 text-slate-100">
              {renderStepContent()}
              
              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-700 mt-8">
                 <div> {/* This div is for alignment, can be empty */}
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="btn-secondary-coherosphere"
                    >
                      Previous
                    </Button>
                  )}
                </div>

                <div>
                  {currentStep < STEPS.length ? (
                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid(currentStep)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                    >
                      Next: {STEPS[currentStep].title}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePublish}
                      disabled={!isStepValid(1) || isProcessing}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isProcessing 
                        ? 'Processing...' 
                        : (isEditMode ? 'Update Circle' : 'Create Circle')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="hidden xl:block">
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-400" />
              Live Preview
            </h3>
            <CirclePreview 
              circleData={circleData}
              creator={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
