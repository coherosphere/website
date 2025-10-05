
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Zap, CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileHeader({ user }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // Generate proper Nostr profile picture URL
  useEffect(() => {
    const loadNostrAvatar = async () => {
      if (user.avatar_url && user.avatar_url.startsWith('http')) {
        // If we already have a proper avatar URL, use it
        setAvatarUrl(user.avatar_url);
        return;
      }

      // Try to construct a Nostr profile picture URL
      const npub = user.nostr_pubkey || "npub1kc9weag9hjf0p0xz5naamts48rdkzymucvrd9ws8ns7n4x3qq5gsljlnck";
      
      // Use a fallback approach with better avatar generation
      const fallbackUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${npub}&backgroundColor=FF6A00,FF8C42&size=120`;
      
      setAvatarUrl(fallbackUrl);
    };

    loadNostrAvatar();
  }, [user.avatar_url, user.nostr_pubkey]);

  const handleCopyNpub = () => {
    const npub = user.nostr_pubkey || "npub1example...";
    navigator.clipboard.writeText(npub);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshAvatar = async () => {
    setIsLoadingAvatar(true);
    setTimeout(() => {
      setIsLoadingAvatar(false);
      const npub = user.nostr_pubkey || "npub1example...";
      setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${npub}&backgroundColor=FF6A00,FF8C42&size=120&t=${Date.now()}`);
    }, 1000);
  };

  const generateQRCode = (text) => {
    // A simplified SVG for QR code placeholder
    // In a real app, you'd use a library like 'qrcode.react' or a QR API
    const qrText = encodeURIComponent(text);
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="100" y="90" text-anchor="middle" font-size="16" fill="black">QR Code</text><text x="100" y="120" text-anchor="middle" font-size="10" fill="gray">${text.substring(0, 25)}${text.length > 25 ? '...' : ''}</text></svg>`;
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Nostr Profile Picture"
                className="w-24 h-24 rounded-full border-2 border-slate-600"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.nostr_pubkey || user.email || 'fallback'}&backgroundColor=FF6A00,FF8C42&size=120`;
                }}
              />
              {/* Resonance Glow */}
              <div className="absolute inset-0 rounded-full border-2 border-orange-500/50 animate-pulse" />
              
              {/* Refresh Avatar Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAvatar}
                disabled={isLoadingAvatar}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white p-0"
                title="Refresh Nostr profile picture"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingAvatar ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Nostr Badge */}
              <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Nostr
              </Badge>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left"> {/* Added text-center for mobile */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-1">
                {user.display_name || user.full_name || 'Anonymous User'}
              </h2>
              <p className="text-slate-400 leading-relaxed">
                {user.bio || 'Building resonance in the coherosphere. Creating connections between humans, technology, and values.'}
              </p>
            </div>

            {/* Npub Display */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Nostr Public Key</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyNpub}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQR(!showQR)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm text-slate-300 break-all">
                {user.nostr_pubkey || "npub1kc9weag9hjf0p0xz5naamts48rdkzymucvrd9ws8ns7n4x3qq5gsljlnck"}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm justify-center md:justify-start"> {/* Added justify-center for mobile */}
              <div className="text-center">
                <div className="text-xl font-bold text-white">{user.resonance_score || 42}</div>
                <div className="text-slate-400">Resonance</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{user.role === 'admin' ? 'Admin' : 'Member'}</div>
                <div className="text-slate-400">Role</div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <div
              className="bg-white p-6 rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={generateQRCode(user.nostr_pubkey || "npub1example...")}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-center text-sm text-gray-600 mt-4">
                Scan to connect on Nostr
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
