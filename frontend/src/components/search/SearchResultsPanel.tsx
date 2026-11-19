import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUpRight, BookOpen, Loader2, Network, SlidersHorizontal } from 'lucide-react';
import { SearchItem } from '../../types';

interface SearchResultsPanelProps {
  query: string;
  items: SearchItem[];
  providerTotal: number | null;
  graphPaperCount: number;
  selectedId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string;
  onRetry: () => void;
  onLoadMore: () => void;
  onOpenStudy: (item: SearchItem) => void;
  onAddToGraph: (item: SearchItem) => void;
}

type SortMode = 'relevance' | 'year' | 'citations';

export const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({ query, items, providerTotal, graphPaperCount, selectedId, loading, loadingMore, hasMore, error, onRetry, onLoadMore, onOpenStudy, onAddToGraph }) => {
  const [sortMode, setSortMode] = useState<SortMode>('relevance');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const displayedItems = useMemo(() => {
    const from = yearFrom ? Number(yearFrom) : null;
    const to = yearTo ? Number(yearTo) : null;
    const filtered = items.filter(item => {
      if (openAccessOnly && item.open_access !== true) return false;
      if (from !== null && (item.year === undefined || item.year < from)) return false;
      if (to !== null && (item.year === undefined || item.year > to)) return false;
      return true;
    });
    if (sortMode === 'year') return [...filtered].sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity));
    if (sortMode === 'citations') return [...filtered].sort((a, b) => (b.citation_count ?? -Infinity) - (a.citation_count ?? -Infinity));
    return filtered;
  }, [items, openAccessOnly, sortMode, yearFrom, yearTo]);

  return <section className="max-w-[1240px] mx-auto w-full space-y-5 pb-10">
    <header className="rg-hero-surface rounded-2xl border border-neutral-200 px-6 md:px-8 py-6">
      <div className="rg-kicker">OpenAlex search / actual works</div>
      <h1 className="font-editorial text-4xl md:text-[44px] mt-2">Discover papers</h1>
      <p className="text-sm text-neutral-600 mt-2">Results stay available as you browse pages and explore the graph. The citation graph is a bounded view of retrieved records, not the full literature.</p>
      <p className="text-xs text-neutral-500 mt-2">Current topic: <span className="font-medium text-neutral-800">{query || 'Enter a topic in search above'}</span></p>
    </header>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Search coverage counts">
      <Coverage label="Provider total" value={providerTotal === null ? 'Unavailable' : providerTotal.toLocaleString()} note="OpenAlex matching works" />
      <Coverage label="Retrieved" value={items.length.toLocaleString()} note="Loaded pages, unique IDs" />
      <Coverage label="Displayed" value={displayedItems.length.toLocaleString()} note="After the current filters" />
      <Coverage label="Graph papers" value={graphPaperCount.toLocaleString()} note="Current bounded graph" />
    </div>

    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 overflow-hidden">
      <div className="p-4 md:p-5 border-b border-neutral-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-sage-800"/><div><h2 className="font-editorial text-xl">Search results</h2><p className="text-[11px] text-neutral-500 mt-0.5">Sort and filter the records retrieved so far; loading more results can widen the set.</p></div></div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[10px] text-neutral-500">Sort by<select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)} className="block mt-1 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-800"><option value="relevance">OpenAlex order</option><option value="year">Newest year</option><option value="citations">Most citations</option></select></label>
          <label className="text-[10px] text-neutral-500">Year from<input inputMode="numeric" value={yearFrom} onChange={e => setYearFrom(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Any" aria-label="Filter from publication year" className="block mt-1 h-8 w-20 rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-800" /></label>
          <label className="text-[10px] text-neutral-500">Year to<input inputMode="numeric" value={yearTo} onChange={e => setYearTo(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Any" aria-label="Filter to publication year" className="block mt-1 h-8 w-20 rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-800" /></label>
          <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 text-[11px] text-neutral-700"><input type="checkbox" checked={openAccessOnly} onChange={e => setOpenAccessOnly(e.target.checked)} className="accent-sage-700"/>Open access</label>
        </div>
      </div>

      {loading && items.length === 0 && <div className="p-12 text-center text-sm text-neutral-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-sage-700"/>Searching OpenAlex records…</div>}
      {error && <div role="alert" className="m-4 rounded-xl border border-coral-200 bg-coral-50 p-4 text-sm text-coral-800">{error}<button onClick={onRetry} className="ml-2 underline">Retry</button></div>}
      {!loading && !error && items.length === 0 && <div className="p-10 text-center text-sm text-neutral-500">No works were returned for this query.</div>}
      {!loading && !error && items.length > 0 && displayedItems.length === 0 && <div className="p-10 text-center text-sm text-neutral-500">No retrieved works match these filters.</div>}

      <div className="divide-y divide-neutral-200">
        {displayedItems.map((item, index) => <article key={item.id} className={'p-4 md:px-5 flex flex-col md:flex-row md:items-center gap-3 transition ' + (selectedId === item.id ? 'bg-highlight-50' : 'hover:bg-neutral-100/70')}>
          <span className="font-editorial text-lg text-sage-800/80 w-7 shrink-0">{String(index + 1).padStart(2, '0')}</span>
          <div className="min-w-0 flex-1">
            <button onClick={() => onOpenStudy(item)} className="text-left text-sm font-semibold text-neutral-900 hover:text-sage-900 leading-5">{item.title}</button>
            <p className="text-[11px] text-neutral-500 mt-1">{[item.venue, item.year].filter(Boolean).join(' · ') || 'Publication details unavailable'}{item.citation_count != null ? ` · ${item.citation_count.toLocaleString()} citations` : ''}{item.open_access ? ' · Open access' : ''}</p>
            {item.authors?.length ? <p className="text-[11px] text-neutral-600 mt-1 line-clamp-1">{item.authors.join(', ')}</p> : null}
          </div>
          {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" aria-label="Open OpenAlex record" className="text-neutral-500 hover:text-sage-900"><ArrowUpRight className="w-4 h-4"/></a>}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onOpenStudy(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"><BookOpen className="w-3.5 h-3.5"/>Study</button>
            <button onClick={() => onAddToGraph(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-highlight-500 px-3 py-2 text-[11px] font-semibold text-neutral-900 hover:bg-highlight-600"><Network className="w-3.5 h-3.5"/>Add to graph</button>
          </div>
        </article>)}
      </div>

      {hasMore && <div className="p-4 border-t border-neutral-200 flex justify-center"><button onClick={onLoadMore} disabled={loadingMore || loading} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-50">{loadingMore ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowDown className="w-4 h-4"/>}{loadingMore ? 'Loading more papers…' : 'Load more papers'}</button></div>}
      {!hasMore && items.length > 0 && <div className="p-4 border-t border-neutral-200 text-center text-[11px] text-neutral-500">No further page cursor was returned by OpenAlex.</div>}
    </section>
  </section>;
};

const Coverage: React.FC<{label:string;value:string;note:string}> = ({label,value,note}) => <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="rg-kicker">{label}</div><div className="font-editorial text-2xl mt-2">{value}</div><div className="text-[10px] text-neutral-500 mt-1">{note}</div></div>;
