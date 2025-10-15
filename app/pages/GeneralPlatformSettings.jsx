
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings2, Save, AlertCircle, CheckCircle, Monitor, Clock } from 'lucide-react';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

export default function GeneralPlatformSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [config, setConfig] = useState(null);
  const [screensaverIdleSeconds, setScreensaverIdleSeconds] = useState(30);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user.role !== 'admin') {
        setMessage({ type: 'error', text: 'Access denied. Admin role required.' });
        setIsLoading(false);
        return;
      }

      // Load config
      const response = await base44.functions.invoke('getAppConfig');
      if (response.data.success) {
        setConfig(response.data.config);
        setScreensaverIdleSeconds(response.data.config.screensaver_idle_seconds || 30);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await base44.functions.invoke('updateAppConfig', {
        updates: {
          screensaver_idle_seconds: parseInt(screensaverIdleSeconds)
        }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully! Users will need to reload the page for changes to take effect.' });
        await loadData();
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (config) {
      setScreensaverIdleSeconds(config.screensaver_idle_seconds || 30);
      setMessage({ type: 'info', text: 'Changes discarded' });
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Fixed Overlay Spinner - Horizontal Centered */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <CoherosphereNetworkSpinner
              size={100}
              lineWidth={2}
              dotRadius={6}
              interval={1100}
              maxConcurrent={4}
            />
            <div className="text-slate-400 text-lg mt-4">Loading Settings...</div>
          </div>
        </div>

        {/* Virtual placeholder */}
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">This area is restricted to administrators only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <Settings2 className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              General Settings
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Configure global platform settings that affect all users.
        </p>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert className={`border ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
            message.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
            'bg-blue-500/10 border-blue-500/30'
          }`}>
            {message.type === 'success' ? 
              <CheckCircle className="h-4 w-4 text-green-400" /> :
              <AlertCircle className="h-4 w-4 text-red-400" />
            }
            <AlertDescription className={message.type === 'success' ? 'text-green-400' : message.type === 'error' ? 'text-red-400' : 'text-blue-400'}>
              {message.text}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Admin Badge */}
      <div className="flex items-center gap-3 mb-8">
        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
          Admin Settings
        </Badge>
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          Global Configuration
        </Badge>
      </div>

      {/* Screensaver Settings */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Monitor className="w-5 h-5 text-orange-500" />
            Idle Screensaver Configuration
          </CardTitle>
          <p className="text-slate-400 text-sm mt-2">
            Configure how long users must be idle before the screensaver activates. This setting applies to all users who have the screensaver enabled.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Clock className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="idle-timeout" className="text-white font-semibold text-lg mb-2 block">
                    Idle Timeout (seconds)
                  </Label>
                  <p className="text-slate-400 text-sm mb-4">
                    How many seconds of inactivity before the screensaver appears. Default is 30 seconds.
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      id="idle-timeout"
                      type="number"
                      min="5"
                      max="300"
                      value={screensaverIdleSeconds}
                      onChange={(e) => setScreensaverIdleSeconds(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white max-w-xs text-lg font-semibold"
                    />
                    <span className="text-slate-400">seconds</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>Recommended range: 15-120 seconds</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-200">
                    <li>This setting affects all users globally</li>
                    <li>Users can still disable the screensaver entirely in their profile</li>
                    <li>Changes require users to reload the page to take effect</li>
                    <li>Very short timeouts (&lt;10s) may be disruptive</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleDiscard}
          variant="outline"
          className="btn-secondary-coherosphere"
        >
          Discard
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
