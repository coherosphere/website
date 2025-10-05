
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { ChevronDown, Globe, Zap, Search, Handshake, Lightbulb, Network, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';

const iconMap = {
  globe: Globe,
  bolt: Zap,
  search: Search,
  handshake: Handshake,
  lightbulb: Lightbulb,
  network: Network,
  heart: Heart
};

// Map lowercase URL paths from Markdown to their correct PageName for createPageUrl
const pageNameMapping = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/hub': 'Hub',
  '/learning': 'Learning',
  '/engage': 'Engage',
  '/faq': 'FAQ',
  '/voting': 'Voting',
  '/treasury': 'Treasury',
  '/activity': 'Activity',
  '/profile': 'Profile',
  '/manifesto': 'Manifesto'
};


export default function FAQItem({ faq, isActive, onToggle, onLinkClick }) {
  const Icon = iconMap[faq.icon] || null;

  return (
    <div className="border-b border-slate-700" id={faq.slug}>
      <h3 className="text-lg font-semibold text-white">
        <button
          onClick={onToggle}
          aria-expanded={isActive}
          aria-controls={`faq-panel-${faq.id}`}
          id={`faq-button-${faq.id}`}
          className="w-full flex justify-between items-center text-left px-6 focus:outline-none focus:ring-1 focus:ring-orange-500/50 rounded-lg transition-all duration-200 hover:bg-slate-800/30"
          style={{ paddingTop: '13px', paddingBottom: '13px' }}>

          <span className="flex items-center gap-4">
            {Icon && <Icon className="w-5 h-5 text-orange-400 flex-shrink-0" />}
            {faq.question}
          </span>
          <motion.div
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.2 }}>

            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isActive &&
        <motion.div
          key="content"
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={{
            open: { opacity: 1, height: 'auto' },
            collapsed: { opacity: 0, height: 0 }
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
          id={`faq-panel-${faq.id}`}
          role="region"
          aria-labelledby={`faq-button-${faq.id}`}>

            <div className="text-slate-300 pt-2 pr-1 pb-6 pl-16 prose prose-slate max-w-none">
              <ReactMarkdown
              components={{
                a: ({ href, children }) => {
                  if (href.startsWith('/')) {
                    const pageName = pageNameMapping[href.toLowerCase()];
                    const targetUrl = pageName ? createPageUrl(pageName) : href;
                    return <Link to={targetUrl} onClick={onLinkClick} className="text-orange-400 hover:underline">{children}</Link>;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">{children}</a>;
                }
              }}>

                {faq.answer}
              </ReactMarkdown>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}