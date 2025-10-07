import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Calendar, BookOpen, ArrowRight, Users, Handshake, MessageSquare } from 'lucide-react';
import { Resource, Event, Project, LearningCircle, NostrMessage } from '@/api/entities';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';

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
];

export default function Engage() {
  const [stats, setStats] = useState({
    messages: 0,
    knowledge: 0,
    events: 0,
    projects: 0,
    circles: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [messages, resources, events, projects, circles] = await Promise.all([
          NostrMessage.list(),
          Resource.list(),
          Event.list(),
          Project.list(),
          LearningCircle.list()
        ]);

        setStats({
          messages: messages.length,
          knowledge: resources.length,
          events: events.length,
          projects: projects.length,
          circles: circles.length,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        // Keep default values of 0 on error
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <>
        {/* Fixed Overlay Spinner */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
          <div className="text-center">
              <CoherosphereNetworkSpinner 
                size={100}
                lineWidth={2}
                dotRadius={6}
                interval={1100}
                maxConcurrent={4}
              />
            <div className="text-slate-400 text-lg mt-4">Loading...</div>
          </div>
        </div>
        
        {/* Virtual placeholder */}
        <div className="min-h-[calc(100vh-200px)]" aria-hidden="true"></div>
      </>
    );
  }

  return (
    <div className="p-4 lg:p-8 text-white">
      <div className=""> 
        {/* Header */}
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

        {/* Stats Bar */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <>
                <MessageSquare className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.messages}</div>
                <div className="text-slate-400 text-sm">Messages</div>
              </>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <>
                <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.knowledge}</div>
                <div className="text-slate-400 text-sm">Knowledge</div>
              </>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <>
                <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.events}</div>
                <div className="text-slate-400 text-sm">Events</div>
              </>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <>
                <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.circles}</div>
                <div className="text-slate-400 text-sm">Circles</div>
              </>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="p-4 text-center">
              <>
                <Lightbulb className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.projects}</div>
                <div className="text-slate-400 text-sm">Projects</div>
              </>
            </CardContent>
          </Card>
        </motion.div>

        {/* Participation Cards */}
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
    </div>
  );
}