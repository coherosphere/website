import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Hub Selector Dropdown Component (following ResonanceSortDropdown style)
function HubSelectorDropdown({ hubs, selectedHubId, onHubChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedHub = hubs.find(hub => hub.id === selectedHubId);

  const handleSelect = (hubId) => {
    onHubChange(hubId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button - Using unified input style */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="input-base min-w-64"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{selectedHub ? selectedHub.name : 'Choose your Local Hub'}</span>
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
              <motion.button
                onClick={() => handleSelect('')}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                  hover:bg-slate-700/50 text-slate-300 hover:text-white
                  ${!selectedHubId ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : ''}
                `}
                whileHover={{ x: 4 }}
              >
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="font-medium">No Hub Selected</span>
                {!selectedHubId && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 bg-white rounded-full"
                  />
                )}
              </motion.button>
              
              {/* Resonance Wave Separator */}
              {hubs.length > 0 && (
                <div className="px-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                </div>
              )}

              {hubs.map((hub, index) => (
                <div key={hub.id}>
                  <motion.button
                    onClick={() => handleSelect(hub.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                      hover:bg-slate-700/50 text-slate-300 hover:text-white
                      ${selectedHubId === hub.id ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : ''}
                    `}
                    whileHover={{ x: 4 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <div className="flex-1">
                      <span className="font-medium">{hub.name}</span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {hub.location} • {hub.member_count} members
                      </div>
                    </div>
                    {selectedHubId === hub.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.button>
                  
                  {/* Resonance Wave Separator */}
                  {index < hubs.length - 1 && (
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

export default function HubSelector({ hubs, selectedHubId, onHubChange }) {
  const selectedHub = hubs.find(hub => hub.id === selectedHubId);

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <MapPin className="w-5 h-5 text-turquoise-400" />
          Local Hub Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <HubSelectorDropdown 
            hubs={hubs}
            selectedHubId={selectedHubId}
            onHubChange={onHubChange}
          />
          
          {selectedHub && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">{selectedHub.name}</h4>
              <p className="text-slate-400 text-sm mb-3">{selectedHub.description}</p>
              <div className="flex gap-4 text-sm">
                <div className="text-slate-300">
                  <span className="text-orange-400 font-bold">{selectedHub.member_count}</span> members
                </div>
                <div className="text-slate-300">
                  <span className="text-green-400 font-bold">{selectedHub.active_projects}</span> projects
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}