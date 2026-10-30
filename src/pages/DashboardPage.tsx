import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import WorkspaceCard, { WorkspaceItem } from '../components/WorkspaceCard';
import { 
  Layers, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  FlaskConical,
  Filter,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

const DOMAIN_OPTIONS = [
  { id: 'all', label: 'All Domains' },
  { id: 'biomedical_clinical', label: 'Biomedical & Clinical' },
  { id: 'ai_computer_science', label: 'AI & Systems' },
  { id: 'climate_sustainability', label: 'Climate & Energy' },
  { id: 'economics_market', label: 'Economics & Markets' },
  { id: 'legal_regulatory', label: 'Legal & Regulatory' },
  { id: 'social_behavioral', label: 'Social & Behavioral' }
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedDomain !== 'all') params.domain = selectedDomain;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axiosClient.get('/workspaces', { params });
      if (res.data && res.data.workspaces) {
        setWorkspaces(res.data.workspaces);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [selectedDomain]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkspaces();
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workspace and all associated sources and synthesis reports?')) {
      return;
    }
    try {
      await axiosClient.delete(`/workspaces/${id}`);
      setWorkspaces(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      alert('Unable to delete workspace.');
    }
  };

  // Aggregate stats across fetched workspaces or user profile
  const totalSources = workspaces.reduce((acc, w) => acc + (Number(w.source_count) || 0), 0);
  const totalClaims = workspaces.reduce((acc, w) => acc + (Number(w.claim_count) || 0), 0);
  const totalSyntheses = workspaces.reduce((acc, w) => acc + (Number(w.synthesis_count) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">
              Principal Investigator Terminal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Research Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Synthesize multi-modal studies, cross-reference empirical findings, and audit contradictions
          </p>
        </div>

        <Link
          to="/workspaces/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Workspace</span>
        </Link>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white font-mono">{workspaces.length}</p>
            <p className="text-xs text-slate-400">Total Workspaces</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-cyan-300 font-mono">{totalSources}</p>
            <p className="text-xs text-slate-400">Sources Analyzed</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-emerald-300 font-mono">{totalClaims}</p>
            <p className="text-xs text-slate-400">Atomic Claims Extracted</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-300 font-mono">{totalSyntheses}</p>
            <p className="text-xs text-slate-400">Syntheses Generated</p>
          </div>
        </div>
      </div>

      {/* Search & Domain Filter Pills Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Domain Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {DOMAIN_OPTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedDomain === d.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces or questions..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </form>
        </div>
      </div>

      {/* Workspaces Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs font-mono">Fetching indexed workspaces...</p>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white mb-1">No Research Workspaces Found</h3>
            <p className="text-xs text-slate-400">
              {searchQuery || selectedDomain !== 'all'
                ? 'No workspaces match your active filter criteria. Try clearing your search.'
                : 'Create your first research inquiry workspace to start ingesting multi-modal papers and discovering evidence.'}
            </p>
          </div>
          <Link
            to="/workspaces/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              workspace={ws}
              onDelete={handleDeleteWorkspace}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
