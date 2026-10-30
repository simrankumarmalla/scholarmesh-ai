import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Trash2, 
  HelpCircle,
  Lightbulb,
  Clock
} from 'lucide-react';

export interface WorkspaceItem {
  id: string;
  title: string;
  domain: string;
  research_question: string;
  working_hypothesis?: string | null;
  default_synthesis_mode?: string;
  source_count?: string | number;
  claim_count?: string | number;
  synthesis_count?: string | number;
  created_at: string;
}

const DOMAIN_LABELS: Record<string, { label: string; color: string; border: string; bg: string }> = {
  biomedical_clinical: {
    label: 'Biomedical & Clinical',
    color: 'text-rose-400',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/10'
  },
  ai_computer_science: {
    label: 'AI & Computer Science',
    color: 'text-indigo-400',
    border: 'border-indigo-500/20',
    bg: 'bg-indigo-500/10'
  },
  climate_sustainability: {
    label: 'Climate & Sustainability',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/10'
  },
  economics_market: {
    label: 'Economics & Markets',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/10'
  },
  legal_regulatory: {
    label: 'Legal & Regulatory',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/10'
  },
  social_behavioral: {
    label: 'Social & Behavioral',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/10'
  }
};

interface WorkspaceCardProps {
  workspace: WorkspaceItem;
  onDelete?: (id: string) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, onDelete }) => {
  const domainConfig = DOMAIN_LABELS[workspace.domain] || {
    label: workspace.domain.replace(/_/g, ' '),
    color: 'text-indigo-400',
    border: 'border-indigo-500/20',
    bg: 'bg-indigo-500/10'
  };

  const formattedDate = new Date(workspace.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/20">
      <div>
        {/* Top Header: Domain Pill & Date / Delete */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${domainConfig.bg} ${domainConfig.color} ${domainConfig.border}`}>
            {domainConfig.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(workspace.id);
                }}
                title="Delete Workspace"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Workspace Title */}
        <Link to={`/workspaces/${workspace.id}`} className="block">
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2 leading-snug">
            {workspace.title}
          </h3>
        </Link>

        {/* Primary Research Question */}
        <div className="mb-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              <span className="font-semibold text-slate-200">Question: </span>
              {workspace.research_question}
            </p>
          </div>
          {workspace.working_hypothesis && (
            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-800/60">
              <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">
                <span className="font-semibold text-emerald-400 not-italic">Hypothesis: </span>
                {workspace.working_hypothesis}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Metrics & Action Link */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300" title="Ingested Sources">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold">{workspace.source_count ?? 0}</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">docs</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300" title="Extracted Atomic Claims">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">{workspace.claim_count ?? 0}</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">claims</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300" title="Cross-Source Syntheses">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{workspace.synthesis_count ?? 0}</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">reports</span>
          </div>
        </div>

        <Link
          to={`/workspaces/${workspace.id}`}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default WorkspaceCard;
