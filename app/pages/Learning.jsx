
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Users, CheckCircle } from 'lucide-react';
import ResourceCard from '@/components/learning/ResourceCard';
import LearningCircleCard from '@/components/learning/LearningCircleCard';
import MindfulnessCheckIn from '@/components/learning/MindfulnessCheckIn';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Added import for Badge
import { Resource, LearningCircle, User, DailyCheckIn } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Learning() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState([]);
  const [circles, setCircles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    knowledge: 0,
    circles: 0,
    checkIns: 0,
  });
  const libraryRef = useRef(null);

  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resourceData, circleData, userData, checkInData] = await Promise.all([
          Resource.list(),
          LearningCircle.list(),
          User.me().catch(() => null),
          DailyCheckIn.list().catch(() => []), // Get all check-in records
        ]);
        setResources(resourceData);
        setCircles(circleData);
        setCurrentUser(userData);

        // Calculate stats
        setStats({
          knowledge: resourceData.length,
          circles: circleData.length,
          checkIns: checkInData.length, // Total number of all check-ins ever made
        });

      } catch (error) {
        console.error("Failed to fetch learning data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCircleUpdate = async () => {
    const circleData = await LearningCircle.list();
    setCircles(circleData);
  };
  
  const handleSetSelectedCategory = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const filteredResources = selectedCategory === 'all'
    ? resources
    : resources.filter(r => r.category && r.category.replace(/ & /g, '').replace(/ /g, '') === selectedCategory);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'CommunityBuilding', label: 'Community Building' },
    { key: 'HolisticHealth', label: 'Holistic Health' },
    { key: 'DecentralizedTech', label: 'Decentralized Tech' },
    { key: 'NatureSustainability', label: 'Nature & Sustainability' },
  ];
  
  const getCategoryCount = (categoryKey) => {
    if (categoryKey === 'all') return resources.length;
    return resources.filter(r => r.category && r.category.replace(/ & /g, '').replace(/ /g, '') === categoryKey).length;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <BookOpen className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Learning & Resilience
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Resources, circles, and practices to grow stronger together.
        </p>
      </div>
      
      {/* Stats Bar */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.knowledge}</div>
                <div className="text-slate-400 text-sm">Knowledge</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.circles}</div>
                <div className="text-slate-400 text-sm">Circles</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2"></div>
                <div className="h-6 w-12 bg-slate-600 rounded mx-auto mb-2"></div>
                <div className="h-4 w-16 bg-slate-600 rounded mx-auto"></div>
              </div>
            ) : (
              <>
                <CheckCircle className="w-8 h-8 text-cyan-500 mx-auto mb-2" /> {/* Changed to cyan-500 for better contrast with turquoise */}
                <div className="text-2xl font-bold text-white">{stats.checkIns}</div>
                <div className="text-slate-400 text-sm">Check-In's</div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Interaction Buttons */}
      <motion.div
        className="mb-8 flex flex-col md:flex-row gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link to={createPageUrl('ShareKnowledge')} className="flex-1">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 text-base">
            <Plus className="w-5 h-5 mr-2" /> Create Resource
          </Button>
        </Link>
        <Link to={createPageUrl('StartCircle')} className="flex-1">
           <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 text-base">
            <Plus className="w-5 h-5 mr-2" /> Start a Circle
          </Button>
        </Link>
      </motion.div>


      {/* Main Content Sections */}
      <div className="space-y-12">
        {/* --- Library and Mindfulness Section --- */}
        <section>
          {/* Library Title and Filters */}
          <motion.div
            ref={libraryRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold">Library of Resilience</h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <Button
                  key={cat.key}
                  onClick={() => handleSetSelectedCategory(cat.key)}
                  variant="ghost"
                  className={`filter-chip h-auto ${selectedCategory === cat.key ? 'active' : ''}`}
                >
                  {cat.label}
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 transition-colors duration-200 ${selectedCategory === cat.key ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {getCategoryCount(cat.key)}
                  </Badge>
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Content Grid (Resources on Left, Mindfulness on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Resource Cards */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 animate-pulse h-40"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paginatedResources.length > 0 ? (
                    paginatedResources.map((resource, index) => (
                      <Link key={resource.id} to={createPageUrl(`ResourceDetail?id=${resource.id}`)}>
                        <ResourceCard resource={resource} index={index} />
                      </Link>
                    ))
                  ) : (
                    <p className="col-span-full text-center text-slate-400">No resources found for this category.</p>
                  )}
                </div>
              )}
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <motion.div
                  className="pt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {/* Pagination Buttons */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      ←
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                        .map((page, index, arr) => (
                          <React.Fragment key={page}>
                            {index > 0 && arr[index - 1] !== page - 1 && (
                              <span className="text-slate-500 px-2">...</span>
                            )}
                            <Button
                              onClick={() => handlePageChange(page)}
                              variant="ghost"
                              className={`filter-chip h-auto w-10 ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))
                      }
                    </div>

                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="ghost"
                      className={`filter-chip h-auto ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      →
                    </Button>
                  </div>

                  {/* Page Info */}
                  <div className="text-slate-400 text-sm text-center">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredResources.length)} of {filteredResources.length} resources
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column: Mindfulness Tools */}
            <aside className="lg:col-span-1">
              <MindfulnessCheckIn />
            </aside>
          </div>
        </section>

        {/* --- Co-Learning Circles Section (Full Width) --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Co-Learning Circles</h2>
          </div>
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 animate-pulse h-32"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {circles.length > 0 ? (
                circles.map((circle, index) => (
                  <LearningCircleCard 
                    key={circle.id} 
                    circle={circle} 
                    index={index} 
                    currentUser={currentUser}
                    onUpdate={handleCircleUpdate}
                  />
                ))
              ) : (
                <p className="text-center text-slate-400">No learning circles found. Be the first to start one!</p>
              )}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
