
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function RecentConversations({ user }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.nostr_pubkey) {
      loadRecentConversations();
    }
  }, [user]);

  const loadRecentConversations = async () => {
    try {
      const response = await base44.functions.invoke('getConversations', {
        tab: 'trusted',
        q: ''
      });
      // Get only the first 3 conversations
      const recent = (response.data.conversations || []).slice(0, 3);
      setConversations(recent);
    } catch (error) {
      console.error('Error loading recent conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';

    let isoString = dateString;
    if (typeof dateString === 'string' &&
        !dateString.endsWith('Z') &&
        !dateString.includes('+') &&
        !dateString.includes('-', 10)) {
      isoString = dateString + 'Z';
    }

    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getAvatarUrl = (avatarUrl, seed) => {
    if (avatarUrl && avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=FF6A00,FF8C42&size=120`;
  };

  if (!user?.nostr_pubkey) {
    return null;
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-white" />
            Recent Messages
          </CardTitle>
          <Link
            to={createPageUrl('Messages')}
            className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900/50 rounded-lg p-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No recent conversations</p>
            <Link
              to={createPageUrl('Messages')}
              className="text-orange-400 hover:text-orange-300 text-sm mt-2 inline-block"
            >
              Start a new chat
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={`${createPageUrl('Messages')}?conversationId=${conv.id}`}
                  className="block bg-slate-900/50 hover:bg-slate-700/50 rounded-lg p-3 border border-slate-700 hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(conv.peerAvatar, conv.peerNpub || conv.peerEmail)}
                      alt={conv.peerName}
                      className="w-10 h-10 rounded-full border-2 border-slate-600 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(null, conv.peerNpub || conv.peerEmail || 'fallback');
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-white text-sm truncate">
                          {conv.peerName}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-orange-500 text-white text-xs px-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">
                            {formatTime(conv.lastAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {conv.lastSnippet || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
