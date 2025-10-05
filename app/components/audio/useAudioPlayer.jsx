import { useState, useEffect, useCallback } from 'react';

// --- Global Audio Store attached to the window object ---
// This ensures the store survives development server hot reloads.
const getAudioStore = () => {
  if (!window.coherosphereAudioStore) {
    const newAudio = new Audio('https://coherosphere.com/manifesto.mp3');
    newAudio.preload = 'metadata';
    
    // Load volume from localStorage
    try {
      const savedVolume = localStorage.getItem('coherosphere_audio_volume');
      if (savedVolume !== null) {
        newAudio.volume = parseFloat(savedVolume);
      } else {
        newAudio.volume = 0.8;
      }
    } catch (e) {
      newAudio.volume = 0.8;
    }
    
    const subscribers = new Set();
    let state = {
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      volume: newAudio.volume,
    };

    const notify = () => {
      state = {
        isPlaying: !newAudio.paused && !newAudio.ended,
        volume: newAudio.volume,
        currentTime: newAudio.currentTime,
        duration: newAudio.duration || 0,
      };
      subscribers.forEach(callback => callback(state));
    };

    newAudio.addEventListener('play', notify);
    newAudio.addEventListener('pause', notify);
    newAudio.addEventListener('ended', notify);
    newAudio.addEventListener('timeupdate', notify);
    newAudio.addEventListener('loadedmetadata', notify);
    newAudio.addEventListener('volumechange', () => {
      try {
        localStorage.setItem('coherosphere_audio_volume', newAudio.volume.toString());
      } catch (e) {}
      notify();
    });

    window.coherosphereAudioStore = {
      subscribe(callback) {
        subscribers.add(callback);
        callback(state); // Immediately send current state
        return () => subscribers.delete(callback);
      },

      togglePlayPause() {
        if (newAudio.paused || newAudio.ended) {
          newAudio.play().catch(e => console.error("Audio play failed:", e));
        } else {
          newAudio.pause();
        }
      },

      changeVolume(newVolume) {
        newAudio.volume = Math.max(0, Math.min(1, newVolume));
      },
      
      seek(time) {
        newAudio.currentTime = time;
      },
      
      // Method to get the current state without subscribing
      getState() {
        // We update the state before returning it to ensure it's fresh
        state = {
          isPlaying: !newAudio.paused && !newAudio.ended,
          volume: newAudio.volume,
          currentTime: newAudio.currentTime,
          duration: newAudio.duration || 0,
        };
        return state;
      }
    };
  }
  return window.coherosphereAudioStore;
};


// --- React Hook ---
export function useAudioPlayer() {
  const audioStore = getAudioStore();
  
  // Initialize state directly from the store's current state
  const [state, setState] = useState(() => audioStore.getState());

  useEffect(() => {
    // Immediately sync state on mount, as it might have changed
    // This is crucial for navigation
    setState(audioStore.getState());
    
    // Subscribe to future changes
    const unsubscribe = audioStore.subscribe(setState);
    return unsubscribe;
  }, [audioStore]); // re-subscribe if store somehow changes (it shouldn't)

  return {
    ...state,
    togglePlayPause: audioStore.togglePlayPause,
    changeVolume: audioStore.changeVolume,
    seek: audioStore.seek,
  };
}