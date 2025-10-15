
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Download,
    Lock,
    X,
    Eye,
    EyeOff,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Key
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Import bech32 utilities
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Decode(str) {
    const p = str.lastIndexOf('1');
    if (p < 1) throw new Error('Invalid bech32 string');

    const prefix = str.substring(0, p);
    const data = str.substring(p + 1);

    const decoded = [];
    for (let i = 0; i < data.length; i++) {
        const c = data.charAt(i);
        const d = BECH32_CHARSET.indexOf(c);
        if (d === -1) throw new Error('Invalid bech32 character');
        decoded.push(d);
    }

    return { prefix, data: decoded };
}

function convertBits(data, fromBits, toBits, pad) {
    let acc = 0;
    let bits = 0;
    const result = [];
    const maxv = (1 << toBits) - 1;

    for (const value of data) {
        acc = (acc << fromBits) | value;
        bits += fromBits;
        while (bits >= toBits) {
            bits -= toBits;
            result.push((acc >> bits) & maxv);
        }
    }

    if (pad) {
        if (bits > 0) result.push((acc << (toBits - bits)) & maxv);
    }

    return result;
}

function bech32Encode(prefix, data) {
    const combined = convertBits([...data], 8, 5, true);
    const checksum = createChecksum(prefix, combined);
    return prefix + '1' + [...combined, ...checksum].map(x => BECH32_CHARSET[x]).join('');
}

function createChecksum(prefix, data) {
    const values = [...prefixExpand(prefix), ...data, 0, 0, 0, 0, 0, 0];
    const mod = polymod(values) ^ 1;
    const result = [];
    for (let i = 0; i < 6; i++) {
        result.push((mod >> (5 * (5 - i))) & 31);
    }
    return result;
}

function prefixExpand(prefix) {
    const result = [];
    for (let i = 0; i < prefix.length; i++) {
        result.push(prefix.charCodeAt(i) >> 5);
    }
    result.push(0);
    for (let i = 0; i < prefix.length; i++) {
        result.push(prefix.charCodeAt(i) & 31);
    }
    return result;
}

function polymod(values) {
    const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (const value of values) {
        const b = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ value;
        for (let i = 0; i < 5; i++) {
            if ((b >> i) & 1) chk ^= GENERATOR[i];
        }
    }
    return chk;
}

// Encryption function
async function encryptNsec(nsec, password) {
    try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

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
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            derivedKey,
            new TextEncoder().encode(nsec)
        );

        return {
            encrypted: Array.from(new Uint8Array(encryptedData)),
            salt: Array.from(salt),
            iv: Array.from(iv)
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt private key');
    }
}

// Check if keypair exists in IndexedDB
async function checkExistingKeypair() {
    return new Promise((resolve) => {
        const request = indexedDB.open('CoherosphereNostrKeys', 2); // Use updated version
        
        request.onerror = (event) => {
            console.error('[checkExistingKeypair] IndexedDB open error:', event.target.error);
            resolve(null);
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('keys')) {
                console.log('[checkExistingKeypair] No keys object store found (after upgrade or fresh).');
                db.close();
                resolve(null);
                return;
            }
            
            const transaction = db.transaction(['keys'], 'readonly');
            const store = transaction.objectStore('keys');
            // Try to get the fixed key
            const getRequest = store.get('current'); 
            
            getRequest.onsuccess = () => {
                const key = getRequest.result;
                db.close();
                
                if (key) {
                    console.log('[checkExistingKeypair] Found existing keypair:', key.npub);
                    resolve(key);
                } else {
                    console.log('[checkExistingKeypair] No "current" key found.');
                    resolve(null);
                }
            };
            
            getRequest.onerror = (event) => {
                console.error('[checkExistingKeypair] Error reading key:', event.target.error);
                db.close();
                resolve(null);
            };
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('[checkExistingKeypair] IndexedDB upgrade needed from version', event.oldVersion, 'to', event.newVersion);
            // Ensure the 'keys' object store exists with the correct keyPath for version 2
            if (event.oldVersion < 2) {
                if (db.objectStoreNames.contains('keys')) {
                    db.deleteObjectStore('keys');
                    console.log('[checkExistingKeypair] Deleted old "keys" object store during upgrade.');
                }
                db.createObjectStore('keys', { keyPath: 'id' });
                console.log('[checkExistingKeypair] Created "keys" object store with keyPath "id".');
            }
            // Data migration (if any) is handled by saveToIndexedDB when it's first called.
            // For checkExistingKeypair, we just ensure the schema is ready for v2.
            // After this, onsuccess will try to read from the potentially empty new structure.
        };
    });
}

