
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, FileText, Lightbulb, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const categories = [
  { key: 'resilience', label: 'Resilience', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { key: 'technology', label: 'Technology', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'community', label: 'Community', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { key: 'learning', label: 'Learning', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { key: 'environment', label: 'Environment', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'governance', label: 'Governance', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
];

export default function ProjectFormBasics({ eventData, onUpdate }) {
  const titleLength = eventData.title.length;
  const descriptionLength = eventData.description.length;
  const goalLength = eventData.goal?.length || 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Project Title *
        </label>
        <div className="relative">
          <Input
            placeholder="What problem are you solving?"
            value={eventData.title}
            onChange={(e) => onUpdate({ title: e.target.value.slice(0, 80) })}
            className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 pr-16"
            maxLength={80}
          />
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
            titleLength > 60 ? 'text-orange-400' : 'text-slate-400'
          }`}>
            {titleLength}/80
          </div>
        </div>
      </div>

      {/* Project Idea (formerly Description) */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Project Idea *
        </label>
        <Textarea
          placeholder="Describe your project's core idea, its purpose, and how it will benefit the community..."
          value={eventData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 h-32"
          rows={6}
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${
            descriptionLength < 50 ? 'text-orange-400' : 'text-slate-500'
          }`}>
            {descriptionLength < 50 ? 'Required: At least 50 characters' : ''}
          </span>
          <span className="text-xs text-slate-400">
            {descriptionLength} characters
          </span>
        </div>
      </div>

      {/* Project Goal */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Project Goal *
        </label>
        <Textarea
          placeholder="What is the specific, measurable goal you want to achieve?"
          value={eventData.goal}
          onChange={(e) => onUpdate({ goal: e.target.value })}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 h-24"
          rows={4}
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${
            goalLength < 40 ? 'text-orange-400' : 'text-slate-500'
          }`}>
            {goalLength < 40 ? 'Required: At least 40 characters' : ''}
          </span>
          <span className="text-xs text-slate-400">
            {goalLength} characters
          </span>
        </div>
      </div>

      {/* Manifesto Compliance */}
      <div className="flex items-center space-x-3 rounded-lg border border-slate-700 bg-slate-900/30 p-4">
        <Checkbox
          id="manifesto-compliance"
          checked={eventData.manifesto_compliance}
          onCheckedChange={(checked) => onUpdate({ manifesto_compliance: checked })}
          className="border-slate-500 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
        />
        <Label htmlFor="manifesto-compliance" className="text-sm font-medium text-slate-300 leading-none cursor-pointer">
          Does the project comply with the{' '}
          <Link
            to={createPageUrl('Manifesto')}
            target="_blank"
            className="text-orange-400 hover:underline"
            onClick={(e) => e.stopPropagation()} // Prevent checkbox toggle when clicking link
          >
            coherosphere manifesto
          </Link>
          ? *
        </Label>
      </div>

      {/* Community Commitment */}
      <div className="flex items-center space-x-3 rounded-lg border border-slate-700 bg-slate-900/30 p-4">
        <Checkbox
          id="community-commitment"
          checked={eventData.community_commitment}
          onCheckedChange={(checked) => onUpdate({ community_commitment: checked })}
          className="border-slate-500 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
        />
        <Label htmlFor="community-commitment" className="text-sm font-medium text-slate-300 leading-none cursor-pointer">
          I undertake to make project results available to the coherosphere community. *
        </Label>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Project Category *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => (
            <Button
              key={category.key}
              variant="ghost"
              onClick={() => onUpdate({ category: category.key })}
              className={`filter-chip h-auto p-4 flex flex-col items-center gap-2 ${
                eventData.category === category.key ? 'active' : ''
              }`}
            >
              <span className="font-medium">{category.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
