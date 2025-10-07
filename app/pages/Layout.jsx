

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Globe,
  Lightbulb,
  Vote,
  MapPin,
  BookOpen,
  Wallet,
  Activity,
  Menu,
  X,
  UserCircle,
  Handshake,
  HelpCircle,
  Calendar as CalendarIcon,
  Heart,
  Globe2,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ManifestoPlayer from "@/components/audio/ManifestoPlayer";
import AuthGuard from "@/components/auth/AuthGuard";
import Footer from "@/components/Footer";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import { ChatProvider, useChatContext } from "@/components/chat/ChatContext"; // Added useChatContext
import { useUser } from "@/components/auth/UserContext";
import { Badge } from "@/components/ui/badge"; // Added Badge import

const navigationItems = [
{
  title: "Resonance Board",
  url: createPageUrl("Dashboard"),
  icon: Globe
},
{
  title: "Projects",
  url: createPageUrl("Projects"),
  icon: Lightbulb
},
{
  title: "Local Hub",
  url: createPageUrl("Hub"),
  icon: MapPin
},
{
  title: "Global Hubs",
  url: createPageUrl("GlobalHubs"),
  icon: Globe2
},
{
  title: "Learning",
  url: createPageUrl("Learning"),
  icon: BookOpen
},
{
  title: "Engage",
  url: createPageUrl("Engage"),
  icon: Handshake
},
{
  title: "Messages",
  url: createPageUrl("Messages"),
  icon: MessageSquare
},
{ isDivider: true },
{
  title: "FAQ",
  url: createPageUrl("FAQ"),
  icon: HelpCircle
},
{
  title: "Timeline",
  url: createPageUrl("Calendar"),
  icon: CalendarIcon,
  desktopOnly: true
},
{
  title: "Governance",
  url: createPageUrl("Voting"),
  icon: Vote
},
{
  title: "Treasury",
  url: createPageUrl("Treasury"),
  icon: Wallet
},
{
  title: "Activity",
  url: createPageUrl("Activity"),
  icon: Activity
},
{
  title: "Donate",
  url: createPageUrl("Donate"),
  icon: Heart
},
{ isDivider: true },
{
  title: "My Profile",
  url: createPageUrl("Profile"),
  icon: UserCircle
}];


