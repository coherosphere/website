
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { faq as Faq } from '@/api/entities';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, Globe, Zap, Search, Handshake, RefreshCw, Eye } from 'lucide-react';
import { debounce } from 'lodash';
import { motion } from 'framer-motion';

import FAQItem from '@/components/faq/FAQItem';
import FAQSearch from '@/components/faq/FAQSearch';
import StatCard from '@/components/StatCard';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { useCachedData } from '@/components/caching/useCachedData';
import { useLoading } from '@/components/loading/LoadingContext';

const categoryIcons = {
  'Introduction': HelpCircle,
  'Key Concepts': Search,
  'Participation & Governance': Handshake,
};

export default function FAQPage() {
  const [activeSlug, setActiveSlug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const itemRefs = useRef({});
  const { setLoading } = useLoading();

  // Use cached data for FAQs
  const { data: faqs = [], isLoading } = useCachedData(
    ['faq', 'published', 'en'],
    async () => {
      const publishedFaqs = await Faq.filter({ status: 'published', locale: 'en' });
      return publishedFaqs.sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return a.position - b.position;
      });
    },
    'faq'
  );

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Handle deep-linking on initial load
  useEffect(() => {
    if (faqs.length === 0) return;
    
    const hash = location.hash.replace('#', '');
    if (hash && faqs.some(f => f.slug === hash)) {
      setActiveSlug(hash);
      setTimeout(() => {
        itemRefs.current[hash]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [location.hash, faqs]);

  const handleToggle = async (slug) => {
    const newSlug = activeSlug === slug ? null : slug;
    setActiveSlug(newSlug);

    // Track view when opening (not when closing)
    if (newSlug && newSlug !== activeSlug) {
      try {
        const faq = faqs.find(f => f.slug === slug);
        if (faq) {
          const currentViews = faq.views || 0;
          // Update view count in database
          await Faq.update(faq.id, {
            views: currentViews + 1
          });
          
          // Note: We don't update local state here as React Query will handle
          // refetching on the next interval based on caching policy
        }
      } catch (error) {
        console.error('Error tracking FAQ view:', error);
        // Don't block UI if tracking fails
      }
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value) => setSearchTerm(value), 200),
    []
  );

  const allTags = useMemo(() => {
    const tags = new Set();
    faqs.forEach(faq => faq.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (activeTag) {
      result = result.filter(faq => faq.tags?.includes(activeTag));
    }
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(faq =>
        faq.question.toLowerCase().includes(lowercasedTerm) ||
        faq.answer.toLowerCase().includes(lowercasedTerm) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(lowercasedTerm))
      );
    }
    return result;
  }, [faqs, searchTerm, activeTag]);

  const groupedFaqs = useMemo(() => {
    return filteredFaqs.reduce((acc, faq) => {
      (acc[faq.category] = acc[faq.category] || []).push(faq);
      return acc;
    }, {});
  }, [filteredFaqs]);

  const handleTagClick = (tag) => {
    setActiveTag(prev => (prev === tag ? null : tag));
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentlyUpdated = faqs.filter(faq => {
      if (!faq.updated_date) return false;
      const updatedDate = new Date(faq.updated_date);
      return !isNaN(updatedDate.getTime()) && updatedDate >= thirtyDaysAgo;
    }).length;

    // Calculate total views across all FAQs
    const totalViews = faqs.reduce((sum, faq) => sum + (faq.views || 0), 0);

    return {
      totalQuestions: faqs.length,
      recentlyUpdated,
      mostViewed: totalViews
    };
  }, [faqs]);
  
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

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-3">
          <HelpCircle className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Frequently Asked Questions
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Answers to common questions about our vision, technology, and how to participate.
        </p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <StatCard
          icon={HelpCircle}
          value={stats.totalQuestions}
          label="Total Questions"
          color="text-orange-400"
          isLoading={false}
        />
        <StatCard
          icon={RefreshCw}
          value={stats.recentlyUpdated}
          label="Recently Updated"
          color="text-green-400"
          isLoading={false}
        />
        <StatCard
          icon={Eye}
          value={stats.mostViewed}
          label="Total Views"
          color="text-blue-400"
          isLoading={false}
        />
      </motion.div>

      {/* Two-column layout: Search left (1/3), FAQ right (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Search and Filters (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <FAQSearch 
              searchTerm={searchTerm} 
              onSearchChange={debouncedSearch} 
              tags={allTags}
              activeTag={activeTag}
              onTagChange={handleTagClick}
            />
          </div>
        </div>

        {/* Right Column: FAQ Accordion (2/3) */}
        <div className="lg:col-span-2">
          {Object.keys(groupedFaqs).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400">No questions found matching your criteria.</p>
            </div>
          ) : (
            Object.entries(groupedFaqs).map(([category, items]) => {
              const CategoryIcon = categoryIcons[category] || HelpCircle;
              return (
                <section key={category} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                      <CategoryIcon className="w-6 h-6 text-slate-500" />
                      <h2 className="text-xl font-bold text-slate-300">{category}</h2>
                  </div>
                  <div>
                    {items.map(faq => (
                      <div ref={el => itemRefs.current[faq.slug] = el} key={faq.id}>
                        <FAQItem
                          faq={faq}
                          isActive={activeSlug === faq.slug}
                          onToggle={() => handleToggle(faq.slug)}
                          onLinkClick={() => setActiveSlug(null)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}
