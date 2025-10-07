
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Resource, User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { CreateFileSignedUrl } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, ThumbsUp, ThumbsDown, Link as LinkIcon, Paperclip, Download, BookOpen, User as UserIcon } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { iconMap } from '@/components/learning/iconMap';

const categoryColors = {
  'CommunityBuilding': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'HolisticHealth': 'bg-green-500/20 text-green-400 border-green-500/30',
  'DecentralizedTech': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Nature&Sustainability': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const AttachmentItem = ({ attachment }) => {
  const [url, setUrl] = useState('#');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const result = await CreateFileSignedUrl({ file_uri: attachment.uri });
      if (result.signed_url) {
        window.open(result.signed_url, '_blank');
      }
    } catch (error) {
      console.error("Failed to get signed URL", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isLoading}
      className="btn-secondary-coherosphere justify-start gap-3"
    >
      {isLoading ? (
        <Download className="w-4 h-4 animate-pulse" />
      ) : (
        <Paperclip className="w-4 h-4" />
      )}
      <span className="truncate">{attachment.name}</span>
    </Button>
  );
};

export default function ResourceDetail() {
  const [resource, setResource] = useState(null);
  const [creator, setCreator] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vote, setVote] = useState(null); // 'up' | 'down' | null
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const resourceId = urlParams.get('id');

  useEffect(() => {
    const loadData = async () => {
      if (!resourceId) {
        navigate(createPageUrl('Learning'));
        return;
      }
      setIsLoading(true);
      try {
        const [resourceData] = await Resource.filter({ id: resourceId });
        const userData = await User.me().catch(() => null);

        if (!resourceData) {
          navigate(createPageUrl('Learning'));
          return;
        }
        
        setResource(resourceData);
        setCurrentUser(userData);

        let creatorInfo = null;
        // Try fetching creator with creator_id first, but don't crash if it fails
        if (resourceData.creator_id) {
            try {
                [creatorInfo] = await User.filter({ id: resourceData.creator_id });
            } catch (e) {
                console.warn(`Failed to fetch creator by creator_id: ${resourceData.creator_id}. This might be an invalid ID.`, e);
            }
        }
        
        // If creator wasn't found and a fallback created_by_id exists, try that
        if (!creatorInfo && resourceData.created_by_id) {
            try {
                [creatorInfo] = await User.filter({ id: resourceData.created_by_id });
            } catch (e) {
                console.warn(`Failed to fetch creator by created_by_id: ${resourceData.created_by_id}.`, e);
            }
        }
        
        if (creatorInfo) {
            setCreator(creatorInfo);
        }

      } catch (error) {
        console.error("Failed to load resource:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [resourceId, navigate]);

  const handleVote = async (voteType) => {
    if (vote === voteType) return; // Prevent re-voting

    const newUpvotes = (resource.upvotes || 0) + (voteType === 'up' ? 1 : 0) - (vote === 'up' ? 1 : 0);
    const newDownvotes = (resource.downvotes || 0) + (voteType === 'down' ? 1 : 0) - (vote === 'down' ? 1 : 0);

    setVote(voteType);
    setResource(prev => ({ ...prev, upvotes: newUpvotes, downvotes: newDownvotes }));

    try {
      // Include all resource data to avoid validation errors
      await Resource.update(resource.id, { 
        ...resource, 
        upvotes: newUpvotes, 
        downvotes: newDownvotes 
      });
    } catch (error) {
      console.error("Failed to save vote:", error);
      // Revert optimistic update on error
      setVote(vote);
      setResource(prev => ({ ...prev, upvotes: resource.upvotes, downvotes: resource.downvotes }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white">
        Resource not found.
      </div>
    );
  }

  const categoryKey = resource.category?.replace(/ & /g, '').replace(/ /g, '');
  const Icon = iconMap[resource.icon_name] || Paperclip;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
           <Link to={createPageUrl('Learning')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 flex items-center justify-center rounded-lg bg-orange-500/10`}>
                <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {resource.title}
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>

        {/* Category Badge & Description */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${categoryColors[categoryKey]}`}>
              <Icon className="w-6 h-6" />
            </div>
            <Badge variant="outline" className={categoryColors[categoryKey]}>{resource.category}</Badge>
          </div>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {resource.description}
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="prose prose-slate max-w-none">
              <div className="space-y-8 text-slate-300 leading-relaxed text-lg">
                <ReactQuill
                  value={resource.content || ''}
                  readOnly={true}
                  theme="bubble"
                  className="text-white text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments & Links - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attachments */}
          {resource.attachments?.length > 0 && (
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.attachments.map((att, i) => <AttachmentItem key={i} attachment={att} />)}
              </CardContent>
            </Card>
          )}

          {/* Related Links */}
          {resource.related_links?.length > 0 && (
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Related Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.related_links.map((link, i) => (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" key={i} className="flex items-center gap-3 text-slate-300 hover:text-orange-400 transition-colors group p-2 rounded-lg hover:bg-slate-700/50">
                    <LinkIcon className="w-4 h-4 text-slate-500 group-hover:text-orange-400" />
                    <span className="truncate">{link.title}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Author Section */}
        {creator && (
          <Card className="bg-slate-800/30 border-slate-700 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Created by</p>
                  <p className="text-white font-medium">{creator.full_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Actions - Edit Left, Voting Right */}
        <div className="flex justify-between items-center">
          {/* Edit Button - Left */}
          <div>
            {currentUser && (currentUser.id === resource.creator_id || currentUser.id === resource.created_by_id) && (
              <Link to={createPageUrl(`ShareKnowledge?id=${resource.id}`)}>
                <Button variant="outline" className="btn-secondary-coherosphere">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>

          {/* Voting - Right */}
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">Was this helpful?</span>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleVote('up')} 
                variant="outline" 
                size="sm"
                className={`gap-2 ${vote === 'up' ? 'bg-green-500/20 border-green-500/40 text-white' : 'btn-secondary-coherosphere'}`}
              >
                <ThumbsUp className="w-4 h-4" /> {resource.upvotes || 0}
              </Button>
              <Button 
                onClick={() => handleVote('down')} 
                variant="outline" 
                size="sm"
                className={`gap-2 ${vote === 'down' ? 'bg-red-500/20 border-red-500/40 text-white' : 'btn-secondary-coherosphere'}`}
              >
                <ThumbsDown className="w-4 h-4" /> {resource.downvotes || 0}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add custom CSS for ReactQuill */}
      <style jsx>{`
        .ql-editor {
          color: white !important;
          background-color: transparent !important;
          padding: 0 !important;
          font-size: 1.125rem !important; /* text-lg */
          line-height: 1.75 !important;
        }
        .ql-editor p, .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
          color: white !important;
        }
        .ql-editor strong, .ql-editor em, .ql-editor u {
          color: white !important;
        }
        .ql-editor ol, .ql-editor ul {
          color: white !important;
        }
        .ql-editor li {
          color: white !important;
        }
        /* Specific styles for different heading levels */
        .ql-editor h1 { font-size: 2.25rem; line-height: 2.5rem; } /* text-4xl */
        .ql-editor h2 { font-size: 1.875rem; line-height: 2.25rem; } /* text-3xl */
        .ql-editor h3 { font-size: 1.5rem; line-height: 2rem; } /* text-2xl */
        .ql-editor h4 { font-size: 1.25rem; line-height: 1.75rem; } /* text-xl */
        .ql-editor h5 { font-size: 1.125rem; line-height: 1.75rem; } /* text-lg */
        .ql-editor h6 { font-size: 1rem; line-height: 1.5rem; } /* text-base */
      `}</style>
    </div>
  );
}
