import React from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser, UserProvider } from './UserContext';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

function AuthGuardContent({ children }) {
  const { currentUser, isLoading, isAuthenticated, isInitialized } = useUser();

  const handleLogin = () => {
    const currentUrl = window.location.href;
    User.loginWithRedirect(currentUrl);
  };

  // Show spinner while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CoherosphereNetworkSpinner 
            size={100}
            lineWidth={2}
            dotRadius={6}
            interval={1100}
            maxConcurrent={4}
          />
          <p className="text-slate-400">Checking authentication...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Welcome to coherosphere
              </CardTitle>
              <p className="text-slate-400 mt-2">
                Your resonance space for connecting humans, technology, and values
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-slate-300 mb-4">
                  Please sign in to access the coherosphere community.
                </p>
                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In with Google
                </Button>
              </div>
              
              <div className="border-t border-slate-700 pt-6">
                <p className="text-xs text-slate-500 text-center">
                  By signing in, you join a community dedicated to building resilient, 
                  human-centered technology and sustainable communities.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return children;
}

export default function AuthGuard({ children }) {
  return (
    <UserProvider>
      <AuthGuardContent>{children}</AuthGuardContent>
    </UserProvider>
  );
}