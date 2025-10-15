
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Key,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    Info,
    Shield,
    Sparkles,
    Download
} from 'lucide-react';
import NostrKeyGeneratorModal from '@/components/auth/NostrKeyGeneratorModal';
import LocalKeypairSignInModal from '@/components/auth/LocalKeypairSignInModal';
import ImportKeypairModal from '@/components/auth/ImportKeypairModal';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

// Check if local keypair exists in IndexedDB
async function checkLocalKeypairExists() {
    return new Promise((resolve) => {
        const request = indexedDB.open('CoherosphereNostrKeys', 2);
        
        request.onerror = (event) => {
            console.error('[NostrAuth] IndexedDB error:', event.target.error);
            resolve(false);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;
            
            console.log('[NostrAuth] Upgrading IndexedDB from version', event.oldVersion, 'to', event.newVersion);
            
            if (event.oldVersion === 1) {
                if (db.objectStoreNames.contains('keys')) {
                    const oldStore = transaction.objectStore('keys');
                    const getAllRequest = oldStore.getAll();
                    
                    getAllRequest.onsuccess = () => {
                        const oldKeys = getAllRequest.result;
                        console.log('[NostrAuth] Found', oldKeys.length, 'old keys to migrate');
                        
                        db.deleteObjectStore('keys');
                        
                        const newStore = db.createObjectStore('keys', { keyPath: 'id' });
                        
                        if (oldKeys.length > 0) {
                            oldKeys.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            const mostRecent = oldKeys[0];
                            
                            newStore.add({
                                id: 'current',
                                npub: mostRecent.npub,
                                encrypted: mostRecent.encrypted,
                                salt: mostRecent.salt,
                                iv: mostRecent.iv,
                                timestamp: mostRecent.timestamp || Date.now()
                            });
                            
                            console.log('[NostrAuth] Migrated key with npub:', mostRecent.npub);
                        } else {
                            console.log('[NostrAuth] No old keys found to migrate.');
                        }
                    };
                    
                    getAllRequest.onerror = (e) => {
                        console.error('[NostrAuth] Error getting old keys for migration:', e.target.error);
                        if (!db.objectStoreNames.contains('keys')) {
                            db.createObjectStore('keys', { keyPath: 'id' });
                            console.log('[NostrAuth] Created fresh keys object store after migration error');
                        }
                    };

                } else {
                    console.log('[NostrAuth] No "keys" object store found for migration from v1, creating new.');
                    db.createObjectStore('keys', { keyPath: 'id' });
                }
            } else if (!db.objectStoreNames.contains('keys')) {
                db.createObjectStore('keys', { keyPath: 'id' });
                console.log('[NostrAuth] Created fresh keys object store');
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('keys')) {
                console.log('[NostrAuth] No keys object store found after upgrade/creation');
                db.close();
                resolve(false);
                return;
            }
            
            const transaction = db.transaction(['keys'], 'readonly');
            const store = transaction.objectStore('keys');
            
            const getRequest = store.get('current');
            
            getRequest.onsuccess = () => {
                const exists = getRequest.result !== undefined;
                console.log('[NostrAuth] Local keypair exists:', exists);
                if (exists) {
                    console.log('[NostrAuth] Keypair npub:', getRequest.result.npub);
                }
                db.close();
                resolve(exists);
            };
            
            getRequest.onerror = (e) => {
                console.error('[NostrAuth] Error checking for key:', e.target.error);
                db.close();
                resolve(false);
            };
        };
    });
}

