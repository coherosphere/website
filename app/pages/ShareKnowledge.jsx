
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Resource, User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Send, CheckCircle, Eye, FileText } from 'lucide-react';

import ResourceFormBasics from '@/components/resources/ResourceFormBasics';
import ResourceFormReview from '@/components/resources/ResourceFormReview';
import ResourcePreview from '@/components/resources/ResourcePreview';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

const STEPS = [
  { id: 1, title: 'Content', icon: FileText },
  { id: 2, title: 'Review & Publish', icon: Send }
];

export default function ShareKnowledge() {
  const [currentStep, setCurrentStep] = useState(1);
  const [resourceData, setResourceData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    icon_name: '',
    attachments: [],
    related_links: [],
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For initial data load
  const [isPublishing, setIsPublishing] = useState(false); // For publish action
  const [isPublished, setIsPublished] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const resourceId = urlParams.get('id');
  const isEditMode = !!resourceId;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); // Start loading for initial data
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (isEditMode) {
          const [data] = await Resource.filter({ id: resourceId });
          if (data && (data.creator_id === user.id || user.role === 'admin')) {
            setResourceData({
              ...data,
              attachments: data.attachments || [],
              related_links: data.related_links || []
            });
          } else {
            navigate(createPageUrl('Learning'));
            return; // Stop further execution if navigation occurs
          }
        } else {
          setResourceData(prev => ({ ...prev, creator_id: user.id }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false); // End loading regardless of success or failure
      }
    };
    loadData();
  }, [resourceId, isEditMode, navigate]);

  const updateResourceData = (updates) => {
    setResourceData(prev => ({ ...prev, ...updates }));
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return resourceData.title.length > 3 && resourceData.description.length > 10 && resourceData.category && resourceData.icon_name;
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
    setIsPublishing(true); // Start publishing
    try {
      let result;
      if (isEditMode) {
        result = await Resource.update(resourceId, resourceData);
        setPublishedId(resourceId);
      } else {
        result = await Resource.create(resourceData);
        setPublishedId(result.id);
      }
      setIsPublished(true);
    } catch (error) {
      console.error("Failed to publish resource:", error);
    } finally {
      setIsPublishing(false); // End publishing
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ResourceFormBasics
            resourceData={resourceData}
            onUpdate={updateResourceData}
          />
        );
      case 2:
        return (
          <ResourceFormReview
            resourceData={resourceData}
            onUpdate={updateResourceData}
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

  if (isPublished) {
     return (
      <div className="p-4 lg:p-8 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-center">
            <CardContent className="p-10">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">{isEditMode ? 'Resource Updated' : 'Resource Published'}</h2>
              <p className="text-slate-300 mb-6">Your contribution is now part of the Library of Resilience.</p>
              <div className="flex gap-4">
                <Link to={createPageUrl('Learning')} className="flex-1">
                  <Button variant="outline" className="w-full btn-secondary-coherosphere">Back to Library</Button>
                </Link>
                <Link to={createPageUrl(`ResourceDetail?id=${publishedId}`)} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600">View Resource</Button>
                </Link>
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
          <BookOpen className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {isEditMode ? 'Edit Resource' : 'Share Knowledge'}
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
            {/* Added 'text-slate-100' to ensure text within the form (including editors)
                is visible against the dark background. This provides a general dark-mode
                context for elements inside ResourceFormBasics. */}
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
                  {currentStep < 2 ? (
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
                      disabled={!isStepValid(1) || isPublishing}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isPublishing 
                        ? 'Processing...' 
                        : (isEditMode ? 'Update Resource' : 'Publish Resource')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="hidden xl:block"> {/* Corrected the class name to `xl:block` from `xl:ResourcePreview` */}
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-400" />
              Live Preview
            </h3>
            <ResourcePreview 
              resourceData={resourceData}
              creator={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