function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalUnreadMessages } = useChatContext(); // Destructure totalUnreadMessages

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Custom CSS for coherosphere styling */}
      <style>
        {`
              @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');
              
              :root {
                --color-primary: #FF6A00;
                --color-primary-2: #FF8C42;
                --color-bg-dark: #1B1F2A;
                --color-bg-light: #FFFFFF;
                --color-text-dark: #111111;
                --color-text-light: #FFFFFF;
                --elevation-hover: 0 4px 16px rgba(0,0,0,0.15);
                /* Existing variables, kept for compatibility if still used elsewhere or for reference */
                --coherosphere-orange: #FF6A00; 
                --coherosphere-orange-light: #FF8C42;
                --coherosphere-blue: #1B1F2A;
                --coherosphere-blue-light: #2E3440;
                --coherosphere-gray: #F4F5F7;
                --coherosphere-green: #4CAF50;
                --coherosphere-turquoise: #3DDAD7;
              }
              
              /* Set Nunito Sans as default font for entire app */
              body, * {
                font-family: 'Nunito Sans', system-ui, sans-serif !important;
              }

              /* Prevent global horizontal scroll */
              html, body {
                overflow-x: hidden;
              }
            
              .resonance-glow {
                box-shadow: 0 0 20px rgba(255, 106, 0, 0.3);
                animation: pulse 2s infinite;
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
              
              .connection-line {
                background: linear-gradient(90deg, transparent, var(--coherosphere-turquoise), transparent);
                animation: flow 3s ease-in-out infinite;
              }
              
              @keyframes flow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
              }

              /* Global Filter Chip Styles */
              .filter-chip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 9999px; /* rounded-full */
                font-size: 14px;
                font-weight: 500;
                padding: 6px 16px; /* py-1.5 px-4 */
                border: 1px solid transparent;
                transition: all 0.2s ease-in-out;
                cursor: pointer;
                
                /* Default State (Dark Mode) */
                background-color: rgba(255, 255, 255, 0.06);
                color: var(--color-text-light);
                border-color: rgba(255, 106, 0, 0.24);
              }

              .filter-chip:hover {
                background-color: var(--color-bg-light);
                color: var(--color-text-dark);
                border-color: rgba(0, 0, 0, 0.12);
                box-shadow: var(--elevation-hover);
                transform: translateY(-2px);
              }

              .filter-chip.active {
                background-image: linear-gradient(90deg, var(--color-primary), var(--color-primary-2));
                color: #0B0B0B; /* Dark text for high contrast on orange */
                border-color: transparent;
                font-weight: 600;
              }

              .filter-chip.active:hover {
                box-shadow: var(--elevation-hover);
                transform: translateY(-2px);
                /* Keep active styles on hover */
                background-image: linear-gradient(90deg, var(--color-primary), var(--color-primary-2));
                color: #0B0B0B;
              }

              .filter-chip:disabled {
                background-color: #E5E7EB;
                color: #9CA3AF;
                border-color: transparent;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
              }
              
              .filter-chip:disabled:hover {
                background-color: #E5E7EB;
                color: #9CA3AF;
                border-color: transparent;
                transform: none;
                box-shadow: none;
              }

              .filter-chip:focus-visible {
                outline: 2px solid var(--color-primary);
                outline-offset: 2px;
              }

              /* --- Unified Input Element Styles --- */
              /* Base input style - exact same height for all elements */
              .input-base {
                height: 40px; /* Fixed height for consistency */
                padding: 0 16px; /* px-4 */
                border-radius: 9999px; /* rounded-full */
                border: 1px solid rgb(71, 85, 105); /* border-slate-600 */
                background-color: #1B1F2A; /* Same as --color-bg-dark */
                color: rgb(203, 213, 225); /* text-slate-300 */
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease-in-out;
                display: inline-flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
              }

              .input-base:hover {
                color: white;
                border-color: rgba(255, 106, 0, 0.5); /* border-orange-500/50 */
                box-shadow: 0 4px 16px rgba(255, 106, 0, 0.2);
              }

              /* Switcher container */
              .switcher-container {
                height: 40px; /* Same as input-base */
                display: inline-flex;
                gap: 1px;
                background-color: #1B1F2A;
                border: 1px solid rgb(71, 85, 105);
                border-radius: 9999px;
                padding: 1px; /* Small padding inside */
              }

              /* Switcher buttons */
              .switcher-button {
                height: 36px; /* Slightly smaller to fit in container */
                padding: 0 16px;
                border-radius: 9999px;
                border: none;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease-in-out;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px; /* gap-1.5 */
                background: transparent;
                color: rgb(148, 163, 184); /* text-slate-400 */
              }

              .switcher-button:hover:not(.active) {
                color: rgb(203, 213, 225); /* text-slate-300 */
              }

              .switcher-button.active {
                background-image: linear-gradient(90deg, var(--color-primary), var(--color-primary-2));
                color: white;
                box-shadow: 0 4px 16px rgba(255, 106, 0, 0.3);
              }

              /* --- Custom Secondary Button Styles --- */
              .btn-secondary-coherosphere {
                background-color: #2A2D32;
                color: #FFFFFF;
                border-color: transparent;
                border-radius: 8px; /* Assuming shadcn default is slightly different */
                padding: 8px 16px;
                transition: all 150ms ease-in-out;
                box-shadow: 0 0 0 0 rgba(255, 106, 0, 0); /* Initial shadow */
              }

              .btn-secondary-coherosphere:hover {
                background-color: #000000;
                color: #FFFFFF;
                /* Subtle orange glow on border */
                box-shadow: 0 0 0 1px rgba(255, 106, 0, 0.4), 0 0 8px rgba(255, 106, 0, 0.2);
              }

              .btn-secondary-coherosphere:active {
                background-image: linear-gradient(90deg, #FF6A00, #FF8C42);
                color: #FFFFFF;
                transform: scale(0.98);
              }

              .btn-secondary-coherosphere:disabled {
                background-color: #3A3D42;
                color: #9CA3AF;
                cursor: not-allowed;
                box-shadow: none;
                transform: none;
              }
              
              .btn-secondary-coherosphere:disabled:hover {
                background-color: #3A3D42;
                color: #9CA3AF;
                box-shadow: none;
              }
            `}
      </style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center resonance-glow flex-shrink-0 ml-0.5">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-white font-bold text-xl">
              coher<span className="text-orange-500">o</span>sphere
            </h1>
            <p className="text-slate-400 text-xs">resonance space</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-10 w-10 text-orange-500 hover:text-orange-400">


          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </Button>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 min-h-screen">
          <div className="p-8 border-b border-slate-700">
            <Link to={createPageUrl("Dashboard")} className="block mb-2 hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3 -ml-2.5">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center resonance-glow flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="-ml-1.5">
                  <h1 className="text-white font-bold text-2xl">
                    coher<span className="text-orange-500">o</span>sphere
                  </h1>
                  <p className="text-slate-400 text-sm">resonance space</p>
                </div>
              </div>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed">
              Where humans, technology, and values come together in harmony
            </p>
          </div>
          
          <div className="p-2 border-b border-slate-700">
            <ManifestoPlayer />
          </div>
          
          <nav className="p-4">
            <div className="space-y-1">
              {navigationItems.map((item, index) =>
              item.isDivider ?
              <div key={`divider-${index}`} className="h-px bg-[#3A3D42] my-2 mx-4" /> :

              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === item.url ?
                'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 resonance-glow' :
                'text-slate-300 hover:text-white hover:bg-slate-800/50'}`
                }>

                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                    {item.title === "Messages" && totalUnreadMessages > 0 && (
                      <Badge className="ml-auto bg-orange-500 text-white">
                        {totalUnreadMessages}
                      </Badge>
                    )}
                  </Link>

              )}
            </div>
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen &&
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm">
            <div className="h-full flex flex-col">
              {/* Header with Close Button */}
              <div className="flex justify-end p-4">
                <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-orange-500 hover:text-orange-400">

                  <X className="w-7 h-7" />
                </Button>
              </div>
              
              {/* Manifesto Player */}
              <div className="px-2 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <ManifestoPlayer />
                </div>
              </div>

              {/* Scrollable Navigation */}
              <div className="flex-1 overflow-y-auto">
                <nav className="px-4 py-6 pb-20 space-y-2">
                  {navigationItems.map((item, index) => {
                  if (item.desktopOnly) return null;

                  return item.isDivider ?
                  <div key={`mobile-divider-${index}`} className="h-px bg-[#3A3D42] my-3 mx-4" /> :

                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 ${
                    location.pathname === item.url ?
                    'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400' :
                    'text-slate-300 hover:text-white hover:bg-slate-800/50'}`
                    }>

                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium text-lg">{item.title}</span>
                            {item.title === "Messages" && totalUnreadMessages > 0 && (
                              <Badge className="ml-auto bg-orange-500 text-white">
                                {totalUnreadMessages}
                              </Badge>
                            )}
                          </Link>;
                })}
                </nav>
              </div>
            </div>
          </div>
        }

        {/* Wrapper for Main Content and Footer - MIT CONTAINMENT */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Main Content - MIT CONTAINMENT */}
          <main className="flex-1 min-w-0 overflow-auto lg:pt-0 pt-20">
            {children}
          </main>
          
          {/* Footer is now inside the content column */}
          <Footer />
        </div>
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <AuthGuard>
      <ChatProvider>
        <LayoutContent children={children} currentPageName={currentPageName} />
      </ChatProvider>
    </AuthGuard>
  );
}

