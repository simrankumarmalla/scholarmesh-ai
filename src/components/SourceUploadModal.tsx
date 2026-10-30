import React, { useState, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  FileUp, 
  Loader2, 
  AlertCircle, 
  FlaskConical,
  Check
} from 'lucide-react';

interface SourceUploadModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSource: any) => void;
}

export const SourceUploadModal: React.FC<SourceUploadModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [sourceType, setSourceType] = useState('peer_reviewed_paper');
  const [rawContent, setRawContent] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExts = ['.pdf', '.txt', '.md'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Please select a valid .pdf, .txt, or .md research document.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let res;
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setError('Please select or drag a research document (.pdf, .txt, or .md) to upload.');
          setIsLoading(false);
          return;
        }

        setLoadingStep('Uploading document & extracting raw text buffer...');
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('title', title || selectedFile.name);
        formData.append('authors', authors || 'Unknown Authors');
        formData.append('publication_year', String(publicationYear));
        formData.append('source_type', sourceType);

        setLoadingStep('Invoking Google Gemini to extract claims & methodology score...');
        res = await axiosClient.post(`/workspaces/${workspaceId}/sources`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        if (!title.trim()) {
          setError('Please provide a source paper title.');
          setIsLoading(false);
          return;
        }
        if (!rawContent.trim() || rawContent.trim().length < 40) {
          setError('Please paste at least 40 characters of the study abstract or literature content.');
          setIsLoading(false);
          return;
        }

        setLoadingStep('Analyzing pasted study text with Google Gemini...');
        res = await axiosClient.post(`/workspaces/${workspaceId}/sources`, {
          title,
          authors: authors || 'Unknown Authors',
          publication_year: publicationYear,
          source_type: sourceType,
          raw_content: rawContent
        });
      }

      if (res.data && res.data.source) {
        onSuccess(res.data.source);
        handleClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to ingest and analyze document.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleLoadSample = async () => {
    setError(null);
    setIsLoading(true);
    setLoadingStep('Ingesting curated scientific peer-reviewed study...');

    try {
      const res = await axiosClient.post(`/workspaces/${workspaceId}/sources/sample`);
      if (res.data && res.data.source) {
        onSuccess(res.data.source);
        handleClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load sample study.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setAuthors('');
    setRawContent('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ingest Research Source</h2>
              <p className="text-xs text-slate-400">Upload scientific papers, notes, or abstracts to index into this corpus</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection & Sample Loader Bar */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between gap-4 border-b border-slate-800/50">
          <div className="flex items-center gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Document Upload (PDF/TXT/MD)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('paste'); setError(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'paste'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Abstract / Text</span>
            </button>
          </div>

          {/* Quick Load Sample Study Button */}
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-500/30 rounded-lg transition-all cursor-pointer"
            title="Instant 1-Click Load Realistic Paper"
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Load Sample Paper</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            /* Drag and Drop Box */
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : selectedFile
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction
                    </p>
                    <span className="text-[11px] text-indigo-400 underline mt-1">Click or drag another file to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      Drag and drop your research file here, or <span className="text-indigo-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports PDF (.pdf), Plain Text (.txt), and Markdown (.md) up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Paste Raw Content Box */
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Study Abstract, Research Notes, or Manuscript Text <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Paste the abstract, methodology section, experimental results, or lab notes..."
                rows={6}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Document / Paper Title {activeTab === 'paste' && <span className="text-rose-400">*</span>}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. High-Efficiency Ionizable LNP Formulations"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Authors / Institution
              </label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g. Chen, Kowalski, et al."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Publication Year
              </label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={publicationYear}
                onChange={(e) => setPublicationYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="peer_reviewed_paper">Peer-Reviewed Paper</option>
                <option value="technical_report">Technical Report / Whitepaper</option>
                <option value="raw_field_notes">Researcher Lab Notes / Data</option>
                <option value="web_article_abstract">Web Article / Abstract</option>
              </select>
            </div>
          </div>

          {/* AI Progress Notification */}
          {isLoading && (
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-semibold text-indigo-200">AI Extraction in Progress</p>
                <p className="text-[11px] text-indigo-300/80">{loadingStep || 'Analyzing scientific document...'}</p>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Indexing Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ingest & Extract Claims</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SourceUploadModal;
