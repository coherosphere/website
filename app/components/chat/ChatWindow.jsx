
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { User } from '@/api/entities';
import { askCoheroBot } from '@/api/functions';
import { useChatContext } from './ChatContext';
import {
  MessageCircle,
  SendHorizonal,
  BookOpen,
  Brain,
  Globe,
  Sparkles,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatWindow({ className = "", showHeader = false }) {
  const { messages, addMessage, clearMessages } = useChatContext();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage('');

    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };

    addMessage(newUserMessage);
    setIsLoading(true);

    try {
      const response = await askCoheroBot({ query: userMessageContent });
      const botResponseText = response.data?.response || response.response || 'Sorry, I could not process your request.';

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponseText,
        timestamp: new Date(),
        context_info: response.data?.context_used || response.context_used,
        relevant_links: response.data?.relevant_links || []
      };

      addMessage(botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Limit to last 10 messages for both mobile and desktop
  const displayedMessages = messages.slice(-10);

  return (
    <Card className={`flex flex-col bg-slate-800/95 backdrop-blur-sm border-slate-700 ${className}`}>
      {showHeader && (
        <CardHeader className="border-b border-slate-700 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-500" />
              core
            </CardTitle>

            <Button
              onClick={clearMessages}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white p-2"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence initial={false}>
          {displayedMessages.map((message) => (
            message.type === 'bot' ? (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 max-w-[85%]">
                  <div className={`prose prose-invert max-w-none p-3 rounded-xl text-sm lg:text-sm ${
                    message.isError
                      ? 'bg-red-900/30 border border-red-500/30'
                      : 'bg-slate-800/70 border border-slate-600/50'
                  }`} style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                    <ReactMarkdown
                      className="text-white"
                      components={{
                        p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif', fontSize: '0.875rem' }} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    
                    {message.relevant_links && message.relevant_links.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-600/50">
                        <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                          More information:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.relevant_links.map((link, index) => (
                            <Link
                              key={index}
                              to={createPageUrl(link.url.replace('/', ''))}
                              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 hover:underline transition-colors"
                              style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}
                            >
                              <span>{link.label}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.context_info && !message.isError && message.context_info.has_internal_context && (
                      <div className={`pt-2 border-t border-slate-600/50 ${message.relevant_links && message.relevant_links.length > 0 ? 'mt-2' : 'mt-0'}`}>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                          <BookOpen className="w-3 h-3 flex-shrink-0" />
                          <span>
                            Used information from:
                            {message.context_info.knowledge_articles > 0 && ` ${message.context_info.knowledge_articles} knowledge articles`}
                            {message.context_info.faqs > 0 && ` • ${message.context_info.faqs} FAQs`}
                            {message.context_info.projects > 0 && ` • ${message.context_info.projects} projects`}
                            {message.context_info.proposals > 0 && ` • ${message.context_info.proposals} proposals`}
                            {message.context_info.resources > 0 && ` • ${message.context_info.resources} resources`}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 ml-1" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-end gap-3"
              >
                <div className="max-w-[85%]">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl px-3 py-2 text-sm lg:text-sm" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                    <p className="whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif', fontSize: '0.875rem' }}>{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 justify-end" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.context_info && (
                      <div className="flex gap-1">
                        {message.context_info.knowledge_articles > 0 && (
                          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                            <Brain className="w-3 h-3 mr-1" />
                            {message.context_info.knowledge_articles} KB
                          </Badge>
                        )}
                        {message.context_info.faqs > 0 && (
                          <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {message.context_info.faqs} FAQ
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {currentUser && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start gap-3"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-slate-800/70 text-slate-100 rounded-xl px-3 py-2 border border-slate-600/50">
              <div className="text-sm text-slate-300">
                core is thinking...
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="flex-shrink-0 p-4 border-t border-slate-700">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-slate-900/80 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 flex-shrink-0"
          >
            <SendHorizonal className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>core Online</span>
          </div>
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span>AI + Knowledge Base</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
