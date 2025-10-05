import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StyledSelect from '@/components/learning/StyledSelect';
import ProjectCard from '@/components/projects/ProjectCard';
import StatCard from '@/components/StatCard';
import {
  Lightbulb,
  Globe,
  MapPin,
  ChevronDown,
  Users,
  Wallet,
  BookOpen,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Helper Components ---

// Structures the showcase with a title and content
const ShowcaseSection = ({ title, children }) => (
  <div className="mb-12">
    <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-slate-700 pb-2">{title}</h2>
    <div className="space-y-8">
      {children}
    </div>
  </div>
);

// Displays a single UI example
const ShowcaseExample = ({ title, children }) => (
  <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

// Mock Data for Components
const mockProject = {
  id: 'proj_mock_1',
  title: 'Community Garden Initiative',
  description: 'A project to build and maintain a community garden, promoting local food production and social cohesion in our neighborhood.',
  category: 'community',
  status: 'active',
  funding_raised: 75000,
  funding_needed: 100000,
  supporters: Array(34),
  resonance_level: 8.2,
  created_date: new Date().toISOString(),
};

// --- Main Showcase Component ---

export default function StyleShowcase() {
  const [selectValue, setSelectValue] = useState('tech');

  return (
    <div className="space-y-12 p-2">
      {/* --- Typography Section --- */}
      <ShowcaseSection title="Typography">
        <ShowcaseExample title="Headings & Text Hierarchy">
          <h1 className="text-4xl font-bold text-white mb-4">Primary Heading (H1)</h1>
          <h2 className="text-3xl font-bold text-white mb-3">Section Heading (H2)</h2>
          <h3 className="text-2xl font-bold text-white mb-3">Subsection Heading (H3)</h3>
          <h4 className="text-xl font-semibold text-white mb-4">Component Title (H4)</h4>
          <p className="text-slate-300 mb-4 leading-relaxed">
            This is the standard paragraph style used throughout the application. It provides optimal readability with a slightly muted color to create clear visual hierarchy and improve content scanability.
          </p>
          <div className="space-y-2">
            <a href="#" className="text-orange-400 hover:text-orange-300 hover:underline transition-colors block">Standard Link</a>
            <span className="text-slate-400 text-sm block">Secondary Text (Small)</span>
            <span className="text-slate-500 text-xs block">Tertiary Text (Extra Small)</span>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Color Palette Text">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-white">Primary Text (White)</div>
              <div className="text-slate-300">Secondary Text (Slate-300)</div>
              <div className="text-slate-400">Tertiary Text (Slate-400)</div>
              <div className="text-slate-500">Quaternary Text (Slate-500)</div>
            </div>
            <div className="space-y-2">
              <div className="text-orange-400">Primary Accent (Orange-400)</div>
              <div className="text-orange-500">Secondary Accent (Orange-500)</div>
              <div className="text-green-400">Success Text (Green-400)</div>
              <div className="text-red-400">Error Text (Red-400)</div>
            </div>
          </div>
        </ShowcaseExample>
      </ShowcaseSection>

      {/* --- Buttons Section --- */}
      <ShowcaseSection title="Buttons & Interactive Elements">
        <ShowcaseExample title="Primary & Secondary Buttons">
          <div className="flex flex-wrap gap-4">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              Primary Action
            </Button>
            <Button variant="outline" className="btn-secondary-coherosphere">
              Secondary Action
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50">
              Ghost Button
            </Button>
            <Button variant="outline" className="btn-secondary-coherosphere" disabled>
              Disabled Button
            </Button>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Filter Chips & Switchers">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button className="filter-chip">Default State</button>
              <button className="filter-chip active">Active State</button>
              <button className="filter-chip" disabled>Disabled State</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">View Switcher:</span>
              <div className="switcher-container w-fit">
                <button className="switcher-button active">
                  <Globe className="w-4 h-4" />
                  Global
                </button>
                <button className="switcher-button">
                  <MapPin className="w-4 h-4" />
                  Local
                </button>
              </div>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Button Sizes & Variants">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600">Small</Button>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600">Default</Button>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600">Large</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="btn-secondary-coherosphere">Small</Button>
              <Button variant="outline" className="btn-secondary-coherosphere">Default</Button>
              <Button variant="outline" size="lg" className="btn-secondary-coherosphere">Large</Button>
            </div>
          </div>
        </ShowcaseExample>
      </ShowcaseSection>

      {/* --- Form Elements Section --- */}
      <ShowcaseSection title="Form Elements">
        <ShowcaseExample title="Text Inputs & Areas">
          <div className="space-y-4">
            <Input placeholder="Enter your username..." className="bg-slate-900/50 border-slate-600" />
            <Input placeholder="Disabled input" disabled className="bg-slate-900/50 border-slate-600" />
            <Textarea placeholder="Describe your project in detail..." className="bg-slate-900/50 border-slate-600 h-24" />
            <Textarea placeholder="Disabled textarea" disabled className="bg-slate-900/50 border-slate-600 h-20" />
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Select Dropdowns">
          <div className="space-y-4">
            <StyledSelect
              value={selectValue}
              onValueChange={setSelectValue}
              placeholder="Choose a category"
              options={[
                { value: 'tech', label: 'Technology & Innovation' },
                { value: 'community', label: 'Community Building' },
                { value: 'learning', label: 'Learning & Education' },
                { value: 'governance', label: 'Governance & Policy' },
              ]}
              iconMap={{
                  tech: Lightbulb,
                  community: Users,
                  learning: BookOpen,
                  governance: Globe,
              }}
            />
            <div className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 text-orange-500 bg-slate-800 border-slate-600 rounded focus:ring-orange-500" />
              <label className="text-slate-300 text-sm">I agree to the terms and conditions</label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="radio" name="demo" className="w-4 h-4 text-orange-500 bg-slate-800 border-slate-600 focus:ring-orange-500" />
                <label className="text-slate-300 text-sm">Option A</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" name="demo" className="w-4 h-4 text-orange-500 bg-slate-800 border-slate-600 focus:ring-orange-500" />
                <label className="text-slate-300 text-sm">Option B</label>
              </div>
            </div>
          </div>
        </ShowcaseExample>
      </ShowcaseSection>
      
      {/* --- Cards & Data Display --- */}
      <ShowcaseSection title="Cards & Data Display">
        <ShowcaseExample title="Stat Cards">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard icon={Users} value="1,234" label="Active Members" color="text-orange-500" isLoading={false} />
              <StatCard icon={Wallet} value="4.5M" label="Sats Raised" color="text-purple-500" isLoading={false} />
              <StatCard icon={Lightbulb} value="42" label="Active Projects" color="text-green-500" isLoading={false} />
              <StatCard icon={Globe} value="8" label="Global Hubs" color="text-blue-500" isLoading={false} />
            </div>
        </ShowcaseExample>

        <ShowcaseExample title="Loading States">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard icon={Users} value="—" label="Loading..." color="text-orange-500" isLoading={true} />
              <StatCard icon={Wallet} value="—" label="Loading..." color="text-purple-500" isLoading={true} />
            </div>
        </ShowcaseExample>

        <ShowcaseExample title="Project Card">
            <ProjectCard 
              project={mockProject} 
              index={0} 
              onCardClick={() => console.log('Card clicked')}
              onSupport={() => console.log('Support clicked')}
              onVote={() => console.log('Vote clicked')}
            />
        </ShowcaseExample>

        <ShowcaseExample title="Basic Card Layouts">
          <div className="grid gap-4">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Card with Header</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">This is a standard card with header and content sections. Perfect for displaying structured information.</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardContent className="p-6">
                <p className="text-slate-300">This is a simple card with only content. Great for minimal information display.</p>
              </CardContent>
            </Card>
          </div>
        </ShowcaseExample>
      </ShowcaseSection>

      {/* --- Status & Feedback --- */}
      <ShowcaseSection title="Status Indicators & Feedback">
        <ShowcaseExample title="Badges & Status Labels">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                Active
              </Badge>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                In Progress
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Pending
              </Badge>
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                Cancelled
              </Badge>
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                Featured
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                Technology
              </Badge>
              <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                Community
              </Badge>
              <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                Learning
              </Badge>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Progress Indicators">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Project Funding</span>
                <span className="text-slate-400">75%</span>
              </div>
              <Progress value={75} className="h-2 bg-slate-700" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Community Engagement</span>
                <span className="text-slate-400">42%</span>
              </div>
              <Progress value={42} className="h-3 bg-slate-700" />
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Alert Messages">
          <div className="space-y-4">
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                This is an informational message to keep users updated.
              </AlertDescription>
            </Alert>
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Success! Your action has been completed successfully.
              </AlertDescription>
            </Alert>
            <Alert className="bg-orange-500/10 border-orange-500/30">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-400">
                Warning: Please review your input before proceeding.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                Error: Something went wrong. Please try again.
              </AlertDescription>
            </Alert>
          </div>
        </ShowcaseExample>
      </ShowcaseSection>

      {/* --- Layout & Spacing --- */}
      <ShowcaseSection title="Layout & Spacing">
        <ShowcaseExample title="Grid Layouts">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({length: 6}, (_, i) => (
                <div key={i} className="bg-slate-700/30 rounded-lg p-4 text-center text-slate-300">
                  Grid Item {i + 1}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({length: 4}, (_, i) => (
                <div key={i} className="bg-slate-700/30 rounded-lg p-3 text-center text-slate-300 text-sm">
                  Column {i + 1}
                </div>
              ))}
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Flexbox Layouts">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300">Space Between</span>
              <Button size="sm" variant="outline" className="btn-secondary-coherosphere">Action</Button>
            </div>
            <div className="flex justify-center items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300">Centered</span>
              <span className="text-slate-300">Content</span>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-700/30 rounded-lg">
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">Tag 1</span>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">Tag 2</span>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">Tag 3</span>
            </div>
          </div>
        </ShowcaseExample>
      </ShowcaseSection>
    </div>
  );
}