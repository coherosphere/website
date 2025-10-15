import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Monitor, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function ScreensaverToggle({ enabled, onToggle }) {
  const [idleSeconds, setIdleSeconds] = useState(30);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await base44.functions.invoke('getAppConfig');
        if (response.data.success) {
          setIdleSeconds(response.data.config.screensaver_idle_seconds || 30);
        }
      } catch (error) {
        console.error('[ScreensaverToggle] Failed to load config:', error);
      }
    };
    loadConfig();
  }, []);

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <Monitor className="w-5 h-5 text-white" />
          Idle Screensaver
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Ambient animation after {idleSeconds} seconds of inactivity
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">
              <Info className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <Label htmlFor="screensaver-toggle" className="text-white font-medium cursor-pointer">
                Enable Screensaver
              </Label>
              <p className="text-xs text-slate-400 mt-1">
                Shows an animated resonance network when you're idle
              </p>
            </div>
          </div>
          
          <motion.button
            id="screensaver-toggle"
            onClick={onToggle}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${
              enabled ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-slate-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
              animate={{
                x: enabled ? 28 : 0
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
          </motion.button>
        </div>
      </CardContent>
    </Card>
  );
}