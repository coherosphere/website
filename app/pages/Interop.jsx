
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plug, 
  Code, 
  Globe, 
  Copy, 
  ExternalLink,
  Activity,
  Filter,
  Database,
  Clock,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Interop() {
  const [copiedEndpoint, setCopiedEndpoint] = React.useState(null);

  const baseUrl = window.location.origin;
  const apiEndpoint = `${baseUrl}/functions/publicResonanceEvents`;
  const docsEndpoint = `${baseUrl}/functions/getPublicApiDocs`;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const codeExamples = [
    {
      language: 'JavaScript',
      code: `// Fetch latest resonance events
const response = await fetch('${apiEndpoint}?limit=10');
const data = await response.json();
console.log(data.events);`,
    },
    {
      language: 'Python',
      code: `import requests

# Fetch events with filters
params = {
    'limit': 50,
    'since': '2025-10-01T00:00:00Z',
    'hub_id': 'your_hub_id'
}
response = requests.get('${apiEndpoint}', params=params)
data = response.json()
print(data['events'])`,
    },
    {
      language: 'cURL',
      code: `curl -X GET "${apiEndpoint}?limit=10&order=desc" \\
  -H "Accept: application/json"`,
    }
  ];

  const parameters = [
    { name: 'since', type: 'ISO 8601', description: 'Events after this timestamp', example: '2025-10-01T00:00:00Z' },
    { name: 'until', type: 'ISO 8601', description: 'Events before this timestamp', example: '2025-10-31T23:59:59Z' },
    { name: 'limit', type: 'integer', description: 'Max results (1-200, default: 50)', example: '100' },
    { name: 'cursor', type: 'string', description: 'Pagination cursor from next_cursor', example: 'eyJ0aW1lc3RhbXA...' },
    { name: 'order', type: 'asc|desc', description: 'Sort order (default: desc)', example: 'desc' },
    { name: 'hub_id', type: 'string', description: 'Filter by hub ID', example: 'hub_zrh' },
    { name: 'entity_type', type: 'string', description: 'Filter by entity type', example: 'project' },
    { name: 'action_type', type: 'string', description: 'Filter by action type', example: 'PROJECT_SUPPORT' },
    { name: 'source', type: 'string', description: 'Filter by source', example: 'ui' },
    { name: 'status', type: 'string', description: 'Filter by status', example: 'approved' },
    { name: 'actor_user_id', type: 'string', description: 'Filter by user ID', example: 'user_123' }
  ];

  const features = [
    { icon: Globe, title: 'Public & Open', description: 'No authentication required. CORS-enabled for web apps.' },
    { icon: Zap, title: 'Edge-Optimized', description: 'Fast response times with global CDN distribution.' },
    { icon: Shield, title: 'Rate-Limited', description: '60 requests per minute per IP for fair usage.' },
    { icon: Database, title: 'Keyset Pagination', description: 'Efficient cursor-based pagination for large datasets.' },
    { icon: Clock, title: 'Cached Responses', description: 'ETag and cache headers for optimal performance.' },
    { icon: Activity, title: 'Real-Time Data', description: 'Access to live proof-of-contribution events.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <Plug className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Public API & Interoperability
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Access Coherosphere's proof-of-contribution data through our public, read-only API. 
          Build integrations, analyze community activity, and create transparency tools.
        </p>
      </div>

      {/* Quick Start Alert - NOW WITH SOLID ORANGE GRADIENT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Alert className="bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400">
          <Code className="h-4 w-4 text-white" />
          <AlertDescription className="text-white">
            <strong className="font-bold">Quick Start:</strong> No API key needed. Just make a GET request to start exploring resonance events.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 h-full">
                <CardContent className="p-6">
                  <feature.icon className="w-8 h-8 text-orange-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* API Endpoints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Endpoints</h2>
        
        {/* Resonance Events Endpoint */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-orange-400" />
                <div>
                  <CardTitle className="text-white">Resonance Events</CardTitle>
                  <p className="text-slate-400 text-sm mt-1">Access proof-of-contribution activity data</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">GET</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4 font-mono text-sm">
              <div className="flex items-center justify-between">
                <code className="text-orange-400">{apiEndpoint}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(apiEndpoint, 'api')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedEndpoint === 'api' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(apiEndpoint + '?limit=10', '_blank')}
                variant="outline"
                className="btn-secondary-coherosphere"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Try it Live
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OpenAPI Documentation Endpoint */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="w-6 h-6 text-orange-400" />
                <div>
                  <CardTitle className="text-white">OpenAPI Documentation</CardTitle>
                  <p className="text-slate-400 text-sm mt-1">Full API specification in OpenAPI 3.0 format</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">GET</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4 font-mono text-sm">
              <div className="flex items-center justify-between">
                <code className="text-orange-400">{docsEndpoint}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(docsEndpoint, 'docs')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedEndpoint === 'docs' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(docsEndpoint, '_blank')}
                variant="outline"
                className="btn-secondary-coherosphere"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View OpenAPI Spec
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Query Parameters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Filter className="w-6 h-6 text-orange-400" />
          Query Parameters
        </h2>
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Parameter</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, index) => (
                    <tr key={param.name} className={index !== parameters.length - 1 ? 'border-b border-slate-700/50' : ''}>
                      <td className="py-3 px-4 font-mono text-orange-400">{param.name}</td>
                      <td className="py-3 px-4 text-slate-400">{param.type}</td>
                      <td className="py-3 px-4 text-slate-300">{param.description}</td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-400">{param.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Code Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Code className="w-6 h-6 text-orange-400" />
          Code Examples
        </h2>
        <div className="grid grid-cols-1 gap-6">
          {codeExamples.map((example, index) => (
            <Card key={example.language} className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{example.language}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(example.code, example.language)}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedEndpoint === example.language ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900/50 rounded-lg p-4 overflow-x-auto">
                  <code className="text-slate-300 text-sm font-mono">{example.code}</code>
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Response Format */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Response Format</h2>
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <pre className="bg-slate-900/50 rounded-lg p-4 overflow-x-auto">
              <code className="text-slate-300 text-sm font-mono">{`{
  "data": [
    {
      "id": "evt_01HZ123456789",
      "timestamp": "2025-10-15T14:30:00Z",
      "actor_user_id": "user_123",
      "entity_type": "project",
      "entity_id": "proj_abc",
      "hub_id": "hub_zrh",
      "action_type": "PROJECT_SUPPORT",
      "magnitude": 50000,
      "alignment_score": 0.85,
      "weight_version": 1,
      "metadata": {
        "sats": 50000,
        "project_title": "Solar Hub Initiative"
      },
      "source": "ui",
      "status": "approved"
    }
  ],
  "next_cursor": "eyJ0aW1lc3RhbXA...",
  "count": 50,
  "processing_time_ms": 42
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rate Limiting & Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Rate Limiting & Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                Rate Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span><strong>60 requests per minute</strong> per IP address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>429 status code when limit exceeded</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Check <code className="text-orange-400">X-RateLimit-*</code> headers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Retry after time provided in response</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Use cursor pagination for large datasets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Respect <code className="text-orange-400">Cache-Control</code> headers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Filter by time ranges to reduce data transfer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Handle errors gracefully with proper retry logic</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
