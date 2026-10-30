import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { 
  Layers, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  Lightbulb, 
  Compass, 
  Loader2, 
  AlertCircle,
  FlaskConical
} from 'lucide-react';

const DOMAIN_OPTIONS = [
  { id: 'biomedical_clinical', label: 'Biomedical & Clinical Sciences' },
  { id: 'ai_computer_science', label: 'AI & Computer Science' },
  { id: 'climate_sustainability', label: 'Climate Science & Environmental Policy' },
  { id: 'economics_market', label: 'Macroeconomics & Market Policy' },
  { id: 'legal_regulatory', label: 'Legal Precedent & Regulatory Compliance' },
  { id: 'social_behavioral', label: 'Social & Behavioral Sciences' }
];

const SYNTHESIS_MODES = [
  { id: 'systematic_review', label: 'Systematic Literature Review', desc: 'Holistic summary of methodologies, sample rigor, and outcomes.' },
  { id: 'contradiction_audit', label: 'Contradiction & Discrepancy Audit', desc: 'Identifies conflicting claims, parameter variances, and opposing results.' },
  { id: 'decision_brief', label: 'Executive Decision & Policy Brief', desc: 'Translates literature conclusions into actionable recommendations with risks.' },
  { id: 'gap_analysis', label: 'Research Gap & Horizon Analysis', desc: 'Highlights unexplored variables and future study hypotheses.' }
];

const PRESET_TEMPLATES = [
  {
    name: 'mRNA Lipid Delivery & Hepatotoxicity',
    domain: 'biomedical_clinical',
    title: 'mRNA Delivery Lipid Nanoparticles: Efficacy vs. Hepatic Toxicity',
    question: 'What ionizable lipid chemical structures maximize mRNA transfection efficiency while minimizing dose-dependent hepatic necrosis and Kupffer cell activation?',
    hypothesis: 'Incorporation of biodegradable ester linkages into the hydrophobic alkyl tails accelerates hepatic clearance kinetics, reducing ALT/AST elevation by >60% without compromising delivery potency.',
    mode: 'contradiction_audit'
  },
  {
    name: 'Sparse MoE vs Dense LLM Reasoning',
    domain: 'ai_computer_science',
    title: 'Sparse Mixture of Experts: Inference Latency vs Reasoning Hallucination Rates',
    question: 'How does expert routing sparsity in 100B+ foundation models impact symbolic reasoning reliability and factual hallucination compared to dense architectures?',
    hypothesis: 'Top-2 routing with temperature-annealed entropy penalties eliminates factual decay on multi-step reasoning benchmarks while maintaining a 3x throughput advantage.',
    mode: 'systematic_review'
  },
  {
    name: 'Direct Air Carbon Capture Efficiency',
    domain: 'climate_sustainability',
    title: 'Solid Sorbent DAC Systems: Energy Desorption Penalties & Thermal Durability',
    question: 'Which amine-functionalized porous silica frameworks achieve maximum CO2 adsorption capacity under ambient humidity with minimal thermal regeneration energy?',
    hypothesis: 'Secondary amine branching supported on ordered mesoporous SBA-15 lowers desorption regeneration temperatures below 85°C while preventing oxidative degradation.',
    mode: 'gap_analysis'
  }
];

export const CreateWorkspacePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('biomedical_clinical');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [workingHypothesis, setWorkingHypothesis] = useState('');
  const [defaultSynthesisMode, setDefaultSynthesisMode] = useState('contradiction_audit');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleApplyTemplate = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setDomain(tmpl.domain);
    setResearchQuestion(tmpl.question);
    setWorkingHypothesis(tmpl.hypothesis);
    setDefaultSynthesisMode(tmpl.mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !researchQuestion.trim()) {
      setError('Please provide a workspace title and primary research question.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post('/workspaces', {
        title,
        domain,
        research_question: researchQuestion,
        working_hypothesis: workingHypothesis.trim() || null,
        default_synthesis_mode: defaultSynthesisMode
      });

      if (res.data && res.data.workspace) {
        navigate(`/workspaces/${res.data.workspace.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.details?.[0] || 'Failed to create workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Workspaces</span>
      </Link>

      {/* Header */}
      <div className="pb-4 border-b border-slate-900">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Research Inquiry Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Define your target scientific inquiry, central hypothesis, and synthesis framework
        </p>
      </div>

      {/* Quick Preset Templates Bar */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">Quick-Fill Research Templates:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
            Workspace Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. mRNA Delivery Lipid Nanoparticles: Efficacy vs. Hepatic Toxicity"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Domain Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
            Knowledge Domain <span className="text-rose-400">*</span>
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {DOMAIN_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Research Question */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
            Primary Research Question <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="What core scientific, clinical, technical, or empirical question are you investigating across literature?"
            required
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Google Gemini will use this question to calibrate claim relevance, rigor scoring, and contradiction detection.
          </p>
        </div>

        {/* Working Hypothesis */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
            Working Hypothesis <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            value={workingHypothesis}
            onChange={(e) => setWorkingHypothesis(e.target.value)}
            placeholder="What proposition, causal mechanism, or empirical outcome are you evaluating?"
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Default Synthesis Mode Lens */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
            Default Synthesis Lens
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SYNTHESIS_MODES.map((mode) => (
              <div
                key={mode.id}
                onClick={() => setDefaultSynthesisMode(mode.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  defaultSynthesisMode === mode.id
                    ? 'bg-indigo-950/30 border-indigo-500 shadow-md text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold text-slate-200 mb-1">{mode.label}</p>
                <p className="text-[11px] text-slate-400 leading-snug">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing Workspace...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Workspace</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkspacePage;
