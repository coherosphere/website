import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Calendar, BookOpen, ArrowRight, Users, Handshake, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { checkApiStatus } from '@/api/functions';
import { useLoading } from '@/components/loading/LoadingContext';
import { useCachedData } from '@/components/caching/useCachedData';

const participationOptions = [
  {
    title: 'Send Message',
    description: 'Connect directly with community members through private, encrypted Nostr messages.',
    link: createPageUrl('Messages'),
    icon: MessageSquare,
    color: 'hover:border-cyan-500/50',
  },
  {
    title: 'Share Knowledge',
    description: 'Contribute an article, guide, or tutorial to our collective Library of Resilience.',
    link: createPageUrl('ShareKnowledge'),
    icon: BookOpen,
    color: 'hover:border-green-500/50',
  },
  {
    title: 'Host an Event',
    description: 'Organize a gathering, workshop, or online meetup to connect your local hub or the global community.',
    link: createPageUrl('HostEvent'),
    icon: Calendar,
    color: 'hover:border-blue-500/50',
  },
  {
    title: 'Start a Learning Circle',
    description: 'Create or join a group to explore topics together and foster shared understanding.',
    link: createPageUrl('StartCircle'),
    icon: Users,
    color: 'hover:border-purple-500/50',
  },
  {
    title: 'Start a Project',
    description: 'Propose a new initiative and gather community support and funding to make it a reality.',
    link: createPageUrl('CreateProject'),
    icon: Lightbulb,
    color: 'hover:border-orange-500/50',
  },
  {
    title: 'Fund the Sphere',
    description: 'Support the coherosphere with Bitcoin donations – every sat strengthens our collective resilience.',
    link: createPageUrl('Donate'),
    icon: Heart,
    color: 'hover:border-pink-500/50',
  },
];

export default function Engage() {
  const { setLoading } = useLoading();
  const [totalDonations, setTotalDonations] = useState(0);

  // Load all entities with useCachedData
  const { data: messages = [], isLoading: messagesLoading } = useCachedData(
    ['engage', 'messages'],
    async () => {
      const { NostrMessage } = await import('@/api/entities');
      return NostrMessage.list();
    },
    'engage'
  );

  const { data: resources = [], isLoading: resourcesLoading } = useCachedData(
    ['engage', 'resources'],
    async () => {
      const { Resource } = await import('@/api/entities');
      return Resource.list();
    },
    'engage'
  );

  const { data: events = [], isLoading: eventsLoading } = useCachedData(
    ['engage', 'events'],
    async () => {
      const { Event } = await import('@/api/entities');
      return Event.list();
    },
    'engage'
  );

  const { data: projects = [], isLoading: projectsLoading } = useCachedData(
    ['engage', 'projects'],
    async () => {
      const { Project } = await import('@/api/entities');
      return Project.list();
    },
    'engage'
  );

  const { data: circles = [], isLoading: circlesLoading } = useCachedData(
    ['engage', 'circles'],
    async () => {
      const { LearningCircle } = await import('@/api/entities');
      return LearningCircle.list();
    },
    'engage'
  );

  // Load donation data separately (uses checkApiStatus function)
  const { data: apiData, isLoading: apiLoading } = useCachedData(
    ['engage', 'donations'],
    checkApiStatus,
    'engage'
  );

  // Calculate total donations when API data changes
  useEffect(() => {
    if (!apiData?.data) return;

    const BITCOIN_ADDRESS = "bc1q7davwh4083qrw8dsnazavamul4ngam99zt7nfy";
    let totalReceived = 0;

    const bitcoinTxs = apiData.data.bitcoinTransactions || [];
    bitcoinTxs.forEach(tx => {
      let received = 0;
      let sent = 0;

      tx.vout?.forEach((output) => {
        if (output.scriptpubkey_address === BITCOIN_ADDRESS) {
          received += output.value;
        }
      });

      tx.vin?.forEach((input) => {
        if (input.prevout?.scriptpubkey_address === BITCOIN_ADDRESS) {
          sent += input.prevout.value;
        }
      });

      const netAmount = received - sent;
      if (netAmount > 0) {
        totalReceived += netAmount;
      }
    });

    const lightningTxs = apiData.data.lightningTransactions || [];
    lightningTxs.forEach(tx => {
      if (tx.type === 'incoming') {
        totalReceived += tx.amount;
      }
    });

    setTotalDonations(totalReceived);
  }, [apiData]);

  // Sync loading state with global loading context
  const isLoading = messagesLoading || resourcesLoading || eventsLoading || projectsLoading || circlesLoading || apiLoading;
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Compute stats from loaded data
  const stats = {
    messages: messages.length,
    knowledge: resources.length,
    events: events.length,
    projects: projects.length,
    circles: circles.length,
    totalDonations: totalDonations,
  };

  return (
    <div className="p-4 lg:p-8 text-white">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center gap-4 mb-3">
          <Handshake className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Engage & Contribute
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          coherosphere thrives on community action. Here's how you can get involved and shape our collective future.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.messages}</div>
            <div className="text-slate-400 text-sm">Messages</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.knowledge}</div>
            <div className="text-slate-400 text-sm">Knowledge</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.events}</div>
            <div className="text-slate-400 text-sm">Events</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.circles}</div>
            <div className="text-slate-400 text-sm">Circles</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.projects}</div>
            <div className="text-slate-400 text-sm">Projects</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalDonations.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">Received (sats)</div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {participationOptions.map((option, index) => (
          <motion.div
            key={option.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
          >
            <Link to={option.link} className="block h-full group">
              <Card className={`h-full bg-slate-800/50 backdrop-blur-sm border-slate-700 transition-all duration-300 ${option.color} hover:bg-slate-800/80 hover:shadow-2xl hover:-translate-y-2`}>
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex-shrink-0 mb-6">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center">
                      <option.icon className="w-8 h-8 text-orange-400" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-white mb-3">{option.title}</h2>
                    <p className="text-slate-400 leading-relaxed">{option.description}</p>
                  </div>
                  <div className="mt-8">
                    <div className="flex items-center gap-2 text-orange-400 font-semibold">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}