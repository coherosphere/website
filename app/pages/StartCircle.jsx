
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LearningCircle, User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, Send, CheckCircle, Eye, FileText } from 'lucide-react';

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
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const circleId = urlParams.get('id');
  const isEditMode = !!circleId;

  useEffect(() => {
    const loadData = async () => {
      setIsProcessing(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (isEditMode) {
          const [data] = await LearningCircle.filter({ id: circleId });
          if (data && (data.created_by === user.id || user.role === 'admin')) {
            setCircleData({
              ...data,
              participants: data.participants || []
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
        setIsProcessing(false);
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
        return circleData.topic.length > 3 && circleData.description.length > 10 && circleData.frequency && circleData.next_session;
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
                  className="flex-1 btn-secondary-coherosphere" 
                  onClick={() => navigate(createPageUrl('Learning'))}
                >
                  Back to Learning
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
                  onClick={() => navigate(createPageUrl('Learning'))}
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
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Users className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {isEditMode ? 'Edit Learning Circle' : 'Start a Learning Circle'}
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors flex-shrink-0 ${
                  currentStep === step.id 
                    ? 'bg-turquoise-500 text-white' 
                    : currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 transition-colors flex-shrink-0 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-600'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="text-center">
            <span className="text-sm text-slate-400">
              Step {currentStep} of 2: {STEPS[currentStep - 1]?.title}
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
              {/* Corrected footer layout for consistency: buttons are direct children of the flex container */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-700 mt-8 gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="btn-secondary-coherosphere w-full sm:w-auto"
                >
                  Previous
                </Button>
                {currentStep < 2 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold w-full sm:w-auto"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handlePublish}
                    disabled={!isStepValid(1) || isProcessing}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isProcessing 
                      ? 'Processing...' 
                      : (isEditMode ? 'Update Circle' : 'Create Circle')}
                  </Button>
                )}
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
