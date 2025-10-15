
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project, User } from '@/api/entities';
import { ArrowLeft, Lightbulb, FileText, Bitcoin, Send, CheckCircle, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

import ProjectFormBasics from '../components/projects/ProjectFormBasics';
import ProjectFormDetails from '../components/projects/ProjectFormDetails';
import ProjectFormReview from '../components/projects/ProjectFormReview';
import ProjectPreview from '../components/projects/ProjectPreview';
import CoherosphereNetworkSpinner from '../components/spinners/CoherosphereNetworkSpinner';

const STEPS = [
  { id: 1, title: 'Basics', icon: FileText },
  { id: 2, title: 'Details', icon: Bitcoin },
  { id: 3, title: 'Review & Publish', icon: Send }
];

export default function CreateProject() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedProject, setPublishedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const isEditMode = !!projectId;

  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    goal: '',
    manifesto_compliance: false,
    community_commitment: false, // Added: Community-Commitment checkbox
    category: 'community',
    hub_id: null,
    funding_needed: 100000,
    status: 'proposed',
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (isEditMode) {
          const projects = await Project.list();
          const existingProject = projects.find(p => p.id === projectId);
          if (existingProject && (existingProject.creator_id === user.id || user.role === 'admin')) {
            setProjectData({
              ...existingProject,
              funding_needed: existingProject.funding_needed || 0,
              goal: existingProject.goal || '', // ensure goal is initialized
              manifesto_compliance: existingProject.manifesto_compliance || false, // ensure compliance is initialized
              community_commitment: existingProject.community_commitment || false, // Added: ensure community commitment is initialized
            });
          } else {
            console.error('Project not found or user not authorized to edit.');
            navigate(createPageUrl('Projects'));
          }
        } else {
           setProjectData(prev => ({ ...prev, hub_id: user.hub_id, creator_id: user.id }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, isEditMode, navigate]);

  const updateProjectData = (updates) => {
    setProjectData(prev => ({ ...prev, ...updates }));
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return projectData.title.length > 3 && 
               projectData.description.length >= 50 && // Changed: Min length 10 to 50
               projectData.goal.length >= 40 &&       // Changed: Min length 10 to 40
               projectData.manifesto_compliance === true &&
               projectData.community_commitment === true; // Added: Community-Commitment validation
      case 2:
        return projectData.hub_id && projectData.funding_needed >= 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePublish = async () => {
    if (!isStepValid(1) || !isStepValid(2)) return;

    setIsPublishing(true);
    try {
      let resultProject;
      const dataToSave = {
        ...projectData,
        creator_id: projectData.creator_id || currentUser.id,
      };

      if (isEditMode) {
        resultProject = await Project.update(projectId, dataToSave);
      } else {
        resultProject = await Project.create(dataToSave);
        
        // Record resonance event for NEW project creation
        try {
          // Record for the creator (User entity)
          await base44.functions.invoke('recordResonanceEvent', {
            entity_type: 'user',
            entity_id: currentUser.id,
            action_type: 'PROJECT_CREATED',
            magnitude: 4.0,
            alignment_score: 1.0, // Perfect alignment for creating projects
            hub_id: projectData.hub_id,
            metadata: {
              project_id: resultProject.id,
              project_title: resultProject.title,
              category: resultProject.category,
              funding_needed: resultProject.funding_needed
            }
          });

          // Record for the project itself
          await base44.functions.invoke('recordResonanceEvent', {
            entity_type: 'project',
            entity_id: resultProject.id,
            action_type: 'PROJECT_CREATED',
            magnitude: 4.0,
            alignment_score: 1.0,
            hub_id: projectData.hub_id,
            metadata: {
              creator_id: currentUser.id,
              category: resultProject.category,
              title: resultProject.title
            }
          });

          // If project is assigned to a hub, give the hub a bonus
          if (projectData.hub_id) {
            await base44.functions.invoke('recordResonanceEvent', {
              entity_type: 'hub',
              entity_id: projectData.hub_id,
              action_type: 'PROJECT_CREATED',
              magnitude: 1.0,
              alignment_score: 1.0,
              metadata: {
                project_id: resultProject.id,
                project_title: resultProject.title,
                creator_id: currentUser.id
              }
            });
          }

          console.log('✓ Project creation resonance events recorded');
        } catch (error) {
          console.error('Failed to record resonance event:', error);
          // Don't fail the publish if resonance recording fails
        }
      }

      setPublishedProject(resultProject);
      setIsPublished(true);
    } catch (error) {
      console.error('Error publishing project:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <ProjectFormBasics eventData={projectData} onUpdate={updateProjectData} />;
      case 2: return <ProjectFormDetails eventData={projectData} onUpdate={updateProjectData} />;
      case 3: return <ProjectFormReview eventData={projectData} />;
      default: return null;
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-2xl w-full"
        >
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {isEditMode ? 'Project Updated!' : 'Project Published!'}
              </h1>
              <p className="text-slate-300 mb-8">
                Your project "{publishedProject?.title}" is now proposed and visible to the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl('Projects')}>
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All Projects
                  </Button>
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
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Lightbulb className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {isEditMode ? 'Edit Project' : 'Start a Project'}
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Turn ideas into collective action — projects that resonate.
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div>
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              {StepIcon && <StepIcon className="w-5 h-5 text-slate-400" />}
              {STEPS[currentStep - 1]?.title}
            </h3>
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-6">
              {renderStepContent()}
              <div className="flex justify-between items-center pt-6 border-t border-slate-700 mt-8">
                <div> 
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
                      <Button onClick={handleNext} disabled={!isStepValid(currentStep)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
                        Next: {STEPS[currentStep].title}
                      </Button>
                    ) : (
                      <Button onClick={handlePublish} disabled={isPublishing || !isStepValid(1) || !isStepValid(2)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold">
                        <Send className="w-4 h-4 mr-2" />
                        {isPublishing ? 'Publishing...' : (isEditMode ? 'Update Project' : 'Publish Project')}
                      </Button>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-400" />
              Live Preview
            </h3>
            <ProjectPreview projectData={projectData} />
          </div>
        </div>
      </div>
    </div>
  );
}
