import React from 'react';
import { Play, Pause } from 'lucide-react';
import { useAudioPlayer } from './useAudioPlayer';

export default function ManifestoPlayer() {
  const { isPlaying, volume, togglePlayPause, changeVolume } = useAudioPlayer();

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    changeVolume(newVolume);
  };

  const handlePlayPauseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlayPause();
  };

  return (
    <div className="text-slate-300 px-6 py-3 flex items-center gap-3 rounded-xl transition-all duration-200 group hover:text-white hover:bg-slate-800/50 w-full">
      {/* Play/Pause as Lucide Icon */}
      <div className="flex-shrink-0">
        {isPlaying ?
        <Pause
          className="w-5 h-5 cursor-pointer"
          onClick={handlePlayPauseClick} /> :


        <Play
          className="w-5 h-5 cursor-pointer"
          onClick={handlePlayPauseClick} />

        }
      </div>

      {/* Label */}
      <span className="font-medium flex-grow">Manifesto</span>

      {/* Volume Slider */}
      <div className="w-16 flex-shrink-0">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
          className="
            w-full h-1 bg-[#2E3440] rounded-full appearance-none cursor-pointer
            focus:outline-none focus:ring-1 focus:ring-orange-500
            slider-thumb
          "




          style={{
            background: `linear-gradient(to right, #FF6A00 0%, #FF6A00 ${volume * 100}%, #2E3440 ${volume * 100}%, #2E3440 100%)`
          }} />

      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #FF6A00;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .slider-thumb:hover::-webkit-slider-thumb {
          box-shadow: 0 0 4px rgba(255, 106, 0, 0.4), 0 1px 2px rgba(0,0,0,0.1);
          transform: scale(1.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #FF6A00;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .slider-thumb:hover::-moz-range-thumb {
          box-shadow: 0 0 4px rgba(255, 106, 0, 0.4), 0 1px 2px rgba(0,0,0,0.1);
          transform: scale(1.2);
        }
      `}</style>
    </div>);

}