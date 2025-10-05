import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Globe } from 'lucide-react';
import { format } from 'date-fns';
import StyledSelect from '@/components/learning/StyledSelect';

const frequencies = ["Daily", "Weekly", "Bi-weekly", "Monthly"];

export default function CircleFormBasics({ circleData, onUpdate }) {
  const updateField = (field, value) => {
    onUpdate({ [field]: value });
  };

  const handleDateSelect = (date) => {
    if (date) {
      // Set to 7 PM on the selected date
      const dateTime = new Date(date);
      dateTime.setHours(19, 0, 0, 0);
      updateField('next_session', dateTime.toISOString());
    }
  };
  
  const handleLocationTypeChange = (type) => {
    updateField('location_type', type);
  };

  const frequencyOptions = frequencies.map(freq => ({ value: freq, label: freq }));

  return (
    <div className="space-y-6">
      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Circle Topic *</label>
        <div className="relative">
          <Input
            placeholder="What will your circle focus on?"
            value={circleData.topic}
            onChange={(e) => updateField('topic', e.target.value.slice(0, 80))}
            className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 pr-16"
            maxLength={80}
          />
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
            circleData.topic.length > 60 ? 'text-orange-400' : 'text-slate-400'
          }`}>
            {circleData.topic.length}/80
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
        <Textarea
          placeholder="Describe what your circle will explore, learn, and achieve together..."
          value={circleData.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 h-32"
          rows={4}
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${
            circleData.description.length < 30 ? 'text-orange-400' : 'text-slate-500'
          }`}>
            {circleData.description.length < 30 ? 'Recommended: At least 30 characters for better engagement' : ''}
          </span>
          <span className="text-xs text-slate-400">
            {circleData.description.length} characters
          </span>
        </div>
      </div>

      {/* Frequency and Next Session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Frequency *</label>
          <StyledSelect
            value={circleData.frequency}
            onValueChange={(val) => updateField('frequency', val)}
            placeholder="How often will you meet?"
            options={frequencyOptions}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Next Session *</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full bg-slate-900/50 border-slate-600 text-white hover:bg-slate-800/50 hover:text-white justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {circleData.next_session ? 
                  format(new Date(circleData.next_session), 'PPP p') : 
                  'Select date and time'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
              <Calendar
                mode="single"
                selected={circleData.next_session ? new Date(circleData.next_session) : undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
              />
              <div className="p-3 border-t border-slate-600">
                <p className="text-sm text-slate-400">Sessions will start at 7:00 PM</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Location Type *
        </label>
        <div className="flex gap-3 mb-4">
          <Button
            variant="ghost"
            onClick={() => handleLocationTypeChange('physical')}
            className={`filter-chip h-auto ${circleData.location_type === 'physical' ? 'active' : ''}`}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Physical
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleLocationTypeChange('online')}
            className={`filter-chip h-auto ${circleData.location_type === 'online' ? 'active' : ''}`}
          >
            <Globe className="w-4 h-4 mr-2" />
            Online
          </Button>
        </div>
        {circleData.location_type === 'physical' ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Physical Address *
            </label>
            <Input
              placeholder="Enter the full address..."
              value={circleData.physical_address}
              onChange={(e) => updateField('physical_address', e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Online Meeting URL *
            </label>
            <Input
              placeholder="https://meet.jit.si/coherosphere-circle"
              value={circleData.online_url}
              onChange={(e) => updateField('online_url', e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
        )}
      </div>

      {/* Learning Goals */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Learning Goals (Optional)</label>
        <Textarea
          placeholder="What specific outcomes or skills do you hope participants will gain?"
          value={circleData.learning_goals || ''}
          onChange={(e) => updateField('learning_goals', e.target.value)}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 h-24"
          rows={3}
        />
      </div>

      {/* Prerequisites */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Prerequisites (Optional)</label>
        <Textarea
          placeholder="Any background knowledge, experience, or materials participants should have?"
          value={circleData.prerequisites || ''}
          onChange={(e) => updateField('prerequisites', e.target.value)}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 h-24"
          rows={3}
        />
      </div>

      {/* Max Participants */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Participants (Optional)</label>
        <Input
          type="number"
          placeholder="Leave empty for no limit"
          value={circleData.max_participants || ''}
          onChange={(e) => updateField('max_participants', e.target.value ? parseInt(e.target.value) : null)}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
          min="2"
          max="50"
        />
        <p className="text-xs text-slate-400 mt-1">
          Recommended: 4-12 participants for effective group learning
        </p>
      </div>
    </div>
  );
}