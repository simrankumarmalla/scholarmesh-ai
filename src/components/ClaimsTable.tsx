import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Quote, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export interface JoinedClaim {
  id: string;
  source_id: string;
  workspace_id: string;
  claim_text: string;
  claim_category: string;
  supporting_quote?: string | null;
  confidence_level?: string;
  created_at: string;
  source_title: string;
  source_authors: string;
  source_rigor_score: number;
  source_type?: string;
}

interface ClaimsTableProps {
  claims: JoinedClaim[];
  isLoading?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  empirical_finding: {
    label: 'Empirical Finding',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30'
  },
  statistic: {
    label: 'Statistic',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30'
  },
  methodology: {
    label: 'Methodology',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30'
  },
  limitation: {
    label: 'Limitation',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  hypothesis: {
    label: 'Hypothesis',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30'
  }
};

export const ClaimsTable: React.FC<ClaimsTableProps> = ({ claims, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all');

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      searchTerm === '' ||
      claim.claim_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (claim.supporting_quote && claim.supporting_quote.toLowerCase().includes(searchTerm.toLowerCase())) ||
      claim.source_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || claim.claim_category === selectedCategory;
    const matchesConfidence = selectedConfidence === 'all' || claim.confidence_level === selectedConfidence;

    return matchesSearch && matchesCategory && matchesConfidence;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Category Filter Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search claims, statistics, or source titles..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="empirical_finding">Empirical Findings</option>
              <option value="statistic">Statistics & Numbers</option>
              <option value="methodology">Methodologies</option>
              <option value="limitation">Study Limitations</option>
              <option value="hypothesis">Hypotheses</option>
            </select>
          </div>

          {/* Confidence Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-400">Confidence:</span>
            <select
              value={selectedConfidence}
              onChange={(e) => setSelectedConfidence(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Counter & Active Filter Indicators */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>
          Showing <strong className="text-white">{filteredClaims.length}</strong> of{' '}
          <strong className="text-white">{claims.length}</strong> atomic claims
        </span>
        {(searchTerm || selectedCategory !== 'all' || selectedConfidence !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedConfidence('all');
            }}
            className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Claims Grid / Matrix View */}
      {filteredClaims.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No Atomic Claims Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {claims.length === 0
              ? 'No research sources have been ingested yet. Upload documents or click "Load Sample Paper" in the Corpus tab to extract claims automatically.'
              : 'Try broadening your search criteria or resetting the category filters above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredClaims.map((claim) => {
            const catStyle = CATEGORY_MAP[claim.claim_category] || {
              label: claim.claim_category,
              bg: 'bg-slate-800',
              text: 'text-slate-300',
              border: 'border-slate-700'
            };

            return (
              <div
                key={claim.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all hover:bg-slate-900/90 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                {/* Left Content: Category, Statement, Supporting Verbatim Quote */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                    >
                      {catStyle.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                        claim.confidence_level === 'high'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {claim.confidence_level || 'high'} confidence
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
                    {claim.claim_text}
                  </p>

                  {claim.supporting_quote && (
                    <div className="flex items-start gap-2 text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
                      <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">"{claim.supporting_quote}"</span>
                    </div>
                  )}
                </div>

                {/* Right Metadata: Attributed Source Card */}
                <div className="md:w-64 shrink-0 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        Source
                      </span>
                      <span className="font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        {claim.source_rigor_score}/100
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1" title={claim.source_title}>
                      {claim.source_title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate" title={claim.source_authors}>
                      {claim.source_authors}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClaimsTable;
