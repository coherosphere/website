import React from 'react';
import StyleShowcase from '@/components/style/StyleShowcase';
import { Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StylePage() {
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center gap-4 mb-3">
          <Layers className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Coherosphere Style Guide
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          A live preview of all UI components. The display updates dynamically with every change to the global CSS and component styles of the app.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
        {/* Desktop View Column */}
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white mb-4 sticky top-4 bg-slate-900/50 backdrop-blur-sm p-2 rounded-lg z-10 xl:top-0">Desktop / Full-width View</h2>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
            <StyleShowcase />
          </div>
        </div>

        {/* Mobile View Column */}
        <div className="hidden xl:block">
          <h2 className="text-2xl font-bold text-white mb-4 sticky top-4 bg-slate-900/50 backdrop-blur-sm p-2 rounded-lg z-10 xl:top-0">Mobile / Constrained View</h2>
          <div className="mx-auto w-full max-w-[420px] h-[80vh] bg-slate-900 rounded-[40px] p-2 border-8 border-slate-700 shadow-2xl overflow-hidden sticky top-24 xl:top-16">
             <div className="w-full h-full overflow-y-auto rounded-[30px] p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
              <StyleShowcase />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}