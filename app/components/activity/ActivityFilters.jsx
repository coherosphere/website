import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, AtSign, Reply, Zap, Heart, Repeat } from 'lucide-react';

export default function ActivityFilters({ 
  selectedFilter, 
  onFilterChange, 
  activityCounts 
}) {
  const filters = [
    { key: 'all', label: 'All', icon: null },
    { key: 'post', label: 'Posts', icon: MessageCircle },
    { key: 'mention', label: 'Mentions', icon: AtSign },
    { key: 'reply', label: 'Replies', icon: Reply },
    { key: 'reaction', label: 'Reactions', icon: Heart },
    { key: 'zap', label: 'Zaps', icon: Zap },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className={`filter-chip h-auto ${selectedFilter === filter.key ? 'active' : ''}`}
        >
          {filter.icon && <filter.icon className="w-4 h-4 mr-2" />}
          {filter.label}
          <Badge 
            variant="secondary" 
            className={`ml-[3px] transition-colors duration-200 ${
              selectedFilter === filter.key 
              ? 'bg-black/20 text-white' 
              : 'bg-slate-700 text-slate-300'
            }`}
          >
            {activityCounts[filter.key] || 0}
          </Badge>
        </Button>
      ))}
    </div>
  );
}