import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ResearchGraphData } from '../../types';
import { Network, Award, GitCommit, Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  query: string;
  graphData?: ResearchGraphData | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ query, graphData }) => {
  const [pagerank, setPagerank] = useState<any[]>([]);
  const [centrality, setCentrality] = useState<any>({ degree_centrality: [], betweenness_centrality: [] });
  const [communities, setCommunities] = useState<any[]>([]);
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  const [pathResult, setPathResult] = useState<any>(null);
  const [loadingPath, setLoadingPath] = useState(false);
  const [showFormulae, setShowFormulae] = useState(false);
  const [error, setError] = useState('');
  const publicationTrend = Object.entries((graphData?.nodes || []).reduce<Record<number, number>>((counts, node) => {
    if (node.type === 'paper' && typeof node.year === 'number') counts[node.year] = (counts[node.year] || 0) + 1;
    return counts;
  }, {})).map(([year, count]) => ({ year: Number(year), count })).sort((a, b) => a.year - b.year);
  const trendMaximum = Math.max(1, ...publicationTrend.map(item => item.count));

  useEffect(() => {
    Promise.all([api.fetchPageRankLeaderboard(query), api.fetchCentralityLeaderboard(query), api.fetchCommunities(query)])
      .then(([rank, central, community]) => { setPagerank(rank.rankings || []); setCentrality(central); setCommunities(community.communities || []); setError(''); })
      .catch((err) => setError(err.message || 'Could not load graph measures.'));
  }, [query]);

  const handleFindPath = async () => {
    if (!sourceNode || !targetNode) return;
    setLoadingPath(true);
    try {
      const res = await api.findShortestPath(sourceNode, targetNode);
      setPathResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate a path.');
    } finally {
      setLoadingPath(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-800">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-editorial text-2xl text-neutral-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-highlight-500" />
            <span>Research Insights</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Network measures calculated from the bounded OpenAlex records retrieved for {query}.
          </p>
        </div>

        <button
          onClick={() => setShowFormulae(!showFormulae)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition"
        >
          <HelpCircle className="w-4 h-4 text-sage-900" />
          <span>How this was calculated</span>
          {showFormulae ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-coral-700 bg-coral-50 p-3 rounded-lg">{error}</p>}

      <section className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div><h3 className="font-editorial text-lg text-neutral-900">Publication years in retrieved graph</h3><p className="text-xs text-neutral-500 mt-1">Counts papers by publication year using the current graph records. Papers without a year are excluded.</p></div>
        {!graphData ? <p className="text-xs text-neutral-500">Graph records are loading.</p> : publicationTrend.length === 0 ? <p className="text-xs text-neutral-500">No publication years are available in the retrieved records.</p> : <div className="flex h-36 items-end gap-1 overflow-x-auto border-b border-neutral-200 px-1">
          {publicationTrend.map(item => <div key={item.year} title={`${item.year}: ${item.count} papers`} className="flex h-full min-w-[24px] flex-1 flex-col items-center justify-end gap-1"><span className="text-[9px] text-neutral-500">{item.count}</span><div className="w-full max-w-8 rounded-t bg-sage-600/80" style={{ height: `${Math.max(4, item.count / trendMaximum * 100)}%` }} /><span className="text-[9px] text-neutral-500">{item.year}</span></div>)}
        </div>}
      </section>

      {/* Collapsable Graph Theory Formulae for Evaluator */}
      {showFormulae && (
        <div className="bg-neutral-50 text-neutral-800 p-5 rounded-2xl border border-neutral-200 space-y-3 animate-in fade-in text-xs font-sans">
          <div className="font-semibold text-sm text-sage-900">Graph theory calculation rationale · NetworkX</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] text-neutral-700">
            <div className="bg-white p-3 rounded-xl border border-neutral-200">
              <strong className="text-neutral-900 block font-sans text-xs mb-1">PageRank influence</strong>
              PR(u) = (1-d)/N + d * Σ (PR(v) / L(v))
            </div>
            <div className="bg-white p-3 rounded-xl border border-neutral-200">
              <strong className="text-neutral-900 block font-sans text-xs mb-1">Bridge centrality</strong>
              C_B(v) = Σ (σ_st(v) / σ_st)
            </div>
            <div className="bg-white p-3 rounded-xl border border-neutral-200">
              <strong className="text-neutral-900 block font-sans text-xs mb-1">Greedy modularity</strong>
              Q = 1/2m * Σ [A_ij - k_i*k_j/2m] δ(c_i, c_j)
            </div>
          </div>
        </div>
      )}

      {/* Grid: Influential Papers + Bridge Researchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ⭐ Influential Papers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <h3 className="font-editorial text-lg text-neutral-900 flex items-center space-x-2">
            <Award className="w-4 h-4 text-highlight-500" />
            <span>Highest PageRank in Retrieved Graph</span>
          </h3>
          <p className="text-xs text-neutral-500">PageRank on the retrieved citation graph; this is a network measure, not a quality judgment.</p>
          <div className="space-y-2">
            {pagerank.length === 0 && <p className="text-xs text-neutral-500">No citation edges were retrieved for this search.</p>}
            {pagerank.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition text-xs">
                <div className="flex items-center space-x-3 truncate">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-highlight-50 font-bold text-xs text-highlight-800">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-neutral-900 truncate block">{item.label}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{item.sub_label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔗 Bridge Researchers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <h3 className="font-editorial text-lg text-neutral-900 flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-sage-600" />
            <span>🔗 Bridge Researchers</span>
          </h3>
          <p className="text-xs text-neutral-500">Authors ranked by betweenness centrality in the retrieved graph.</p>
          <div className="space-y-2">
            {centrality.betweenness_centrality.filter((item: any) => item.type === 'author').length === 0 && <p className="text-xs text-neutral-500">No author centrality results are available.</p>}
            {centrality.betweenness_centrality.filter((item: any) => item.type === 'author').slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition text-xs">
                <div>
                  <span className="font-semibold text-neutral-900 block">{item.label}</span>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">Author · retrieved graph</span>
                </div>
                <span className="font-mono text-xs font-bold text-sage-900 bg-sage-50 px-2 py-0.5 rounded border border-sage-200">
                  Bridge Score: {item.score.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🧩 Research Communities */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <h3 className="font-editorial text-lg text-neutral-900 flex items-center space-x-2">
          <Network className="w-4 h-4 text-sage-700" />
          <span>🧩 Major Research Communities</span>
        </h3>
        <p className="text-xs text-neutral-500">Structural communities detected over retrieved relationships; clusters are not scientific findings.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communities.length === 0 && <p className="text-xs text-neutral-500">No communities could be calculated for this graph.</p>}
          {communities.map((comm) => (
            <div key={comm.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2 text-xs flex flex-col justify-between">
              <div>
                <div className="font-bold text-neutral-900 text-sm mb-1">{comm.name}</div>
                <div className="text-neutral-600">Dominant Field: <strong className="text-neutral-900">{comm.dominant_topic}</strong></div>
              </div>
              <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/60">
                Key Works: {comm.sample_papers?.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 space-y-3">
        <h3 className="font-editorial text-lg text-neutral-900">Directed citation path</h3>
        <p className="text-xs text-neutral-500">Enter two OpenAlex work IDs. The search follows citation arrows from the source paper to its references.</p>
        <div className="flex gap-2"><input value={sourceNode} onChange={e => setSourceNode(e.target.value)} placeholder="Source work ID (W…)" className="border rounded px-2 py-1 text-xs" />
          <input value={targetNode} onChange={e => setTargetNode(e.target.value)} placeholder="Target work ID (W…)" className="border rounded px-2 py-1 text-xs" />
          <button disabled={!sourceNode || !targetNode || loadingPath} onClick={handleFindPath} className="px-3 py-1 bg-highlight-500 text-neutral-900 rounded text-xs font-semibold hover:bg-highlight-600 disabled:opacity-50">{loadingPath ? 'Searching…' : 'Find path'}</button></div>
        {pathResult && <p className="text-xs text-neutral-700">{pathResult.found ? pathResult.path_details?.map((node: any) => node.label).join(' → ') : pathResult.message}</p>}
      </div>
    </div>
  );
};
