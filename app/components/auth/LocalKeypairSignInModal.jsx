
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Key, 
    Lock,
    X,
    Eye,
    EyeOff,
    Loader2,
    AlertTriangle
} from 'lucide-react';

// Import bech32 codec (vendored)
import { decode as bech32Decode, fromWords } from '../lib/codec/bech32.js';

// Import backend function
import { signNostrEvent } from '@/api/functions';

// Decryption utilities
async function decryptNsec(encryptedData, password) {
    try {
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new Uint8Array(encryptedData.salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(encryptedData.iv)
            },
            derivedKey,
            new Uint8Array(encryptedData.encrypted)
        );
        
        return new TextDecoder().decode(decryptedData);
    } catch (error) {
        // Falsches Passwort ist ein erwarteter User-Fehler, kein Programmierfehler
        // Daher nur als Info loggen, nicht als Error
        console.log('[LocalKeypairSignIn] Decryption failed (likely wrong password)');
        throw new Error('Failed to decrypt. Wrong password?');
    }
}

// Load encrypted data from IndexedDB
async function loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CoherosphereNostrKeys', 2); // Match version
        
        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;
            
            console.log('[LocalKeypairSignIn] Upgrading IndexedDB from version', event.oldVersion, 'to', event.newVersion);
            
            // Migration logic from version 1 to 2
            if (event.oldVersion === 1) {
                if (db.objectStoreNames.contains('keys')) {
                    console.log('[LocalKeypairSignIn] Found old "keys" object store from version 1.');
                    const oldStore = transaction.objectStore('keys');
                    const getAllRequest = oldStore.getAll();
                    
                    getAllRequest.onsuccess = () => {
                        const oldKeys = getAllRequest.result;
                        console.log('[LocalKeypairSignIn] Found', oldKeys.length, 'old keys to migrate.');
                        
                        // Delete old object store
                        // Note: deleteObjectStore must be called on the DB itself within onupgradeneeded.
                        db.deleteObjectStore('keys'); 
                        console.log('[LocalKeypairSignIn] Deleted old "keys" object store.');
                        
                        // Create new object store with fixed keyPath 'id'
                        const newStore = db.createObjectStore('keys', { keyPath: 'id' });
                        console.log('[LocalKeypairSignIn] Created new "keys" object store with keyPath "id".');
                        
                        // Migrate the most recent key (if any exist)
                        if (oldKeys.length > 0) {
                            // Sort by timestamp (newest first). Ensure timestamp exists or default to 0.
                            oldKeys.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            const mostRecent = oldKeys[0];
                            
                            // Save with new fixed ID 'current'
                            newStore.add({
                                id: 'current', // New fixed ID
                                npub: mostRecent.npub,
                                encrypted: mostRecent.encrypted,
                                salt: mostRecent.salt,
                                iv: mostRecent.iv,
                                timestamp: mostRecent.timestamp || Date.now() // Keep old timestamp or assign new
                            });
                            
                            console.log('[LocalKeypairSignIn] Migrated most recent key with npub:', mostRecent.npub, 'to id "current".');
                        } else {
                            console.log('[LocalKeypairSignIn] No old keys found to migrate.');
                        }
                    };
                    
                    getAllRequest.onerror = () => {
                        console.error('[LocalKeypairSignIn] Error retrieving old keys during migration:', getAllRequest.error);
                    };
                } else {
                    console.log('[LocalKeypairSignIn] No "keys" object store found for version 1, creating new for version 2.');
                    // If 'keys' didn't exist in v1, just create it for v2
                    db.createObjectStore('keys', { keyPath: 'id' });
                }
            } 
            // This 'else if' handles cases where oldVersion is 0 (fresh install)
            // or if it's an upgrade from a version older than 1 to 2, 
            // and no 'keys' store exists yet.
            else if (!db.objectStoreNames.contains('keys')) {
                // Fresh install or no existing store (e.g., upgrading from v0 to v2 directly)
                db.createObjectStore('keys', { keyPath: 'id' });
                console.log('[LocalKeypairSignIn] Created fresh keys object store.');
            }
            // If oldVersion is 0, this will be executed. If oldVersion is 1, the above block handles.
            // If oldVersion is >1 and <2 (shouldn't happen if previous version was 1), then it might also execute.
            // In essence, ensure the 'keys' store exists with keyPath 'id' by the end of onupgradeneeded.
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            // It's possible that even after an upgrade, if no keys were migrated/created,
            // the store is empty or the specific 'current' key is missing.
            // So, check if the object store exists first, and then try to get the key.
            if (!db.objectStoreNames.contains('keys')) {
                db.close();
                reject(new Error('IndexedDB "keys" object store missing or not created after upgrade.'));
                return;
            }
            
            const transaction = db.transaction(['keys'], 'readonly');
            const store = transaction.objectStore('keys');
            
            // Get the key with fixed ID 'current'
            const getRequest = store.get('current');
            
            getRequest.onsuccess = () => {
                const key = getRequest.result;
                db.close();
                
                if (!key) {
                    reject(new Error('No active key found in local storage (id: "current"). Please generate a new key.'));
                    return;
                }
                
                console.log('[LocalKeypairSignIn] Loaded keypair:', key.npub);
                resolve(key);
            };
            
            getRequest.onerror = () => {
                db.close();
                reject(new Error('Failed to load key from local storage (id: "current").'));
            };
        };

        request.onblocked = () => {
            // This event indicates that an upgrade transaction could not be immediately started
            // because a connection to the database was still open.
            console.warn('[LocalKeypairSignIn] IndexedDB upgrade blocked. Please close all other tabs/windows using this app.');
            reject(new Error('IndexedDB access blocked. Please ensure no other instances of the app are open.'));
        };
    });
}

