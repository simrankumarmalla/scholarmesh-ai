import React from 'react';
import { Download, Printer, Check, Copy } from 'lucide-react';

interface MarkdownExporterProps {
  report: {
    title: string;
    synthesis_mode: string;
    overall_evidence_strength: string;
    executive_summary: string;
    consensus_themes: any[];
    contradictions: any[];
    research_gaps: any[];
    decision_recommendations: any[];
    created_at?: string;
  };
}

export const MarkdownExporter: React.FC<MarkdownExporterProps> = ({ report }) => {
  const [copied, setCopied] = React.useState(false);

  const generateMarkdownString = () => {
    const consensus = Array.isArray(report.consensus_themes)
      ? report.consensus_themes
      : typeof report.consensus_themes === 'string'
      ? JSON.parse(report.consensus_themes)
      : [];

    const contradictions = Array.isArray(report.contradictions)
      ? report.contradictions
      : typeof report.contradictions === 'string'
      ? JSON.parse(report.contradictions)
      : [];

    const gaps = Array.isArray(report.research_gaps)
      ? report.research_gaps
      : typeof report.research_gaps === 'string'
      ? JSON.parse(report.research_gaps)
      : [];

    const decisions = Array.isArray(report.decision_recommendations)
      ? report.decision_recommendations
      : typeof report.decision_recommendations === 'string'
      ? JSON.parse(report.decision_recommendations)
      : [];

    return `# ${report.title}
*Synthesis Lens:* ${report.synthesis_mode.replace(/_/g, ' ').toUpperCase()}  
*Evidence Strength Assessment:* **${report.overall_evidence_strength}**  
*Generated:* ${new Date(report.created_at || Date.now()).toLocaleDateString()} via ScholarMesh AI  

---

## 1. Executive Literature Review & Synthesis
${report.executive_summary}

---

## 2. Consensus Themes & Cross-Document Alignment
${consensus.map((c: any, i: number) => `### ${i + 1}. ${c.theme_title}
${c.synthesis_statement}
*Supporting Sources:* ${(c.supporting_source_titles || []).join(', ')}
`).join('\n')}

---

## 3. Direct Empirical Contradictions & Discrepancies
${contradictions.length > 0 ? contradictions.map((d: any, i: number) => `### Discrepancy ${i + 1}: ${d.topic}
- **Conflicting Positions:** ${d.conflicting_positions}
- **Methodological Cause:** ${d.methodological_reason}
- **Sources Involved:** ${(d.sources_involved || []).join(', ')}
`).join('\n') : '_No direct contradictions detected among selected sources._'}

---

## 4. Unaddressed Research Gaps
${gaps.map((g: any, i: number) => `### Gap ${i + 1}: ${g.gap_title}
${g.description}
*Recommended Next Study:* ${g.suggested_next_study}
`).join('\n')}

---

## 5. Evidence-Based Decision Recommendations
${decisions.map((r: any, i: number) => `### Recommendation ${i + 1}: ${r.action_title} (Confidence: ${r.evidence_confidence})
- **Action:** ${r.recommendation}
- **Risk if Ignored:** ${r.risk_if_ignored}
`).join('\n')}

---
*Report synthesized and verified with Google Gemini 2.5 Flash on ScholarMesh AI.*
`;
  };

  const handleDownload = () => {
    const md = generateMarkdownString();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_synthesis.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const md = generateMarkdownString();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
        title="Copy Markdown to Clipboard"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
        <span>{copied ? 'Copied' : 'Copy MD'}</span>
      </button>

      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 rounded-xl transition-all cursor-pointer"
        title="Download .md file"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span>Export .md</span>
      </button>

      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
        title="Print or Save as PDF"
      >
        <Printer className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Print / PDF</span>
      </button>
    </div>
  );
};

export default MarkdownExporter;
