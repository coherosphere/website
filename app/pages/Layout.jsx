

import React, { useState, useEffect } from "react";
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
  ChartNoAxesGantt,
  Heart,
  Globe2,
  MessageSquare,
  CircleGauge,
  DatabaseZap,
  Settings2
} from "lucide-react"; // Changed from "lucide" to "lucide-react"
import { Button } from "@/components/ui/button";
import ManifestoPlayer from "@/components/audio/ManifestoPlayer";
import AuthGuard from "@/components/auth/AuthGuard";
import Footer from "@/components/Footer";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import { ChatProvider, useChatContext } from "@/components/chat/ChatContext";
import { useUser } from "@/components/auth/UserContext";
import { Badge } from "@/components/ui/badge";
import { trackPageLoad } from "@/components/utils/performanceTracking";
import { LoadingProvider, useLoading } from "@/components/loading/LoadingContext";
import { CachingPolicyProvider, useCachingPolicy } from "@/components/caching/CachingPolicyContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CoherosphereNetworkSpinner from '@/components/spinners/CoherosphereNetworkSpinner';
import ServiceWorkerManager from '@/components/ServiceWorkerManager';
import FreshnessOverlay from '@/components/caching/FreshnessOverlay';
import IdleScreensaver from '@/components/IdleScreensaver';
import { ScreensaverStatusProvider } from '@/components/screensaver/ScreensaverStatusContext';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults (can be overridden by useCachedData)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

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
    icon: MapPin,
    highlightOnPages: ["HubResonance"]
  },
  {
    title: "Global Hubs",
    url: createPageUrl("GlobalHubs"),
    icon: Globe2
  },
  {
    title: "Learning",
    url: createPageUrl("Learning"),
    icon: BookOpen,
    highlightOnPages: ["ResonanceCheck", "ResourceDetail"]
  },
  {
    title: "Engage",
    url: createPageUrl("Engage"),
    icon: Handshake,
    highlightOnPages: ["ShareKnowledge", "HostEvent", "StartCircle", "CreateProject"]
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
    title: "Timeline", // Renamed from "Calendar" to "Timeline"
    url: createPageUrl("Calendar"),
    icon: ChartNoAxesGantt, // Changed icon from CalendarIcon to ChartNoAxesGantt
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
    title: "Fund the Sphere",
    url: createPageUrl("Donate"),
    icon: Heart
  },
  { isDivider: true },
  {
    title: "My Profile",
    url: createPageUrl("Profile"),
    icon: UserCircle,
    highlightOnPages: ["UserResonance"]
  },
  { isDivider: true, adminOnly: true }, // Admin-specific divider added here
  {
    title: "Resonance Control",
    url: createPageUrl("ResonanceAdmin"),
    icon: Activity,
    adminOnly: true
  },
  {
    title: "Caching Policy",
    url: createPageUrl("CachingPolicyAdmin"),
    icon: DatabaseZap, // Using DatabaseZap icon
    adminOnly: true
  },
  {
    title: "Performance Stats",
    url: createPageUrl("PerfStats"),
    icon: CircleGauge,
    adminOnly: true
  },
  {
    title: "General Settings",
    url: createPageUrl("GeneralPlatformSettings"),
    icon: Settings2,
    adminOnly: true
  }
];