// Convert bytes to hex
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export default function LocalKeypairSignInModal({ isOpen, onClose, onSuccess, challenge }) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignIn = async () => {
        if (!password) {
            setError('Please enter your password');
            return;
        }
        
        if (!challenge) {
            setError('No challenge available. Please try refreshing.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('[LocalKeypairSignIn] ===== STARTING SIGN-IN WITH BACKEND SIGNING =====');
            
            // 1. Load encrypted data from IndexedDB
            console.log('[LocalKeypairSignIn] Loading encrypted key from IndexedDB...');
            const encryptedData = await loadFromIndexedDB();
            
            // 2. Decrypt nsec with password
            console.log('[LocalKeypairSignIn] Decrypting key...');
            const nsec = await decryptNsec(encryptedData, password);
            
            // 3. Decode nsec using bech32
            console.log('[LocalKeypairSignIn] Decoding nsec...');
            const decoded = bech32Decode(nsec, 'bech32');
            
            if (!decoded || decoded.hrp !== 'nsec') {
                throw new Error('Invalid nsec format');
            }
            
            // 4. Convert 5-bit words to 8-bit bytes (private key)
            const privateKeyArray = fromWords(decoded.data);
            
            if (!privateKeyArray || privateKeyArray.length !== 32) {
                throw new Error('Invalid private key length');
            }
            
            // Convert to Uint8Array if needed
            const privateKeyBytes = privateKeyArray instanceof Uint8Array 
                ? privateKeyArray 
                : new Uint8Array(privateKeyArray);
            
            // Convert to hex for backend
            const privateKeyHex = bytesToHex(privateKeyBytes);
            
            console.log('[LocalKeypairSignIn] ✓ Private key decoded (32 bytes)');
            console.log('[LocalKeypairSignIn] Private key hex (first 10):', privateKeyHex.substring(0, 10));
            
            // 5. Create unsigned Nostr auth event (kind 22242 for HTTP Auth as per NIP-98)
            const unsignedEvent = {
                kind: 22242,
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['u', window.location.origin + challenge.path],
                    ['method', 'POST'],
                    ['challenge', challenge.nonce]
                ],
                content: ''
            };
            
            console.log('[LocalKeypairSignIn] Unsigned event:', unsignedEvent);
            
            // 6. Send to backend for signing
            console.log('[LocalKeypairSignIn] Sending to backend for signing...');
            const { data } = await signNostrEvent({
                unsigned_event: unsignedEvent,
                private_key_hex: privateKeyHex
            });
            
            if (!data || !data.signed_event) {
                throw new Error('Backend signing failed - no signed event returned');
            }
            
            const signedEvent = data.signed_event;
            
            console.log('[LocalKeypairSignIn] ✅ Event signed by backend!');
            console.log('[LocalKeypairSignIn] Signed event:', {
                id: signedEvent.id,
                pubkey: signedEvent.pubkey,
                sig: signedEvent.sig,
                kind: signedEvent.kind,
                created_at: signedEvent.created_at
            });
            
            // 7. Call parent success handler with signed event
            onSuccess(signedEvent);
            
        } catch (err) {
            // Nur bei unerwarteten Fehlern als Error loggen
            if (err.message?.includes('Wrong password')) {
                console.log('[LocalKeypairSignIn] User entered wrong password');
            } else {
                console.error('[LocalKeypairSignIn] Unexpected error:', err);
            }
            setError(err.message || 'Failed to sign in. Please check your password and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Card className="bg-slate-800/95 backdrop-blur-sm border-slate-700">
                        <CardHeader className="relative pb-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                                onClick={onClose}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                            
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center">
                                    <Key className="w-6 h-6 text-orange-400" />
                                </div>
                                <CardTitle className="text-xl text-white">
                                    Sign In with Local Keypair
                                </CardTitle>
                            </div>
                            <p className="text-slate-400 text-sm">
                                Enter your password to unlock your local Nostr keypair
                            </p>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !isLoading) {
                                                handleSignIn();
                                            }
                                        }}
                                        placeholder="Enter your password"
                                        className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-500 hover:text-slate-300"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </motion.div>
                            )}

                            {/* Sign In Button */}
                            <Button
                                onClick={handleSignIn}
                                disabled={isLoading || !password}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        <Key className="w-4 h-4 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </Button>

                            {/* Help Text */}
                            <p className="text-xs text-slate-500 text-center">
                                Your private key is decrypted locally and sent securely to the backend for signing. It is never stored on the server.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
