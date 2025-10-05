
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Plus, X, Code, Palette, Users, Wrench } from 'lucide-react';

const predefinedSkills = [
  { name: 'Web Development', icon: Code },
  { name: 'Design', icon: Palette },
  { name: 'Community Building', icon: Users },
  { name: 'Project Management', icon: Wrench },
  { name: 'Writing', icon: null },
  { name: 'Marketing', icon: null },
  { name: 'Data Analysis', icon: null },
  { name: 'Teaching', icon: null },
  { name: 'Photography', icon: null },
  { name: 'Music', icon: null }
];

export default function SkillsEditor({ skills, onSkillsChange }) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = (skill) => {
    if (skill && !skills.includes(skill) && skills.length < 10) {
      onSkillsChange([...skills, skill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    onSkillsChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addSkill(newSkill.trim());
    }
  };

  const getSkillIcon = (skillName) => {
    const skillData = predefinedSkills.find(s => s.name === skillName);
    return skillData?.icon;
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-blue-400" />
          Skills & Abilities
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Share your skills to connect with relevant projects (up to 10 skills)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Skills */}
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => {
              const IconComponent = getSkillIcon(skill);
              return (
                <Badge
                  key={skill}
                  variant="outline"
                  className="bg-blue-500/20 text-blue-400 border-blue-500/30 pl-3 pr-2 py-1"
                >
                  <div className="flex items-center gap-1">
                    {IconComponent && <IconComponent className="w-3 h-3" />}
                    <span>{skill}</span>
                  </div>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-2 text-current hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>

          {/* Add New Skill */}
          {skills.length < 10 && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
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
          <div className="border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-400 mb-2">Popular skills:</p>
            <div className="flex flex-wrap gap-2">
              {predefinedSkills
                .filter(skillData => !skills.includes(skillData.name))
                .slice(0, 6)
                .map(({ name, icon: IconComponent }) => (
                  <button
                    key={name}
                    onClick={() => addSkill(name)}
                    disabled={skills.length >= 10}
                    className="filter-chip h-auto text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      {IconComponent && <IconComponent className="w-3 h-3" />}
                      <span>{name}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
