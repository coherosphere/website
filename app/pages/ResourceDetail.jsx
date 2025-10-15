
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Resource, User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { CreateFileSignedUrl, base44 } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, ThumbsUp, ThumbsDown, Link as LinkIcon, Paperclip, Download, BookOpen, User as UserIcon, ArrowUpRight, Copy } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { iconMap } from '@/components/learning/iconMap';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachedData } from '@/components/caching/useCachedData';

const getCategoryStyles = (key) => {
  switch (key) {
    case 'CommunityBuilding':
      return {
        bgColor: 'rgba(114, 106, 145, 0.15)', // #726A91 Soft Violet
        borderColor: 'rgba(114, 106, 145, 0.3)',
        textColor: '#9B94BB',
        badgeBg: 'rgba(114, 106, 145, 0.2)',
        badgeText: '#B5AFDA'
      };
    case 'HolisticHealth':
      return {
        bgColor: 'rgba(123, 158, 135, 0.15)', // #7B9E87 Calm Sage Green
        borderColor: 'rgba(123, 158, 135, 0.3)',
        textColor: '#A0C9B0',
        badgeBg: 'rgba(123, 158, 135, 0.2)',
        badgeText: '#C0E5D0'
      };
    case 'DecentralizedTech':
      return {
        bgColor: 'rgba(42, 62, 92, 0.2)', // #2A3E5C Deep Steel Blue
        borderColor: 'rgba(42, 62, 92, 0.4)',
        textColor: '#5A7AA0',
        badgeBg: 'rgba(42, 62, 92, 0.25)',
        badgeText: '#7A9AC8'
      };
    case 'NatureSustainability':
    case 'Nature&Sustainability':
      return {
        bgColor: 'rgba(85, 107, 47, 0.15)', // #556B2F Earthy Moss
        borderColor: 'rgba(85, 107, 47, 0.3)',
        textColor: '#8BA35E',
        badgeBg: 'rgba(85, 107, 47, 0.2)',
        badgeText: '#A8C178'
      };
    default:
      return {
        bgColor: 'rgba(100, 116, 139, 0.15)',
        borderColor: 'rgba(100, 116, 139, 0.3)',
        textColor: '#94A3B8',
        badgeBg: 'rgba(100, 116, 139, 0.2)',
        badgeText: '#CBD5E1'
      };
  }
};

const AttachmentItem = ({ attachment }) => {
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
      className="btn-secondary-coherosphere justify-start gap-3">

      {isLoading ?
        <Download className="w-4 h-4 animate-pulse" /> :

        <Paperclip className="w-4 h-4" />
      }
      <span className="truncate">{attachment.name}</span>
    </Button>);

};

// Helper function to check if an ID is valid
const isValidUserId = (id) => {
  if (!id) return false;
  // Check if it's a valid ObjectId format (24 hex characters) or UUID format
  const objectIdRegex = /^[a-f\d]{24}$/i;
  const uuidRegex = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
  return objectIdRegex.test(id) || uuidRegex.test(id);
};

