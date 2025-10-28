
import React, { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Set favicon
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f5fdb20fcb4ce997cb7f53/a9079e540_profilesmall.jpg';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0C1E3C 0%, #1B1B1B 100%)' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap');
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `
      }} />
      
      {/* Subtle Network Background */}
      <svg className="absolute inset-0 w-full h-full opacity-20" style={{ animation: 'pulse 8s ease-in-out infinite' }}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1.5" fill="#FF6A00" opacity="0.4" />
            <line x1="40" y1="40" x2="80" y2="40" stroke="#FF6A00" strokeWidth="0.5" opacity="0.2" />
            <line x1="40" y1="40" x2="40" y2="80" stroke="#FF6A00" strokeWidth="0.5" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ animation: 'fadeIn 1.2s ease-out' }}>
        <h1 
          className="text-[clamp(3rem,12vw,8rem)] tracking-tight text-center"
          style={{ 
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#F5F5F5',
            letterSpacing: '-0.02em'
          }}
        >
          resonating soon
        </h1>
      </div>

      {/* Footer */}
      <footer className="pb-8 px-6 text-center" style={{ animation: 'fadeIn 1.8s ease-out' }}>
        <p 
          className="text-sm md:text-base"
          style={{ 
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 400,
            color: '#F5F5F5',
            opacity: 0.7,
            letterSpacing: '0.02em'
          }}
        >
          © coherosphere — Resonance · Resilience · Future
        </p>
      </footer>
    </div>
  );
}
