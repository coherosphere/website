import React, { useState } from "react";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Key, 
  QrCode, 
  Copy, 
  User as UserIcon,
  Heart,
  Lightbulb,
  MapPin,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [nostrProfile, setNostrProfile] = useState({
    pubkey: "",
    display_name: "",
    bio: "",
    avatar_url: ""
  });
  const [resonanceFields, setResonanceFields] = useState({
    values: [],
    skills: [],
    location: ""
  });
  const [newValue, setNewValue] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const mockNostrLogin = async () => {
    setIsConnecting(true);
    // Simulate Nostr connection
    setTimeout(() => {
      setNostrProfile({
        pubkey: "npub1coherosphere123...",
        display_name: "Resonance Explorer",
        bio: "Building coherent communities through technology and human connection",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      });
      setIsConnecting(false);
      setStep(2);
    }, 2000);
  };

  const addValue = () => {
    if (newValue.trim()) {
      setResonanceFields(prev => ({
        ...prev,
        values: [...prev.values, newValue.trim()]
      }));
      setNewValue("");
    }
  };

  const removeValue = (index) => {
    setResonanceFields(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResonanceFields(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index) => {
    setResonanceFields(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const completeOnboarding = async () => {
    try {
      await User.create({
        nostr_pubkey: nostrProfile.pubkey,
        display_name: nostrProfile.display_name,
        bio: nostrProfile.bio,
        avatar_url: nostrProfile.avatar_url,
        values: resonanceFields.values,
        skills: resonanceFields.skills,
        location: resonanceFields.location,
        resonance_score: 0
      });
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <motion.div
            className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Globe className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome to <span className="text-orange-500">coherosphere</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Your resonance space where humans, technology, and values unite
          </p>
        </div>

        {step === 1 && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-3">
                <Key className="w-6 h-6 text-orange-500" />
                Connect with Nostr
              </CardTitle>
              <p className="text-slate-400">
                Use your Nostr identity to join the coherosphere network
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={mockNostrLogin}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 h-auto"
              >
                {isConnecting ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    ⚡ Login with Nostr
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-slate-500 mb-4">or</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="border-slate-600 text-slate-300">
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-slate-300">
                    <Copy className="w-4 h-4 mr-2" />
                    Paste Nostr Keys
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-3">
                <UserIcon className="w-6 h-6 text-orange-500" />
                Your Nostr Profile
              </CardTitle>
              <p className="text-slate-400">
                Verify your profile and add resonance fields
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                <img
                  src={nostrProfile.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-2 border-orange-500"
                />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{nostrProfile.display_name}</h3>
                  <p className="text-slate-400 text-sm mb-2">{nostrProfile.bio}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {nostrProfile.pubkey}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Resonance Fields */}
              <div className="space-y-6">
                {/* Values */}
                <div>
                  <label className="text-white font-medium mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Core Values
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Add a value..."
                      className="bg-slate-700/50 border-slate-600 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && addValue()}
                    />
                    <Button onClick={addValue} size="sm" variant="outline" className="border-slate-600">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resonanceFields.values.map((value, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-orange-500/20 text-orange-400 cursor-pointer"
                        onClick={() => removeValue(index)}
                      >
                        {value} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="text-white font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Skills & Expertise
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      className="bg-slate-700/50 border-slate-600 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button onClick={addSkill} size="sm" variant="outline" className="border-slate-600">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resonanceFields.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-green-500/20 text-green-400 cursor-pointer"
                        onClick={() => removeSkill(index)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-white font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Location
                  </label>
                  <Input
                    value={resonanceFields.location}
                    onChange={(e) => setResonanceFields(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Your city or region..."
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={completeOnboarding}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 h-auto"
              >
                Enter coherosphere
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}