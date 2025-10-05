import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus, X } from 'lucide-react';

const predefinedValues = [
  'Resilience', 'Innovation', 'Community', 'Transparency', 'Freedom',
  'Creativity', 'Sustainability', 'Decentralization', 'Collaboration',
  'Empowerment', 'Growth', 'Balance', 'Authenticity', 'Purpose'
];

export default function ValuesEditor({ values, onValuesChange }) {
  const [newValue, setNewValue] = useState('');

  const addValue = (value) => {
    if (value && !values.includes(value) && values.length < 8) {
      onValuesChange([...values, value]);
      setNewValue('');
    }
  };

  const removeValue = (valueToRemove) => {
    onValuesChange(values.filter(value => value !== valueToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addValue(newValue.trim());
    }
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <Heart className="w-5 h-5 text-red-400" />
          Resonance Values
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Define the values that resonate with you (up to 8 values)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Values - Now using consistent blue color like Skills */}
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <Badge
                key={value}
                variant="outline"
                className="bg-blue-500/20 text-blue-400 border-blue-500/30 pl-3 pr-2 py-1"
              >
                {value}
                <button
                  onClick={() => removeValue(value)}
                  className="ml-2 text-current hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add New Value */}
          {values.length < 8 && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a value..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
              />
              <Button
                onClick={() => addValue(newValue.trim())}
                disabled={!newValue.trim()}
                size="sm"
                className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Predefined Values */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-400 mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-2">
              {predefinedValues
                .filter(value => !values.includes(value))
                .slice(0, 6)
                .map((value) => (
                  <button
                    key={value}
                    onClick={() => addValue(value)}
                    disabled={values.length >= 8}
                    className="filter-chip h-auto text-xs"
                  >
                    {value}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}