// Delete keypair from IndexedDB
async function deleteFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CoherosphereNostrKeys', 2);
        
        request.onerror = (event) => reject(new Error(`Failed to open IndexedDB: ${event.target.error}`));
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;
            
            console.log('[NostrAuth] Upgrading IndexedDB from version', event.oldVersion, 'to', event.newVersion);
            
            if (event.oldVersion === 1) {
                if (db.objectStoreNames.contains('keys')) {
                    const oldStore = transaction.objectStore('keys');
                    const getAllRequest = oldStore.getAll();
                    
                    getAllRequest.onsuccess = () => {
                        const oldKeys = getAllRequest.result;
                        console.log('[NostrAuth] Found', oldKeys.length, 'old keys to migrate during delete operation');
                        
                        db.deleteObjectStore('keys');
                        const newStore = db.createObjectStore('keys', { keyPath: 'id' });
                        
                        if (oldKeys.length > 0) {
                            oldKeys.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            const mostRecent = oldKeys[0];
                            newStore.add({
                                id: 'current',
                                npub: mostRecent.npub,
                                encrypted: mostRecent.encrypted,
                                salt: mostRecent.salt,
                                iv: mostRecent.iv,
                                timestamp: mostRecent.timestamp || Date.now()
                            });
                            console.log('[NostrAuth] Migrated key with npub:', mostRecent.npub);
                        } else {
                            console.log('[NostrAuth] No old keys found to migrate during delete operation.');
                        }
                    };

                    getAllRequest.onerror = (e) => {
                        console.error('[NostrAuth] Error getting old keys for migration during delete:', e.target.error);
                        if (!db.objectStoreNames.contains('keys')) {
                            db.createObjectStore('keys', { keyPath: 'id' });
                            console.log('[NostrAuth] Created fresh keys object store after migration error during delete');
                        }
                    };

                } else {
                    console.log('[NostrAuth] No "keys" object store found for migration from v1, creating new.');
                    db.createObjectStore('keys', { keyPath: 'id' });
                }
            } else if (!db.objectStoreNames.contains('keys')) {
                db.createObjectStore('keys', { keyPath: 'id' });
                console.log('[NostrAuth] Created fresh keys object store');
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('keys')) {
                db.close();
                resolve();
                return;
            }
            
            const transaction = db.transaction(['keys'], 'readwrite');
            const store = transaction.objectStore('keys');
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                console.log('[NostrAuth] Successfully deleted all keys from IndexedDB');
                db.close();
                resolve();
            };
            
            clearRequest.onerror = (e) => {
                db.close();
                reject(new Error(`Failed to delete keys from IndexedDB: ${e.target.error}`));
            };
        };
    });
}

