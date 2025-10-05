
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { faq as Faq } from '@/api/entities';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, Globe, Zap, Search, Handshake } from 'lucide-react';
import { debounce } from 'lodash';

import FAQItem from '@/components/faq/FAQItem';
import FAQSearch from '@/components/faq/FAQSearch';

const categoryIcons = {
  'Introduction': HelpCircle,
  'Key Concepts': Search,
  'Participation & Governance': Handshake,
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const itemRefs = useRef({});

  useEffect(() => {
    const fetchFaqs = async () => {
      setIsLoading(true);
      try {
        const publishedFaqs = await Faq.filter({ status: 'published', locale: 'en' });
        const sortedFaqs = publishedFaqs.sort((a, b) => {
          if (a.category < b.category) return -1;
          if (a.category > b.category) return 1;
          return a.position - b.position;
        });
        setFaqs(sortedFaqs);

        // Handle deep-linking on initial load
        const hash = location.hash.replace('#', '');
        if (hash && sortedFaqs.some(f => f.slug === hash)) {
          setActiveSlug(hash);
          setTimeout(() => {
            itemRefs.current[hash]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }

      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFaqs();
  }, [location.hash]);

  const handleToggle = (slug) => {
    const newSlug = activeSlug === slug ? null : slug;
    setActiveSlug(newSlug);
    // The previous navigation with hash was mainly for the left sidebar.
    // With its removal, we can simplify this. If deep linking is still desired
    // (e.g., for direct URL access), the initial useEffect handles it.
    // For toggling, just updating state is enough.
    // navigate(newSlug ? `#${newSlug}` : location.pathname, { replace: true });
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-3">
          <HelpCircle className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Frequently Asked Questions
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 max-w-3xl mt-3">
          Answers to common questions about our vision, technology, and how to participate.
        </p>
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
