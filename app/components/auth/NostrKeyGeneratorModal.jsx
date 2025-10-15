
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Key, 
    Copy, 
    CheckCircle, 
    HelpCircle,
    Sparkles,
    Shield,
    Eye,
    EyeOff,
    X,
    Lock,
    Database
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Bech32 encoding utilities (simplified for npub/nsec)
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Encode(prefix, data) {
    const combined = convertBits([...data], 8, 5, true);
    const checksum = createChecksum(prefix, combined);
    return prefix + '1' + [...combined, ...checksum].map(x => BECH32_CHARSET[x]).join('');
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

// Encryption utilities using Web Crypto API (PBKDF2 + AES-GCM)
async function encryptNsec(nsec, password) {
    try {
        // Generate random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        
        // Generate random IV for AES-GCM
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Derive key from password using PBKDF2
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
        
        // Encrypt the nsec
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            derivedKey,
            new TextEncoder().encode(nsec)
        );
        
        // Return everything needed for decryption
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

// Save encrypted nsec to IndexedDB with fixed key
async function saveToIndexedDB(npub, encryptedData) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CoherosphereNostrKeys', 2); // Increment version
        
        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;
            
            console.log('[KeyGenerator] Upgrading IndexedDB from version', event.oldVersion, 'to', event.newVersion);
            
            // Migration logic from version 1 to 2
            if (event.oldVersion === 1 && db.objectStoreNames.contains('keys')) {
                const oldStore = transaction.objectStore('keys');
                const getAllRequest = oldStore.getAll();
                
                getAllRequest.onsuccess = () => {
                    const oldKeys = getAllRequest.result;
                    console.log('[KeyGenerator] Found', oldKeys.length, 'old keys to migrate');
                    
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
                            salt: Array.from(mostRecent.salt), // Ensure these are plain arrays
                            iv: Array.from(mostRecent.iv), // Ensure these are plain arrays
                            timestamp: mostRecent.timestamp || Date.now()
                        });
                        
                        console.log('[KeyGenerator] Migrated key with npub:', mostRecent.npub);
                    } else {
                        console.log('[KeyGenerator] No old keys found to migrate.');
                    }
                };
            } else if (!db.objectStoreNames.contains('keys')) {
                // Fresh install or no existing store
                db.createObjectStore('keys', { keyPath: 'id' });
                console.log('[KeyGenerator] Created fresh keys object store');
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
                    console.log('[KeyGenerator] Successfully saved encrypted key to IndexedDB');
                    console.log('[KeyGenerator] Saved npub:', npub);
                    db.close();
                    resolve();
                };
                
                putRequest.onerror = () => {
                    db.close();
                    reject(new Error('Failed to save to IndexedDB'));
                };
            };
            
            clearRequest.onerror = () => {
                db.close();
                reject(new Error('Failed to clear old keys'));
            };
        };
    });
}

