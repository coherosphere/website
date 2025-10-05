
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, FileText, Zap, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EventFormBasics({ formData, onChange, onNext, organizer }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyNpub = () => {
    if (organizer?.nostr_pubkey) {
      navigator.clipboard.writeText(organizer.nostr_pubkey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const titleLength = formData.title.length;
  const descriptionLength = formData.description.length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Event Title *
        </label>
        <div className="relative">
          <Input
            placeholder="What's happening?"
            value={formData.title}
            onChange={(e) => onChange({ title: e.target.value.slice(0, 80) })}
            className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 pr-16"
            maxLength={80}
          />
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
            titleLength > 60 ? 'text-orange-400' : 'text-slate-400'
          }`}>
            {titleLength}/80
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description *
        </label>
        <Textarea
          placeholder="Describe your event in detail..."
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 h-32"
          rows={6}
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${
            descriptionLength < 30 ? 'text-orange-400' : 'text-slate-500'
          }`}>
            {descriptionLength < 30 ? 'Recommended: At least 30 characters for better engagement' : ''}
          </span>
          <span className="text-xs text-slate-400">
            {descriptionLength} characters
          </span>
        </div>
      </div>

      {/* Organizer (Read-only) */}
      <Card className="bg-slate-900/30 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
            Event Organizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organizer ? (
            <div className="flex items-start gap-4">
              <img
                src={organizer.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${organizer.email}&backgroundColor=FF6A00,FF8C42&size=60`}
                alt="Organizer Avatar"
                className="w-12 h-12 rounded-full border-2 border-slate-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-white">
                    {organizer.display_name || organizer.full_name}
                  </h4>
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Organizer
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mb-2">
                  {organizer.bio || 'Building resonance in the coherosphere.'}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded font-mono">
                    {organizer.nostr_pubkey?.substring(0, 20) || 'npub1example...'}...
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyNpub}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">Loading organizer...</div>
          )}
        </CardContent>
      </Card>

      {/* Next Button */}
      {organizer && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={onNext}
            disabled={!formData.title || !formData.description}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
          >
            Next: Time & Place
          </Button>
        </div>
      )}
    </div>
  );
}