export default function NostrAuthPage() {
    const [step, setStep] = useState('initial');
    const [challenge, setChallenge] = useState(null);
    const [error, setError] = useState(null);
    const [authResult, setAuthResult] = useState(null);
    const [hasNostrExtension, setHasNostrExtension] = useState(false);
    const [hasLocalKeypair, setHasLocalKeypair] = useState(false);
    const [showKeyGenerator, setShowKeyGenerator] = useState(false);
    const [showLocalSignIn, setShowLocalSignIn] = useState(false);
    const [showImportKeypair, setShowImportKeypair] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    React.useEffect(() => {
        const checkExtension = () => {
            if (window.nostr) {
                setHasNostrExtension(true);
                console.log('[NostrAuth] NIP-07 extension detected!');
            } else {
                setHasNostrExtension(false);
                console.log('[NostrAuth] No NIP-07 extension found');
            }
        };

        const checkLocalKeys = async () => {
            const exists = await checkLocalKeypairExists();
            setHasLocalKeypair(exists);
        };

        checkExtension();
        checkLocalKeys();

        setTimeout(checkExtension, 1000);

        const handleKeypairDeleted = () => {
            console.log('[NostrAuth] Local keypair was deleted, refreshing status...');
            checkLocalKeys();
        };

        window.addEventListener('localKeypairDeleted', handleKeypairDeleted);

        return () => {
            window.removeEventListener('localKeypairDeleted', handleKeypairDeleted);
        };
    }, []);

    const handleSignIn = async () => {
        try {
            setError(null);
            setStep('requesting_challenge');

            console.log('[NostrAuth] Requesting challenge...');
            const { data: challengeData } = await base44.functions.invoke('requestNostrChallenge', {});

            console.log('[NostrAuth] Challenge received:', {
                id: challengeData.challenge_id,
                nonce: challengeData.nonce.substring(0, 10) + '...'
            });

            setChallenge(challengeData);
            setStep('signing');

            if (!window.nostr) {
                throw new Error('No Nostr extension found. Please install Alby, nos2x, or another NIP-07 compatible extension.');
            }

            console.log('[NostrAuth] Requesting signature from NIP-07 extension...');

            const unsignedEvent = {
                kind: 22242,
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['u', window.location.origin + challengeData.path],
                    ['method', 'POST'],
                    ['challenge', challengeData.nonce]
                ],
                content: ''
            };

            console.log('[NostrAuth] Unsigned event:', unsignedEvent);

            let signedEvent;
            try {
                signedEvent = await window.nostr.signEvent(unsignedEvent);
            } catch (signError) {
                if (signError.message?.includes('denied') || signError.message?.includes('reject')) {
                    console.log('[NostrAuth] ℹ️ User denied signature request');
                    throw new Error('Signature request was denied. Please approve the signature in your Nostr extension to continue.');
                }
                console.warn('[NostrAuth] Extension error:', signError);
                throw new Error(`Extension error: ${signError.message || 'Failed to sign event'}`);
            }

            console.log('[NostrAuth] Event signed!', {
                id: signedEvent.id,
                pubkey: signedEvent.pubkey.substring(0, 10) + '...',
                sig: signedEvent.sig.substring(0, 10) + '...'
            });

            setStep('verifying');

            console.log('[NostrAuth] Sending to backend for verification...');
            const { data: verifyData } = await base44.functions.invoke('verifyNostrAuth', {
                challenge_id: challengeData.challenge_id,
                signed_event: signedEvent
            });

            console.log('[NostrAuth] ✅ Verification successful!', verifyData);

            setAuthResult(verifyData);
            setStep('success');

            // Automatische Weiterleitung entfernt - jetzt manuell über Button
            // setTimeout(() => {
            //     if (verifyData.is_new_user) {
            //         window.location.href = createPageUrl('Profile');
            //     } else {
            //         window.location.href = createPageUrl('Dashboard');
            //     }
            // }, 2000);

        } catch (err) {
            if (err.message?.includes('denied') || err.message?.includes('approve')) {
                console.log('[NostrAuth] User action required:', err.message);
            } else {
                console.error('[NostrAuth] Unexpected error:', err);
            }
            setError(err.message || 'Authentication failed');
            setStep('error');
        }
    };

    const handleLocalSignIn = async () => {
        try {
            setError(null);
            setStep('requesting_challenge');

            console.log('[NostrAuth] Requesting challenge for local keypair...');
            const { data: challengeData } = await base44.functions.invoke('requestNostrChallenge', {});

            console.log('[NostrAuth] Challenge received:', {
                id: challengeData.challenge_id,
                nonce: challengeData.nonce.substring(0, 10) + '...'
            });

            setChallenge(challengeData);
            setStep('signing');

            setShowLocalSignIn(true);

        } catch (err) {
            console.error('[NostrAuth] Error requesting challenge:', err);
            setError(err.message || 'Failed to request challenge');
            setStep('error');
        }
    };

    const handleLocalSignInSuccess = async (signedEvent) => {
        try {
            setShowLocalSignIn(false);
            setStep('verifying');

            console.log('[NostrAuth] Sending local-signed event to backend for verification...');

            if (!challenge || !challenge.challenge_id) {
                throw new Error('Challenge not available for verification.');
            }

            const { data: verifyData } = await base44.functions.invoke('verifyNostrAuth', {
                challenge_id: challenge.challenge_id,
                signed_event: signedEvent
            });

            console.log('[NostrAuth] ✅ Verification successful!', verifyData);

            setAuthResult(verifyData);
            setStep('success');

            // Automatische Weiterleitung entfernt - jetzt manuell über Button
            // setTimeout(() => {
            //     if (verifyData.is_new_user) {
            //         window.location.href = createPageUrl('Profile');
            //     } else {
            //         window.location.href = createPageUrl('Dashboard');
            //     }
            // }, 2000);

        } catch (err) {
            console.error('[NostrAuth] Verification error:', err);
            setError(err.message || 'Authentication failed');
            setStep('error');
        }
    };

    const handleLocalSignInCancel = () => {
        console.log('[NostrAuth] Local sign-in cancelled by user');
        setShowLocalSignIn(false);
        setStep('initial');
        setChallenge(null);
        setError(null);
    };

    const handleDeleteKeypair = async () => {
        setIsDeleting(true);
        setDeleteError('');

        try {
            await deleteFromIndexedDB();
            console.log('[NostrAuth] Local keypair deleted successfully');

            const exists = await checkLocalKeypairExists();
            setHasLocalKeypair(exists);

            setShowDeleteConfirm(false);

            window.dispatchEvent(new CustomEvent('localKeypairDeleted'));

        } catch (err) {
            console.error('[NostrAuth] Failed to delete keypair:', err);
            setDeleteError('Failed to delete local keypair. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-3">
                    <Shield className="w-12 h-12 text-orange-500 flex-shrink-0" />
                    <div>
                        <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                            Nostr Authentication
                        </h1>
                        <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
                    </div>
                </div>
                <p className="text-lg text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Nostr authentication flow using NIP-07 browser extensions or local keypairs.
                </p>
            </div>

            <div className="max-w-4xl mx-auto grid gap-6">
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-white">
                            <Info className="w-5 h-5 text-blue-400" />
                            Authentication Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            {hasNostrExtension ? (
                                <>
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                    <div>
                                        <div className="text-white font-medium">NIP-07 browser extension detected</div>
                                        <div className="text-slate-400 text-sm">Ready to sign with your Nostr identity</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                                    <div>
                                        <div className="text-white font-medium">No NIP-07 browser extension detected</div>
                                        <div className="text-slate-400 text-sm">
                                            Please install <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Alby</a>, <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">nos2x</a>, or create a local keypair
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="border-t border-slate-700"></div>

                        <div className="flex items-center gap-3">
                            {hasLocalKeypair ? (
                                <>
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                    <div>
                                        <div className="text-white font-medium">Local Keypair Detected</div>
                                        <div className="text-slate-400 text-sm">Keypair stored locally for authentication</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Info className="w-6 h-6 text-slate-500" />
                                    <div>
                                        <div className="text-white font-medium">No Local Keypair Found</div>
                                        <div className="text-slate-400 text-sm">Create one if you don't use a Nostr extension</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-white">
                            <Key className="w-5 h-5 text-orange-400" />
                            Authentication Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {[
                                { id: 'initial', label: 'Start Authentication', icon: Key },
                                { id: 'requesting_challenge', label: 'Request Challenge from Backend', icon: Loader2 },
                                { id: 'signing', label: 'Sign Challenge', icon: Shield },
                                { id: 'verifying', label: 'Verify Signature on Backend', icon: Loader2 },
                                { id: 'success', label: 'Authentication Complete', icon: CheckCircle }
                            ].map((flowStep, index) => {
                                const isActive = step === flowStep.id;
                                const flowStepsOrder = ['initial', 'requesting_challenge', 'signing', 'verifying', 'success'];
                                const isPast = flowStepsOrder.indexOf(step) > flowStepsOrder.indexOf(flowStep.id);
                                const Icon = flowStep.icon;

                                return (
                                    <div key={flowStep.id} className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isActive ? 'bg-orange-500 text-white' :
                                            isPast ? 'bg-green-500 text-white' :
                                            'bg-slate-700 text-slate-400'
                                        }`}>
                                            {isActive && flowStep.icon === Loader2 ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-medium ${
                                                isActive ? 'text-orange-400' :
                                                isPast ? 'text-green-400' :
                                                'text-slate-400'
                                            }`}>
                                                {flowStep.label}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {challenge && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                            >
                                <h4 className="text-white font-semibold mb-3">Challenge Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-slate-400">ID:</span>
                                        <span className="text-slate-300 ml-2 font-mono">{challenge.challenge_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Nonce:</span>
                                        <span className="text-slate-300 ml-2 font-mono break-all">{challenge.nonce}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Expires:</span>
                                        <span className="text-slate-300 ml-2">{new Date(challenge.expires_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {error && step === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-red-400 font-semibold mb-1">Authentication Failed</h4>
                                        <p className="text-red-300 text-sm">{error}</p>
                                        {error.includes('denied') && (
                                            <p className="text-red-200 text-xs mt-2">
                                                💡 Tip: Make sure to approve the signature request in your Nostr extension popup.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {authResult && step === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="text-green-400 font-semibold mb-2">✅ Authentication Successful!</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-slate-400">Nostr Pubkey:</span>
                                                <span className="text-green-300 ml-2 font-mono break-all">{authResult.npub}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">User Status:</span>
                                                <Badge className={`ml-2 ${authResult.is_new_user ? 'bg-yellow-500' : 'bg-green-500'}`}>
                                                    {authResult.is_new_user ? 'New User' : 'Existing User'}
                                                </Badge>
                                            </div>
                                            {authResult.display_name && (
                                                <div>
                                                    <span className="text-slate-400">Display Name:</span>
                                                    <span className="text-green-300 ml-2">{authResult.display_name}</span>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-green-500/30">
                                                <p className="text-green-300">{authResult.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="pt-4 space-y-3">
                            {step === 'initial' || step === 'error' ? (
                                <>
                                    <Button
                                        onClick={handleSignIn}
                                        disabled={!hasNostrExtension}
                                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
                                    >
                                        <Key className="w-5 h-5 mr-2" />
                                        Sign In with Nostr Extension (NIP-07)
                                    </Button>

                                    <Button
                                        onClick={handleLocalSignIn}
                                        disabled={!hasLocalKeypair}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Shield className="w-5 h-5 mr-2" />
                                        Sign In with Local Keypair
                                    </Button>

                                    <Button
                                        onClick={() => setShowKeyGenerator(true)}
                                        variant="outline"
                                        className="w-full btn-secondary-coherosphere py-3"
                                    >
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        {hasLocalKeypair ? 'Manage Local Keypair' : 'No Nostr? Create Local Keypair'}
                                    </Button>

                                    <Button
                                        onClick={() => setShowImportKeypair(true)}
                                        variant="outline"
                                        className="w-full btn-secondary-coherosphere py-3"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Import Existing Keypair
                                    </Button>

                                    {hasLocalKeypair && !showDeleteConfirm && (
                                        <Button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            variant="outline"
                                            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 py-3"
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Delete Local Keypair
                                        </Button>
                                    )}

                                    {showDeleteConfirm && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-red-200 leading-relaxed">
                                                    <strong className="block mb-2">Are you absolutely sure?</strong>
                                                    This will permanently delete your local keypair from this browser.
                                                    Make sure you have a backup before proceeding. This action cannot be undone.
                                                </div>
                                            </div>

                                            {deleteError && (
                                                <div className="text-sm text-red-300">
                                                    {deleteError}
                                                </div>
                                            )}

                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false);
                                                        setDeleteError('');
                                                    }}
                                                    variant="outline"
                                                    className="flex-1 btn-secondary-coherosphere"
                                                    disabled={isDeleting}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleDeleteKeypair}
                                                    disabled={isDeleting}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                                            Yes, Delete Permanently
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            ) : step === 'success' ? (
                                <>
                                    <Button
                                        onClick={() => {
                                            // Manuelle Weiterleitung bei Klick
                                            if (authResult.is_new_user) {
                                                window.location.href = createPageUrl('Profile');
                                            } else {
                                                window.location.href = createPageUrl('Dashboard');
                                            }
                                        }}
                                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
                                    >
                                        Continue to {authResult.is_new_user ? 'Profile Setup' : 'Dashboard'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setStep('initial');
                                            setChallenge(null);
                                            setAuthResult(null);
                                            setError(null);
                                            checkLocalKeypairExists().then(setHasLocalKeypair);
                                        }}
                                        variant="outline"
                                        className="w-full btn-secondary-coherosphere"
                                    >
                                        Test Again
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    disabled
                                    className="w-full bg-slate-700 text-slate-400"
                                >
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                    <CardContent className="pt-6">
                        <h4 className="text-white font-semibold mb-3">How This Works</h4>
                        <ol className="space-y-2 text-slate-300 text-sm list-decimal list-inside">
                            <li>Backend generates a unique, time-limited challenge</li>
                            <li>Your Nostr extension or local keypair signs the challenge with cryptographic proof</li>
                            <li>Backend verifies the signature using your public key</li>
                            <li>If valid, you're authenticated without passwords or centralized accounts</li>
                        </ol>
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-300 text-sm">
                                <strong>Security Note:</strong> Your private key never leaves your browser extension or local storage.
                                Only cryptographic signatures are shared, using secp256k1 Schnorr signatures.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <NostrKeyGeneratorModal
                isOpen={showKeyGenerator}
                onClose={() => {
                    setShowKeyGenerator(false);
                    checkLocalKeypairExists().then(setHasLocalKeypair);
                }}
            />

            <LocalKeypairSignInModal
                isOpen={showLocalSignIn}
                onClose={handleLocalSignInCancel}
                onSuccess={handleLocalSignInSuccess}
                challenge={challenge}
            />

            <ImportKeypairModal
                isOpen={showImportKeypair}
                onClose={() => {
                    setShowImportKeypair(false);
                    checkLocalKeypairExists().then(setHasLocalKeypair);
                }}
            />
        </div>
    );
}