export default function NostrKeyGeneratorModal({ isOpen, onClose }) {
    const [keys, setKeys] = useState(null);
    const [copiedNsec, setCopiedNsec] = useState(false);
    const [copiedNpub, setCopiedNpub] = useState(false);
    const [showNsec, setShowNsec] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Save options state
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const generateKeys = async () => {
        setIsGenerating(true);
        try {
            // Generate 32 random bytes for private key
            const privateKeyBytes = new Uint8Array(32);
            crypto.getRandomValues(privateKeyBytes);
            
            // Encode to bech32 format (nsec)
            const nsec = bech32Encode('nsec', privateKeyBytes);
            
            console.log('[KeyGenerator] Generated nsec, deriving npub from backend...');
            
            // Derive correct npub from backend using base44 function
            const response = await base44.functions.invoke('deriveNpubFromNsec', { nsec });
            
            if (!response.data || !response.data.npub) {
                throw new Error('Failed to derive public key from backend');
            }
            
            const npub = response.data.npub;
            
            console.log('[KeyGenerator] ✅ Generated new keypair');
            console.log('[KeyGenerator] npub:', npub);
            
            setKeys({ nsec, npub });
        } catch (error) {
            console.error('[KeyGenerator] Error generating keys:', error);
            alert('Error generating keys. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'nsec') {
                setCopiedNsec(true);
                setTimeout(() => setCopiedNsec(false), 2000);
            } else {
                setCopiedNpub(true);
                setTimeout(() => setCopiedNpub(false), 2000);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers or restricted environments
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                if (type === 'nsec') {
                    setCopiedNsec(true);
                    setTimeout(() => setCopiedNsec(false), 2000);
                } else {
                    setCopiedNpub(true);
                    setTimeout(() => setCopiedNpub(false), 2000);
                }
            } catch (err) {
                alert('Failed to copy. Please copy manually: ' + text);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleDownloadBackup = () => {
        if (!keys) return;

        // Create backup JSON
        const backup = {
            public_key: keys.npub,
            private_key: keys.nsec,
            created_at: new Date().toISOString(),
            note: "Local coherosphere identity backup - KEEP THIS FILE SECURE!"
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(backup, null, 2);

        // Create blob
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with date
        const date = new Date().toISOString().split('T')[0];
        a.download = `coherosphere-nostr-key-${date}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[KeyGenerator] Backup downloaded successfully');
    };

    const handleDone = () => {
        setShowSaveOptions(true);
    };

    const handleSaveLocally = async () => {
        setSaveError('');
        
        // Validation
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
            // Encrypt the nsec
            const encryptedData = await encryptNsec(keys.nsec, password);
            
            // Save to IndexedDB
            await saveToIndexedDB(keys.npub, encryptedData);
            
            setSaveSuccess(true);
            
            // Clear password fields
            setPassword('');
            setConfirmPassword('');
            
            // Dispatch event to notify NostrAuthPage
            window.dispatchEvent(new CustomEvent('localKeypairSaved'));
            
        } catch (error) {
            console.error('[KeyGenerator] Save error:', error);
            setSaveError(error.message || 'Failed to save key');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSkipSave = () => {
        handleClose();
    };

    const handleClose = () => {
        setKeys(null);
        setCopiedNsec(false);
        setCopiedNpub(false);
        setShowNsec(false);
        setShowTooltip(false);
        setShowSaveOptions(false);
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setSaveError('');
        setSaveSuccess(false);
        setIsSaving(false);
        setIsGenerating(false); // Reset generating state
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
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-white mb-2">
                                            {showSaveOptions ? 'Save Your Private Key Securely' : 'Create Your Own Identity'}
                                        </CardTitle>
                                        <p className="text-slate-300 text-sm">
                                            {showSaveOptions 
                                                ? 'Choose how to manage your private key'
                                                : 'No login, no password – just you and your key.'}
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
                            {!keys ? (
                                <>
                                    {/* Info Section */}
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-purple-200 leading-relaxed">
                                                <strong>Your private key (nsec)</strong> is your access. 
                                                Keep it safe – <strong>no one else can recover it</strong>.
                                                <div className="mt-2 text-purple-300">
                                                    ✓ Save it in a password manager<br/>
                                                    ✓ Write it down on paper<br/>
                                                    ✗ Never share it with others
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* What is this? Tooltip */}
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowTooltip(!showTooltip)}
                                            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                                        >
                                            <HelpCircle className="w-4 h-4 mr-2" />
                                            What is npub/nsec?
                                        </Button>
                                        
                                        <AnimatePresence>
                                            {showTooltip && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 mt-2"
                                                >
                                                    <div className="text-sm text-slate-300 space-y-3">
                                                        <div>
                                                            <strong className="text-purple-400">npub (Public Key):</strong>
                                                            <p className="mt-1">Your public identity. Like your email address – you can share it with others.</p>
                                                        </div>
                                                        <div>
                                                            <strong className="text-orange-400">nsec (Private Key):</strong>
                                                            <p className="mt-1">Your secret key. Like your password – <strong>never share!</strong></p>
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-700">
                                                            <p className="text-xs text-slate-400">
                                                                💡 Nostr is based on cryptographic keys instead of accounts. 
                                                                You control your identity – not a server.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Generate Button */}
                                    <Button
                                        onClick={generateKeys}
                                        disabled={isGenerating}
                                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-6 text-lg"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Generate Keypair
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : !showSaveOptions ? (
                                <>
                                    {/* Success Message */}
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-green-400 font-semibold mb-1">
                                                    Keypair successfully generated!
                                                </div>
                                                <div className="text-green-200 text-sm">
                                                    Save your private key (nsec) securely now.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Public Key (npub) */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                                Public Key (npub)
                                            </Badge>
                                            <span className="text-xs text-slate-400">← Can be shared</span>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                            <div className="flex items-start gap-3">
                                                <code className="flex-1 text-sm text-purple-300 break-all font-mono">
                                                    {keys.npub}
                                                </code>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleCopy(keys.npub, 'npub')}
                                                    className="flex-shrink-0 text-purple-400 hover:text-purple-300"
                                                >
                                                    {copiedNpub ? (
                                                        <CheckCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Private Key (nsec) */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                                                Private Key (nsec)
                                            </Badge>
                                            <span className="text-xs text-orange-400">← KEEP SECRET!</span>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4 border border-orange-500/30">
                                            <div className="flex items-start gap-3">
                                                <code className="flex-1 text-sm text-orange-300 break-all font-mono">
                                                    {showNsec ? keys.nsec : '•'.repeat(63)}
                                                </code>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setShowNsec(!showNsec)}
                                                        className="text-orange-400 hover:text-orange-300"
                                                    >
                                                        {showNsec ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleCopy(keys.nsec, 'nsec')}
                                                        className="text-orange-400 hover:text-orange-300"
                                                    >
                                                        {copiedNsec ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Warning */}
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 22h16a2 2 0 0 0 1.73-4Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                            <div className="text-sm text-red-200 leading-relaxed">
                                                <strong>Important:</strong> If you lose your private key (nsec), 
                                                it's gone forever. There's no way to recover it. 
                                                Save it securely now!
                                            </div>
                                        </div>
                                    </div>

                                    {/* Backup Download Section */}
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="text-blue-300 font-semibold mb-1">
                                                    Backup Your Keys
                                                </div>
                                                <div className="text-blue-200 text-sm leading-relaxed mb-3">
                                                    Download a backup file containing both your public and private keys. 
                                                    <strong className="text-blue-100"> Store this file in a secure location</strong> (password manager, encrypted drive, etc.).
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleDownloadBackup}
                                            variant="outline"
                                            className="w-full bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
                                        >
                                            <Key className="w-4 h-4 mr-2" />
                                            Download Backup (JSON)
                                        </Button>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <Button
                                            onClick={() => {
                                                setKeys(null);
                                                setShowNsec(false);
                                            }}
                                            variant="outline"
                                            className="flex-1 btn-secondary-coherosphere"
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate New Pair
                                        </Button>
                                        <Button
                                            onClick={handleDone}
                                            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                                        >
                                            Done - Next Step
                                        </Button>
                                    </div>
                                </>
                            ) : !saveSuccess ? (
                                <>
                                    {/* Save Options Screen */}
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-blue-200 leading-relaxed">
                                                <strong>Would you like to save your private key locally for automatic login later?</strong>
                                                <p className="mt-2">
                                                    We'll encrypt it securely with a password you choose – it never leaves your browser.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Option 1: Save Locally */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-5 h-5 text-green-400" />
                                            <h3 className="text-lg font-semibold text-white">Yes, save locally (recommended)</h3>
                                        </div>
                                        
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
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Key className="w-5 h-5 text-slate-400" />
                                            <h3 className="text-lg font-semibold text-white">No, I'll manage it myself</h3>
                                        </div>
                                        
                                        <p className="text-slate-300 text-sm">
                                            You'll need to enter your private key manually each time you want to sign in.
                                        </p>

                                        <Button
                                            onClick={handleSkipSave}
                                            variant="outline"
                                            className="w-full btn-secondary-coherosphere"
                                        >
                                            Skip Local Storage
                                        </Button>
                                    </div>
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
                                                    Your local identity has been securely saved.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <p className="text-sm text-blue-200 leading-relaxed">
                                            ✅ Your private key is encrypted with your password<br/>
                                            ✅ Stored locally in your browser (IndexedDB)<br/>
                                            ✅ Never transmitted to any server
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleClose}
                                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-6 text-lg"
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
