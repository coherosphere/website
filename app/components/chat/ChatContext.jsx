import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getConversations } from '@/api/functions';
import { useUser } from '@/components/auth/UserContext';

const ChatContext = createContext();

const STORAGE_KEY = 'coherosphere_chat_messages';

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useUser();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "What brings you to the coherosphere today?",
      timestamp: new Date(),
      context_info: null
    }
  ]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  
  // Throttling mechanism for refreshUnreadCount - INCREASED TO 15 SECONDS
  const lastRefreshTime = useRef(0);
  const isRefreshing = useRef(false);
  const THROTTLE_INTERVAL = 15000; // Increased from 5s to 15s to avoid rate limits

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedMessages = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Failed to load chat messages from localStorage:', error);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat messages to localStorage:', error);
    }
  }, [messages]);

  // Throttled function to manually refresh unread count
  const refreshUnreadCount = async () => {
    if (!isAuthenticated || !currentUser?.nostr_pubkey) {
      setTotalUnreadMessages(0);
      return;
    }

    // Throttling: Don't refresh if we refreshed less than 15 seconds ago
    const now = Date.now();
    if (now - lastRefreshTime.current < THROTTLE_INTERVAL) {
      console.log('Throttling refreshUnreadCount - too soon since last refresh');
      return;
    }

    // Prevent concurrent refreshes
    if (isRefreshing.current) {
      console.log('Skipping refreshUnreadCount - already refreshing');
      return;
    }

    isRefreshing.current = true;
    lastRefreshTime.current = now;

    try {
      const { data } = await getConversations({ tab: 'all', q: '' });
      const unread = data.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setTotalUnreadMessages(unread);
    } catch (error) {
      // Better error handling - don't spam console on rate limits
      if (error.response?.data?.error === 'Rate limit exceeded') {
        console.log('Rate limit hit for unread count refresh - will retry later');
      } else {
        console.error('Error fetching unread message count:', error);
      }
      // Don't throw - just silently fail and try again next interval
    } finally {
      isRefreshing.current = false;
    }
  };

  // Auto-refresh as fallback (every 60 seconds instead of 45)
  useEffect(() => {
    let intervalId;
    
    if (isAuthenticated && currentUser?.nostr_pubkey) {
      refreshUnreadCount(); // Initial fetch
      intervalId = setInterval(refreshUnreadCount, 60000); // Update every 60 seconds (increased from 45s)
    } else {
      setTotalUnreadMessages(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, currentUser]);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    const initialMessage = {
      id: 1,
      type: 'bot',
      content: "What brings you to the coherosphere today?",
      timestamp: new Date(),
      context_info: null
    };
    setMessages([initialMessage]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      addMessage, 
      clearMessages,
      totalUnreadMessages,
      refreshUnreadCount // Expose throttled refresh function
    }}>
      {children}
    </ChatContext.Provider>
  );
};