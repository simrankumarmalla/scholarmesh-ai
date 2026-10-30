import React, { useState } from 'react';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Award, 
  Tag, 
  Quote, 
  Calendar, 
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export interface ExtractedClaimItem {
  id?: string;
  claim_text: string;
  claim_category: string;
  supporting_quote?: string | null;
  confidence_level?: string;
}

export interface SourceItem {
  id: string;
  title: string;
  authors: string;
  publication_year?: number;
  source_type: string;
  original_filename?: string | null;
  raw_content: string;
  word_count?: number;
  ai_summary?: string | null;
  methodology_notes?: string | null;
  rigor_score: number;
  rigor_justification?: string | null;
  key_topics?: string[] | string;
  extracted_claims?: ExtractedClaimItem[];
  created_at?: string;
}

interface SourceCardProps {
  source: SourceItem;
  onDelete?: (sourceId: string) => void;
  onSelectForSynthesis?: (sourceId: string) => void;
  isSelected?: boolean;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  onDelete,
  onSelectForSynthesis,
  isSelected = false
}) => {
  const [claimsExpanded, setClaimsExpanded] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  // Parse topics if string
  const topics: string[] = Array.isArray(source.key_topics)
    ? source.key_topics
    : typeof source.key_topics === 'string'
    ? JSON.parse(source.key_topics || '[]')
    : [];

  const claims: ExtractedClaimItem[] = source.extracted_claims || [];

  // Rigor Score Badge Styling
  const getRigorBadge = (score: number) => {
    if (score >= 75) {
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'High Rigor'
      };
    } else if (score >= 50) {
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        label: 'Moderate Rigor'
      };
    } else {
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        label: 'Low / Preliminary'
      };
    }
  };

  const rigorStyle = getRigorBadge(source.rigor_score);

  return (
    <div
      className={`group relative bg-slate-900/60 border rounded-2xl p-5 transition-all duration-200 ${
        isSelected
          ? 'border-indigo-500 shadow-md shadow-indigo-950/40 bg-slate-900/90'
          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
    >
      {/* Top Header: Checkbox for synthesis selection, Type badge, Rigor Score, Delete */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {onSelectForSynthesis && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectForSynthesis(source.id)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer"
              title="Select for cross-source synthesis"
            />
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {source.source_type.replace(/_/g, ' ')}
          </span>
          {source.publication_year && (
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-slate-400" />
              {source.publication_year}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Rigor Score Badge */}
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rigorStyle.bg} ${rigorStyle.text} ${rigorStyle.border}`}
            title={source.rigor_justification || 'Methodological Rigor Evaluation'}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rigor: {source.rigor_score}/100</span>
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(source.id)}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
              title="Remove document from workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Authors */}
      <h4 className="text-base font-bold text-white mb-1 leading-snug group-hover:text-indigo-200 transition-colors">
        {source.title}
      </h4>
      <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
        <User className="w-3 h-3 text-slate-400 shrink-0" />
        <span className="truncate">{source.authors}</span>
      </p>

      {/* AI Executive Summary */}
      {source.ai_summary && (
        <div className="mb-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Award className="w-3 h-3" />
            AI Executive Summary
          </p>
          <p className={`text-xs text-slate-300 leading-relaxed ${showFullSummary ? '' : 'line-clamp-3'}`}>
            {source.ai_summary}
          </p>
          {source.ai_summary.length > 200 && (
            <button
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
            >
              {showFullSummary ? 'Show less' : 'Read full summary'}
            </button>
          )}
        </div>
      )}

      {/* Methodology Notes & Rigor Justification */}
      {source.methodology_notes && (
        <div className="mb-3 text-[11px] text-slate-400 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
          <span className="font-semibold text-slate-300">Methodology Critique: </span>
          {source.methodology_notes}
        </div>
      )}

      {/* Topic Keyword Tags */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topics.map((t, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-500/20"
            >
              <Tag className="w-2.5 h-2.5 text-indigo-400" />
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Atomic Claims Drawer */}
      {claims.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setClaimsExpanded(!claimsExpanded)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white py-1 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Extracted Atomic Claims ({claims.length})
            </span>
            {claimsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {claimsExpanded && (
            <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto pr-1">
              {claims.map((claim, idx) => (
                <div
                  key={claim.id || idx}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-xs transition-all hover:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-800 text-indigo-300 border border-indigo-500/20">
                      {claim.claim_category.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-mono capitalize ${
                      claim.confidence_level === 'high' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {claim.confidence_level || 'high'} confidence
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed mb-1.5">
                    {claim.claim_text}
                  </p>
                  {claim.supporting_quote && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                      <Quote className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>"{claim.supporting_quote}"</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SourceCard;
