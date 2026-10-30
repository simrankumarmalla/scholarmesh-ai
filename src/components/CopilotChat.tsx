import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  BookOpen, 
  ChevronRight, 
  Quote, 
  HelpCircle,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export interface CopilotCitation {
  source_id: string;
  source_title: string;
  relevance_note: string;
  key_excerpt: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  message_text: string;
  citations?: CopilotCitation[] | string;
  follow_up_questions?: string[] | string;
  created_at?: string;
}

interface CopilotChatProps {
  workspaceId: string;
  researchQuestion: string;
  sourcesCount: number;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({
  workspaceId,
  researchQuestion,
  sourcesCount
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<CopilotCitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await axiosClient.get(`/workspaces/${workspaceId}/copilot`);
        if (res.data && res.data.messages) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error('Failed to load copilot history:', err);
      } finally {
        setIsFetchingHistory(false);
      }
    }
    loadHistory();
  }, [workspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || isLoading) return;

    if (sourcesCount === 0) {
      alert('Please upload or ingest at least one research source before querying the copilot.');
      return;
    }

    const tempUserMsg: CopilotMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      message_text: q,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await axiosClient.post(`/workspaces/${workspaceId}/copilot`, { question: q });
      if (res.data && res.data.message) {
        setMessages(prev => [...prev, res.data.message]);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        message_text: `Error: ${err.response?.data?.message || err.message || 'Unable to process query.'}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseArray = (field: any): any[] => {
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

  const starterPrompts = [
    `Where do the ingested studies directly contradict each other regarding "${researchQuestion.slice(0, 50)}"?`,
    'Compare the sample sizes, species cohorts, and experimental rigor scores across all sources.',
    'What are the primary methodological limitations identified by the authors?',
    'What specific dosage or metric thresholds represent the safest operational window?'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px]">
      {/* Left 2 Cols: Chat Window */}
      <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Grounded Research Copilot
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Grounded in {sourcesCount} Sources
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Answers are strictly derived from your workspace documents with inline citations</p>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {isFetchingHistory ? (
            <div className="flex items-center justify-center h-full text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs font-mono">Loading grounded workspace memory...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Inquire About Your Research Corpus</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                Ask specific questions about methodologies, conflicting metrics, or evidentiary consensus across your {sourcesCount} ingested documents.
              </p>

              {/* Starter Question Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg text-left">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="p-3 bg-slate-950/60 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-300 transition-all text-left flex items-start gap-2 cursor-pointer group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              const citations: CopilotCitation[] = isAssistant ? parseArray(msg.citations) : [];
              const followUps: string[] = isAssistant ? parseArray(msg.follow_up_questions) : [];

              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3.5 ${isAssistant ? 'items-start' : 'items-start justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2.5 ${isAssistant ? '' : 'text-right'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-950/70 border border-slate-800/80 text-slate-200'
                          : 'bg-indigo-600 text-white shadow-md'
                      }`}
                    >
                      {/* Markdown rendered with line breaks */}
                      <div className="whitespace-pre-wrap font-sans space-y-2 text-left">
                        {msg.message_text}
                      </div>
                    </div>

                    {/* Inline Citation Badges */}
                    {isAssistant && citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mr-1">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          Citations:
                        </span>
                        {citations.map((cit, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setSelectedCitation(cit)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-950 border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-950/60 hover:border-indigo-500 transition-all cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="max-w-[150px] truncate">{cit.source_title}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Follow-up Question Chips */}
                    {isAssistant && followUps.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-emerald-400" />
                          Suggested Follow-ups:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {followUps.map((fu, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSend(fu)}
                              className="text-left px-2.5 py-1 text-[11px] rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-indigo-200 transition-colors cursor-pointer"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs text-indigo-300 font-mono">
                  Synthesizing indexed claims & verifying citations...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a grounded research question regarding your indexed sources..."
              disabled={isLoading || sourcesCount === 0}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuestion.trim() || sourcesCount === 0}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Col: Active Citation Inspector Inspector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Citation Inspector</h4>
          </div>

          {selectedCitation ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified Source Grounding
                </span>
                <h5 className="text-sm font-bold text-white mt-2 leading-snug">
                  {selectedCitation.source_title}
                </h5>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <p className="text-[11px] font-semibold text-indigo-400">Relevance to Query:</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCitation.relevance_note}
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  Key Supporting Excerpt:
                </p>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{selectedCitation.key_excerpt}"
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-medium text-slate-300">No Citation Selected</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Click any citation pill in the copilot conversation thread to inspect the underlying research paper quote and relevance rationale.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>Model: Gemini 2.5 Flash</span>
          <span className="text-emerald-400">Zero-Hallucination Policy</span>
        </div>
      </div>
    </div>
  );
};

export default CopilotChat;
