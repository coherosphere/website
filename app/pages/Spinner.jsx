import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SpinnerPage() {
  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Server className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Spinner Showcase
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Alle verwendeten Loader und Spinner im Projekt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Große motion.div Kreise (orange/gradient) - Seiten-Initial-Loading */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Motion Gradient Circle (Large)</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: Dashboard, Voting, Hub, CreateProject, Profile (initial loading)</p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </CardContent>
        </Card>

        {/* 2. RefreshCw Icon mit animate-spin */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">RefreshCw Icon</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: Dashboard (Refresh Button, Loading Status)</p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          </CardContent>
        </Card>

        {/* 3. Loader2 Icon mit animate-spin */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Loader2 Icon</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: Calendar, AuthGuard, LearningCircleCard</p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </CardContent>
        </Card>

        {/* 4. CSS Border Spinner (Large) */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">CSS Border Spinner (Large)</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: ResourceDetail (initial loading)</p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </CardContent>
        </Card>

        {/* 5. Motion CSS Border Spinner (Medium) */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Motion CSS Border (Medium)</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: Treasury, Activity (loading lists)</p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <motion.div
              className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </CardContent>
        </Card>

        {/* 6. Small CSS Border Spinner (für Buttons) */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Small CSS Border (Button)</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: Footer (Newsletter Button)</p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </CardContent>
        </Card>

        {/* 7. Skeleton Loader - Rectangle */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Skeleton Loader (Rectangle)</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: Learning (Resources, Circles), Dashboard/Projects (StatCards)</p>
          </CardHeader>
          <CardContent className="py-4">
            <div className="bg-slate-700 rounded-xl p-6 animate-pulse h-32">
              <div className="h-4 bg-slate-600 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-slate-600 rounded mb-2 w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-600 rounded w-1/2 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* 8. Skeleton Loader - StatCard */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Skeleton StatCard</CardTitle>
            <p className="text-slate-400 text-sm">Verwendet in: Dashboard, Projects (StatCard loading)</p>
          </CardHeader>
          <CardContent className="py-4">
            <div className="bg-slate-800/50 rounded-xl p-4 text-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-700 mx-auto mb-2 animate-pulse"></div>
              <div className="h-6 w-3/4 bg-slate-700 rounded mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 w-1/2 bg-slate-700 rounded mx-auto animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* 9. Button mit Loader */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Button Loading States</CardTitle>
            <p className="text-slate-400 text-sm">Verschiedene Button-Loading-Zustände</p>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <Button disabled className="w-full bg-orange-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
            <Button disabled className="w-full bg-orange-500">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </Button>
            <Button disabled className="w-full bg-orange-500">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
              Saving...
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Vergleich Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Performance & Empfehlungen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-green-400">✅ Empfohlene Spinner</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-2">
              <p><strong>Für große Initial-Loading:</strong> Motion Gradient Circle</p>
              <p><strong>Für Button-States:</strong> Loader2 Icon</p>
              <p><strong>Für Listen/Karten:</strong> Skeleton Loader</p>
              <p><strong>Für kleine Inline-Loading:</strong> CSS Border Spinner (Small)</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-yellow-400">⚠️ Zu vereinheitlichen</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-2">
              <p><strong>Problem:</strong> 8+ verschiedene Spinner-Typen</p>
              <p><strong>Lösung:</strong> Auf 3-4 Typen reduzieren</p>
              <p><strong>Konsistenz:</strong> Einheitliche Größen und Farben</p>
              <p><strong>Performance:</strong> CSS-only wo möglich</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}