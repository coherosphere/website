import React from 'react';
import { MessageCircle, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ChatWindow from '@/components/chat/ChatWindow';

export default function Chat() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 lg:p-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <MessageCircle className="w-12 h-12 text-orange-500 flex-shrink-0" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              core
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3 ml-16" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Your AI companion for navigating the coherosphere community.
        </p>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-hidden px-4 lg:px-8">
        <ChatWindow 
          className="h-full"
          showHeader={false}
        />
      </div>
    </div>
  );
}