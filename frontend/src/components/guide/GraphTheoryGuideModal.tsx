import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface GraphTheoryGuideModalProps { onClose: () => void; }

const sections = [
  { title: 'Node categories', text: 'Papers are OpenAlex works. Authors and institutions come from the works’ authorship and affiliation records. Topics come from the topic assignments attached to those works.' },
  { title: 'Relationship types', text: 'Citation (cites) links, authorship (authored) links, author–institution affiliation (affiliated_with), paper–topic assignments (has_topic), and OpenAlex related-work links (related_work) are shown when both endpoints are in the retrieved graph.' },
  { title: 'Citation direction', text: 'A citation arrow points from the citing work to the referenced work. For example, A → B means paper A cites paper B. Related-work and authorship relationships are not citation claims.' },
  { title: 'Search results and graph scope', text: 'Search Results are the OpenAlex works returned for your query (up to 30, with the current workspace request using 15). Core Only shows those works and their listed authors, institutions, and topics. Core + Related also requests up to 8 references and 5 related works for each of the first 10 results. Explore Full Network adds up to 20 citing works discovered from the first 5 results. The displayed graph is bounded by records OpenAlex returns.' },
  { title: 'Algorithms and measures', text: 'PageRank uses the directed citation subgraph with damping 0.85. Degree and betweenness centrality are calculated on the retrieved heterogeneous graph. Communities use NetworkX greedy modularity. Shortest citation path follows directed citation arrows in the bounded set of retrieved works; it is unweighted. Re-centering limits the graph to a neighborhood up to two hops from the selected work.' },
];

export const GraphTheoryGuideModal: React.FC<GraphTheoryGuideModalProps> = ({ onClose }) => <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in">
  <section role="dialog" aria-modal="true" aria-labelledby="guide-title" className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden text-neutral-800">
    <header className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
      <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-sage-900" /><div><h2 id="guide-title" className="font-editorial text-xl text-neutral-900">About the graph</h2><p className="text-[11px] text-neutral-500">How to read this retrieved OpenAlex network</p></div></div>
      <button onClick={onClose} aria-label="Close graph guide" className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"><X className="w-5 h-5" /></button>
    </header>
    <div className="p-6 space-y-3 overflow-y-auto flex-1 text-xs">{sections.map(section => <article key={section.title} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1"><h3 className="font-bold text-neutral-900 text-sm">{section.title}</h3><p className="text-neutral-700 leading-relaxed">{section.text}</p></article>)}</div>
    <footer className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end"><button onClick={onClose} className="px-4 py-1.5 bg-neutral-900 text-neutral-50 rounded-lg text-xs font-medium hover:bg-neutral-800">Close guide</button></footer>
  </section>
</div>;
