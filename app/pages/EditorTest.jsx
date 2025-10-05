import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // We'll override this
import { motion } from 'framer-motion';
import { PenSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function EditorTest() {
  const [content, setContent] = useState('');

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>
        {`
          /* --- ReactQuill Custom Styling for Coherosphere --- */

          /* Toolbar */
          .ql-toolbar.ql-snow {
            background-color: #2A2D32; /* Slightly lighter than card bg */
            border-color: rgb(71, 85, 105); /* slate-600 */
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            border-bottom: none;
            padding: 12px;
          }

          /* Toolbar Buttons & Inputs */
          .ql-toolbar .ql-formats button,
          .ql-toolbar .ql-picker-label {
            height: 36px;
            width: 36px;
            border-radius: 8px !important;
            transition: all 0.2s ease-in-out;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .ql-toolbar .ql-formats button:hover {
            background-color: #3A3D42;
          }
          
          /* Icons inside buttons */
          .ql-snow .ql-stroke {
            stroke: rgb(203, 213, 225); /* slate-300 */
            stroke-width: 1.5;
          }
          .ql-snow .ql-fill {
            fill: rgb(203, 213, 225); /* slate-300 */
          }
          
          /* Active state for buttons */
          .ql-snow.ql-toolbar button.ql-active {
            background-image: linear-gradient(90deg, var(--color-primary), var(--color-primary-2));
            box-shadow: 0 0 8px rgba(255, 106, 0, 0.3);
          }
          .ql-snow.ql-toolbar button.ql-active .ql-stroke {
            stroke: white;
          }

          /* Picker (Dropdown for Headers) */
          .ql-snow .ql-picker {
            color: rgb(203, 213, 225);
          }
          .ql-snow .ql-picker-label {
            padding-left: 8px;
            width: auto;
          }
          .ql-snow .ql-picker:not(.ql-expanded):hover .ql-picker-label {
             background-color: #3A3D42;
          }

          .ql-snow .ql-picker-options {
            background-color: #1B1F2A; /* --color-bg-dark */
            border-color: rgb(71, 85, 105);
            border-radius: 8px;
            padding: 4px;
          }
          .ql-snow .ql-picker-item:hover {
            background-color: #3A3D42;
            color: white;
          }

          /* Main Editor Container */
          .ql-container.ql-snow {
            background-color: #1B1F2A; /* --color-bg-dark */
            border-color: rgb(71, 85, 105);
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
            color: rgb(203, 213, 225); /* slate-300 */
            min-height: 250px;
            font-size: 16px;
          }

          /* Editing Area */
          .ql-editor {
            font-family: 'Nunito Sans', system-ui, sans-serif;
          }
          
          /* Placeholder Text */
          .ql-editor.ql-blank::before{
              color: rgb(100, 116, 139); /* slate-500 */
              font-style: normal;
          }
          
          /* Links in the editor */
          .ql-editor a {
            color: var(--coherosphere-turquoise);
            text-decoration: none;
          }
          .ql-editor a:hover {
            text-decoration: underline;
          }
          
          /* Headings */
          .ql-editor h1, .ql-editor h2, .ql-editor h3 {
            color: white;
            font-family: 'Poppins', system-ui, sans-serif;
            border-bottom: none;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
          }
        `}
      </style>

      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <PenSquare className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Modern Editor Showcase
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              A demonstration of a restyled ReactQuill editor, integrated into the Coherosphere design.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-8"
      >
        <div className="rounded-xl shadow-lg shadow-black/20">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            placeholder="Share your knowledge, tell a story, or write a guide..."
          />
        </div>

        {/* Output Preview */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Live HTML Output</h2>
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700">
            <CardContent className="p-6">
              <div 
                className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-a:text-turquoise-400"
                dangerouslySetInnerHTML={{ __html: content }} 
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}