export default function ResourceDetail() {
  const [relatedResources, setRelatedResources] = useState([]);
  const [creator, setCreator] = useState(null);
  const [vote, setVote] = useState(null); // 'up' | 'down' | null
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const urlParams = new URLSearchParams(window.location.search);
  const resourceId = urlParams.get('id');

  // Use cached data for current user
  const { data: currentUser, isLoading: userLoading } = useCachedData(
    ['resourceDetail', 'currentUser'],
    () => User.me().catch(() => null),
    'resourceDetail'
  );

  // Use cached data for current resource
  const { data: resourceData, isLoading: resourceLoading, invalidate: invalidateResourceCache } = useCachedData(
    ['resourceDetail', 'resource', resourceId],
    () => Resource.filter({ id: resourceId }),
    'resourceDetail',
    { enabled: !!resourceId }
  );

  // Use cached data for all resources (for related resources)
  const { data: allResources = [], isLoading: allResourcesLoading } = useCachedData(
    ['resourceDetail', 'allResources'],
    () => Resource.list(),
    'resourceDetail',
    { enabled: !!resourceId } // Only fetch all resources if there's a resourceId
  );

  const resource = resourceData && resourceData.length > 0 ? resourceData[0] : null;
  const isLoading = userLoading || resourceLoading || allResourcesLoading;

  // Sync with global loading context
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Redirect if no resourceId
  useEffect(() => {
    if (!resourceId) {
      navigate(createPageUrl('Learning'));
    }
  }, [resourceId, navigate]);

  // Redirect if resource not found after loading
  useEffect(() => {
    if (!isLoading && !resource) { // Changed from !resourceLoading
      navigate(createPageUrl('Learning'));
    }
  }, [isLoading, resource, navigate]);


  // Fetch related resources
  useEffect(() => {
    if (resource && allResources.length > 0) {
      const related = allResources
        .filter(r =>
          r.id !== resource.id &&
          r.category === resource.category
        )
        .slice(0, 5); // Limit to 5 related resources
      setRelatedResources(related);
    }
  }, [resource, allResources]);

  // Fetch creator profile
  useEffect(() => {
    const fetchCreator = async () => {
      if (!resource) return;

      const creatorIdToFetch = resource.creator_id || resource.created_by_id;
      
      if (creatorIdToFetch && isValidUserId(creatorIdToFetch)) {
        try {
          const response = await base44.functions.invoke('getPublicUserProfile', {
            userId: creatorIdToFetch
          });
          if (response.data && response.data.user) {
            setCreator(response.data.user);
          }
        } catch (e) {
          console.warn(`Failed to fetch creator profile for user: ${creatorIdToFetch}`, e);
          setCreator(null); // Ensure creator is null if fetch fails
        }
      } else {
        setCreator(null); // Clear creator if ID is invalid or missing
      }
    };

    fetchCreator();
  }, [resource]);

  const handleVote = async (voteType) => {
    // Optimistic update
    if (!resource || vote === voteType) return; 

    // Calculate new vote counts based on current vote state and new vote type
    let newUpvotes = resource.upvotes || 0;
    let newDownvotes = resource.downvotes || 0;

    if (voteType === 'up') {
      newUpvotes = (vote === 'down') ? newUpvotes + 1 : newUpvotes + 1; // if previously downvoted, remove downvote then add upvote
      newDownvotes = (vote === 'down') ? newDownvotes - 1 : newDownvotes;
    } else { // voteType === 'down'
      newDownvotes = (vote === 'up') ? newDownvotes + 1 : newDownvotes + 1; // if previously upvoted, remove upvote then add downvote
      newUpvotes = (vote === 'up') ? newUpvotes - 1 : newUpvotes;
    }

    const previousVote = vote;
    const previousUpvotes = resource.upvotes;
    const previousDownvotes = resource.downvotes;

    // Update local UI state
    setVote(voteType);
    invalidateResourceCache(); // Invalidate cache to refetch resource if needed, or simply update local resource data temporarily.
                              // For immediate UI update, we'll update the resource object directly.
                              // For simplicity, for now, we'll rely on a later fetch/invalidation if we want to ensure persistence from backend.

    const tempResourceUpdate = { ...resource, upvotes: newUpvotes, downvotes: newDownvotes };
    // Temporarily update the resource object to reflect the new vote immediately
    // Note: This does NOT update the cached data, only the 'resource' variable in this render cycle
    // The useCachedData hook doesn't expose a 'setData' to update its internal state directly.
    // If resourceData is a Query result, it's read-only.
    // A better approach might involve a local state for votes, or force invalidation and wait for re-fetch if not modifying the actual cache state.

    try {
      // Send update to backend
      await Resource.update(resource.id, {
        upvotes: newUpvotes,
        downvotes: newDownvotes
      });
      // Invalidate the cache after successful update to ensure next fetch gets fresh data
      invalidateResourceCache();
    } catch (error) {
      console.error("Failed to save vote:", error);
      // Revert optimistic update on error
      setVote(previousVote);
      // Revert resource data in cache
      invalidateResourceCache(); // Force re-fetch original state
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Fixed Overlay Spinner */}
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50">
          <div className="text-center">
            <CoherosphereNetworkSpinner
              size={100}
              lineWidth={2}
              dotRadius={6}
              interval={1100}
              maxConcurrent={4}
            />
            <div className="text-slate-400 text-lg mt-4">Loading...</div>
          </div>
        </div>

        {/* Virtual placeholder to prevent footer jump */}
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white">
        Resource not found.
      </div>);

  }

  const categoryKey = resource.category?.replace(/ & /g, '').replace(/ /g, '');
  const Icon = iconMap[resource.icon_name] || Paperclip;
  const categoryStyles = getCategoryStyles(categoryKey);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mx-auto"
      >

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            {/* Removed Back-Link */}
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
              <div
                className="w-10 h-10 flex items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: categoryStyles.bgColor,
                  borderColor: categoryStyles.borderColor
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: categoryStyles.textColor }}
                />
              </div>
              <span
                className="px-2.5 py-0.5 text-xs font-semibold rounded-full border"
                style={{
                  backgroundColor: categoryStyles.badgeBg,
                  borderColor: categoryStyles.borderColor,
                  color: categoryStyles.badgeText
                }}
              >
                {resource.category}
              </span>
            </div>
            <p className="text-lg text-slate-400 leading-relaxed max-w-4xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {resource.description}
            </p>
          </div>
        </div>

        {/* Main Grid Layout: 3 Columns (Content spans 2, Sidebar spans 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content (spans 2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Content Card */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6">
                <div className="prose prose-slate max-w-none">
                  <div className="space-y-8 text-slate-300 leading-relaxed text-lg">
                    <ReactQuill
                      value={resource.content || ''}
                      readOnly={true}
                      theme="bubble"
                      className="text-white text-lg resource-content"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments & Links - Full Width Below Content */}
            {(resource.attachments?.length > 0 || resource.related_links?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attachments */}
                {resource.attachments?.length > 0 && (
                  <Card className="bg-slate-800/30 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-white">Attachments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {resource.attachments.map((att, i) => (
                        <AttachmentItem key={i} attachment={att} />
                      ))}
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
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          key={i}
                          className="flex items-center gap-3 text-slate-300 hover:text-orange-400 transition-colors group p-2 rounded-lg hover:bg-slate-700/50"
                        >
                          <LinkIcon className="w-4 h-4 text-slate-500 group-hover:text-orange-400" />
                          <span className="truncate">{link.title}</span>
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Author Section */}
            {creator && (
              <Card className="bg-slate-800/30 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <img
                      src={creator.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.nostr_pubkey || creator.email || 'fallback'}&backgroundColor=FF6A00,FF8C42&size=48`}
                      alt={creator.display_name || creator.full_name}
                      className="w-12 h-12 rounded-full border-2 border-slate-600"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.nostr_pubkey || creator.email || 'fallback'}&backgroundColor=FF6A00,FF8C42&size=48`;
                      }}
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 mb-0.5">Created by</p>
                      <p className="text-white font-semibold text-base mb-1">
                        {creator.display_name || creator.full_name}
                      </p>
                      {creator.nostr_pubkey && (
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                            {creator.nostr_pubkey.substring(0, 12)}...{creator.nostr_pubkey.substring(creator.nostr_pubkey.length - 8)}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(creator.nostr_pubkey);
                            }}
                            className="text-slate-400 hover:text-orange-400 transition-colors"
                            title="Copy Nostr pubkey"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bottom Actions - Edit Left, Voting Right */}
            <div className="flex justify-between items-center">
              {/* Edit Button - Left */}
              <div>
                {currentUser && resource && (currentUser.id === resource.creator_id || currentUser.id === resource.created_by_id) && (
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
          </div>

          {/* Right Column: Related Resources Sidebar (spans 1 column on desktop) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="bg-slate-800/30 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    Related Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedResources.length > 0 ? (
                    relatedResources.map((related) => {
                      const relatedCategoryKey = related.category?.replace(/ & /g, '').replace(/ /g, '');
                      const RelatedIcon = iconMap[related.icon_name] || BookOpen;
                      const relatedStyles = getCategoryStyles(relatedCategoryKey);

                      return (
                        <Link
                          key={related.id}
                          to={createPageUrl(`ResourceDetail?id=${related.id}`)}
                          className="block group"
                        >
                          <div className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 border border-transparent hover:border-orange-500/30">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center border"
                                style={{
                                  backgroundColor: relatedStyles.bgColor,
                                  borderColor: relatedStyles.borderColor
                                }}
                              >
                                <RelatedIcon
                                  className="w-4 h-4"
                                  style={{ color: relatedStyles.textColor }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                                  {related.title}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                  {related.description}
                                </p>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0" />
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No related resources found in this category.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
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

        /* Base text elements */
        .ql-editor p {
          color: rgb(203, 213, 225) !important; /* slate-300 */
          margin-bottom: 1.25em !important;
          line-height: 1.75 !important;
        }

        .ql-editor p:last-child {
          margin-bottom: 0 !important;
        }

        /* Headings - Better spacing and hierarchy */
        .ql-editor h1,
        .ql-editor h2,
        .ql-editor h3,
        .ql-editor h4,
        .ql-editor h5,
        .ql-editor h6 {
          color: white !important;
          font-family: 'Poppins', system-ui, sans-serif !important;
          font-weight: 700 !important;
          margin-top: 2em !important;
          margin-bottom: 0.75em !important;
          line-height: 1.3 !important;
        }

        /* First heading shouldn't have top margin */
        .ql-editor > h1:first-child,
        .ql-editor > h2:first-child,
        .ql-editor > h3:first-child,
        .ql-editor > h4:first-child,
        .ql-editor > h5:first-child,
        .ql-editor > h6:first-child {
          margin-top: 0 !important;
        }

        /* Specific heading sizes */
        .ql-editor h1 {
          font-size: 2.25rem !important;
          line-height: 1.2 !important;
          margin-top: 2.5em !important;
        }

        .ql-editor h2 {
          font-size: 1.875rem !important;
          line-height: 1.25 !important;
          margin-top: 2.25em !important;
        }

        .ql-editor h3 {
          font-size: 1.5rem !important;
          line-height: 1.3 !important;
          margin-top: 2em !important;
        }

        .ql-editor h4 {
          font-size: 1.25rem !important;
          line-height: 1.4 !important;
          margin-top: 1.75em !important;
        }

        .ql-editor h5 {
          font-size: 1.125rem !important;
          line-height: 1.5 !important;
          margin-top: 1.5em !important;
        }

        .ql-editor h6 {
          font-size: 1rem !important;
          line-height: 1.5 !important;
          margin-top: 1.5em !important;
          color: rgb(203, 213, 225) !important; /* slate-300 for h6 */
        }

        /* Text formatting */
        .ql-editor strong,
        .ql-editor em,
        .ql-editor u {
          color: white !important;
        }

        .ql-editor strong {
          font-weight: 600 !important;
        }

        /* Lists - Better spacing */
        .ql-editor ol,
        .ql-editor ul {
          color: rgb(203, 213, 225) !important; /* slate-300 */
          margin-top: 1.25em !important;
          margin-bottom: 1.25em !important;
          padding-left: 1.5em !important;
        }

        .ql-editor li {
          color: rgb(203, 213, 225) !important; /* slate-300 */
          margin-bottom: 0.5em !important;
          line-height: 1.75 !important;
        }

        .ql-editor li:last-child {
          margin-bottom: 0 !important;
        }

        /* Nested lists */
        .ql-editor ol ol,
        .ql-editor ul ul,
        .ql-editor ol ul,
        .ql-editor ul ol {
          margin-top: 0.5em !important;
          margin-bottom: 0.5em !important;
        }

        /* Links */
        .ql-editor a {
          color: #3DDAD7 !important; /* coherosphere turquoise */
          text-decoration: none !important;
          border-bottom: 1px solid rgba(61, 218, 215, 0.3) !important;
          transition: all 0.2s ease !important;
        }

        .ql-editor a:hover {
          color: #FF6A00 !important; /* coherosphere orange */
          border-bottom-color: rgba(255, 106, 0, 0.5) !important;
        }

        /* Blockquotes */
        .ql-editor blockquote {
          border-left: 4px solid #FF6A00 !important;
          padding-left: 1.5em !important;
          margin: 1.5em 0 !important;
          color: rgb(203, 213, 225) !important; /* slate-300 */
          font-style: italic !important;
        }

        /* Code blocks */
        .ql-editor pre,
        .ql-editor code {
          background-color: rgba(0, 0, 0, 0.3) !important;
          border-radius: 0.375rem !important;
          padding: 0.125em 0.375em !important;
          color: #3DDAD7 !important;
          font-family: 'Monaco', 'Courier New', monospace !important;
        }

        .ql-editor pre {
          padding: 1em !important;
          margin: 1.5em 0 !important;
          overflow-x: auto !important;
        }

        /* Horizontal rule */
        .ql-editor hr {
          border: none !important;
          border-top: 2px solid rgb(71, 85, 105) !important; /* slate-600 */
          margin: 2em 0 !important;
        }
      `}</style>
    </div>
  );
}
