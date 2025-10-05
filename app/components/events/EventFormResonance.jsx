
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, BrainCircuit, Plus, X, Users, Clock, Zap, DollarSign } from 'lucide-react';

const predefinedValues = [
  'Community', 'Learning', 'Resilience', 'Innovation', 'Sustainability',
  'Creativity', 'Collaboration', 'Empowerment', 'Balance', 'Growth'
];

const predefinedSkills = [
  'Web Development', 'Design', 'Writing', 'Teaching', 'Facilitation',
  'Photography', 'Music', 'Marketing', 'Project Management', 'Research'
];

export default function EventFormResonance({ formData, onChange, onNext, onBack }) {
  const [newValue, setNewValue] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const addValue = (value) => {
    if (value && !formData.values.includes(value) && formData.values.length < 6) {
      onChange({ values: [...formData.values, value] });
      setNewValue('');
    }
  };

  const removeValue = (valueToRemove) => {
    onChange({ values: formData.values.filter(value => value !== valueToRemove) });
  };

  const addSkill = (skill) => {
    if (skill && !formData.requested_skills.includes(skill) && formData.requested_skills.length < 8) {
      onChange({ requested_skills: [...formData.requested_skills, skill] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    onChange({ requested_skills: formData.requested_skills.filter(skill => skill !== skillToRemove) });
  };

  const toggleContributionType = (type) => {
    const current = formData.contribution_types || ['time'];
    if (current.includes(type)) {
      onChange({ contribution_types: current.filter(t => t !== type) });
    } else {
      onChange({ contribution_types: [...current, type] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Resonance Values */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          <Heart className="w-4 h-4 inline mr-2 text-red-400" />
          Resonance Values (up to 6)
        </label>
        <p className="text-xs text-slate-400 mb-3">
          What values does this event represent and promote?
        </p>
        
        {/* Current Values */}
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.values.map((value) => (
            <Badge
              key={value}
              variant="outline"
              className="bg-red-500/20 text-red-400 border-red-500/30 pl-3 pr-2 py-1"
            >
              {value}
              <button
                onClick={() => removeValue(value)}
                className="ml-2 text-current hover:text-red-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Add Custom Value */}
        {formData.values.length < 6 && (
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Add a value..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addValue(newValue.trim())}
              className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
            />
            <Button
              onClick={() => addValue(newValue.trim())}
              disabled={!newValue.trim()}
              size="sm"
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Predefined Values */}
        <div className="flex flex-wrap gap-2">
          {predefinedValues
            .filter(value => !formData.values.includes(value))
            .slice(0, 5)
            .map((value) => (
              <Button
                key={value}
                onClick={() => addValue(value)}
                disabled={formData.values.length >= 6}
                variant="ghost"
                className="filter-chip h-auto text-xs"
              >
                {value}
              </Button>
            ))}
        </div>
      </div>

      {/* Requested Skills */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          <BrainCircuit className="w-4 h-4 inline mr-2 text-blue-400" />
          Requested Skills (up to 8)
        </label>
        <p className="text-xs text-slate-400 mb-3">
          What skills would be valuable for attendees or contributors to have?
        </p>
        
        {/* Current Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.requested_skills.map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="bg-blue-500/20 text-blue-400 border-blue-500/30 pl-3 pr-2 py-1"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-2 text-current hover:text-blue-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Add Custom Skill */}
        {formData.requested_skills.length < 8 && (
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill.trim())}
              className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
            />
            <Button
              onClick={() => addSkill(newSkill.trim())}
              disabled={!newSkill.trim()}
              size="sm"
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Predefined Skills */}
        <div className="flex flex-wrap gap-2">
          {predefinedSkills
            .filter(skill => !formData.requested_skills.includes(skill))
            .slice(0, 5)
            .map((skill) => (
              <Button
                key={skill}
                onClick={() => addSkill(skill)}
                disabled={formData.requested_skills.length >= 8}
                variant="ghost"
                className="filter-chip h-auto text-xs"
              >
                {skill}
              </Button>
            ))}
        </div>
      </div>

      {/* Contribution Types */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          <Users className="w-4 h-4 inline mr-2 text-green-400" />
          Ways to Contribute
        </label>
        <p className="text-xs text-slate-400 mb-3">
          How can people contribute to make this event successful?
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="ghost"
            onClick={() => toggleContributionType('time')}
            className={`filter-chip h-auto flex-col py-4 ${
              (formData.contribution_types || ['time']).includes('time') ? 'active' : ''
            }`}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span className="text-xs">Time & Effort</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => toggleContributionType('knowledge')}
            className={`filter-chip h-auto flex-col py-4 ${
              (formData.contribution_types || []).includes('knowledge') ? 'active' : ''
            }`}
          >
            <BrainCircuit className="w-5 h-5 mb-1" />
            <span className="text-xs">Knowledge</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => toggleContributionType('sats')}
            className={`filter-chip h-auto flex-col py-4 ${
              (formData.contribution_types || []).includes('sats') ? 'active' : ''
            }`}
          >
            <Zap className="w-5 h-5 mb-1" />
            <span className="text-xs">Sats Donation</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => toggleContributionType('resources')}
            className={`filter-chip h-auto flex-col py-4 ${
              (formData.contribution_types || []).includes('resources') ? 'active' : ''
            }`}
          >
            <DollarSign className="w-5 h-5 mb-1" />
            <span className="text-xs">Resources</span>
          </Button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-slate-700">
        <Button 
          onClick={onBack} 
          variant="outline" 
          className="btn-secondary-coherosphere"
        >
          Previous
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
        >
          Next: Review
        </Button>
      </div>
    </div>
  );
}
