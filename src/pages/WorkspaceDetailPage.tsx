import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import SourceCard, { SourceItem } from '../components/SourceCard';
import SourceUploadModal from '../components/SourceUploadModal';
import ClaimsTable, { JoinedClaim } from '../components/ClaimsTable';
import SynthesisStudio from '../components/SynthesisStudio';
import CopilotChat from '../components/CopilotChat';
import { 
  Layers, 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Bot, 
  Loader2, 
  Plus, 
  FlaskConical, 
  HelpCircle, 
  Lightbulb, 
  Trash2,
  Share2
} from 'lucide-react';

export const WorkspaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<any>(null);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [claims, setClaims] = useState<JoinedClaim[]>([]);
  const [synthesisReports, setSynthesisReports] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'corpus' | 'claims' | 'synthesis' | 'copilot'>('corpus');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get(`/workspaces/${id}`);
      if (res.data && res.data.workspace) {
        setWorkspace(res.data.workspace);
        setSources(res.data.workspace.sources || []);
        setSynthesisReports(res.data.workspace.synthesis_reports || []);
      }

      // Fetch claims matrix
      const claimsRes = await axiosClient.get(`/workspaces/${id}/claims`);
      if (claimsRes.data && claimsRes.data.claims) {
        setClaims(claimsRes.data.claims);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Workspace not found or unauthorized.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkspaceData();
    }
  }, [id]);

  const handleSourceAdded = (newSource: any) => {
    setSources(prev => [newSource, ...prev]);
    // Refresh claims
    axiosClient.get(`/workspaces/${id}/claims`).then(res => {
      if (res.data && res.data.claims) setClaims(res.data.claims);
    });
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Delete this source and its associated extracted claims?')) return;
    try {
      await axiosClient.delete(`/workspaces/${id}/sources/${sourceId}`);
      setSources(prev => prev.filter(s => s.id !== sourceId));
      setClaims(prev => prev.filter(c => c.source_id !== sourceId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete source.');
    }
  };

  const handleSynthesisComplete = (newReport: any) => {
    setSynthesisReports(prev => [newReport, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono">Loading workspace corpus & evidence graph...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 bg-slate-950 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Workspace Unavailable</h2>
        <p className="text-xs text-slate-400 mb-6">{error || 'Unable to load workspace details.'}</p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header: Breadcrumbs & Workspace Info */}
      <div className="space-y-4 pb-4 border-b border-slate-900">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Workspaces</span>
          </Link>
          <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {workspace.domain?.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {workspace.title}
            </h1>
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-200 leading-relaxed">
                  <span className="font-semibold text-indigo-300">Inquiry Question: </span>
                  {workspace.research_question}
                </p>
              </div>
              {workspace.working_hypothesis && (
                <div className="flex items-start gap-2 pt-2 border-t border-slate-800/60">
                  <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    <span className="font-semibold text-emerald-400 not-italic">Hypothesis: </span>
                    {workspace.working_hypothesis}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Upload Action */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Ingest Source Document</span>
          </button>
        </div>

        {/* 4 Navigation Command Center Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2">
          <button
            onClick={() => setActiveTab('corpus')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'corpus'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Corpus & Documents ({sources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'claims'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Claims & Evidence Explorer ({claims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('synthesis')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'synthesis'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Synthesis Studio ({synthesisReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'copilot'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Research Copilot</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Corpus & Source Upload */}
      {activeTab === 'corpus' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Indexed Documents & Studies ({sources.length})
            </h3>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          </div>

          {sources.length === 0 ? (
            <div className="p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl text-center space-y-4">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="max-w-md mx-auto">
                <h4 className="text-base font-bold text-white mb-1">Your Workspace Corpus is Empty</h4>
                <p className="text-xs text-slate-400">
                  Upload PDF research papers, lab notes, or abstracts to trigger automatic AI claim extraction and methodology rigor scoring.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Upload Research Paper
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sources.map(source => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onDelete={handleDeleteSource}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Claim & Evidence Explorer */}
      {activeTab === 'claims' && (
        <ClaimsTable claims={claims} />
      )}

      {/* Tab 3: Cross-Source Synthesis Studio */}
      {activeTab === 'synthesis' && (
        <SynthesisStudio
          workspaceId={workspace.id}
          sources={sources}
          synthesisReports={synthesisReports}
          onSynthesisComplete={handleSynthesisComplete}
          defaultMode={workspace.default_synthesis_mode}
        />
      )}

      {/* Tab 4: Grounded Research Copilot */}
      {activeTab === 'copilot' && (
        <CopilotChat
          workspaceId={workspace.id}
          researchQuestion={workspace.research_question}
          sourcesCount={sources.length}
        />
      )}

      {/* Source Upload Modal */}
      <SourceUploadModal
        workspaceId={workspace.id}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleSourceAdded}
      />
    </div>
  );
};

export default WorkspaceDetailPage;
