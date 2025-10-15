import React, { createContext, useContext, useState, useCallback } from 'react';

const ScreensaverStatusContext = createContext();

export function ScreensaverStatusProvider({ children }) {
  const [isIdle, setIsIdle] = useState(false);

  const setScreensaverActive = useCallback((active) => {
    console.log('[ScreensaverStatus] Screensaver status changed:', active ? 'ACTIVE (Polling paused)' : 'INACTIVE (Polling resumed)');
    setIsIdle(active);
  }, []);

  return (
    <ScreensaverStatusContext.Provider value={{ isIdle, setScreensaverActive }}>
      {children}
    </ScreensaverStatusContext.Provider>
  );
}

export function useScreensaverStatus() {
  const context = useContext(ScreensaverStatusContext);
  if (!context) {
    throw new Error('useScreensaverStatus must be used within ScreensaverStatusProvider');
  }
  return context;
}