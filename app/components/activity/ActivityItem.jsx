
import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  AtSign, 
  Reply, 
  Zap, 
  ArrowRight,
  Heart,
  Repeat,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { nip19 } from 'nostr-tools'; // This import is removed

export default function ActivityItem({ activity, index }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'post': return <MessageCircle className="w-4 h-4" />;
      case 'mention': return <AtSign className="w-4 h-4" />;
      case 'reply': return <Reply className="w-4 h-4" />;
      case 'reaction': return <Heart className="w-4 h-4" />;
      case 'repost': return <Repeat className="w-4 h-4" />;
      case 'zap-in': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'zap-out': return <Zap className="w-4 h-4 text-orange-400" />;
      case 'zap-request': return <Zap className="w-4 h-4 text-yellow-400" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'post': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'mention': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'reply': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'reaction': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'repost': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'zap-in': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'zap-out': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'zap-request': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const truncateNpub = (npub) => {
    if (!npub) return '';
    return `${npub.substring(0, 10)}...${npub.substring(npub.length - 4)}`;
  }
  
  const getEventNpub = () => {
    // Use the pre-encoded nevent from the backend
    return activity?.nevent || '';
  }

  const renderContent = () => {
    let content = activity.content || "No content";
    const emojiMatch = content.match(/^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])$/);
    
    if (activity.type === 'reaction' && emojiMatch) {
      return <div className="text-4xl">{content}</div>;
    }
    
    if (activity.type === 'reaction' && content === '+') {
      return <div className="flex items-center text-slate-400"><Heart className="w-4 h-4 mr-2 text-pink-500"/> Liked a post</div>
    }
    
    if (!activity.content) {
      if(activity.type === 'reaction') return <div className="flex items-center text-slate-400"><Heart className="w-4 h-4 mr-2 text-pink-500"/> Reacted to a post</div>
      if(activity.type === 'repost') return <div className="flex items-center text-slate-400"><Repeat className="w-4 h-4 mr-2 text-teal-500"/> Reposted</div>
      return <p className="text-slate-500 italic">No content</p>;
    }
    
    return <p className="text-slate-300 leading-relaxed break-words">{content}</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              <Badge variant="outline" className={`px-2 py-1 border ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
                <span className="ml-1 capitalize">{activity.type.replace('-', ' ')}</span>
              </Badge>
              
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>by</span>
                <span className="font-mono text-xs text-orange-400">{truncateNpub(activity.from_npub)}</span>
              </div>
            </div>

            <div className="text-slate-500 text-sm whitespace-nowrap pl-2">
              {formatRelativeTime(activity.timestamp)}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            {renderContent()}

            {/* Zap amount */}
            {(activity.type === 'zap-in' || activity.type === 'zap-out' || activity.type === 'zap-request') && activity.amount > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Zap className={`w-4 h-4 ${activity.direction === 'in' ? 'text-yellow-400' : 'text-orange-400'}`} />
                <span className={`font-bold ${activity.direction === 'in' ? 'text-yellow-400' : 'text-orange-400'}`}>
                  {activity.amount.toLocaleString()} sats
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {/* This could be extended to show real stats in the future */}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white p-1"
              asChild
            >
              <a href={`https://snort.social/${getEventNpub()}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
