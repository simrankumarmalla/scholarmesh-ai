import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Network, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Bot, 
  ArrowRight, 
  FlaskConical, 
  Layers, 
  Compass, 
  BarChart3,
  Award,
  Zap,
  BookOpen
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemo = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-96 right-10 w-[600px] h-[400px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Academic Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-medium mb-8">
          <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Systems for Scientific Discovery & Literature Synthesis</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Synthesize Fragmented Literature.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Uncover Hidden Contradictions.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          ScholarMesh AI is an autonomous research discovery platform that turns multi-document PDF and text corpora into structured atomic claims, detects methodological conflicts across studies, and provides citation-grounded literature copilot Q&A.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Go to Your Workspaces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={handleDemo}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <FlaskConical className="w-4 h-4" />
                <span>1-Click Demo Account</span>
              </button>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-semibold text-sm rounded-xl transition-all"
              >
                <span>Create Researcher Account</span>
              </Link>
            </>
          )}
        </div>

        {/* Metric Badges */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-900">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-extrabold text-white font-mono">100%</p>
            <p className="text-xs text-slate-400">Grounded Citations Only</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-extrabold text-indigo-400 font-mono">0–100</p>
            <p className="text-xs text-slate-400">Methodology Rigor Index</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-extrabold text-emerald-400 font-mono">Multi-Doc</p>
            <p className="text-xs text-slate-400">Contradiction Detection</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-2xl font-extrabold text-amber-400 font-mono">PDF & MD</p>
            <p className="text-xs text-slate-400">Multer Buffer Ingestion</p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 mb-2">
            The ScholarMesh Architecture
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Built for Systematic Academic Inquiries
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Multi-Format Ingestion & Claims Extraction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload PDF manuscripts, lab notes, or abstracts. Google Gemini extracts atomic verifiable claims, sample statistics, study limitations, and scores methodological soundness.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Cross-Source Synthesis & Contradiction Matrix</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare 2+ publications to surface conflicting findings, pinpoint experimental reasons for divergences, and translate findings into executive policy recommendations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Citation-Grounded Research Copilot</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interrogate your workspace with complex research questions. Every response is verified against your corpus with inspectable quotes and follow-up inquiry prompts.
            </p>
          </div>
        </div>
      </section>

      {/* Target Domains */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center mb-10">
          <h3 className="text-xl font-bold text-white mb-2">Engineered for 6 Core Knowledge Domains</h3>
          <p className="text-xs text-slate-400">Structured taxonomy for cross-disciplinary research synthesis</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Biomedical & Clinical', color: 'text-rose-400', border: 'border-rose-500/30' },
            { name: 'AI & Systems', color: 'text-indigo-400', border: 'border-indigo-500/30' },
            { name: 'Climate & Energy', color: 'text-emerald-400', border: 'border-emerald-500/30' },
            { name: 'Economics & Markets', color: 'text-amber-400', border: 'border-amber-500/30' },
            { name: 'Legal & Regulatory', color: 'text-purple-400', border: 'border-purple-500/30' },
            { name: 'Social & Behavioral', color: 'text-cyan-400', border: 'border-cyan-500/30' }
          ].map((d, i) => (
            <div key={i} className={`p-4 rounded-xl bg-slate-900/50 border ${d.border} text-center`}>
              <p className={`text-xs font-bold ${d.color}`}>{d.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 max-w-5xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/20 shadow-2xl space-y-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to explore cross-document synthesis?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Test the pre-seeded mRNA LNP hepatotoxicity workspace with 3 conflicting studies and pre-extracted claims, or ingest your own papers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleDemo}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Launch Pre-Seeded Demo
            </button>
            <Link
              to="/register"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-semibold text-sm rounded-xl transition-all"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
