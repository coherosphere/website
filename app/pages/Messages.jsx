
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/api/entities';
import { getConversations } from '@/api/functions';
import { getMessages } from '@/api/functions';
import { createConversation } from '@/api/functions';
import { sendNostrMessage } from '@/api/functions';
import { toggleMuteConversation } from '@/api/functions';
import { toggleBlockConversation } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    MessageSquare,
    Send,
    MoreVertical,
    BellOff,
    Ban,
    AlertTriangle,
    Shield,
    Plus,
    ArrowLeft
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import NewChatModal from '@/components/messages/NewChatModal';
import { useChatContext } from '@/components/chat/ChatContext';

export default function MessagesPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [hasMoreMessages, setHasMoreMessages] = useState(false); // New state for pagination
    const [isLoadingOlder, setIsLoadingOlder] = useState(false); // New state for pagination loading
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(false); // Track if it's the initial load of a conversation
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const { refreshUnreadCount } = useChatContext();

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadConversations();
        }
    }, [currentUser, activeTab]);

    // Auto-refresh conversations every 30 seconds (increased from 15)
    useEffect(() => {
        if (!currentUser) return;

        const intervalId = setInterval(() => {
            loadConversations();
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [currentUser, activeTab]);

    // When conversation is selected, load messages and mark as initial load
    useEffect(() => {
        if (selectedConversation) {
            setIsInitialLoad(true);
            loadMessages(); // Initial load of latest messages
        } else {
            setMessages([]); // Clear messages when no conversation is selected
        }
    }, [selectedConversation]);

    // Auto-refresh messages in open chat every 30 seconds (increased from 15)
    useEffect(() => {
        if (!selectedConversation) return;

        const intervalId = setInterval(() => {
            setIsInitialLoad(false); // Subsequent loads are not initial
            loadMessages(); // This will load the latest batch of messages
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [selectedConversation]);

    const loadUser = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversations = async () => {
        try {
            const { data } = await getConversations({
                tab: activeTab,
                q: ''
            });
            setConversations(data.conversations || []);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadMessages = async (before = null) => { // Added 'before' parameter for pagination
        if (!selectedConversation) return;
        
        if (before) {
            setIsLoadingOlder(true);
        }
        
        try {
            const { data } = await getMessages({
                conversationId: selectedConversation.id,
                limit: 50,
                before: before // Pass 'before' for pagination
            });
            
            if (before) {
                // Prepend older messages
                setMessages(prev => [...data.messages, ...prev]);
                setHasMoreMessages(data.hasMore || false);
            } else {
                // Initial load or refresh: replace messages
                setMessages(data.messages || []);
                setHasMoreMessages(data.hasMore || false);
            }
            
            // After reading messages, refresh unread count (throttled)
            // Only refresh unread count on initial load, not when loading older history
            if (!before) {
                await refreshUnreadCount();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            if (before) {
                setIsLoadingOlder(false);
            }
        }
    };

    const handleLoadOlderMessages = async () => {
        if (messages.length === 0 || isLoadingOlder || !hasMoreMessages) return;
        
        // Save current scroll position
        const container = messagesContainerRef.current;
        if (!container) return;
        
        const oldScrollHeight = container.scrollHeight;
        const oldScrollTop = container.scrollTop;
        
        // Load older messages using the ID of the oldest message currently displayed
        const oldestMessageId = messages[0].id;
        await loadMessages(oldestMessageId);
        
        // Restore scroll position after new content has loaded
        // Use setTimeout to ensure DOM has updated before calculating new scroll position
        setTimeout(() => {
            if (container) {
                const newScrollHeight = container.scrollHeight;
                const scrollDifference = newScrollHeight - oldScrollHeight;
                container.scrollTop = oldScrollTop + scrollDifference;
            }
        }, 50); // Small delay to allow DOM to render
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || isSending) return;

        const userMessageContent = newMessage.trim();
        
        const tempMessageId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: tempMessageId,
            from: currentUser.nostr_pubkey,
            content: userMessageContent,
            createdAt: new Date().toISOString(),
            status: 'pending',
        };

        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
        setNewMessage('');
        inputRef.current?.focus();

        setIsSending(true);

        try {
            await sendNostrMessage({
                conversationId: selectedConversation.id,
                content: userMessageContent,
                links: []
            });
            
            await loadMessages(); 
            await loadConversations();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
            setMessages(prevMessages => prevMessages.map(msg =>
                msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
            ));
        } finally {
            setIsSending(false);
        }
    };

    const handleMuteConversation = async () => {
        if (!selectedConversation) return;
        try {
            await toggleMuteConversation({ conversationId: selectedConversation.id });
            await loadConversations();
            
            // Find the updated conversation in the current list and update selectedConversation state
            const updated = conversations.find(c => c.id === selectedConversation.id);
            if (updated) {
                setSelectedConversation(updated);
            }
            
            await refreshUnreadCount();
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    };

    const handleBlockConversation = async () => {
        if (!selectedConversation) return;
        const confirmBlock = confirm('Are you sure you want to block this user?');
        if (!confirmBlock) return;

        try {
            await toggleBlockConversation({ conversationId: selectedConversation.id });
            await loadConversations();
            setSelectedConversation(null); // Clear selected conversation after blocking
            setMessages([]); // Clear messages
            
            await refreshUnreadCount();
        } catch (error) {
            console.error('Error toggling block:', error);
        }
    };

    const handleConversationCreated = async (conversationId) => {
        setShowNewChatModal(false);
        await loadConversations();
        
        // Reload conversations to ensure new one is in the list with correct data
        const reloadedConversations = await getConversations({
            tab: activeTab,
            q: ''
        });
        const newConv = reloadedConversations.data.conversations.find(c => c.id === conversationId);
        if (newConv) {
            setSelectedConversation(newConv);
        }
        
        await refreshUnreadCount();
    };

    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        }
    };

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        // Check if within 100px of the bottom
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        setShowScrollButton(!isNearBottom);
    };

    // Scroll to bottom when opening a conversation (initial load)
    useEffect(() => {
        if (isInitialLoad && messages.length > 0) {
            // Use instant scroll for initial load (immediate feedback)
            setTimeout(() => {
                scrollToBottom('instant');
                setIsInitialLoad(false); // Reset after scrolling
            }, 100); // A small delay is often good to ensure DOM is fully rendered
        }
    }, [isInitialLoad, messages]);

    // Auto-scroll for new messages (smooth scroll, only if already near bottom)
    useEffect(() => {
        if (!messagesContainerRef.current || messages.length === 0 || isInitialLoad) return;
        
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        // Only scroll to bottom if loading new messages (not older ones) AND already near bottom
        if (!isLoadingOlder && isNearBottom) {
            // Use setTimeout + requestAnimationFrame for precise timing
            setTimeout(() => {
                requestAnimationFrame(() => {
                    scrollToBottom('smooth');
                });
            }, 150); // Increased delay to 150ms to allow DOM to fully calculate heights
        }
    }, [messages, isLoadingOlder, isInitialLoad]);


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
            console.error('Invalid date:', dateString);
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
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Function to render message content with clickable links
    const renderMessageContent = (content) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);
        
        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                const isInternal = part.includes('coherosphere') || 
                                  part.includes(window.location.hostname);
                
                return (
                    <a
                        key={index}
                        href={part}
                        target={isInternal ? '_self' : '_blank'}
                        rel={isInternal ? undefined : 'noopener noreferrer'}
                        className="underline hover:text-orange-200 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    if (isLoading) {
        return (
            <>
                <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
                    <div className="text-center">
                        <CoherosphereNetworkSpinner size={100} lineWidth={2} dotRadius={6} interval={1100} maxConcurrent={4} />
                        <div className="text-slate-400 text-lg mt-4">Loading...</div>
                    </div>
                </div>
                <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
            </>
        );
    }

    if (!currentUser?.nostr_pubkey || !currentUser?.nostr_secret) {
        return (
            <div className="p-8">
                <Card className="bg-red-500/10 border-red-500/30 p-6 max-w-2xl mx-auto">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Nostr Keys Required
                            </h3>
                            <p className="text-slate-300 mb-4">
                                To use messaging, you need to configure your Nostr keys in your profile settings.
                            </p>
                            <Button 
                                onClick={() => window.location.href = '/Profile'}
                                className="bg-orange-500 hover:bg-orange-600"
                            >
                                Go to Profile Settings
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Managed Key Warning Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-500/10 border-b border-orange-500/30 px-6 py-3 flex-shrink-0"
            >
                <div className="flex items-center gap-3 max-w-7xl mx-auto">
                    <Shield className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <p className="text-sm text-orange-200">
                        <strong>Test Mode (Managed Key):</strong> Messages are signed server-side for testing. 
                        In Phase 2, you'll sign locally with your own keys.
                    </p>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden min-h-0">
                {/* Conversations List (Left Sidebar) */}
                <div className={`md:col-span-4 lg:col-span-3 border-r border-slate-700 flex flex-col bg-slate-800/30 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {/* Conversations Header */}
                    <div className="p-4 border-b border-slate-700 flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-orange-500" />
                                Messages
                            </h2>
                            <Button
                                size="icon"
                                onClick={() => setShowNewChatModal(true)}
                                className="bg-orange-500 hover:bg-orange-600"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2">
                            {['all', 'muted', 'blocked'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        activeTab === tab
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center">
                                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">
                                    {activeTab === 'all' 
                                        ? 'No conversations yet. Start a new chat!' 
                                        : `No ${activeTab} conversations`}
                                </p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <motion.button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors text-left ${
                                        selectedConversation?.id === conv.id ? 'bg-slate-700/50' : ''
                                    }`}
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 text-white font-semibold">
                                            {conv.peerName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-white truncate">
                                                    {conv.peerName}
                                                </h3>
                                                <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                                    {formatTime(conv.lastAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-slate-400 truncate">
                                                    {conv.lastSnippet || 'No messages yet'}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <Badge className="bg-orange-500 text-white ml-2 flex-shrink-0">
                                                        {conv.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat View (Right Side) */}
                <div className={`md:col-span-8 lg:col-span-9 flex flex-col min-h-0 relative ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {!selectedConversation ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center max-w-md">
                                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Choose a conversation from the list or start a new one.
                                </p>
                                <p className="text-slate-500 text-sm mt-4 leading-relaxed">
                                    Your messages are sent using <span className="text-orange-400 font-medium">Nostr Kind 4 events</span>, following the <span className="text-orange-400 font-medium">NIP-04 standard</span> for end-to-end encrypted communication — private, decentralized, and visible only to you and your conversation partner.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header - Fixed */}
                            <div className="flex-shrink-0 p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedConversation(null)}
                                        className="md:hidden text-white hover:text-orange-400"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                                        {selectedConversation.peerName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {selectedConversation.peerName}
                                        </h3>
                                        <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                            {selectedConversation.peerNpub}
                                        </p>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="w-5 h-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleMuteConversation}>
                                            <BellOff className="w-4 h-4 mr-2" />
                                            {selectedConversation.muted ? 'Unmute' : 'Mute'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={handleBlockConversation}
                                            className="text-red-400"
                                        >
                                            <Ban className="w-4 h-4 mr-2" />
                                            {selectedConversation.blocked ? 'Unblock' : 'Block'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Messages Area - Scrollable, Takes Available Space */}
                            <div 
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30 min-h-0"
                            >
                                {/* Load Older Messages Button */}
                                {hasMoreMessages && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-center mb-4"
                                    >
                                        <Button
                                            onClick={handleLoadOlderMessages}
                                            disabled={isLoadingOlder}
                                            variant="outline"
                                            className="bg-slate-700/50 hover:bg-slate-600/50 border-slate-600 text-slate-300"
                                        >
                                            {isLoadingOlder ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Load older messages'
                                            )}
                                        </Button>
                                    </motion.div>
                                )}

                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-slate-400 text-sm">
                                            No messages yet. Start the conversation!
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.from === currentUser.nostr_pubkey;
                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                                        isOwn
                                                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                                            : 'bg-slate-700 text-slate-100'
                                                    }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">
                                                        {renderMessageContent(msg.content)}
                                                    </p>
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-slate-400'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                    {msg.status === 'pending' && (
                                                        <p className="text-xs text-orange-200 mt-1">Sending...</p>
                                                    )}
                                                    {msg.status === 'failed' && (
                                                        <p className="text-xs text-red-300 mt-1">Failed to send</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Scroll to Bottom Button */}
                            <AnimatePresence>
                                {showScrollButton && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="absolute bottom-24 right-8 z-10"
                                    >
                                        <Button
                                            onClick={() => scrollToBottom('smooth')}
                                            className="rounded-full w-12 h-12 bg-orange-500 hover:bg-orange-600 shadow-lg"
                                            size="icon"
                                        >
                                            <ArrowLeft className="w-5 h-5 rotate-[-90deg]" /> {/* Rotated for scroll down */}
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Message Composer - Fixed at Bottom */}
                            <form 
                                onSubmit={handleSendMessage}
                                className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800/50"
                            >
                                {selectedConversation.blocked ? (
                                    <div className="text-center py-2">
                                        <p className="text-red-400 text-sm">
                                            You have blocked this user. Unblock to send messages.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            ref={inputRef}
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            disabled={isSending}
                                            className="flex-1 bg-slate-900/50 border-slate-600 text-white"
                                            maxLength={2000}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={!newMessage.trim() || isSending}
                                            className="bg-orange-500 hover:bg-orange-600 flex-shrink-0"
                                        >
                                            {isSending ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            <NewChatModal
                isOpen={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
                onConversationCreated={handleConversationCreated}
                currentUser={currentUser}
            />
        </div>
    );
}
