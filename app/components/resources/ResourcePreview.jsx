import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Link as LinkIcon, Paperclip, ThumbsUp } from 'lucide-react';
import { iconMap } from '@/components/learning/iconMap';

const categoryColors = {
  'Community Building': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Holistic Health': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Decentralized Tech': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Nature & Sustainability': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function ResourcePreview({ resourceData, creator }) {
  const IconComponent = iconMap[resourceData.icon_name];
  const hasContent = resourceData.title || resourceData.description || resourceData.category;

  if (!hasContent) {
    return (
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Resource preview will appear here as you fill in the details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:bg-slate-800/60 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header with icon and category */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
              {IconComponent ? (
                <IconComponent className="w-6 h-6 text-orange-400" />
              ) : (
                <BookOpen className="w-6 h-6 text-slate-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {resourceData.category && (
                <Badge 
                  variant="outline" 
                  className={`mb-2 border text-xs ${categoryColors[resourceData.category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
                >
                  {resourceData.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Title and description */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
              {resourceData.title || 'Resource Title'}
            </h3>
            <p className="text-slate-300 leading-relaxed mb-4 line-clamp-3">
              {resourceData.description || 'Resource description will appear here...'}
            </p>
          </div>

          {/* Content preview */}
          {resourceData.content && (
            <div className="border-t border-slate-700 pt-4">
              <div 
                className="text-sm text-slate-400 line-clamp-3 prose prose-slate prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: resourceData.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...' 
                }}
              />
            </div>
          )}

          {/* Links and attachments indicators */}
          <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-700 pt-4">
            {resourceData.related_links.length > 0 && (
              <div className="flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                <span>{resourceData.related_links.length} links</span>
              </div>
            )}
            {resourceData.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span>{resourceData.attachments.length} files</span>
              </div>
            )}
          </div>

          {/* Author preview */}
          {creator && (
            <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
              <img
                src={creator.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.email}&backgroundColor=FF6A00,FF8C42&size=32`}
                alt="Creator"
                className="w-6 h-6 rounded-full border border-slate-600"
              />
              <div>
                <span className="text-sm text-slate-300">
                  By {creator.display_name || creator.full_name}
                </span>
              </div>
            </div>
          )}

          {/* Engagement placeholder */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-1 text-slate-500">
              <ThumbsUp className="w-3 h-3" />
              <span className="text-xs">0</span>
            </div>
            <span className="text-xs text-slate-500">Just created</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}