import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Loader, AlertCircle, RefreshCw, ExternalLink, Copy, Clock, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/components/auth/UserContext';
import { getOrCreateCommunityRoom } from '@/api/functions';

export default function VideoCallPage() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [roomId, setRoomId] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isApiDown, setIsApiDown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const initializeRoom = async (isRetry = false) => {
    if (!currentUser) return;

    try {
      if (!isRetry) {
        setIsLoadingRoom(true);
      }
      setError(null);
      setErrorDetails(null);
      setIsApiDown(false);

      console.log(`Fetching community room... (attempt ${retryCount + 1})`);
      const response = await getOrCreateCommunityRoom({});

      console.log('Full response:', response);

      // Check for explicit SERVICE_DOWN error type
      if (response?.data?.errorType === 'SERVICE_DOWN') {
        setIsApiDown(true);
        setError(response.data.error);
        setErrorDetails(response.data.details);
        return;
      }

      // Check for other errors
      if (response?.data?.error) {
        const errorMsg = response.data.error;
        
        // Check if it's a 521 or API down error
        if (errorMsg.includes('521') || errorMsg.includes('Web server is down') || errorMsg.includes('temporarily unavailable')) {
          setIsApiDown(true);
          setError('Huddle01 video service is temporarily unavailable');
          setErrorDetails('The video service provider is experiencing technical difficulties. Please try again in a few minutes.');
        } else {
          setError(errorMsg);
          setErrorDetails(response.data.details || JSON.stringify(response.data, null, 2));
        }
        return;
      }

      if (response?.data?.roomId && response?.data?.projectId) {
        setRoomId(response.data.roomId);
        setProjectId(response.data.projectId);
        setAccessToken(response.data.accessToken);
        setRetryCount(0); // Reset retry count on success
        console.log('✅ Room initialized successfully');
      } else {
        setError('Invalid response from video service');
        setErrorDetails(JSON.stringify(response?.data || {}, null, 2));
      }
    } catch (err) {
      console.error('❌ Error initializing room:', err);
      console.log('Error response:', err.response);
      console.log('Error response data:', err.response?.data);
      
      let errorMessage = 'Failed to initialize video call';
      let details = null;
      
      // WICHTIG: Bei 503-Fehlern ist die error-Info in response.data
      if (err.response?.status === 503 && err.response?.data) {
        const errorData = err.response.data;
        console.log('503 error data:', errorData);
        
        if (errorData.errorType === 'SERVICE_DOWN') {
          setIsApiDown(true);
          setError(errorData.error);
          setErrorDetails(errorData.details);
          return; // Wichtig: Früh beenden
        }
      }
      
      // Andere Fehlerbehandlung
      if (err.response?.data) {
        if (err.response.data.errorType === 'SERVICE_DOWN') {
          setIsApiDown(true);
          errorMessage = err.response.data.error;
          details = err.response.data.details;
        } else {
          errorMessage = err.response.data.error || err.response.data.message || errorMessage;
          details = JSON.stringify(err.response.data, null, 2);
        }
      } else if (err.message) {
        errorMessage = err.message;
        
        if (errorMessage.includes('521') || errorMessage.includes('Web server is down') || errorMessage.includes('temporarily unavailable')) {
          setIsApiDown(true);
          errorMessage = 'Huddle01 video service is temporarily unavailable';
          details = 'The video service provider is experiencing technical difficulties. Please try again in a few minutes.';
        }
      }
      
      setError(errorMessage);
      setErrorDetails(details || JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    initializeRoom(true);
  };

  useEffect(() => {
    initializeRoom();
  }, [currentUser]);

  if (userLoading || isLoadingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Loader className="w-12 h-12 text-orange-500" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">
              {retryCount > 0 ? 'Retrying connection...' : 'Initializing Community Call...'}
            </h2>
            <p className="text-slate-400">
              {retryCount > 0 ? `Attempt ${retryCount + 1}` : 'Setting up your video connection'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mb-6"
              >
                {isApiDown ? (
                  <WifiOff className="w-16 h-16 text-orange-500 mx-auto" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-orange-500 mx-auto" />
                )}
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                {isApiDown ? 'Service Temporarily Unavailable' : 'Connection Error'}
              </h2>
              
              <p className="text-slate-300 mb-6 text-lg">
                {error}
              </p>

              {isApiDown && (
                <Alert className="bg-orange-500/10 border-orange-500/30 mb-6 text-left">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <AlertDescription className="text-slate-300">
                    The Huddle01 video service is experiencing temporary issues. This is not a problem with your setup.
                    Please try again in a few minutes.
                  </AlertDescription>
                </Alert>
              )}

              {errorDetails && (
                <details className="bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
                  <summary className="text-slate-400 cursor-pointer hover:text-slate-300 mb-2">
                    Technical Details
                  </summary>
                  <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">
                    {errorDetails}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(errorDetails)}
                    className="mt-2 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy Details
                  </Button>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleRetry}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                {isApiDown && (
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://status.huddle01.com', '_blank')}
                    className="btn-secondary-coherosphere"
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                    Check Service Status
                  </Button>
                )}
              </div>

              {retryCount > 0 && (
                <p className="text-slate-500 text-sm mt-4">
                  Retry attempts: {retryCount}
                </p>
              )}
            </CardContent>
          </Card>

          {!isApiDown && (
            <Card className="bg-orange-500/10 border-orange-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Need Help?
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>• Check if HUDDLE_PROJECT and HUDDLE_KEY are correctly set in Environment Variables</li>
                  <li>• Verify your Huddle01 API key has the necessary permissions</li>
                  <li>• Make sure your domain is whitelisted in Huddle01 Dashboard</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Success - show iframe
  const iframeUrl = `https://iframe.huddle01.com/${roomId}?projectId=${projectId}${accessToken ? `&token=${accessToken}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="h-screen w-full">
        <iframe
          src={iframeUrl}
          allow="camera; microphone; display-capture; autoplay"
          className="w-full h-full border-0"
          title="Coherosphere Community Video Call"
        />
      </div>
    </div>
  );
}