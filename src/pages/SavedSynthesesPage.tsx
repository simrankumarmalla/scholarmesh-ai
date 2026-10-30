import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import MarkdownExporter from '../components/MarkdownExporter';
import { 
  BookOpen, 
  Sparkles, 
  Layers, 
  Loader2, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

export const SavedSynthesesPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await axiosClient.get('/syntheses');
        if (res.data && res.data.reports) {
          setReports(res.data.reports);
          if (res.data.reports.length > 0) {
            setSelectedReport(res.data.reports[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load user syntheses:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const parseJsonField = (field: any) => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase">
            Synthesis Repository & Literature Reviews
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Synthesis Library
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Comprehensive archive of all cross-source reviews, contradiction audits, and decision briefs across your workspaces
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-xs font-mono">Retrieving synthesized reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl text-center space-y-4">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white mb-1">No Synthesis Reports Generated</h3>
            <p className="text-xs text-slate-400">
              Navigate to any research workspace and open the Synthesis Studio tab to compare multiple documents and generate literature reviews.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Go to Workspaces</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Reports List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
              Generated Reports ({reports.length})
            </h3>
            <div className="space-y-2.5">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-950/30'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {rep.synthesis_mode?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 mb-1.5">
                      {rep.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span className="truncate">{rep.workspace_title}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Full Report View */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {selectedReport.synthesis_mode?.replace(/_/g, ' ')}
                      </span>
                      <Link
                        to={`/workspaces/${selectedReport.workspace_id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium underline"
                      >
                        <span>Workspace: {selectedReport.workspace_title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {selectedReport.title}
                    </h2>
                  </div>

                  <MarkdownExporter report={selectedReport} />
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                    Executive Summary & Evidence Review
                  </h4>
                  <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {selectedReport.executive_summary}
                  </div>
                </div>

                {/* Consensus Themes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Consensus Themes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parseJsonField(selectedReport.consensus_themes).map((theme: any, i: number) => (
                      <div key={i} className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3.5">
                        <p className="text-xs font-bold text-emerald-300 mb-1">{theme.theme_title}</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{theme.synthesis_statement}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contradictions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                    Discrepancies & Contradictions
                  </h4>
                  <div className="space-y-3">
                    {parseJsonField(selectedReport.contradictions).map((contra: any, i: number) => (
                      <div key={i} className="bg-rose-950/10 border border-rose-500/30 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-bold text-rose-300">{contra.topic}</p>
                        <p className="text-xs text-slate-200">{contra.conflicting_positions}</p>
                        <p className="text-[11px] text-indigo-300">
                          <span className="font-semibold text-slate-400">Reason: </span>
                          {contra.methodological_reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Actionable Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parseJsonField(selectedReport.decision_recommendations).map((dec: any, i: number) => (
                      <div key={i} className="bg-slate-950/60 border border-indigo-500/20 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-white">{dec.action_title}</p>
                          <span className="text-[10px] font-mono text-indigo-300">{dec.evidence_confidence}</span>
                        </div>
                        <p className="text-xs text-slate-300">{dec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSynthesesPage;
