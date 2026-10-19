import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ResearchGapSignal, CrossDomainData } from '../../types';
import { Sparkles, Compass, GitMerge, AlertCircle, ArrowRight } from 'lucide-react';

interface GapExplorerProps {
  query: string;
}

export const GapExplorer: React.FC<GapExplorerProps> = ({ query }) => {
  const [signals, setSignals] = useState<ResearchGapSignal[]>([]);
  const [crossDomain, setCrossDomain] = useState<CrossDomainData | null>(null);
  const [domainA, setDomainA] = useState('Computer Vision');
  const [domainB, setDomainB] = useState('Healthcare');
  const [loadingCross, setLoadingCross] = useState(false);

  useEffect(() => {
    api.fetchResearchGaps(query).then((res) => setSignals(res));
    handleFetchCrossDomain();
  }, [query]);

  const handleFetchCrossDomain = () => {
    setLoadingCross(true);
    api.fetchCrossDomain(domainA, domainB)
      .then((res) => setCrossDomain(res))
      .catch((err) => console.error(err))
      .finally(() => setLoadingCross(false));
  };

  return (
    <div className="space-y-6 text-neutral-800">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Structural Research Gap Signals & Cross-Domain Explorer</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Identifies structurally under-connected areas based on edge density, graph modularity, and betweenness centrality. These are mathematical signals presented for human research investigation.
        </p>
      </div>

      {/* Structural Gap Signals List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-teal-700" />
          <span>Detected Under-Connected Community Signals</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signals.map((sig) => (
            <div key={sig.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Confidence: {(sig.confidence_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Cross-edges: {sig.observed_cross_edges}
                  </span>
                </div>
                <h4 className="font-bold text-neutral-900 text-sm">{sig.title}</h4>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{sig.explanation}</p>
              </div>

              <div className="bg-teal-50 p-3 rounded-xl border border-teal-100/80 text-xs text-teal-900 font-medium space-y-1">
                <span className="font-bold block text-[10px] text-teal-800 uppercase tracking-wider">Actionable Signal</span>
                <p>{sig.actionable_signal}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Domain Connection Finder */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
          <GitMerge className="w-4 h-4 text-indigo-600" />
          <span>Cross-Domain Interdisciplinary Connection Finder</span>
        </h3>

        <div className="flex flex-col md:flex-row items-center gap-3">
          <input
            type="text"
            value={domainA}
            onChange={(e) => setDomainA(e.target.value)}
            placeholder="Domain A (e.g. Computer Vision)"
            className="flex-1 p-2.5 rounded-lg border border-neutral-200 text-xs bg-neutral-50 font-medium"
          />
          <ArrowRight className="w-4 h-4 text-neutral-400 hidden md:block" />
          <input
            type="text"
            value={domainB}
            onChange={(e) => setDomainB(e.target.value)}
            placeholder="Domain B (e.g. Healthcare)"
            className="flex-1 p-2.5 rounded-lg border border-neutral-200 text-xs bg-neutral-50 font-medium"
          />
          <button
            onClick={handleFetchCrossDomain}
            disabled={loadingCross}
            className="px-4 py-2.5 bg-academic-900 text-white rounded-lg text-xs font-medium hover:bg-academic-800 transition"
          >
            {loadingCross ? 'Mapping...' : 'Find Connections'}
          </button>
        </div>

        {crossDomain && (
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs space-y-3">
            <div className="font-semibold text-neutral-900">{crossDomain.structural_summary}</div>
            
            <div className="space-y-1">
              <span className="font-semibold text-neutral-600 text-[11px] block">Bridging Topics:</span>
              <div className="flex flex-wrap gap-2">
                {crossDomain.bridging_topics.map((t, idx) => (
                  <span key={idx} className="bg-white px-2.5 py-1 rounded border border-neutral-200 font-medium text-neutral-800">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="font-semibold text-neutral-600 text-[11px] block">Bridge Researchers:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {crossDomain.bridging_researchers.map((r, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded border border-neutral-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-neutral-900">{r.name}</div>
                      <div className="text-[10px] text-neutral-500">{r.institution} • {r.role}</div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      B: {r.betweenness.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
