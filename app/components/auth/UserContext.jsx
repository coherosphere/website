
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';

const UserContext = createContext(null);

// SessionStorage Keys
const USER_CACHE_KEY = 'coherosphere_user_cache';
const AUTH_STATUS_KEY = 'coherosphere_auth_status';

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user on mount - check cache first
  useEffect(() => {
    const loadUser = async () => {
      // Versuche zuerst, den User aus dem sessionStorage zu laden
      try {
        const cachedUser = sessionStorage.getItem(USER_CACHE_KEY);
        const cachedAuthStatus = sessionStorage.getItem(AUTH_STATUS_KEY);
        
        if (cachedUser && cachedAuthStatus !== null) {
          // Wir haben gecachte Daten - nutze sie sofort
          const user = JSON.parse(cachedUser);
          const authStatus = cachedAuthStatus === 'true';
          
          setCurrentUser(user);
          setIsAuthenticated(authStatus);
          setIsLoading(false);
          setIsInitialized(true);
          
          console.log('[UserContext] Using cached authentication data');
          return; // Kein API-Call nötig
        }
      } catch (error) {
        console.warn('[UserContext] Failed to load cached auth data:', error);
        // Fahre fort mit normalem API-Call
      }

      // Kein Cache vorhanden oder Cache-Fehler - lade vom Server
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Speichere im sessionStorage für zukünftige Mounts
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        sessionStorage.setItem(AUTH_STATUS_KEY, 'true');
        
        console.log('[UserContext] Loaded user from API and cached');
      } catch (error) {
        console.log('[UserContext] User not authenticated');
        setIsAuthenticated(false);
        setCurrentUser(null);
        
        // Speichere negativen Auth-Status
        sessionStorage.setItem(AUTH_STATUS_KEY, 'false');
        sessionStorage.removeItem(USER_CACHE_KEY);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadUser();
  }, []); // Leeres Dependency-Array - läuft nur einmal pro Mount

  // Function to refresh user data if needed
  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Update cache
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      sessionStorage.setItem(AUTH_STATUS_KEY, 'true');
      
      console.log('[UserContext] User refreshed:', user.email, 'screensaver_enabled:', user.screensaver_enabled);
      
      return user;
    } catch (error) {
      console.error('[UserContext] Failed to refresh user:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      
      // Update cache
      sessionStorage.setItem(AUTH_STATUS_KEY, 'false');
      sessionStorage.removeItem(USER_CACHE_KEY);
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update user data locally without API call
  const updateUserLocally = (updates) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      
      // Update cache
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      
      console.log('[UserContext] User updated locally:', updated.email, 'screensaver_enabled:', updated.screensaver_enabled);
      
      return updated;
    });
  };

  // Function to clear auth cache (for logout)
  const clearAuthCache = () => {
    sessionStorage.removeItem(USER_CACHE_KEY);
    sessionStorage.removeItem(AUTH_STATUS_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isLoading,
    isAuthenticated,
    isInitialized,
    refreshUser,
    updateUserLocally,
    clearAuthCache
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
