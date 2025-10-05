
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { UploadPrivateFile } from '@/api/integrations';
import { iconMap } from '@/components/learning/iconMap';
import StyledSelect from '@/components/learning/StyledSelect';

const categories = ["Community Building", "Holistic Health", "Decentralized Tech", "Nature & Sustainability"];
const iconNames = Object.keys(iconMap);

export default function ResourceFormBasics({ resourceData, onUpdate }) {
  const [isUploading, setIsUploading] = useState(false);

  const updateField = (field, value) => {
    onUpdate({ [field]: value });
  };

  // ReactQuill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_uri } = await UploadPrivateFile({ file });
      updateField('attachments', [...resourceData.attachments, { name: file.name, uri: file_uri }]);
    } catch (error) {
      console.error("File upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = () => {
    updateField('related_links', [...resourceData.related_links, { title: '', url: '' }]);
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...resourceData.related_links];
    newLinks[index][field] = value;
    updateField('related_links', newLinks);
  };
  
  const removeLink = (index) => {
    const newLinks = resourceData.related_links.filter((_, i) => i !== index);
    updateField('related_links', newLinks);
  };

  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
  const iconOptions = iconNames.map(name => ({ value: name, label: name }));

  return (
    <div className="space-y-6">
      {/* Custom CSS for ReactQuill */}
      <style>
        {`
          /* --- ReactQuill Custom Styling for Coherosphere --- */

          /* Toolbar */
          .ql-toolbar.ql-snow {
            background-color: #2A2D32;
            border-color: rgb(71, 85, 105);
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            border-bottom: none;
            padding: 16px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center; /* Center all toolbar elements */
            gap: 8px;
            position: relative;
            z-index: 10;
          }

          /* Toolbar Buttons & Inputs - Unified Height */
          .ql-toolbar .ql-formats {
            margin: 0 !important;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .ql-toolbar .ql-formats button,
          .ql-toolbar .ql-picker {
            height: 40px !important;
            min-width: 40px;
            border-radius: 8px !important;
            transition: all 0.2s ease-in-out;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: 1px solid transparent;
            background: transparent;
            margin: 0 !important;
            position: relative;
          }

          /* Correct orange hover effect */
          .ql-toolbar .ql-formats button:not(.ql-active):hover,
          .ql-toolbar .ql-picker:not(.ql-expanded):hover {
            background-color: rgba(255, 106, 0, 0.15) !important;
            border-color: rgba(255, 106, 0, 0.5) !important;
          }
          
          /* Icons inside buttons */
          .ql-snow .ql-stroke {
            stroke: rgb(203, 213, 225);
            stroke-width: 1.8;
          }
          .ql-snow .ql-fill {
            fill: rgb(203, 213, 225);
          }
          
          /* Active state for buttons AND PICKERS */
          .ql-snow.ql-toolbar button.ql-active,
          .ql-snow .ql-picker-label.ql-active,
          .ql-snow .ql-picker-item.ql-selected {
            background-image: linear-gradient(90deg, var(--color-primary), var(--color-primary-2)) !important;
            border-color: var(--color-primary) !important;
            box-shadow: 0 0 8px rgba(255, 106, 0, 0.3) !important;
            color: white !important;
          }
          
          .ql-snow.ql-toolbar button.ql-active .ql-stroke,
          .ql-snow .ql-picker-label.ql-active .ql-stroke,
          .ql-snow .ql-picker-item.ql-selected .ql-stroke {
            stroke: white !important;
            stroke-width: 2 !important;
          }
          
          .ql-snow.ql-toolbar button.ql-active .ql-fill,
          .ql-snow .ql-picker-label.ql-active .ql-fill,
          .ql-snow .ql-picker-item.ql-selected .ql-fill {
            fill: white !important;
          }

          /* Picker (Dropdown for Headers) - Special Styling */
          .ql-snow .ql-picker {
            color: rgb(203, 213, 225) !important;
            font-size: 16px; /* Increased from 15px */
            font-weight: 600; /* Increased from 500 */
            min-width: 120px !important; /* Increased width to prevent wrapping */
            padding: 0 12px !important;
          }
          .ql-snow .ql-picker-label {
            padding: 0 !important;
            border: none !important;
            color: inherit !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            height: 100% !important;
            white-space: nowrap; /* Prevent text from wrapping */
          }
          .ql-snow .ql-picker-label::before {
            color: rgb(203, 213, 225) !important;
            line-height: 1 !important;
            font-size: 16px !important; /* Increased font size for selected text */
            font-weight: 600 !important; /* Bold selected text */
          }
          .ql-snow .ql-picker:not(.ql-expanded):hover .ql-picker-label {
             background-color: transparent !important;
          }

          /* Dropdown arrow */
          .ql-snow .ql-picker-label svg {
            width: 14px !important;
            height: 14px !important;
          }
          .ql-snow .ql-picker-label svg .ql-stroke {
            stroke: rgb(203, 213, 225);
            stroke-width: 2;
          }

          /* CRITICAL FIX: Dropdown Options - Project Standard Design */
          .ql-snow .ql-picker-options {
            background-color: #1e293b !important; /* slate-800 */
            border: 1px solid rgb(71, 85, 105) !important; /* border-slate-600 */
            border-radius: 12px !important;
            padding: 8px !important;
            margin-top: 4px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            z-index: 9999 !important; /* High z-index to appear above other elements */
            position: absolute !important;
            min-width: 140px !important;
          }

          .ql-snow .ql-picker-item {
            padding: 8px 12px !important;
            color: rgb(203, 213, 225) !important; /* text-slate-300 */
            border-radius: 8px !important;
            margin: 2px 0 !important;
            transition: all 0.15s ease-in-out !important;
            cursor: pointer !important;
          }

          .ql-snow .ql-picker-item:hover {
            background-color: #334155 !important; /* slate-700 */
            color: white !important;
            transform: translateX(2px) !important;
          }
          
          /* This is now handled by the general .ql-selected rule above */
          /* .ql-snow .ql-picker-item.ql-selected {
            background-image: linear-gradient(90deg, var(--color-primary), var(--color-primary-2)) !important;
            color: white !important;
            font-weight: 600 !important;
          } */

          /* Ensure dropdown container has proper z-index context */
          .ql-snow .ql-picker.ql-expanded {
            z-index: 9999 !important;
          }

          /* Mobile Responsiveness */
          @media (max-width: 768px) {
            .ql-toolbar.ql-snow {
              padding: 12px;
              gap: 6px;
              justify-content: center; /* Keep centering on mobile */
            }
            
            .ql-toolbar .ql-formats {
              gap: 3px;
            }
            
            .ql-toolbar .ql-formats button,
            .ql-toolbar .ql-picker {
              height: 38px !important;
              min-width: 38px;
            }
            
            .ql-snow .ql-picker {
              min-width: 90px !important; /* Adjusted for mobile */
              font-size: 15px; /* Slightly smaller on mobile */
            }

            .ql-snow .ql-picker-label::before {
              font-size: 15px !important;
            }

            .ql-snow .ql-picker-options {
              min-width: 120px !important;
            }
          }

          /* Main Editor Container */
          .ql-container.ql-snow {
            background-color: #1B1F2A;
            border-color: rgb(71, 85, 105);
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
            color: rgb(203, 213, 225);
            min-height: 250px;
            font-size: 16px;
            position: relative;
            z-index: 1;
          }

          /* Editing Area */
          .ql-editor {
            font-family: 'Nunito Sans', system-ui, sans-serif;
            padding: 20px;
          }
          
          /* Placeholder Text */
          .ql-editor.ql-blank::before{
              color: rgb(100, 116, 139);
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

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
        <div className="relative">
          <Input
            placeholder="What knowledge are you sharing?"
            value={resourceData.title}
            onChange={(e) => updateField('title', e.target.value.slice(0, 80))}
            className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 pr-16"
            maxLength={80}
          />
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
            resourceData.title.length > 60 ? 'text-orange-400' : 'text-slate-400'
          }`}>
            {resourceData.title.length}/80
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
        <Textarea
          placeholder="Describe what this resource teaches or provides..."
          value={resourceData.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 h-32"
          rows={4}
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${
            resourceData.description.length < 30 ? 'text-orange-400' : 'text-slate-500'
          }`}>
            {resourceData.description.length < 30 ? 'Recommended: At least 30 characters for better engagement' : ''}
          </span>
          <span className="text-xs text-slate-400">
            {resourceData.description.length} characters
          </span>
        </div>
      </div>

      {/* Primary Link */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Primary Link (Optional)</label>
        <Input 
          placeholder="https://example.com"
          value={resourceData.link || ''} 
          onChange={(e) => updateField('link', e.target.value)} 
          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500" 
        />
        <p className="text-xs text-slate-400 mt-1">
          Link to the original source or main resource
        </p>
      </div>

      {/* Category and Icon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
          <StyledSelect
            value={resourceData.category}
            onValueChange={(val) => updateField('category', val)}
            placeholder="Select a category"
            options={categoryOptions}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Icon *</label>
          <StyledSelect
            value={resourceData.icon_name}
            onValueChange={(val) => updateField('icon_name', val)}
            placeholder="Select an icon"
            options={iconOptions}
            iconMap={iconMap}
          />
        </div>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Full Content</label>
        <div className="rounded-xl overflow-hidden">
          <ReactQuill 
            theme="snow" 
            value={resourceData.content} 
            onChange={(val) => updateField('content', val)}
            placeholder="Write your detailed content here..."
            modules={modules}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Use the rich text editor to format your content with headings, lists, and links
        </p>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Attachments</label>
        <div className="space-y-2">
          {resourceData.attachments.map((att, i) => (
            <div key={i} className="text-sm text-slate-300 p-2 bg-slate-700/50 rounded flex items-center justify-between">
              <span>{att.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newAttachments = resourceData.attachments.filter((_, index) => index !== i);
                  updateField('attachments', newAttachments);
                }}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <label className="btn-secondary-coherosphere w-full flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
          </label>
        </div>
      </div>

      {/* Related Links */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Related Links</label>
        <div className="space-y-3">
          {resourceData.related_links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input 
                placeholder="Link Title" 
                value={link.title} 
                onChange={(e) => updateLink(i, 'title', e.target.value)} 
                className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500" 
              />
              <Input 
                placeholder="URL" 
                value={link.url} 
                onChange={(e) => updateLink(i, 'url', e.target.value)} 
                className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500" 
              />
              <Button variant="ghost" size="icon" onClick={() => removeLink(i)} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddLink} className="btn-secondary-coherosphere">
            Add Link
          </Button>
        </div>
      </div>
    </div>
  );
}
