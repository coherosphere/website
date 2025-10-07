
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Knowledge } from '@/api/entities';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations'; // Added ExtractDataFromUploadedFile
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookPlus, Send, CheckCircle, UploadCloud, File, X, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const initialKnowledgeState = {
  title: '',
  content: '',
  category: '',
  tags: [],
  source_type: 'manual_entry',
  attachment_url: '',
  attachment_name: '',
  status: 'draft',
};

export default function AddKnowledge() {
  const [knowledgeData, setKnowledgeData] = useState(initialKnowledgeState);
  const [tagsInput, setTagsInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false); // New state for PDF extraction

  const navigate = useNavigate();

  const handleTagsChange = (e) => {
    setTagsInput(e.target.value);
    const newTags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setKnowledgeData(prev => ({ ...prev, tags: newTags }));
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadProgress(0); // Reset progress for new file

    setKnowledgeData(prev => ({
      ...prev,
      source_type: selectedFile.type === 'application/pdf' ? 'pdf_upload' : 'document_import',
      attachment_name: selectedFile.name,
      attachment_url: '', // Clear attachment_url, it will be set on final submit
    }));

    if (selectedFile.type === 'application/pdf') {
      setIsExtractingPDF(true);
      try {
        // Upload file temporarily for extraction only
        const { file_url: tempFileUrlForExtraction } = await UploadFile({ file: selectedFile });

        if (!tempFileUrlForExtraction) {
          throw new Error("Temporary file upload for PDF extraction failed.");
        }

        const extractResult = await ExtractDataFromUploadedFile({
          file_url: tempFileUrlForExtraction,
          json_schema: {
            type: "object",
            properties: {
              text_content: { type: "string", description: "All text content extracted from the PDF document" },
              title_suggestion: { type: "string", description: "Suggested title based on document content" }
            }
          }
        });

        if (extractResult.status === 'success' && extractResult.output) {
          const extractedText = extractResult.output.text_content || '';
          const suggestedTitle = extractResult.output.title_suggestion || selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
          
          setKnowledgeData(prev => ({
            ...prev,
            content: extractedText,
            title: prev.title || suggestedTitle, // Only set title if it's empty
          }));
          console.log(`Successfully extracted ${extractedText.length} characters from PDF.`);
        } else {
          console.warn('PDF text extraction failed, content will remain manual.');
        }
      } catch (error) {
        console.error('Error during PDF processing:', error);
        // User can still manually enter content
      } finally {
        setIsExtractingPDF(false);
      }
    }
  };
  
  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setKnowledgeData(prev => ({ 
      ...prev, 
      attachment_url: '', 
      attachment_name: '',
      source_type: 'manual_entry'
    }));
  };
  
  const resetForm = () => {
    setKnowledgeData(initialKnowledgeState);
    setTagsInput('');
    setFile(null);
    setUploadProgress(0);
    setIsSubmitted(false);
    setIsExtractingPDF(false); // Reset extraction state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setUploadProgress(0); // Reset for the final upload

    let finalData = { ...knowledgeData };

    try {
      if (file) {
        setUploadProgress(50); // Simulate upload start for final file persistence
        const { file_url } = await UploadFile({ file });
        if (file_url) {
          finalData.attachment_url = file_url;
          finalData.attachment_name = file.name;
          setUploadProgress(100);
        } else {
          throw new Error("File upload failed.");
        }
      }

      await Knowledge.create(finalData);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to add knowledge:", error);
      // You could add an error state and display a message to the user
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSubmitted) {
    return (
     <div className="p-4 lg:p-8 flex items-center justify-center">
       <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
         <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-center">
           <CardContent className="p-10">
             <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-white mb-2">Knowledge Added</h2>
             <p className="text-slate-300 mb-6">Your contribution has been added to the knowledge store.</p>
             <div className="flex gap-4">
               <Button variant="outline" onClick={resetForm} className="w-full btn-secondary-coherosphere">Add Another</Button>
               <Link to={createPageUrl('Learning')} className="flex-1">
                 <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600">Back to Library</Button>
               </Link>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   );
 }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <BookPlus className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Add to KnowledgeStore
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 max-w-3xl ml-16" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Contribute to the collective intelligence by adding articles, documents, and other resources.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto"> {/* Changed max-w-3xl to max-w-4xl as per outline */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit}> {/* Re-added form tag for proper submit handling */}
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <Label htmlFor="title" className="text-white mb-2 block">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter knowledge article title..."
                    value={knowledgeData.title}
                    onChange={(e) => setKnowledgeData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
                    required
                  />
                </div>

                {/* Category Field */}
                <div>
                  <Label className="text-white mb-2 block">Category *</Label>
                  <Select 
                    value={knowledgeData.category} 
                    onValueChange={(value) => setKnowledgeData(prev => ({ ...prev, category: value }))}
                    required
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {['Manifesto', 'FAQ', 'Technology', 'Community', 'Governance', 'Onboarding'].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-white mb-2 block">Upload Document (Optional)</Label>
                  <div className="space-y-3">
                    {!file ? (
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-orange-500/50 transition-colors">
                        <div className="text-center">
                          <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-orange-400 hover:text-orange-300 font-medium">
                              Click to upload
                            </span>
                            <span className="text-slate-400"> or drag and drop</span>
                          </label>
                          <p className="text-slate-500 text-sm mt-2">PDF, DOC, DOCX up to 10MB</p>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{file.name}</p>
                              <p className="text-slate-400 text-sm">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                {file.type === 'application/pdf' && (
                                  <span className="text-orange-400 ml-2">
                                    {isExtractingPDF ? 'Extracting text...' : 'Text extracted ✓'}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={removeFile}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            disabled={isExtractingPDF}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {isExtractingPDF && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Extracting text content from PDF...
                            </div>
                            {/* Progress for extraction is not tracked here, only for final upload */}
                            {/* <Progress value={uploadProgress} className="mt-2" /> */}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    {file?.type === 'application/pdf' 
                      ? 'PDF text will be automatically extracted and added to the content below.' 
                      : 'Upload a document (e.g., DOC, DOCX) to attach it. For PDFs, text will be extracted.'}
                  </p>
                </div>

                {/* Content Field - Using ReactQuill */}
                <div>
                  <Label className="text-white mb-2 block">
                    Content {file?.type === 'application/pdf' ? '(Auto-extracted from PDF)' : ''}
                  </Label>
                  <div className="bg-slate-900/50 rounded-lg border border-slate-600">
                    <ReactQuill
                      theme="snow"
                      value={knowledgeData.content}
                      onChange={(value) => setKnowledgeData(prev => ({ ...prev, content: value }))}
                      placeholder="Enter the knowledge content..."
                      className="quill-editor-dark text-white" // Added quill-editor-dark back
                      style={{ minHeight: '200px' }}
                    />
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    You can edit the extracted content or add additional information here.
                  </p>
                </div>

                {/* Tags Field */}
                <div>
                  <Label htmlFor="tags" className="text-white mb-2 block">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Enter tags separated by commas (e.g. blockchain, governance, community)"
                    value={tagsInput}
                    onChange={handleTagsChange}
                    className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500"
                  />
                  {knowledgeData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {knowledgeData.tags.map((tag, index) => (
                        <span key={index} className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Field */}
                <div>
                  <Label className="text-white mb-2 block">Status</Label>
                  <Select 
                    value={knowledgeData.status} 
                    onValueChange={(value) => setKnowledgeData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-slate-400 text-sm mt-1">
                    Only published articles will be available to the chatbot.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="btn-secondary-coherosphere"
                    disabled={isProcessing || isExtractingPDF}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit" // Changed to type="submit" because it's inside a form
                    disabled={isProcessing || isExtractingPDF || !knowledgeData.title || !knowledgeData.category}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Save Knowledge Article
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Custom styles for ReactQuill in dark mode */}
      <style jsx global>{`
        .quill-editor-dark .ql-toolbar {
          border-color: #475569; /* slate-600 */
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .quill-editor-dark .ql-container {
          border-color: #475569; /* slate-600 */
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          color: #f8fafc; /* slate-50 */
          font-family: 'Inter', system-ui, sans-serif;
        }
        .quill-editor-dark .ql-editor {
          min-height: 200px;
        }
        .quill-editor-dark .ql-snow .ql-stroke {
          stroke: #94a3b8; /* slate-400 */
        }
        .quill-editor-dark .ql-snow .ql-picker-label {
          color: #94a3b8; /* slate-400 */
        }
        .quill-editor-dark .ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill {
           fill: #94a3b8; /* slate-400 */
        }
        .quill-editor-dark .ql-editor.ql-blank::before {
          color: #64748b; /* slate-500 */
        }
      `}</style>
    </div>
  );
}
