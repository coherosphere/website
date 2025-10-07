
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Link as LinkIcon, Paperclip, User, Target } from 'lucide-react';
import { iconMap } from '@/components/learning/iconMap';

const categoryColors = {
  'Community Building': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Holistic Health': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Decentralized Tech': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Nature & Sustainability': 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40', // Much brighter for visibility
};

export default function ResourceFormReview({ resourceData }) {
  const IconComponent = iconMap[resourceData.icon_name];

  return (
    <div className="space-y-6">
      {/* Resource Summary */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-400" />
            Resource Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
              {IconComponent ? <IconComponent className="w-6 h-6 text-orange-400" /> : <BookOpen className="w-6 h-6 text-orange-400" />}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{resourceData.title || 'Resource Title'}</h3>
              <p className="text-slate-300 leading-relaxed mb-3">{resourceData.description || 'Resource description will appear here...'}</p>
              
              {resourceData.category && (
                <Badge variant="outline" className={`border ${categoryColors[resourceData.category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                  {resourceData.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Primary Link */}
          {resourceData.link && (
            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-center gap-2 text-slate-300">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Primary Link:</span>
                <code className="text-xs bg-slate-800/50 px-2 py-1 rounded">{resourceData.link}</code>
              </div>
            </div>
          )}

          {/* Content Preview */}
          {resourceData.content && (
            <div className="pt-3 border-t border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Content Preview:</h4>
              <div 
                className="text-sm text-slate-400 line-clamp-3 prose prose-slate prose-sm"
                dangerouslySetInnerHTML={{ __html: resourceData.content.substring(0, 200) + '...' }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments & Links */}
      {(resourceData.attachments.length > 0 || resourceData.related_links.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attachments */}
          {resourceData.attachments.length > 0 && (
            <Card className="bg-slate-900/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resourceData.attachments.map((attachment, index) => (
                    <div key={index} className="text-sm text-slate-300 p-2 bg-slate-800/50 rounded">
                      {attachment.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Links */}
          {resourceData.related_links.length > 0 && (
            <Card className="bg-slate-900/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  Related Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resourceData.related_links.map((link, index) => (
                    <div key={index} className="text-sm">
                      <div className="text-slate-300 font-medium">{link.title || 'Untitled Link'}</div>
                      <div className="text-slate-400 text-xs">{link.url}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ready to Publish */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">
            <Target className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Publish</h3>
            <p className="text-slate-400">
              Your resource will be added to the Library of Resilience and made available to the entire community.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
