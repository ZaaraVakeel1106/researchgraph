import React, { useEffect, useState } from 'react';
import { PaperStudyData, PaperNote, PaperReferenceItem } from '../../types';
import { api } from '../../services/api';
import { BookOpen, Bookmark, FileText, Download, X, ArrowRight, CheckCircle, Tag, Clock, ChevronRight, HelpCircle } from 'lucide-react';

interface PaperStudyModalProps {
  paperId: string | null;
  onClose: () => void;
  onPivotPaper?: (newPaperId: string) => void;
}

export const PaperStudyModal: React.FC<PaperStudyModalProps> = ({ paperId, onClose, onPivotPaper }) => {
  const [data, setData] = useState<PaperStudyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<PaperNote>({ paper_id: paperId || '', reading_status: 'Unread', notes_markdown: '' });
  const [savingNote, setSavingNote] = useState(false);
  const [activeCitationTab, setActiveCitationTab] = useState<'references' | 'cited_by'>('references');

  useEffect(() => {
    if (!paperId) return;
    setLoading(true);
    api.fetchPaperStudy(paperId)
      .then((res) => {
        setData(res);
        return api.fetchPaperNote(paperId);
      })
      .then((n) => {
        setNote(n);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [paperId]);

  if (!paperId) return null;

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.savePaperNote(note);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleExportBibtex = () => {
    window.open('/api/workspace/export/bibtex', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden text-neutral-800">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/60">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-academic-900 text-white">
                EDITORIAL STUDY VIEW
              </span>
              {data && (
                <span className="text-xs text-neutral-500 font-mono">
                  {data.venue} • {data.publication_year} • {data.citation_count.toLocaleString()} citations
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-neutral-900 leading-snug">
              {loading ? 'Loading paper study view...' : data?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-academic-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Synthesizing paper context, citation references, and graph relationships...</p>
          </div>
        ) : data ? (
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
            {/* Authors & Institutions */}
            <div className="flex flex-wrap gap-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <span className="font-semibold text-neutral-800">Authors:</span>
              {data.authors.map((a, idx) => (
                <span key={idx} className="bg-white px-2 py-0.5 rounded border border-neutral-200 font-medium">
                  {a.name} ({a.institution || 'Research Inst.'})
                </span>
              ))}
            </div>

            {/* Abstract Section Breakdown */}
            <div className="space-y-3">
              <h3 className="font-bold text-neutral-900 text-base flex items-center space-x-2">
                <FileText className="w-4 h-4 text-academic-900" />
                <span>Why This Paper Matters (Structure & Methodology)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-1">
                  <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">Research Problem</div>
                  <p className="text-xs text-neutral-700 leading-relaxed">{data.abstract_breakdown.problem}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-1">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Methodology & Approach</div>
                  <p className="text-xs text-neutral-700 leading-relaxed">{data.abstract_breakdown.methodology}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-1">
                  <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Key Reported Results</div>
                  <p className="text-xs text-neutral-700 leading-relaxed">{data.abstract_breakdown.results}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-1">
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Stated Limitations</div>
                  <p className="text-xs text-neutral-700 leading-relaxed">{data.abstract_breakdown.limitations}</p>
                </div>
              </div>
            </div>

            {/* Research Context Chain */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-neutral-900 text-base flex items-center space-x-2">
                <Clock className="w-4 h-4 text-academic-900" />
                <span>Research Context & Temporal Chain</span>
              </h3>
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Predecessors */}
                <div className="flex-1 w-full bg-white p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Predecessor Work (References)</div>
                  {data.research_context.predecessors.slice(0, 2).map((p, idx) => (
                    <div key={idx} className="font-medium text-neutral-800 truncate">{p.title} ({p.year})</div>
                  ))}
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400 hidden md:block shrink-0" />
                {/* Current */}
                <div className="flex-1 w-full bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs space-y-1 shadow-xs">
                  <div className="text-[10px] font-bold text-teal-800 uppercase">Selected Paper</div>
                  <div className="font-bold text-teal-900 truncate">{data.title} ({data.publication_year})</div>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400 hidden md:block shrink-0" />
                {/* Successors */}
                <div className="flex-1 w-full bg-white p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Subsequent Work (Citing)</div>
                  {data.research_context.successors.slice(0, 2).map((s, idx) => (
                    <div key={idx} className="font-medium text-neutral-800 truncate">{s.title} ({s.year})</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive References vs Cited By Tabs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex space-x-4 text-sm font-bold">
                  <button
                    onClick={() => setActiveCitationTab('references')}
                    className={`pb-1 transition ${activeCitationTab === 'references' ? 'text-academic-900 border-b-2 border-academic-900' : 'text-neutral-400 hover:text-neutral-700'}`}
                  >
                    References ({data.references?.length || 2})
                  </button>
                  <button
                    onClick={() => setActiveCitationTab('cited_by')}
                    className={`pb-1 transition ${activeCitationTab === 'cited_by' ? 'text-academic-900 border-b-2 border-academic-900' : 'text-neutral-400 hover:text-neutral-700'}`}
                  >
                    Cited By ({data.cited_by?.length || 2})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(activeCitationTab === 'references' ? data.references : data.cited_by)?.map((refItem: PaperReferenceItem, idx: number) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-neutral-200 hover:border-academic-900 transition flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-neutral-900 text-xs">{refItem.title}</h4>
                      <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{refItem.venue} ({refItem.year})</p>
                      {refItem.rationale && <p className="text-[10px] text-academic-900 mt-1 font-medium">💡 {refItem.rationale}</p>}
                    </div>
                    {onPivotPaper && (
                      <button
                        onClick={() => onPivotPaper(refItem.id)}
                        className="p-1.5 text-neutral-400 hover:text-academic-900 rounded-lg hover:bg-neutral-100"
                        title="Pivot to this paper"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* "Why am I seeing this?" Recommended Next Cards */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-neutral-900 text-base">Recommended Literature & "Why Am I Seeing This?"</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.recommended_next.map((rec, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-semibold text-neutral-900 text-xs line-clamp-2">{rec.title}</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 font-mono">{rec.venue} ({rec.year})</p>
                    </div>
                    <div className="bg-academic-50 p-2 rounded-lg text-[11px] text-academic-900 font-medium leading-tight">
                      💡 {rec.graph_rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Workspace Notes & Reading Status */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 text-base">Personal Research Notes</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-neutral-500">Reading Status:</span>
                  <select
                    value={note.reading_status}
                    onChange={(e) => setNote({ ...note, reading_status: e.target.value as any })}
                    className="text-xs bg-neutral-100 border border-neutral-200 rounded-lg px-2.5 py-1 font-semibold text-neutral-800"
                  >
                    <option value="Unread">Unread</option>
                    <option value="Reading">Reading</option>
                    <option value="Read">Read</option>
                    <option value="Important">Important</option>
                  </select>
                </div>
              </div>
              <textarea
                value={note.notes_markdown}
                onChange={(e) => setNote({ ...note, notes_markdown: e.target.value })}
                placeholder="Write your personal literature review notes, key findings, or open research questions for this paper..."
                rows={4}
                className="w-full p-3 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-academic-900 focus:outline-none bg-neutral-50/50"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition"
              >
                {savingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <button
            onClick={handleExportBibtex}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export BibTeX</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-academic-900 text-white rounded-xl text-xs font-medium hover:bg-academic-800 transition shadow-xs"
          >
            Close Study View
          </button>
        </div>
      </div>
    </div>
  );
};