// Delete existing keypair from IndexedDB
async function deleteExistingKeypair() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CoherosphereNostrKeys', 2); // Use updated version
        
        request.onerror = (event) => reject(new Error(`Failed to open IndexedDB: ${event.target.error}`));
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('keys')) {
                console.log('[deleteExistingKeypair] No "keys" object store found to delete from.');
                db.close();
                resolve();
                return;
            }
            
            const transaction = db.transaction(['keys'], 'readwrite');
            const store = transaction.objectStore('keys');
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                console.log('[deleteExistingKeypair] Successfully deleted existing keypair(s) by clearing store.');
                db.close();
                resolve();
            };
            
            clearRequest.onerror = (event) => {
                db.close();
                reject(new Error(`Failed to delete existing keypair: ${event.target.error}`));
            };
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('[deleteExistingKeypair] IndexedDB upgrade triggered during delete from version', event.oldVersion, 'to', event.newVersion);
            // Ensure the 'keys' object store exists with the correct keyPath for version 2
            if (event.oldVersion < 2) {
                if (db.objectStoreNames.contains('keys')) {
                    db.deleteObjectStore('keys');
                    console.log('[deleteExistingKeypair] Deleted old "keys" object store during upgrade.');
                }
                db.createObjectStore('keys', { keyPath: 'id' });
                console.log('[deleteExistingKeypair] Created "keys" object store with keyPath "id".');
            }
            // Data migration (if any) is handled by saveToIndexedDB when it's first called.
            // Here, we just ensure the schema is ready for v2. The clear() operation will then run on it.
        };
    });
}

