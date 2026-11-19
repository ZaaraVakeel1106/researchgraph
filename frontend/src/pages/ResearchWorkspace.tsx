import React, { useEffect, useRef, useState } from 'react';
import { Header } from '../components/common/Header';
import { CytoscapeCanvas } from '../components/graph/CytoscapeCanvas';
import { NodeDetailsPanel } from '../components/details/NodeDetailsPanel';
import { PaperStudyModal } from '../components/study/PaperStudyModal';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { GapExplorer } from '../components/signals/GapExplorer';
import { WorkspaceModal } from '../components/workspace/WorkspaceModal';
import { GraphTheoryGuideModal } from '../components/guide/GraphTheoryGuideModal';
import { SearchResultsPanel } from '../components/search/SearchResultsPanel';
import { useToast } from '../components/common/ToastProvider';
import { api } from '../services/api';
import { BookmarkItem, GraphNode, ResearchGraphData, SearchItem } from '../types';
import { Network, LayoutDashboard, Compass, Library, BarChart3, GitBranch, ArrowLeft, ChevronRight, HelpCircle, SlidersHorizontal, Search, Loader2, ArrowUpRight } from 'lucide-react';

type WorkspaceView = 'dashboard' | 'discover' | 'graph' | 'analytics' | 'signals';
interface ResearchWorkspaceProps { initialQuery: string; onBackToHome: () => void; }

