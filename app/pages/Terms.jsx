import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <FileText className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Terms & Conditions
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          The terms of service and conditions for using coherosphere.
        </p>
      </div>

      {/* Terms Content */}
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-orange-500/10 border-orange-500/30 backdrop-blur-sm mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    Legal Framework
                  </h2>
                  <p className="text-slate-400">coherosphere terms of service</p>
                </div>
              </div>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-4">
                Terms & Conditions Coming Soon
              </Badge>
              <p className="text-slate-300 leading-relaxed max-w-2xl mx-auto">
                The comprehensive terms of service, user agreements, and legal conditions 
                will be documented here. This will include user rights, responsibilities, 
                service availability, and legal compliance information.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Terms of Service</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  User agreements, service availability, acceptable use policies, 
                  and platform usage guidelines.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-6 h-6 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Legal Compliance</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  Jurisdiction, governing law, dispute resolution, and regulatory 
                  compliance information.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">User Rights</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  User responsibilities, content ownership, intellectual property 
                  rights, and service limitations.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className="mt-16 text-center text-slate-500 border-t border-slate-700 pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Legal documentation in progress</p>
          <p className="text-sm mt-2">coherosphere collective · 2025</p>
        </motion.div>
      </div>
    </div>
  );
}