// Save to IndexedDB with fixed key
async function saveToIndexedDB(npub, encryptedData) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CoherosphereNostrKeys', 2); // Increment version

        request.onerror = (event) => reject(new Error(`Failed to open IndexedDB: ${event.target.error}`));

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;
            
            console.log('[saveToIndexedDB] Upgrading IndexedDB from version', event.oldVersion, 'to', event.newVersion);
            
            // Migration logic from version 1 to 2
            if (event.oldVersion === 1) {
                if (db.objectStoreNames.contains('keys')) {
                    const oldStore = transaction.objectStore('keys');
                    const getAllRequest = oldStore.getAll(); // This is an IDBRequest and will keep transaction open until completion
                    
                    getAllRequest.onsuccess = (e) => {
                        const oldKeys = e.target.result;
                        console.log('[saveToIndexedDB] Found', oldKeys.length, 'old keys from v1 to migrate.');
                        
                        // Delete old object store
                        db.deleteObjectStore('keys');
                        
                        // Create new object store with fixed keyPath
                        const newStore = db.createObjectStore('keys', { keyPath: 'id' });
                        
                        // Migrate the most recent key (if any exist)
                        if (oldKeys.length > 0) {
                            // Sort by timestamp (newest first)
                            oldKeys.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            const mostRecent = oldKeys[0];
                            
                            // Save with new fixed ID 'current'
                            newStore.add({
                                id: 'current',
                                npub: mostRecent.npub,
                                encrypted: mostRecent.encrypted,
                                salt: mostRecent.salt,
                                iv: mostRecent.iv,
                                timestamp: mostRecent.timestamp || Date.now()
                            });
                            
                            console.log('[saveToIndexedDB] Migrated key with npub:', mostRecent.npub);
                        } else {
                            console.log('[saveToIndexedDB] No old keys found to migrate.');
                        }
                    };
                    
                    getAllRequest.onerror = (e) => {
                        console.error('[saveToIndexedDB] Error getting old keys for migration:', e.target.error);
                        // Even if migration data fetch fails, we should still proceed to create new store
                        // and allow the current save operation to proceed.
                        if (db.objectStoreNames.contains('keys')) { // Check again in case of error
                            db.deleteObjectStore('keys');
                        }
                        db.createObjectStore('keys', { keyPath: 'id' });
                    };

                } else {
                    // oldVersion was 1 but no 'keys' store found, so just create the new one.
                    db.createObjectStore('keys', { keyPath: 'id' });
                    console.log('[saveToIndexedDB] Old version 1, but no "keys" store found. Created new "keys" store for v2.');
                }
            } else if (event.oldVersion < 2) { // Handles initial creation (oldVersion 0) or other pre-v2 versions
                // If upgrading from version 0, or if somehow previous version was < 1.
                // Ensure existing 'keys' store (if any) is deleted before creating new one with correct keyPath
                if (db.objectStoreNames.contains('keys')) {
                    db.deleteObjectStore('keys');
                    console.log('[saveToIndexedDB] Deleted existing "keys" store during upgrade from <v2.');
                }
                db.createObjectStore('keys', { keyPath: 'id' });
                console.log('[saveToIndexedDB] Created "keys" object store with keyPath "id" for v2.');
            } else {
                // This case should ideally not happen if versions are sequential.
                // If oldVersion > 2 (e.g. downgrading or version reset), ensure correct schema.
                console.warn('[saveToIndexedDB] Unexpected upgrade scenario: oldVersion', event.oldVersion, 'to newVersion', event.newVersion, '. Recreating "keys" store.');
                if (db.objectStoreNames.contains('keys')) {
                    db.deleteObjectStore('keys');
                }
                db.createObjectStore('keys', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['keys'], 'readwrite');
            const store = transaction.objectStore('keys');

            // First, clear ALL existing keys to ensure only one 'current' key exists
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                // Then save the new key with fixed ID
                const data = {
                    id: 'current', // Fixed ID
                    npub: npub,
                    encrypted: encryptedData.encrypted,
                    salt: encryptedData.salt,
                    iv: encryptedData.iv,
                    timestamp: Date.now()
                };

                const putRequest = store.put(data);

                putRequest.onsuccess = () => {
                    console.log('[saveToIndexedDB] Successfully saved encrypted key to IndexedDB (ID: current, npub: ', npub, ')');
                    db.close();
                    resolve();
                };

                putRequest.onerror = (event) => {
                    db.close();
                    reject(new Error(`Failed to save to IndexedDB: ${event.target.error}`));
                };
            };
            
            clearRequest.onerror = (event) => {
                db.close();
                reject(new Error(`Failed to clear old keys: ${event.target.error}`));
            };
        };
    });
}

