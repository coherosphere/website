
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Globe, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EventFormTimePlace({ formData, onChange, onNext, onBack }) {
  const handleLocationTypeChange = (type) => {
    onChange({ 
      location_type: type,
      physical_address: type === 'online' ? '' : formData.physical_address,
      online_url: type === 'physical' ? '' : formData.online_url
    });
  };

  const getDatePreset = (preset) => {
    const now = new Date();
    switch (preset) {
      case 'today_18':
        const today = new Date(now);
        today.setHours(18, 0, 0, 0);
        return today.toISOString().slice(0, 16);
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        return tomorrow.toISOString().slice(0, 16);
      case 'weekend':
        const weekend = new Date(now);
        const daysUntilSaturday = 6 - now.getDay();
        weekend.setDate(weekend.getDate() + daysUntilSaturday);
        weekend.setHours(14, 0, 0, 0);
        return weekend.toISOString().slice(0, 16);
      default:
        return '';
    }
  };

  const handlePresetClick = (preset) => {
    const dateTime = getDatePreset(preset);
    if (dateTime) {
      onChange({ date: dateTime });
    }
  };

  const isValid = () => {
    return formData.date && 
           formData.capacity && 
           ((formData.location_type === 'physical' && formData.physical_address) ||
            (formData.location_type === 'online' && formData.online_url));
  };

  return (
    <div className="space-y-6">
      {/* Date & Time */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Event Date & Time *
        </label>
        
        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="ghost"
            onClick={() => handlePresetClick('today_18')}
            className="filter-chip h-auto text-sm"
          >
            <Clock className="w-3 h-3 mr-1" />
            Today 18:00
          </Button>
          <Button
            variant="ghost"
            onClick={() => handlePresetClick('tomorrow')}
            className="filter-chip h-auto text-sm"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Tomorrow
          </Button>
          <Button
            variant="ghost"
            onClick={() => handlePresetClick('weekend')}
            className="filter-chip h-auto text-sm"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Next Weekend
          </Button>
        </div>

        <div className="space-y-4">
          <div className="w-full overflow-hidden">
            <label className="block text-xs text-slate-400 mb-1">Start Date & Time</label>
            <div className="relative">
              <Input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => onChange({ date: e.target.value })}
                className="bg-slate-900/50 border-slate-600 text-white w-full focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="w-full overflow-hidden">
            <label className="block text-xs text-slate-400 mb-1">End Time (Optional)</label>
            <div className="relative">
              <Input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => onChange({ end_time: e.target.value })}
                className="bg-slate-900/50 border-slate-600 text-white w-full focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Location Type *
        </label>
        <div className="flex gap-3 mb-4">
          <Button
            variant="ghost"
            onClick={() => handleLocationTypeChange('physical')}
            className={`filter-chip h-auto ${formData.location_type === 'physical' ? 'active' : ''}`}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Physical
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleLocationTypeChange('online')}
            className={`filter-chip h-auto ${formData.location_type === 'online' ? 'active' : ''}`}
          >
            <Globe className="w-4 h-4 mr-2" />
            Online
          </Button>
        </div>
      </div>

      {/* Location Details */}
      {formData.location_type === 'physical' ? (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Physical Address *
          </label>
          <Input
            placeholder="Enter the full address..."
            value={formData.physical_address}
            onChange={(e) => onChange({ physical_address: e.target.value })}
            className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 mb-3"
          />
          {formData.physical_address && (
            <Card className="bg-slate-900/30 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Map className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Map Preview</span>
                </div>
                <div className="w-full h-32 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-600">
                  <span className="text-slate-400 text-sm">Map will appear here</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Online Event URL *
          </label>
          <Input
            placeholder="https://meet.jit.si/coherosphere-event"
            value={formData.online_url}
            onChange={(e) => onChange({ online_url: e.target.value })}
            className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Meeting link, livestream URL, or any other online access point
          </p>
        </div>
      )}

      {/* Capacity */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Event Capacity
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="number"
              placeholder="20"
              value={formData.capacity}
              onChange={(e) => onChange({ capacity: parseInt(e.target.value) || 20 })}
              className="bg-slate-900/50 border-slate-600 text-white h-10"
              min="1"
              max="1000"
            />
            <p className="text-xs text-slate-400 mt-1">Maximum attendees</p>
          </div>
          <div className="flex items-start">
            <Button
              variant="ghost"
              onClick={() => onChange({ rsvp_enabled: !formData.rsvp_enabled })}
              className={`filter-chip h-10 w-full ${formData.rsvp_enabled ? 'active' : ''}`}
            >
              RSVP {formData.rsvp_enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
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
          disabled={!isValid()}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
        >
          Next: Resonance
        </Button>
      </div>
    </div>
  );
}
