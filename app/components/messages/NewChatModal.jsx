import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/api/entities';
import { createConversation } from '@/api/functions';
import { listUsersForMessaging } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Search, User as UserIcon, Loader2 } from 'lucide-react';

export default function NewChatModal({ isOpen, onClose, onConversationCreated, currentUser }) {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter(user => 
                user.full_name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.display_name?.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            // Use backend function with service role
            const { data } = await listUsersForMessaging();
            setUsers(data.users || []);
            setFilteredUsers(data.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = async (selectedUser) => {
        if (!selectedUser.nostr_pubkey) {
            alert('This user has not configured their Nostr keys yet.');
            return;
        }

        setIsCreating(true);
        try {
            const { data } = await createConversation({
                recipientNpub: selectedUser.nostr_pubkey
            });

            if (data.conversationId) {
                onConversationCreated(data.conversationId);
                onClose();
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Failed to create conversation: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg max-h-[80vh] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-700">
                        <h2 className="text-xl font-bold text-white">Start New Conversation</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="overflow-y-auto max-h-[50vh] p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <UserIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">
                                    {searchQuery ? 'No users found matching your search' : 'No users available'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUsers.map((user) => (
                                    <motion.button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        disabled={isCreating}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {(user.display_name || user.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-white truncate">
                                                    {user.display_name || user.full_name || 'Unknown User'}
                                                </div>
                                                <div className="text-sm text-slate-400 truncate">
                                                    {user.email}
                                                </div>
                                                {user.bio && (
                                                    <div className="text-xs text-slate-500 truncate mt-1">
                                                        {user.bio}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                        <p className="text-xs text-slate-400 text-center">
                            Select a user to start a private Nostr conversation
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}