export default function ImportKeypairModal({ isOpen, onClose }) {
    // Existing keypair check
    const [existingKeypair, setExistingKeypair] = useState(null);
    const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
    const [isCheckingExisting, setIsCheckingExisting] = useState(true);
    
    const [nsecInput, setNsecInput] = useState('');
    const [showNsec, setShowNsec] = useState(false);
    const [importError, setImportError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    // Derived data after validation
    const [validatedKeys, setValidatedKeys] = useState(null);

    // Save options
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Check for existing keypair when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsCheckingExisting(true);
            checkExistingKeypair().then((existing) => {
                setExistingKeypair(existing);
                setShowOverwriteWarning(existing !== null);
                setIsCheckingExisting(false);
            }).catch(error => {
                console.error("Error checking existing keypair:", error);
                setExistingKeypair(null); // Assume no existing keypair on error
                setShowOverwriteWarning(false);
                setIsCheckingExisting(false);
            });
        }
    }, [isOpen]);

    const handleProceedWithImport = () => {
        setShowOverwriteWarning(false);
    };

    const handleCancelImport = () => {
        handleClose();
    };

    const handleValidateAndImport = async () => {
        setImportError('');
        setIsValidating(true);

        try {
            // Trim and validate input
            const nsec = nsecInput.trim();

            if (!nsec) {
                throw new Error('Please enter your private key (nsec)');
            }

            if (!nsec.startsWith('nsec1')) {
                throw new Error('Invalid nsec format. Must start with "nsec1"');
            }

            // Decode nsec to validate format
            console.log('[ImportKeypair] Validating nsec format...');
            const decoded = bech32Decode(nsec);

            if (decoded.prefix !== 'nsec') {
                throw new Error('Invalid nsec prefix');
            }

            // Convert 5-bit to 8-bit
            const privateKeyBytes = new Uint8Array(convertBits(decoded.data.slice(0, -6), 5, 8, false));

            if (privateKeyBytes.length !== 32) {
                throw new Error('Invalid private key length');
            }

            console.log('[ImportKeypair] ✓ nsec format valid (32 bytes)');

            // Use backend to derive correct npub
            console.log('[ImportKeypair] Deriving npub from backend...');
            const response = await base44.functions.invoke('deriveNpubFromNsec', { nsec });

            if (!response.data || !response.data.npub) {
                throw new Error('Failed to derive public key from backend.');
            }

            const npub = response.data.npub;

            console.log('[ImportKeypair] ✓ Derived npub:', npub);

            setValidatedKeys({ nsec, npub });
            setShowSaveOptions(true);

        } catch (error) {
            console.log('[ImportKeypair] Validation failed:', error.message);
            setImportError(error.message || 'Failed to validate private key');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSaveLocally = async () => {
        setSaveError('');

        if (!password) {
            setSaveError('Please enter a password');
            return;
        }

        if (password.length < 8) {
            setSaveError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setSaveError('Passwords do not match');
            return;
        }

        setIsSaving(true);

        try {
            // The `saveToIndexedDB` function now handles clearing existing keys internally
            // so we don't need `deleteExistingKeypair` here explicitly.
            const encryptedData = await encryptNsec(validatedKeys.nsec, password);
            await saveToIndexedDB(validatedKeys.npub, encryptedData);

            setSaveSuccess(true);
            setPassword('');
            setConfirmPassword('');

            // Notify parent that keypair was saved
            // This event name might be slightly confusing as it implies deletion.
            // Perhaps a new event like 'localKeypairSaved' would be better,
            // but for now keeping consistency with existing system.
            window.dispatchEvent(new CustomEvent('localKeypairDeleted')); 

        } catch (error) {
            console.error('[ImportKeypair] Save error:', error);
            setSaveError(error.message || 'Failed to save key');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSkipSave = () => {
        handleClose();
    };

    const handleClose = () => {
        setExistingKeypair(null);
        setShowOverwriteWarning(false);
        setIsCheckingExisting(true);
        setNsecInput('');
        setShowNsec(false);
        setImportError('');
        setIsValidating(false);
        setValidatedKeys(null);
        setShowSaveOptions(false);
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setSaveError('');
        setIsSaving(false);
        setSaveSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Card className="bg-slate-800/95 backdrop-blur-sm border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                                        <Download className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-white mb-2">
                                            Import Existing Keypair
                                        </CardTitle>
                                        <p className="text-slate-300 text-sm">
                                            Bring your existing Nostr identity to coherosphere
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClose}
                                    className="text-slate-400 hover:text-white -mr-2 -mt-2"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {isCheckingExisting ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                </div>
                            ) : showOverwriteWarning ? (
                                <>
                                    {/* Overwrite Warning */}
                                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
                                        <div className="flex items-start gap-4">
                                            <AlertTriangle className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                                            <div>
                                                <h3 className="text-xl font-bold text-orange-400 mb-3">
                                                    Local Keypair Already Exists
                                                </h3>
                                                <div className="text-orange-200 space-y-3 mb-4">
                                                    <p>
                                                        You already have a local keypair saved in your browser:
                                                    </p>
                                                    <div className="bg-slate-900/50 rounded-lg p-3 border border-orange-500/30">
                                                        <code className="text-sm text-orange-300 break-all">
                                                            {existingKeypair.npub}
                                                        </code>
                                                    </div>
                                                    <p className="font-semibold">
                                                        Importing a new keypair will permanently delete the existing one!
                                                    </p>
                                                    <p>
                                                        Make sure you have a backup of your current keypair before proceeding.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <Button
                                            onClick={handleCancelImport}
                                            variant="outline"
                                            className="flex-1 btn-secondary-coherosphere py-6 text-lg"
                                        >
                                            Cancel - Keep Existing Keypair
                                        </Button>
                                        <Button
                                            onClick={handleProceedWithImport}
                                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-semibold"
                                        >
                                            <AlertTriangle className="w-5 h-5 mr-2" />
                                            Proceed - Overwrite Existing
                                        </Button>
                                    </div>
                                </>
                            ) : !showSaveOptions ? (
                                <>
                                    {/* Security Warning */}
                                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-orange-200 leading-relaxed">
                                                <strong>Security Notice:</strong> Only enter your private key on devices and applications you trust.
                                                Your private key gives complete access to your Nostr identity.
                                            </div>
                                        </div>
                                    </div>

                                    {/* nsec Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">
                                            Private Key (nsec)
                                        </label>
                                        <div className="relative">
                                            <Textarea
                                                type={showNsec ? 'text' : 'password'}
                                                value={nsecInput}
                                                onChange={(e) => setNsecInput(e.target.value)}
                                                placeholder="nsec1..."
                                                className="bg-slate-900/50 border-slate-700 text-white pr-10 font-mono text-sm"
                                                rows={3}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowNsec(!showNsec)}
                                                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                                            >
                                                {showNsec ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Error Display */}
                                    {importError && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                            <p className="text-red-400 text-sm">{importError}</p>
                                        </div>
                                    )}

                                    {/* Validate Button */}
                                    <Button
                                        onClick={handleValidateAndImport}
                                        disabled={isValidating || !nsecInput.trim()}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3"
                                    >
                                        {isValidating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="w-4 h-4 mr-2" />
                                                Validate and Import
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : !saveSuccess ? (
                                <>
                                    {/* Success - Keys Validated */}
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-green-400 font-semibold mb-1">
                                                    Keypair validated successfully!
                                                </div>
                                                <div className="text-green-200 text-sm">
                                                    Your npub: <code className="text-xs">{validatedKeys.npub.substring(0, 20)}...</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save Options */}
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-blue-200 leading-relaxed">
                                                <strong>Would you like to save your private key locally?</strong>
                                                <p className="mt-2">
                                                    We'll encrypt it securely with a password you choose – it never leaves your browser.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Option 1: Save Locally */}
                                    <div className="space-y-4">
                                        <p className="text-slate-300 text-sm">
                                            Choose a strong password to encrypt your private key:
                                        </p>

                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Password (min. 8 characters)"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="bg-slate-900/50 border-slate-600 text-white pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                            </div>

                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Confirm password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="bg-slate-900/50 border-slate-600 text-white"
                                            />
                                        </div>

                                        {saveError && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                                <p className="text-red-400 text-sm">{saveError}</p>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleSaveLocally}
                                            disabled={isSaving}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Encrypting...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Encrypt and Save
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-slate-800 text-slate-400">OR</span>
                                        </div>
                                    </div>

                                    {/* Option 2: Skip */}
                                    <Button
                                        onClick={handleSkipSave}
                                        variant="outline"
                                        className="w-full btn-secondary-coherosphere"
                                    >
                                        Skip Local Storage
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Success State */}
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle className="w-8 h-8 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">
                                                    Success!
                                                </h3>
                                                <p className="text-green-200">
                                                    Your keypair has been imported and securely saved.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleClose}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-lg"
                                    >
                                        Continue to Sign-in
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
