import React from 'react';
import { GraphNode, GraphEdge } from '../../types';
import { BookOpen, Bookmark, ExternalLink, X, Target } from 'lucide-react';

interface NodeDetailsPanelProps {
  node: GraphNode | null; edges?: GraphEdge[]; onClose: () => void; onOpenPaperStudy: (paperId: string) => void;
  onAddBookmark: (node: GraphNode) => void; onPivotPaper?: (paperId: string) => void;
  onRecenterGraph?: (nodeId: string, nodeLabel: string) => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ node, edges = [], onClose, onOpenPaperStudy, onAddBookmark, onRecenterGraph }) => {
  if (!node) return null;
  const metrics = node.metrics;
  const sourceUrl = node.data?.source_url as string | undefined;
  return <aside className="absolute right-4 top-4 bottom-4 w-[380px] z-20 bg-white border border-neutral-200 rounded-xl shadow-xl flex flex-col overflow-hidden text-neutral-800">
    <header className="p-4 border-b border-neutral-100 bg-neutral-50">
      <div className="flex justify-between items-center"><span className="px-2 py-1 rounded-full border text-[10px] uppercase font-bold">{node.type}</span><button onClick={onClose} aria-label="Close details"><X className="w-4 h-4" /></button></div>
      <h2 className="font-bold text-base mt-3">{node.label}</h2>{node.sub_label && <p className="text-xs text-neutral-500 mt-1">{node.sub_label}</p>}
    </header>
    <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
      {node.type === 'paper' && <>
        <dl className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-neutral-50 rounded"><dt className="text-neutral-500">Year</dt><dd>{node.year ?? 'Not available in the source'}</dd></div>
          <div className="p-2 bg-neutral-50 rounded"><dt className="text-neutral-500">Citations</dt><dd>{node.citations ?? 'Not available in the source'}</dd></div>
          <div className="p-2 bg-neutral-50 rounded col-span-2"><dt className="text-neutral-500">OpenAlex ID</dt><dd>{node.id}</dd></div>
        </dl>
        {Array.isArray(node.data?.authors) && node.data.authors.length > 0 && <p><strong>Authors: </strong>{node.data.authors.join(', ')}</p>}
        {node.data?.doi && <p><strong>DOI: </strong>{node.data.doi}</p>}
        {sourceUrl && <a className="inline-flex items-center gap-1 text-teal-800 underline" href={sourceUrl} target="_blank" rel="noreferrer">OpenAlex record <ExternalLink className="w-3 h-3" /></a>}
      </>}
      <section className="border-t pt-3"><p className="font-semibold mb-2">Retrieved relationships</p>
        {edges.filter(edge => edge.source === node.id || edge.target === node.id).length ? <ul className="space-y-2">{edges.filter(edge => edge.source === node.id || edge.target === node.id).slice(0, 12).map(edge => <li key={edge.id} className="p-2 bg-neutral-50 rounded"><strong>{edge.type}</strong>: {edge.rationale || edge.label || 'Relationship recorded in OpenAlex'}<span className="block text-[10px] text-neutral-500">{edge.source} → {edge.target}</span></li>)}</ul> : <p className="text-neutral-500">No retrieved relationships for this node.</p>}
      </section>
      {metrics && <div className="border-t pt-3"><p className="font-semibold mb-2">Graph measures for this retrieved graph</p><p>PageRank {metrics.pagerank.toFixed(4)} · Degree {metrics.degree_centrality.toFixed(4)}</p><p>Betweenness {metrics.betweenness_centrality.toFixed(4)} · Community {metrics.community_id || '—'}</p></div>}
    </div>
    <footer className="p-3 border-t bg-neutral-50 space-y-2">
      {onRecenterGraph && node.type === 'paper' && <button onClick={() => onRecenterGraph(node.id, node.label)} className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg"><Target className="w-4 h-4" />Re-center graph on this work</button>}
      {node.type === 'paper' && <button onClick={() => onOpenPaperStudy(node.id)} className="w-full flex items-center justify-center gap-2 py-2 bg-academic-900 text-white rounded-lg"><BookOpen className="w-4 h-4" />Study this paper</button>}
      <button onClick={() => onAddBookmark(node)} className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg bg-white"><Bookmark className="w-4 h-4" />Save to workspace</button>
    </footer>
  </aside>;
};