export const ResearchWorkspace: React.FC<ResearchWorkspaceProps> = ({ initialQuery, onBackToHome }) => {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState('core');
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>(initialQuery ? 'discover' : 'dashboard');
  const [graphData, setGraphData] = useState<ResearchGraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [graphError, setGraphError] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedSearchPaperId, setSelectedSearchPaperId] = useState<string | null>(null);
  const [centerLabel, setCenterLabel] = useState<string | null>(null);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [providerTotal, setProviderTotal] = useState<number | null>(null);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchRefresh, setSearchRefresh] = useState(0);
  const [graphSearchTerm, setGraphSearchTerm] = useState('');
  const [yearRange, setYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkError, setBookmarkError] = useState('');
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const [readingProgress, setReadingProgress] = useState<{ Read: number; Reading: number; Unread: number; Important: number } | null>(null);
  const requestId = useRef(0);
  const searchRequestId = useRef(0);
  const savingBookmarkIds = useRef(new Set<string>());
  const { showToast } = useToast();
  const [studyPaperId, setStudyPaperId] = useState<string | null>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const paperNodes = graphData?.nodes.filter(node => node.type === 'paper') || [];
  const publicationYears = paperNodes.map(node => node.year).filter((year): year is number => typeof year === 'number');
  const minYear = publicationYears.length ? Math.min(...publicationYears) : 1900;
  const maxYear = publicationYears.length ? Math.max(...publicationYears) : new Date().getFullYear();

  const loadGraph = (searchQuery: string, selectedScope = scope, centeredId = centerNodeId) => {
    const current = ++requestId.current;
    setLoadingGraph(true); setGraphError('');
    (centeredId ? api.fetchGraphEntity(centeredId, selectedScope) : api.fetchGraphLandscape(searchQuery, 'landscape', selectedScope))
      .then(data => { if (current === requestId.current) { setGraphData(data); setSelectedNode(centeredId ? data.nodes.find(node => node.id === centeredId) || null : null); } })
      .catch(error => { if (current === requestId.current) { setGraphData(null); setGraphError(error.message || 'Research data could not be retrieved.'); } })
      .finally(() => { if (current === requestId.current) setLoadingGraph(false); });
  };

  useEffect(() => { loadGraph(query, scope, centerNodeId); }, [query, scope, centerNodeId]);
  useEffect(() => {
    const current = ++searchRequestId.current;
    if (!query.trim()) { setSearchItems([]); setProviderTotal(null); setSearchCursor(null); setSearchError(''); return; }
    setSearchLoading(true); setLoadingMore(false); setSearchError(''); setSearchItems([]); setProviderTotal(null); setSearchCursor(null);
    api.searchPage(query, '*', 100)
      .then(page => { if (current === searchRequestId.current) { setSearchItems(page.results); setProviderTotal(page.provider_total ?? null); setSearchCursor(page.next_cursor || null); } })
      .catch(error => { if (current === searchRequestId.current) setSearchError(error.message || 'Search results could not be loaded.'); })
      .finally(() => { if (current === searchRequestId.current) setSearchLoading(false); });
  }, [query, searchRefresh]);
  useEffect(() => { api.fetchBookmarks().then(setBookmarks).catch(error => { const message = error.message || 'Saved papers could not be loaded.'; setBookmarkError(message); showToast('error', message, 'bookmarks-load'); }).finally(() => setBookmarksLoaded(true)); }, [showToast]);
  useEffect(() => { if (publicationYears.length) setYearRange([minYear, maxYear]); }, [graphData]);

  const handleSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    setCenterNodeId(null); setCenterLabel(null); setQuery(normalized); setActiveView('discover');
    setSearchRefresh(refresh => refresh + 1);
  };
  const loadMoreSearchResults = async () => {
    if (!searchCursor || loadingMore || searchLoading) return;
    const current = searchRequestId.current;
    const cursorUsed = searchCursor;
    setLoadingMore(true); setSearchError('');
    try {
      const page = await api.searchPage(query, cursorUsed, 100);
      if (current !== searchRequestId.current) return;
      setSearchItems(existing => {
        const byId = new Map(existing.map(item => [item.id, item]));
        page.results.forEach(item => { if (!byId.has(item.id)) byId.set(item.id, item); });
        return [...byId.values()];
      });
      setProviderTotal(page.provider_total ?? providerTotal);
      setSearchCursor(page.next_cursor && page.next_cursor !== cursorUsed ? page.next_cursor : null);
    } catch (error) { if (current === searchRequestId.current) setSearchError(error instanceof Error ? error.message : 'More search results could not be loaded.'); }
    finally { if (current === searchRequestId.current) setLoadingMore(false); }
  };
  const addPaperToGraph = (paperId: string, title: string) => {
    setSelectedSearchPaperId(paperId); setCenterNodeId(paperId); setCenterLabel(title); setSelectedNode(null); setActiveView('graph');
  };
  const openSearchPaper = (item: SearchItem) => {
    setSelectedSearchPaperId(item.id);
    setSelectedNode(graphData?.nodes.find(node => node.id === item.id) || null);
    setStudyPaperId(item.id);
  };
  const pivotStudyPaper = (paperId: string) => {
    setSelectedSearchPaperId(paperId);
    setSelectedNode(graphData?.nodes.find(node => node.id === paperId) || null);
    setStudyPaperId(paperId);
  };
  const handleGraphSelect = (node: GraphNode | null) => {
    setSelectedNode(node);
    if (node?.type === 'paper') setSelectedSearchPaperId(node.id);
  };
  const handleAddBookmark = async (node: GraphNode) => {
    if (savingBookmarkIds.current.has(node.id)) return;
    savingBookmarkIds.current.add(node.id);
    try {
      let currentBookmarks = bookmarks;
      if (!bookmarksLoaded) {
        currentBookmarks = await api.fetchBookmarks();
        setBookmarks(currentBookmarks);
        setBookmarksLoaded(true);
      }
      if (currentBookmarks.some(item => item.entity_id === node.id)) {
        showToast('info', node.type === 'paper' ? 'This paper is already in your library.' : 'This item is already in your library.', `paper-duplicate:${node.id}`);
        return;
      }
      const saved = await api.addBookmark({ entity_id: node.id, entity_type: node.type, title: node.label, subtitle: node.sub_label,
        metadata_json: { year: node.year, venue: node.data?.venue, doi: node.data?.doi, authors: node.data?.authors, source_url: node.data?.source_url } });
      setBookmarks(current => [saved, ...current.filter(item => item.entity_id !== saved.entity_id)]);
      showToast('success', node.type === 'paper' ? 'Paper saved to My Library.' : 'Item saved to My Library.', `paper-save:${node.id}`);
    } catch (error) { showToast('error', error instanceof Error ? error.message : 'Could not save this item. Please try again.', `paper-save-error:${node.id}`); }
    finally { savingBookmarkIds.current.delete(node.id); }
  };

  const navItems: { id: WorkspaceView | 'library'; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'graph', label: 'Research graph', icon: Network }, { id: 'library', label: 'My library', icon: Library },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }, { id: 'signals', label: 'Research signals', icon: GitBranch }
  ];
  const navigate = (id: WorkspaceView | 'library') => id === 'library' ? setShowWorkspace(true) : setActiveView(id);
  const savedPapers = bookmarks.filter(item => item.entity_type === 'paper');
  const graphPaperCount = graphData?.nodes.filter(node => node.type === 'paper').length || 0;
  useEffect(() => {
    let cancelled = false;
    if (!savedPapers.length) { setReadingProgress({ Read: 0, Reading: 0, Unread: 0, Important: 0 }); return () => { cancelled = true; }; }
    Promise.all(savedPapers.map(item => api.fetchPaperNote(item.entity_id)))
      .then(notes => {
        if (cancelled) return;
        const counts = { Read: 0, Reading: 0, Unread: 0, Important: 0 };
        notes.forEach(note => { counts[note.reading_status] += 1; });
        setReadingProgress(counts);
      })
      .catch(error => { if (!cancelled) { const message = error.message || 'Reading progress could not be loaded.'; setBookmarkError(message); showToast('error', message, 'reading-progress-load'); } });
    return () => { cancelled = true; };
  }, [bookmarks, showToast]);

  const dashboard = <div className="max-w-[1240px] mx-auto w-full space-y-7 pb-10">
    <section className="rg-hero-surface relative overflow-hidden rounded-2xl border border-neutral-200 px-6 md:px-9 py-7 md:py-9">
      <div className="rg-kicker">Research desk / active query</div>
      <div className="mt-3 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div><h1 className="font-editorial text-4xl md:text-[48px] leading-tight tracking-tight">{query}</h1><p className="text-sm text-neutral-500 mt-2">Explore the works and relationships retrieved for this search.</p></div>
        <button onClick={() => setActiveView('graph')} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-highlight-500 text-neutral-900 text-xs font-semibold hover:bg-highlight-600 transition">Open research graph <ChevronRight className="w-4 h-4"/></button>
      </div>
    </section>
    <section className="grid grid-cols-2 xl:grid-cols-5 gap-3">
      {[
        { label: 'Papers', value: graphData?.stats.paper_count, note: 'retrieved works' }, { label: 'Saved papers', value: savedPapers.length, note: 'in My Library' }, { label: 'Reading progress', value: readingProgress ? `${readingProgress.Read} read` : '…', note: readingProgress ? `${readingProgress.Reading} reading · ${readingProgress.Unread} unread · ${readingProgress.Important} important` : 'saved paper statuses' }, { label: 'Authors', value: graphData?.stats.author_count, note: 'listed authors' },
        { label: 'Relationships', value: graphData?.stats.total_edges, note: 'in this graph' }
      ].map(card => <div key={card.label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="rg-kicker">{card.label}</div><div className="font-editorial text-3xl mt-2">{loadingGraph ? '—' : card.value ?? '—'}</div><div className="text-[11px] text-neutral-500 mt-1">{card.note}</div></div>)}
    </section>
    <div className="grid xl:grid-cols-[1.35fr_.85fr] gap-6">
      <section className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-3"><div><div className="rg-kicker">From the current search</div><h2 className="font-editorial text-2xl mt-1">Retrieved papers</h2></div><button onClick={() => setActiveView('graph')} className="text-xs text-sage-900 hover:text-sage-700">View map <ChevronRight className="inline w-3.5 h-3.5 ml-1"/></button></div>
        <div className="divide-y divide-neutral-200/70">
          {loadingGraph && <div className="px-5 py-6 text-xs text-neutral-500 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading OpenAlex records…</div>}
          {!loadingGraph && !graphError && paperNodes.slice(0, 6).map((paper, index) => <button key={paper.id} onClick={() => setStudyPaperId(paper.id)} className="w-full text-left px-5 py-4 flex gap-4 items-start hover:bg-neutral-100 transition">
            <span className="font-editorial text-xl text-sage-900/80 w-6 shrink-0">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0"><span className="block text-sm font-medium text-neutral-900 line-clamp-2">{paper.label}</span><span className="block text-[11px] text-neutral-500 mt-1">{paper.sub_label || 'Publication details unavailable'}{paper.citations != null ? ' · ' + paper.citations.toLocaleString() + ' citations' : ''}</span></span><ArrowUpRight className="w-4 h-4 text-neutral-500 ml-auto shrink-0 mt-1"/>
          </button>)}
          {!loadingGraph && !graphError && paperNodes.length === 0 && <p className="px-5 py-6 text-xs text-neutral-500">No papers were retrieved for this search.</p>}
          {graphError && <div role="alert" className="px-5 py-6 text-xs text-coral-700">{graphError}<button onClick={() => loadGraph(query)} className="ml-2 underline">Retry</button></div>}
        </div>
      </section>
      <section className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between"><div><div className="rg-kicker">Your reading desk</div><h2 className="font-editorial text-2xl mt-1">Saved papers</h2></div><button onClick={() => setShowWorkspace(true)} className="text-xs text-sage-900">Open library</button></div>
        <div className="p-5 space-y-3">
          {bookmarkError && <p role="alert" className="text-xs text-coral-700">{bookmarkError}</p>}
          {!bookmarkError && savedPapers.length === 0 && <div className="py-5 text-center"><Library className="w-5 h-5 mx-auto text-neutral-500"/><p className="text-xs text-neutral-500 mt-3">Saved papers will appear here.</p></div>}
          {savedPapers.slice(0, 5).map(item => <button key={item.entity_id} onClick={() => setStudyPaperId(item.entity_id)} className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition"><span className="block text-xs font-medium text-neutral-900 line-clamp-2">{item.title}</span><span className="text-[10px] text-neutral-500 mt-1 block">{item.subtitle || item.entity_id}</span></button>)}
        </div>
      </section>
    </div>
  </div>;

  return <div className="rg-app h-[100dvh] min-h-[620px] flex overflow-hidden">
    <aside className="w-[62px] lg:w-[238px] shrink-0 bg-sidebar border-r border-neutral-200 flex flex-col px-2 lg:px-3 py-4 relative z-30">
      <button onClick={onBackToHome} className="flex items-center gap-3 px-2 lg:px-3 h-11 mb-7 text-left" title="Back to ResearchGraph search">
        <span className="w-9 h-9 shrink-0 rounded-xl border border-sage-900/30 bg-sage-900/15 text-sage-900 flex items-center justify-center"><Network className="w-[18px] h-[18px]"/></span>
        <span className="hidden lg:block min-w-0"><span className="block text-[11px] font-semibold tracking-[.14em]">RESEARCHGRAPH</span><span className="block text-[9px] uppercase tracking-[.13em] text-neutral-500 mt-1">Research studio</span></span>
      </button>
      <div className="hidden lg:flex items-center gap-2 px-3 py-2 mb-5 rounded-lg border border-neutral-200/80 bg-neutral-50"><span className="w-1.5 h-1.5 rounded-full bg-sage-900"/><span className="text-[10px] text-neutral-500 truncate">{query || 'No active query'}</span></div>
      <div className="rg-kicker hidden lg:block px-3 mb-2">Workspace</div>
      <nav className="space-y-1">{navItems.map(({ id, label, icon: Icon }) => {
        const active = id === 'library' ? showWorkspace : id === activeView;
        return <button key={id} onClick={() => navigate(id)} title={label} aria-current={active ? 'page' : undefined}
          className={'w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 h-10 rounded-lg text-xs transition ' + (active ? 'bg-highlight-100 text-neutral-900 border border-highlight-500/40' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}>
          <Icon className="w-[17px] h-[17px] shrink-0"/><span className="hidden lg:block">{label}</span>{active && <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-highlight-500"/>}
        </button>;
      })}</nav>
      <div className="mt-auto space-y-2">
        <div className="hidden lg:block border-t border-neutral-200/80 pt-4 px-3"><div className="rg-kicker">Graph scope</div><div className="text-[11px] text-neutral-500 mt-1">{scope === 'core' ? 'Search results' : scope === 'related' ? 'Related literature' : 'Expanded network'}</div></div>
        <button onClick={() => setShowGuide(true)} title="Graph theory guide" className="w-full h-10 flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 rounded-lg text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"><HelpCircle className="w-[17px] h-[17px] shrink-0"/><span className="hidden lg:block">About the graph</span></button>
        <button onClick={onBackToHome} title="Back to search" className="w-full h-10 flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 rounded-lg text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"><ArrowLeft className="w-[17px] h-[17px] shrink-0"/><span className="hidden lg:block">New search</span></button>
      </div>
    </aside>

    <div className="min-w-0 flex-1 flex flex-col">
      <Header query={query} onSearch={handleSearch} onOpenWorkspace={() => setShowWorkspace(true)} onOpenDoc={() => setShowGuide(true)}/>
      <main className={activeView === 'graph' ? 'min-h-0 flex-1 p-3 md:p-5 overflow-hidden' : 'min-h-0 flex-1 p-4 md:p-8 overflow-y-auto'}>
        {activeView === 'dashboard' && dashboard}
        {activeView === 'discover' && <SearchResultsPanel key={query} query={query} items={searchItems} providerTotal={providerTotal} graphPaperCount={graphPaperCount} selectedId={selectedSearchPaperId} loading={searchLoading} loadingMore={loadingMore} hasMore={Boolean(searchCursor)} error={searchError} onRetry={() => setSearchRefresh(refresh => refresh + 1)} onLoadMore={loadMoreSearchResults} onOpenStudy={openSearchPaper} onAddToGraph={item => addPaperToGraph(item.id, item.title)}/>}
        {activeView === 'graph' && <div className="h-full min-h-0 flex flex-col gap-3">
          <div className="shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 md:px-4 py-3">
            <div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded-lg bg-sage-900/12 text-sage-900 flex items-center justify-center shrink-0"><Network className="w-4 h-4"/></div><div className="min-w-0"><div className="text-xs font-semibold truncate">{centerLabel ? `Centered on ${centerLabel}` : query}</div><div className="text-[10px] text-neutral-500 mt-0.5">{graphData ? graphData.stats.paper_count + ' papers · ' + graphData.stats.total_nodes + ' entities · ' + graphData.stats.total_edges + ' relationships in this bounded graph' : 'Bounded OpenAlex network'}</div></div></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 border border-neutral-200" aria-label="Graph scope">{[['core','Core Only'],['related','Core + Related'],['full','Explore Full Network']].map(([value,label])=><button key={value} onClick={() => setScope(value)} aria-pressed={scope===value} title={value==='core'?'Search Results: OpenAlex works returned for this query, plus their listed authors, institutions and topics.':value==='related'?'Search Results plus up to 8 references and 5 related works for each of the first 10 core works.': 'Core + Related, plus up to 20 citing works discovered from the first 5 core works. In a centered graph, the selected paper is the core.'} className={'px-2.5 py-1.5 rounded-md text-[10px] font-medium transition ' + (scope===value?'bg-neutral-300 text-neutral-900 shadow-sm':'text-neutral-500 hover:text-neutral-900')}>{label}</button>)}</div>
              <label className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500"/><input aria-label="Filter graph nodes" value={graphSearchTerm} onChange={e => setGraphSearchTerm(e.target.value)} placeholder="Filter nodes" className="w-[130px] sm:w-[165px] h-8 pl-8 pr-2 rounded-lg bg-neutral-100 border border-neutral-200 text-[10px] placeholder:text-neutral-500 outline-none focus:border-sage-900/60"/></label>
            </div>
          </div>
          <div className="min-h-0 flex-1 relative">
            {loadingGraph ? <div className="h-full min-h-[360px] rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-3"><Loader2 className="w-5 h-5 text-sage-900 animate-spin"/><span className="text-xs text-neutral-500">Retrieving the research network…</span></div>
              : graphData ? <CytoscapeCanvas graphData={graphData} selectedNodeId={selectedNode?.id || null} onSelectNode={handleGraphSelect} yearRange={yearRange} searchTerm={graphSearchTerm}/>
              : <div role="alert" className="h-full min-h-[360px] rounded-xl border border-coral-200 bg-neutral-50 flex flex-col items-center justify-center text-center p-8"><p className="text-sm text-coral-700">{graphError || 'No research records were found.'}</p><button onClick={() => loadGraph(query)} className="mt-3 text-xs text-sage-900 underline">Retry</button></div>}
            {graphData && <NodeDetailsPanel node={selectedNode} edges={graphData.edges} onClose={() => setSelectedNode(null)} onOpenPaperStudy={setStudyPaperId} onAddBookmark={handleAddBookmark} onPivotPaper={setStudyPaperId} onRecenterGraph={(id,label) => { setCenterNodeId(id); setCenterLabel(label); setSelectedSearchPaperId(id); }}/>}
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-3 px-1 text-[10px] text-neutral-500">
            <span className="inline-flex items-center gap-1.5"><SlidersHorizontal className="w-3 h-3"/>Publication years</span><span className="font-mono text-neutral-700">{yearRange[0]}—{yearRange[1]}</span>
            <input aria-label="Earliest publication year" type="range" min={minYear} max={maxYear} value={Math.min(yearRange[0], maxYear)} onChange={e => setYearRange([Math.min(Number(e.target.value), yearRange[1]), yearRange[1]])} className="w-24 accent-highlight-600"/>
            <input aria-label="Latest publication year" type="range" min={minYear} max={maxYear} value={Math.max(yearRange[1], minYear)} onChange={e => setYearRange([yearRange[0], Math.max(Number(e.target.value), yearRange[0])])} className="w-24 accent-highlight-600"/>
            <span className="hidden lg:inline max-w-[480px]" title="Search Results are the works returned for the query. Core Only shows these works and associated entities; broader scopes add bounded citation and related-work records. Re-centering makes the selected work the core.">{scope === 'core' ? 'Search Results are the core works; associated entities are included.' : scope === 'related' ? 'Core + Related adds bounded references and related works.' : 'Explore Full Network adds a bounded sample of citing works.'} Citation arrows point from citing work to cited work.</span>
          </div>
        </div>}
        {activeView === 'analytics' && <div className="max-w-[1240px] mx-auto"><div className="mb-6"><div className="rg-kicker">Network measures / {query}</div><h1 className="font-editorial text-4xl mt-2">Analytics</h1><p className="text-sm text-neutral-500 mt-2">Measures describe the retrieved graph, not scholarly quality.</p></div><AnalyticsDashboard query={query} graphData={graphData}/></div>}
        {activeView === 'signals' && <div className="max-w-[1240px] mx-auto"><div className="mb-6"><div className="rg-kicker">Connections / OpenAlex records</div><h1 className="font-editorial text-4xl mt-2">Research signals</h1><p className="text-sm text-neutral-500 mt-2">Structural links are exploratory; sparse connections do not establish research gaps.</p></div><GapExplorer query={query}/></div>}
      </main>
    </div>
    {studyPaperId && <PaperStudyModal paperId={studyPaperId} onClose={() => setStudyPaperId(null)} onPivotPaper={pivotStudyPaper} onAddToGraph={(id,title) => { setStudyPaperId(null); addPaperToGraph(id,title); }}/>}
    {showWorkspace && <WorkspaceModal onClose={() => setShowWorkspace(false)} onOpenPaperStudy={setStudyPaperId} onBookmarksChange={setBookmarks}/>}
    {showGuide && <GraphTheoryGuideModal onClose={() => setShowGuide(false)}/>}
  </div>;
};
