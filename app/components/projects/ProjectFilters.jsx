
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  MapPin, 
  Globe, 
  ChevronDown,
  Clock,
  Users,
  Zap,
  Bitcoin,
  Waves,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Sort Dropdown Component
function ResonanceSortDropdown({ sortBy, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { key: 'newest', label: 'Newest First', icon: Clock },
    { key: 'most-supported', label: 'Most Supported', icon: Users },
    { key: 'highest-resonance', label: 'Highest Resonance', icon: Waves },
    { key: 'most-funded', label: 'Most Funded', icon: Bitcoin },
  ];

  const currentSort = sortOptions.find(option => option.key === sortBy);

  const handleSelect = (optionKey) => {
    onSortChange(optionKey);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button - Using unified input style */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="input-base min-w-48"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <currentSort.icon className="w-4 h-4" />
          <span>{currentSort.label}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-full z-20"
          >
            <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {sortOptions.map((option, index) => (
                <div key={option.key}>
                  <motion.button
                    onClick={() => handleSelect(option.key)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                      hover:bg-slate-700/50 text-slate-300 hover:text-white
                      ${sortBy === option.key ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : ''}
                    `}
                    whileHover={{ x: 4 }}
                  >
                    <option.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{option.label}</span>
                    {sortBy === option.key && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.button>
                  
                  {/* Resonance Wave Separator */}
                  {index < sortOptions.length - 1 && (
                    <div className="px-4">
                      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click Outside Handler */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default function ProjectFilters({ 
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  scope,
  onScopeChange,
  projectCounts,
  currentUser 
}) {
  const categories = [
    { key: 'all', label: 'All Projects' },
    { key: 'resilience', label: 'Resilience' },
    { key: 'technology', label: 'Technology' },
    { key: 'community', label: 'Community' },
    { key: 'learning', label: 'Learning' },
    { key: 'environment', label: 'Environment' },
    { key: 'governance', label: 'Governance' },
  ];

  // Determine current support filter state
  const supportFilter = selectedCategory === 'my-supported' ? 'my-supported' : 
                       selectedCategory === 'no-support' ? 'no-support' : 'all';

  const handleSupportFilterChange = (newFilter) => {
    onCategoryChange(newFilter);
  };

  const isLocalDisabled = !currentUser || !currentUser.hub_id;

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
      <div className="flex flex-col gap-6">
        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Support Filter Switcher */}
          {currentUser && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-300">My Support?</span>
              <div className="switcher-container w-fit">
                <motion.button
                  onClick={() => handleSupportFilterChange('my-supported')}
                  className={`switcher-button ${supportFilter === 'my-supported' ? 'active' : ''}`}
                  whileHover={{ scale: supportFilter !== 'my-supported' ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">({projectCounts['my-supported'] || 0})</span>
                </motion.button>
                <motion.button
                  onClick={() => handleSupportFilterChange('no-support')}
                  className={`switcher-button ${supportFilter === 'no-support' ? 'active' : ''}`}
                  whileHover={{ scale: supportFilter !== 'no-support' ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm">({projectCounts['no-support'] || 0})</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* Custom Sort Dropdown */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Sort by Resonance</span>
            </div>
            <ResonanceSortDropdown 
              sortBy={sortBy} 
              onSortChange={onSortChange} 
            />
          </div>

          {/* Scope Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-300">Resonance Scope</span>
            <div className="switcher-container w-fit">
              <motion.button
                onClick={() => onScopeChange('local')}
                className={`switcher-button ${scope === 'local' ? 'active' : ''} ${isLocalDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLocalDisabled}
                title={isLocalDisabled ? "Select a hub in your profile to use this filter" : "Show local projects"}
                whileHover={{ scale: scope !== 'local' && !isLocalDisabled ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
              >
                <MapPin className="w-4 h-4" />
                Local
              </motion.button>
              <motion.button
                onClick={() => onScopeChange('global')}
                className={`switcher-button ${scope === 'global' ? 'active' : ''}`}
                whileHover={{ scale: scope !== 'global' ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe className="w-4 h-4" />
                Global
              </motion.button>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.key}
                variant="ghost"
                size="sm"
                onClick={() => onCategoryChange(category.key)}
                className={`filter-chip h-auto justify-between min-w-fit whitespace-nowrap ${selectedCategory === category.key && supportFilter === 'all' ? 'active' : ''}`}
              >
                <span className="flex-shrink-0">{category.label}</span>
                <Badge 
                  variant="secondary" 
                  className={`ml-[3px] transition-colors duration-200 flex-shrink-0 ${
                    selectedCategory === category.key && supportFilter === 'all'
                    ? 'bg-black/20 text-white' 
                    : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {projectCounts[category.key] || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
