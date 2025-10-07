
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Palette, 
  Globe, 
  Zap, 
  Users, 
  Shield, 
  Lightbulb,
  Heart,
  Network,
  Eye,
  MessageSquare,
  Target,
  Compass
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Brand() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <Palette className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Coherosphere Brand
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          The complete visual identity and brand concept of coherosphere – where humans, technology, and values come together in harmony.
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Brand Essence Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    coher<span className="text-orange-500">o</span>sphere
                  </h2>
                  <p className="text-slate-300 text-lg">resonance space</p>
                </div>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-white mb-4">Brand Essence</h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  coherosphere is the new sphere where humans, technology, and values resonate. 
                  It embodies coherence, meaning, and collective agency – a space where fragmentation turns into connection.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="filter-chip active justify-center pointer-events-none text-base py-3">
                    Order from diversity
                  </div>
                  <div className="filter-chip active justify-center pointer-events-none text-base py-3">
                    Resilience as strength
                  </div>
                  <div className="filter-chip active justify-center pointer-events-none text-base py-3">
                    Future from community
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* The Term Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">The Term</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <Network className="w-6 h-6 text-orange-400" />
                  Coherence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  <strong className="text-orange-400">Derived from Latin</strong> cohaerere = 'to be connected'
                </p>
                <div className="space-y-2">
                  <p className="text-slate-300"><strong>Physics:</strong> when waves resonate in phase</p>
                  <p className="text-slate-300"><strong>Language:</strong> logical and clear</p>
                  <p className="text-slate-300"><strong>Psychology:</strong> sense of orientation and meaning</p>
                </div>
                <p className="text-orange-300 font-medium">
                  For coherosphere: technology, values, communities, and individuals resonate together.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <Globe className="w-6 h-6 text-orange-400" />
                  Sphere
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  <strong className="text-orange-400">Derived from Greek</strong> sphaira = 'sphere, celestial body'
                </p>
                <div className="space-y-2">
                  <p className="text-slate-300"><strong>Science:</strong> atmosphere, biosphere, noosphere</p>
                  <p className="text-slate-300"><strong>Philosophy:</strong> dimension of existence</p>
                </div>
                <p className="text-orange-300 font-medium">
                  For coherosphere: a global resonance space where meaning, values, and technology cohere.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-block bg-slate-800/60 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Why coherosphere?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="text-slate-300">
                  <strong className="text-orange-400">Internationally recognizable</strong><br />
                  coherence is understandable in almost all languages
                </div>
                <div className="text-slate-300">
                  <strong className="text-orange-400">Easy to pronounce</strong><br />
                  ko-HER-o-sphere works in English and German
                </div>
                <div className="text-slate-300">
                  <strong className="text-orange-400">Strong in meaning</strong><br />
                  conveys sense, cohesion, resonance, integration
                </div>
                <div className="text-slate-300">
                  <strong className="text-orange-400">Brandable</strong><br />
                  modern, serious, visionary – suited for a DAO
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Mission & Vision */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <Target className="w-6 h-6 text-orange-400" />
                  Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">
                  Our mission – as stated in the{' '}
                  <Link to={createPageUrl('Manifesto')} className="text-orange-400 hover:underline">
                    coherosphere manifesto
                  </Link>
                  {' '}– is to build an <strong className="text-orange-400">infrastructure of coherence</strong>:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300">Technology that serves humanity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300">Communities that grow decentralized and participatory</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300">Values of freedom, transparency, and resilience as the foundation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <Eye className="w-6 h-6 text-orange-400" />
                  Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">
                  In line with the{' '}
                  <Link to={createPageUrl('Manifesto')} className="text-orange-400 hover:underline">
                    coherosphere manifesto
                  </Link>
                  , our vision is a <strong className="text-orange-400">global network of local resonance spaces</strong>.
                </p>
                <p className="text-slate-300 mb-4">
                  Here we create <strong>meaning beyond work</strong> and <strong>resilience with purpose</strong>.
                </p>
                <p className="text-orange-300 font-medium">
                  We envision a future where humans, AI, and the planet resonate in harmony, 
                  shaping a new social contract for the 21st century.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Brand Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Brand Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Decentralized", desc: "no central authority, wisdom of the many", icon: Network },
              { title: "Intelligent", desc: "AI and automation serve humanity", icon: Lightbulb },
              { title: "Resilient", desc: "antifragile systems that grow stronger through challenges", icon: Shield },
              { title: "Collective", desc: "participation, synergy, belonging", icon: Users },
              { title: "Trustless", desc: "transparency replaces blind trust", icon: Eye },
              { title: "Solid", desc: "strong assets and shared values as foundation", icon: Target },
              { title: "Progressive", desc: "innovative, adaptive, forward-looking", icon: Zap },
              { title: "Inviting", desc: "inclusive, empowering, open", icon: Heart }
            ].map((value, index) => (
              <Card key={index} className="bg-slate-800/40 backdrop-blur-sm border-slate-700 hover:border-orange-500/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <value.icon className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-slate-400 text-sm">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Brand Personality */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Brand Personality</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Trustworthy", desc: "transparent, stable" },
              { title: "Inspiring", desc: "visionary, encouraging" },
              { title: "Human", desc: "empathetic, inclusive, value-oriented" },
              { title: "Innovative", desc: "curious, bold, technologically leading" }
            ].map((trait, index) => (
              <Card key={index} className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-orange-400 mb-2">{trait.title}</h3>
                  <p className="text-slate-400">{trait.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Visual Identity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Visual Identity</h2>
          
          {/* Colors */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-full h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg mb-4"></div>
                  <h4 className="font-bold text-white mb-2">Orange</h4>
                  <p className="text-slate-400 text-sm mb-2">#FF6600 / variations</p>
                  <p className="text-slate-300 text-sm">Dominant color for buttons, highlights, and active elements. Represents energy and community.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-full h-16 bg-[#1C2C44] rounded-lg mb-4"></div>
                  <h4 className="font-bold text-white mb-2">Deep Blue</h4>
                  <p className="text-slate-400 text-sm mb-2">#1C2C44</p>
                  <p className="text-slate-300 text-sm">For backgrounds and headers, evoking stability and trust.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-full h-16 bg-gradient-to-r from-[#2E2E2E] to-[#3A3A3A] rounded-lg mb-4"></div>
                  <h4 className="font-bold text-white mb-2">Dark Gray</h4>
                  <p className="text-slate-400 text-sm mb-2">#2E2E2E – #3A3A3A</p>
                  <p className="text-slate-300 text-sm">For text and neutral backgrounds, supporting clarity.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-full h-16 bg-gradient-to-r from-white to-[#F5F5F5] rounded-lg mb-4"></div>
                  <h4 className="font-bold text-white mb-2">Light</h4>
                  <p className="text-slate-400 text-sm mb-2">White & #F5F5F5</p>
                  <p className="text-slate-300 text-sm">For contrast and readability.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Typography */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Typography</h3>
            <Card className="bg-slate-800/40 border-slate-700">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h4 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                    Nunito Sans
                  </h4>
                  <p className="text-slate-400">Primary font family</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-lg font-semibold text-white mb-4">Features</h5>
                    <ul className="space-y-2">
                      <li className="text-slate-300">• Clean, modern sans-serif optimized for digital readability</li>
                      <li className="text-slate-300">• Wide range of weights (200–1000) for flexible hierarchy</li>
                      <li className="text-slate-300">• Bold/semi-bold for headers, regular/light for body text</li>
                      <li className="text-slate-300">• Professional clarity with human, approachable tone</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="text-lg font-semibold text-white mb-4">Weight Examples</h5>
                    <div className="space-y-3" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
                      <p className="text-slate-300 font-extralight">Extra Light (200) - Supporting text</p>
                      <p className="text-slate-300 font-normal">Regular (400) - Body text</p>
                      <p className="text-slate-300 font-semibold">Semi Bold (600) - Navigation</p>
                      <p className="text-white font-bold">Bold (700) - Headlines</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* UI Elements */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">UI & Design Elements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-6">
                  <Network className="w-8 h-8 text-orange-400 mb-3" />
                  <h4 className="font-bold text-white mb-2">Network Metaphor</h4>
                  <p className="text-slate-300 text-sm">Resonance Board and Hubs show nodes, connections, and circles—visually reinforcing coherence.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg mb-3"></div>
                  <h4 className="font-bold text-white mb-2">Cards & Modules</h4>
                  <p className="text-slate-300 text-sm">Proposals, projects, and treasury elements in modular cards for clarity and scalability.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-8 h-8 border-2 border-slate-400 rounded-full mb-3"></div>
                  <h4 className="font-bold text-white mb-2">Icons & Symbols</h4>
                  <p className="text-slate-300 text-sm">Minimal, line-based, often circular or geometric, referencing openness and transparency.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>

        {/* Brand Claims */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Brand Claims</h2>
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold text-white">coherosphere</p>
                <div className="space-y-3">
                  <p className="text-lg text-slate-300">– The Sphere of Shared Meaning and Resilience</p>
                  <p className="text-lg text-slate-300">– Where humanity, technology and values resonate</p>
                  <p className="text-lg text-slate-300">– Resonance. Resilience. Future.</p>
                  <p className="text-lg text-slate-300">– The sphere of shared meaning</p>
                </div>
                <p className="text-xl font-semibold text-orange-400 pt-4">
                  Where humans, technology, and values come together in harmony
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Overall Impression */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-center"
        >
          <Card className="bg-slate-800/60 border-slate-600">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Overall Impression</h2>
              <p className="text-lg text-slate-200 leading-relaxed max-w-4xl mx-auto">
                The coherosphere identity is <strong className="text-orange-400">warm yet technological</strong> – 
                balancing orange vibrancy with blue solidity. It feels like a DAO platform and a resonance network, 
                signaling transparency, resilience, and collective action. Every visual element reinforces the idea of 
                <strong className="text-orange-400"> coherence from diversity</strong> and <strong className="text-orange-400">shared resonance</strong>.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer */}
        <motion.div
          className="text-center text-slate-500 border-t border-slate-700 pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <p className="text-sm">coherosphere collective · 2025</p>
        </motion.div>
      </div>
    </div>
  );
}
