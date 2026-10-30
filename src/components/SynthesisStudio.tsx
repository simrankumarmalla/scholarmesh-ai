import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { SourceItem } from './SourceCard';
import MarkdownExporter from './MarkdownExporter';
import { 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  Compass, 
  Loader2, 
  CheckSquare, 
  Square, 
  History, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

interface SynthesisStudioProps {
  workspaceId: string;
  sources: SourceItem[];
  synthesisReports: any[];
  onSynthesisComplete: (newReport: any) => void;
  defaultMode?: string;
}

const LENSES = [
  {
    id: 'systematic_review',
    title: 'Systematic Review',
    description: 'Comprehensive synthesis of findings, experimental rigor, and cross-study alignment.'
  },
  {
    id: 'contradiction_audit',
    title: 'Contradiction Audit',
    description: 'Focuses heavily on conflicting data points, methodological variations, and opposing conclusions.'
  },
  {
    id: 'decision_brief',
    title: 'Decision & Policy Brief',
    description: 'Translates empirical findings into actionable recommendations with identified risk levels.'
  },
  {
    id: 'gap_analysis',
    title: 'Research Gap Analysis',
    description: 'Identifies unexplored variables, demographic blind spots, and future study directions.'
  }
];

export const SynthesisStudio: React.FC<SynthesisStudioProps> = ({
  workspaceId,
  sources,
  synthesisReports,
  onSynthesisComplete,
  defaultMode = 'contradiction_audit'
}) => {
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(() =>
    sources.slice(0, 3).map(s => s.id)
  );
  const [selectedMode, setSelectedMode] = useState<string>(defaultMode);
  const [customTitle, setCustomTitle] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active view: either a newly generated report or an existing one from history
  const [activeReport, setActiveReport] = useState<any>(() =>
    synthesisReports.length > 0 ? synthesisReports[0] : null
  );

  const toggleSource = (id: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedSourceIds(sources.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSourceIds([]);
  };

  const handleRunSynthesis = async () => {
    if (selectedSourceIds.length < 2) {
      setError('Please select at least 2 research sources to synthesize.');
      return;
    }

    setError(null);
    setIsSynthesizing(true);

    try {
      const res = await axiosClient.post(`/workspaces/${workspaceId}/synthesize`, {
        source_ids: selectedSourceIds,
        synthesis_mode: selectedMode,
        title: customTitle.trim() || undefined
      });

      if (res.data && res.data.report) {
        setActiveReport(res.data.report);
        onSynthesisComplete(res.data.report);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to generate cross-source synthesis.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Helper to parse JSON fields safely
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

  const consensusThemes = activeReport ? parseJsonField(activeReport.consensus_themes) : [];
  const contradictions = activeReport ? parseJsonField(activeReport.contradictions) : [];
  const researchGaps = activeReport ? parseJsonField(activeReport.research_gaps) : [];
  const decisions = activeReport ? parseJsonField(activeReport.decision_recommendations) : [];

  return (
    <div className="space-y-8">
      {/* Configuration & Selection Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Cross-Source Knowledge Synthesis Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select 2 or more indexed sources to run multi-document contradiction detection & consensus discovery
            </p>
          </div>

          {/* Quick Select All / Deselect buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Select All ({sources.length})
            </button>
            <button
              onClick={deselectAll}
              className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Source Selection Checkboxes Grid */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
            1. Select Sources to Compare ({selectedSourceIds.length} of {sources.length} selected)
          </label>
          {sources.length < 2 ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
              This workspace currently has only {sources.length} source. Please upload or ingest at least 2 sources in the Corpus tab to run cross-source synthesis.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {sources.map(s => {
                const isSelected = selectedSourceIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSource(s.id)}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 text-indigo-400 shrink-0">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{s.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{s.authors} • Rigor: {s.rigor_score}/100</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Synthesis Lens / Mode Selection */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
            2. Choose Synthesis Lens
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LENSES.map(lens => (
              <button
                key={lens.id}
                type="button"
                onClick={() => setSelectedMode(lens.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMode === lens.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold text-slate-200 mb-1">{lens.title}</p>
                <p className="text-[11px] text-slate-400 leading-snug">{lens.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Title & Action Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Optional synthesis report title (default auto-generated)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={handleRunSynthesis}
            disabled={isSynthesizing || selectedSourceIds.length < 2}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Comparing Sources & Extracting Discrepancies...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Cross-Source Synthesis</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}
      </div>

      {/* Synthesis History Switcher if multiple reports exist */}
      {synthesisReports.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 font-mono">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            Report History:
          </span>
          {synthesisReports.map(rep => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                activeReport?.id === rep.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {rep.title} ({new Date(rep.created_at).toLocaleDateString()})
            </button>
          ))}
        </div>
      )}

      {/* Active Synthesis Report View */}
      {activeReport ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          {/* Report Top Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeReport.synthesis_mode?.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Synthesized on {new Date(activeReport.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {activeReport.title}
              </h2>
            </div>

            {/* Evidence Strength Badge & Markdown Exporter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Evidence Strength:</span>
                <span className="font-bold text-white">{activeReport.overall_evidence_strength}</span>
              </div>
              <MarkdownExporter report={activeReport} />
            </div>
          </div>

          {/* Section 1: Executive Literature Review */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" />
              1. Executive Literature Review & Cross-Document Synthesis
            </h4>
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans">
              {activeReport.executive_summary}
            </div>
          </div>

          {/* Section 2: Consensus Themes Matrix */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              2. Consensus Themes & Cross-Document Alignment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consensusThemes.map((theme: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {theme.theme_title}
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {theme.synthesis_statement}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">Supporting: </span>
                    {(theme.supporting_source_titles || []).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Contradiction & Discrepancy Alerts */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              3. Empirical Contradictions & Discrepancy Alerts
            </h4>
            {contradictions.length === 0 ? (
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-400">
                No direct empirical contradictions identified among the selected sources.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contradictions.map((contra: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-rose-950/10 border border-rose-500/30 rounded-2xl p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        Discrepancy #{idx + 1}: {contra.topic}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-semibold text-rose-300">Conflicting Data: </span>
                      {contra.conflicting_positions}
                    </p>
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                      <span className="font-semibold text-indigo-300">Why Discrepancy Occurred: </span>
                      {contra.methodological_reason}
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">
                      <span className="font-semibold text-slate-300">Conflicting Sources: </span>
                      {(contra.sources_involved || []).join(' vs. ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Research Gaps & Next Steps */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4" />
              4. Unaddressed Research Gaps
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {researchGaps.map((gap: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-4 space-y-2"
                >
                  <h5 className="text-xs font-bold text-amber-300">{gap.gap_title}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{gap.description}</p>
                  <div className="pt-2 border-t border-slate-800/60 text-[11px] text-indigo-300">
                    <span className="font-semibold text-slate-200">Recommended Next Study: </span>
                    {gap.suggested_next_study}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Decision Matrix & Actionable Recommendations */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              5. Evidence-Based Decision Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {decisions.map((dec: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-indigo-500/20 rounded-2xl p-4 space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h5 className="text-xs font-bold text-white">{dec.action_title}</h5>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {dec.evidence_confidence} Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{dec.recommendation}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 text-[11px] text-rose-300 bg-rose-950/20 p-2 rounded-lg">
                    <span className="font-semibold text-rose-200">Risk if Ignored: </span>
                    {dec.risk_if_ignored}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl text-center">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">No Synthesis Generated Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose your synthesis lens, select 2 or more sources above, and click "Run Cross-Source Synthesis" to discover empirical consensus and hidden contradictions.
          </p>
        </div>
      )}
    </div>
  );
};

export default SynthesisStudio;
