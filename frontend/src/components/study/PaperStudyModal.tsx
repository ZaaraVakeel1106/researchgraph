import React, { useEffect, useState } from 'react';
import { PaperStudyData, PaperNote, PaperReferenceItem } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../common/ToastProvider';
import { Download, X, ExternalLink, ChevronLeft } from 'lucide-react';

interface PaperStudyModalProps { paperId: string | null; onClose: () => void; onPivotPaper?: (newPaperId: string) => void; onAddToGraph?: (paperId: string, title: string) => void; }

export const PaperStudyModal: React.FC<PaperStudyModalProps> = ({ paperId, onClose, onPivotPaper, onAddToGraph }) => {
  const [data, setData] = useState<PaperStudyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState<PaperNote>({ paper_id: paperId || '', reading_status: 'Unread', notes_markdown: '' });
  const [savedNote, setSavedNote] = useState<PaperNote>({ paper_id: paperId || '', reading_status: 'Unread', notes_markdown: '' });
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const { showToast } = useToast();
  const [activeCitationTab, setActiveCitationTab] = useState<'references' | 'cited_by' | 'related'>('references');
  const [history, setHistory] = useState<string[]>([]);

  const retryLoad = async (id: string) => {
    setLoading(true); setError('');
    try {
      const [study, savedNote] = await Promise.all([api.fetchPaperStudy(id), api.fetchPaperNote(id)]);
      setData(study); setNote(savedNote); setSavedNote(savedNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retrieve this paper.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!paperId) return;
    let cancelled = false;
    setLoading(true); setError(''); setData(null);
    Promise.all([api.fetchPaperStudy(paperId), api.fetchPaperNote(paperId)])
      .then(([study, savedNote]) => { if (!cancelled) { setData(study); setNote(savedNote); setSavedNote(savedNote); } })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not retrieve this paper.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [paperId]);

  if (!paperId) return null;
  const navigateTo = (id: string) => { if (!onPivotPaper) return; setHistory((old) => [...old, paperId]); onPivotPaper(id); };
  const goBack = () => { const prior = history[history.length - 1]; if (!prior || !onPivotPaper) return; setHistory((old) => old.slice(0, -1)); onPivotPaper(prior); };
  const saveNote = async () => {
    if (!paperId || savingNote || savingStatus) return;
    setSavingNote(true);
    try {
      const saved = await api.savePaperNote({ ...note, paper_id: paperId });
      setNote(saved); setSavedNote(saved); showToast('success', 'Note saved successfully.', `notes-save:${paperId}`);
    } catch (err) { showToast('error', err instanceof Error ? err.message : 'Could not save notes. Please try again.', `notes-error:${paperId}`); }
    finally { setSavingNote(false); }
  };
  const updateReadingStatus = async (status: PaperNote['reading_status']) => {
    if (!paperId || savingStatus || savingNote || status === savedNote.reading_status) return;
    setSavingStatus(true);
    try {
      const saved = await api.savePaperNote({ ...savedNote, paper_id: paperId, reading_status: status });
      setSavedNote(saved);
      setNote(current => ({ ...current, paper_id: paperId, reading_status: saved.reading_status }));
      showToast('success', 'Reading status updated.', `reading-status:${paperId}`);
    } catch (err) { showToast('error', err instanceof Error ? err.message : 'Could not update reading status. Please try again.', `reading-status-error:${paperId}`); }
    finally { setSavingStatus(false); }
  };
  const exportBibtex = () => window.open(`/api/workspace/export/bibtex?paper_ids=${encodeURIComponent(paperId)}`, '_blank', 'noopener,noreferrer');
  const items: PaperReferenceItem[] = activeCitationTab === 'references' ? (data?.references || []) : activeCitationTab === 'cited_by' ? (data?.cited_by || []) : (data?.related_papers || []);
  const notAvailable = 'Not available in the source';

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60">
    <section role="dialog" aria-modal="true" aria-labelledby="study-title" className="bg-white w-full max-w-5xl max-h-[94vh] rounded-xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden text-neutral-800">
      <header className="p-5 border-b flex items-start justify-between gap-4 bg-neutral-50">
        <div className="min-w-0">{history.length > 0 && <button onClick={goBack} className="text-xs text-sage-800 inline-flex items-center mb-2"><ChevronLeft className="w-4 h-4" />Previous paper</button>}
          <p className="text-[10px] font-bold uppercase tracking-wider text-sage-800">Paper study</p>
          <h2 id="study-title" className="font-editorial text-2xl md:text-3xl leading-tight mt-1">{loading ? 'Loading paper…' : data?.title || 'Paper details unavailable'}</h2>
          {data && <p className="text-xs text-neutral-600 mt-1">{data.venue || notAvailable} · {data.publication_year || notAvailable} · {data.citation_count ?? notAvailable} citations</p>}
        </div><button onClick={onClose} aria-label="Close study view"><X className="w-5 h-5" /></button>
      </header>
      {loading ? <div className="p-12 text-center text-sm text-neutral-500">Loading OpenAlex record and citation context…</div> : error ? <div role="alert" className="m-6 p-5 rounded-lg bg-coral-50 text-coral-800 text-sm">{error}<button onClick={() => retryLoad(paperId)} className="ml-3 underline">Retry</button></div> : data ? <main className="p-5 overflow-y-auto flex-1 space-y-5 text-sm">
        <section className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><h3 className="font-editorial text-xl">Paper overview</h3>
            <p><strong>Authors: </strong>{data.authors.length ? data.authors.map(a => a.name).filter(Boolean).join(', ') : notAvailable}</p>
            <p><strong>Publication date: </strong>{data.publication_date || notAvailable}</p><p><strong>Source: </strong>{data.venue || notAvailable}</p>
            <p><strong>DOI: </strong>{data.doi || notAvailable}</p><p><strong>OpenAlex ID: </strong>{data.id}</p>
            <p><strong>Open access: </strong>{data.open_access === undefined || data.open_access === null ? notAvailable : data.open_access ? 'Yes' : 'No'}</p>
            {data.topics.length > 0 && <p><strong>Topics: </strong>{data.topics.join(', ')}</p>}
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg space-y-2 border border-neutral-200"><h3 className="font-editorial text-xl">Read the paper</h3>
            {data.open_access_pdf ? <a href={data.open_access_pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sage-800 underline">Open available full text / PDF <ExternalLink className="w-3 h-3" /></a> : <p className="text-neutral-600">No open access PDF is listed by OpenAlex.</p>}
            {(data.landing_page || data.doi || data.source_url) && <div className="flex flex-wrap gap-3">{data.landing_page && <a href={data.landing_page} target="_blank" rel="noreferrer" className="underline text-sage-800">Publisher or source page</a>}{data.doi && <a href={data.doi} target="_blank" rel="noreferrer" className="underline text-sage-800">DOI page</a>}{data.source_url && <a href={data.source_url} target="_blank" rel="noreferrer" className="underline text-sage-800">OpenAlex record</a>}</div>}
          </div>
        </section>
        <section className="space-y-2"><h3 className="font-editorial text-xl">Abstract</h3><p className="p-5 bg-neutral-100 border border-neutral-200 rounded-lg whitespace-pre-wrap leading-7 text-[14px]">{data.abstract || 'Abstract not available in the source.'}</p><p className="text-xs text-neutral-500">The abstract is not the complete paper. Research problem, methods, results and limitations are not inferred from the title.</p></section>
        <section className="space-y-3"><div className="flex gap-4 border-b">{(['references', 'cited_by', 'related'] as const).map(tab => <button key={tab} onClick={() => setActiveCitationTab(tab)} className={`pb-2 text-xs font-semibold ${activeCitationTab === tab ? 'border-b-2 border-sage-800 text-sage-900' : 'text-neutral-500'}`}>{tab === 'references' ? `References (${data.references.length})` : tab === 'cited_by' ? `Cited by (${data.cited_by.length})` : `Related works (${data.related_papers.length})`}</button>)}</div>
          {items.length ? <ul className="divide-y">{items.map(item => <li key={item.id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"><div><p className="font-medium">{item.title}</p><p className="text-xs text-neutral-500">{item.venue || notAvailable} · {item.year ?? notAvailable}{item.authors?.length ? ` · ${item.authors.join(', ')}` : ''}</p></div><div className="flex gap-3 shrink-0"><button onClick={() => navigateTo(item.id)} className="text-xs text-sage-800 underline">Open paper</button><button onClick={() => onAddToGraph?.(item.id, item.title)} className="text-xs text-sage-800 underline">Add to graph</button></div></li>)}</ul> : <p className="text-sm text-neutral-500 py-4">No {activeCitationTab === 'cited_by' ? 'citing works' : activeCitationTab === 'references' ? 'references' : 'related works'} were retrieved.</p>}
        </section>
        <section className="space-y-3 border-t border-neutral-200 pt-4"><div className="flex items-center justify-between"><h3 className="font-editorial text-xl">Personal notes</h3><select aria-label="Reading status" disabled={savingStatus || savingNote} value={note.reading_status} onChange={e => updateReadingStatus(e.target.value as PaperNote['reading_status'])} className="border border-neutral-200 bg-neutral-100 rounded px-2 py-1 text-xs disabled:opacity-60"><option>Unread</option><option>Reading</option><option>Read</option><option>Important</option></select></div>
          <textarea value={note.notes_markdown} onChange={e => setNote({ ...note, notes_markdown: e.target.value })} rows={4} className="w-full border border-neutral-200 bg-neutral-50 rounded-lg p-3 text-sm" placeholder="Your notes for this paper" />
          <div className="flex items-center gap-3"><button onClick={saveNote} disabled={savingNote || savingStatus} className="px-4 py-2 bg-highlight-500 text-neutral-900 font-semibold rounded-lg text-xs hover:bg-highlight-600 disabled:opacity-60">{savingNote ? 'Saving…' : 'Save notes'}</button>{savingStatus && <span role="status" className="text-xs text-neutral-500">Updating status…</span>}</div>
        </section>
      </main> : null}
      <footer className="p-3 border-t border-neutral-200 bg-neutral-50 flex justify-between"><button onClick={exportBibtex} disabled={!data} className="inline-flex gap-2 items-center px-3 py-2 border border-neutral-200 rounded-lg text-xs disabled:opacity-50"><Download className="w-4 h-4" />Export BibTeX</button><button onClick={onClose} className="px-4 py-2 bg-neutral-900 text-neutral-50 font-semibold rounded-lg text-xs hover:bg-neutral-800">Close</button></footer>
    </section>
  </div>;
};