function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalUnreadMessages } = useChatContext();
  const { currentUser } = useUser();
  const { isLoading } = useLoading();
  const { policy } = useCachingPolicy();

  // Helper function to check if menu item should be highlighted
  const isItemActive = (item) => {
    if (location.pathname === item.url) return true;
    if (item.highlightOnPages) {
      return item.highlightOnPages.some(pageName =>
        location.pathname === createPageUrl(pageName)
      );
    }
    return false;
  };

  // Helper function to check if item should be shown
  const shouldShowItem = (item) => {
    // If it's adminOnly and the current user is not an admin, don't show it.
    // This applies to both links and dividers marked as adminOnly.
    if (item.adminOnly && currentUser?.role !== 'admin') {
      return false;
    }
    return true; // Otherwise, show it (including non-admin-only items and admin-only items for admins)
  };

  // Performance tracking - track page load time
  useEffect(() => {
    // Extract page name from current path. Default to 'Dashboard' if path is root.
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const pageName = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : 'Dashboard';

    // Track the page load
    trackPageLoad(pageName);
  }, [location.pathname]);

  // Scroll to top on route change - versuche alle möglichen Container
  useEffect(() => {
    console.log('[Layout] Route changed to:', location.pathname);

    // 1. Versuche window zu scrollen
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 2. Versuche document.documentElement (html) zu scrollen
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }

    // 3. Versuche document.body zu scrollen
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 4. Versuche das main-Element zu scrollen
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
      console.log('[Layout] Main element scrollTop set to 0');
    }

    // 5. Versuche alle div-Elemente mit overflow-auto zu scrollen
    const scrollableContainers = document.querySelectorAll('[class*="overflow-auto"], [class*="overflow-y-auto"]');
    scrollableContainers.forEach((container, index) => {
      // Only scroll if the container actually has scrollable content
      if (container.scrollHeight > container.clientHeight) {
        console.log(`[Layout] Found scrollable container ${index}:`, {
          tagName: container.tagName,
          className: container.className,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight
        });
        container.scrollTop = 0;
      }
    });

    console.log('[Layout] All scroll resets complete');
  }, [location.pathname]);

  // Check if Freshness Overlay should be visible
  const shouldShowFreshnessOverlay = () => {
    if (!policy?.global_settings?.freshness_overlay_enabled) {
      console.log('[FreshnessOverlay] Overlay disabled in policy');
      return false;
    }

    const visibleTo = policy.global_settings.freshness_overlay_visible_to || 'admins';
    console.log('[FreshnessOverlay] Visible to:', visibleTo);
    console.log('[FreshnessOverlay] Current user role:', currentUser?.role);

    if (visibleTo === 'all') return true;
    if (visibleTo === 'admins' && currentUser?.role === 'admin') return true;
    if (visibleTo === 'whitelist') {
      const whitelist = policy.global_settings.freshness_overlay_whitelist_users || [];
      const isWhitelisted = whitelist.includes(currentUser?.id) || whitelist.includes(currentUser?.email);
      console.log('[FreshnessOverlay] Whitelist check:', isWhitelisted);
      return isWhitelisted;
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Service Worker Manager */}
      <ServiceWorkerManager />

      {/* Idle Screensaver - globally active */}
      <IdleScreensaver />

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
                /* CRITICAL: Set dark background to prevent white flash during initial load or AuthGuard checks */
                background-color: #0f172a !important; /* Fallback for older browsers or if gradient fails */
                background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a) !important; /* Matches main layout bg */
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

              /* Custom Resonance Slider Styling - Similar to Project Funding Progress */
              .resonance-slider [data-orientation="horizontal"] {
                background: rgba(71, 85, 105, 0.5) !important; /* slate-600/50 - dunkler Hintergrund */
                height: 8px !important;
                border-radius: 9999px !important;
              }

              /* Der gefüllte Bereich (Range) */
              .resonance-slider [data-orientation="horizontal"] > span:first-child {
                background: linear-gradient(90deg, var(--color-primary), var(--color-primary-2)) !important;
                border-radius: 9999px !important;
              }

              /* Thumb/Regler */
              .resonance-slider [role="slider"] {
                width: 18px !important;
                height: 18px !important;
                background: linear-gradient(90deg, var(--color-primary), var(--color-primary-2)) !important;
                border: 2px solid rgba(255, 255, 255, 0.9) !important;
                box-shadow: 0 2px 8px rgba(255, 106, 0, 0.4) !important;
                border-radius: 9999px !important;
                cursor: grab !important;
                transition: all 0.2s ease-in-out; /* Add transition for smooth effects */
              }

              .resonance-slider [role="slider"]:hover {
                box-shadow: 0 2px 12px rgba(255, 106, 0, 0.6) !important;
                transform: scale(1.1);
              }

              .resonance-slider [role="slider"]:active {
                cursor: grabbing !important;
                transform: scale(1.05);
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

              .btn-secondary-coherosphere:focus-visible {
                outline: 2px solid var(--color-primary);
                outline-offset: 2px;
              }
            `}
      </style>

      {/* REMOVED: Global Loading Spinner - Pages handle their own loading states */}

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
              {navigationItems
                .filter(item => shouldShowItem(item))
                .map((item, index) =>
                item.isDivider ?
                  <div key={`divider-${index}`} className="h-px bg-[#3A3D42] my-2 mx-4" /> :
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isItemActive(item) ?
                      'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 resonance-glow' :
                      'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
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
                  {navigationItems
                    .filter(item => !item.desktopOnly && shouldShowItem(item))
                    .map((item, index) => {
                    return item.isDivider ?
                      <div key={`mobile-divider-${index}`} className="h-px bg-[#3A3D42] my-3 mx-4" /> :
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 ${
                          isItemActive(item) ?
                          'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400' :
                          'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
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

      {/* Freshness Overlay - conditionally rendered */}
      {shouldShowFreshnessOverlay() && <FreshnessOverlay />}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <CachingPolicyProvider>
          <ScreensaverStatusProvider>
            <AuthGuard>
              <ChatProvider>
                <LayoutContent children={children} currentPageName={currentPageName} />
              </ChatProvider>
            </AuthGuard>
          </ScreensaverStatusProvider>
        </CachingPolicyProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

