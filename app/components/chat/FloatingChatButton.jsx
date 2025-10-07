
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatWindow from './ChatWindow';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const chatWindowVariants = {
    closed: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      x: 20,
      pointerEvents: 'none',
      transition: { duration: 0.2, ease: "easeOut" }
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      pointerEvents: 'auto',
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Button
          onClick={toggleChat}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all duration-300 border-0 ${
            isOpen 
              ? 'bg-slate-700/60 hover:bg-slate-600/60 backdrop-blur-sm' 
              : 'bg-gradient-to-r from-orange-500/80 to-orange-600/80 hover:from-orange-600/80 hover:to-orange-700/80 hover:scale-110 backdrop-blur-sm'
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Modal - Now always rendered but controlled by variants */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleChat}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={chatWindowVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] max-w-[calc(100vw-2rem)] lg:max-w-[380px] lg:h-[60vh] max-h-[calc(100vh-8rem)]"
        style={{ transformOrigin: "bottom right" }}
      >
        <ChatWindow 
          className="h-full shadow-2xl"
          showHeader={true}
        />
      </motion.div>
    </>
  );
}
