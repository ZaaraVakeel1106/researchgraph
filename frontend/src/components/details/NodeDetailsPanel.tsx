import React, { useState } from 'react';
import { GraphNode } from '../../types';
import { BookOpen, Bookmark, GitCommit, Layers, ExternalLink, X, ArrowRight, HelpCircle, FileText, ChevronRight, Target } from 'lucide-react';

interface NodeDetailsPanelProps {
  node: GraphNode | null;
  onClose: () => void;
  onOpenPaperStudy: (paperId: string) => void;
  onAddBookmark: (node: GraphNode) => void;
  onPivotPaper?: (paperId: string) => void;
  onRecenterGraph?: (nodeId: string, nodeLabel: string) => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onOpenPaperStudy,
  onAddBookmark,
  onPivotPaper,
  onRecenterGraph
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'citations'>('overview');
  const [citationTab, setCitationTab] = useState<'references' | 'cited_by'>('references');

  if (!node) return null;

  const pr = node.metrics?.pagerank || 0;
  const degree = node.metrics?.degree_centrality || 0;
  const betweenness = node.metrics?.betweenness_centrality || 0;
  const commId = node.metrics?.community_id || 1;
  const tier = node.relevance_tier || 'core';

  const typeBg = {
    paper: 'bg-teal-50 text-teal-800 border-teal-200',
    author: 'bg-amber-50 text-amber-800 border-amber-200',
    institution: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    topic: 'bg-rose-50 text-rose-800 border-rose-200'
  }[node.type] || 'bg-neutral-50 text-neutral-800 border-neutral-200';

  const tierBadge = {
    core: 'bg-teal-100 text-teal-900 border-teal-300',
    related: 'bg-blue-100 text-blue-900 border-blue-300',
    adjacent: 'bg-amber-100 text-amber-900 border-amber-300 border-dashed'
  }[tier];

  // Sample references & cited by for selected paper
  const sampleReferences = [
    { id: 'W2562470718', title: 'Semi-Supervised Classification with GCN', year: 2017, venue: 'ICLR 2017' },
    { id: 'W2107936166', title: 'DeepWalk: Online Learning of Social Representations', year: 2014, venue: 'KDD 2014' }
  ];

  const sampleCitedBy = [
    { id: 'W3112345678', title: 'Graph Neural Networks in Bioinformatics', year: 2021, venue: 'Briefings in Bio 2021' },
    { id: 'W3201928374', title: 'Large Language Models for Graph Reasoning', year: 2023, venue: 'ACL 2023' }
  ];

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[420px] z-20 bg-white/95 backdrop-blur-2xl border border-neutral-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-800 transition-all duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 bg-neutral-50/70">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border ${typeBg}`}>
              {node.type}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border ${tierBadge}`}>
              {tier} tier
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-bold text-base text-neutral-900 mt-2 leading-snug">{node.label}</h3>
        {node.sub_label && (
          <p className="text-xs text-neutral-500 mt-1 font-mono">{node.sub_label}</p>
        )}

        {/* Navigation Tabs for Paper */}
        {node.type === 'paper' && (
          <div className="flex items-center space-x-1 mt-3 bg-neutral-200/60 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1 rounded-md transition ${activeTab === 'overview' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Overview & Context
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`flex-1 py-1 rounded-md transition ${activeTab === 'citations' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Citations & References
            </button>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* "Why is this related?" Explanation Box */}
        <div className="bg-academic-50/90 p-3.5 rounded-xl border border-academic-200 space-y-1">
          <div className="flex items-center space-x-1.5 text-academic-900 font-bold text-[11px] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Why is this node in the graph?</span>
          </div>
          <p className="text-neutral-800 leading-relaxed text-[11px] font-medium">
            {node.connection_rationale || `Connected work in the selected research landscape.`}
          </p>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <>
            {/* Re-center Graph Action Button */}
            {onRecenterGraph && (
              <button
                onClick={() => onRecenterGraph(node.id, node.label)}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-xl border border-neutral-300 transition text-xs shadow-xs"
              >
                <Target className="w-3.5 h-3.5 text-academic-900" />
                <span>Re-center Graph Landscape on "{node.label}"</span>
              </button>
            )}

            {/* Why This Paper Matters Card */}
            {node.type === 'paper' && (
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                <div className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-academic-900" />
                  <span>Why This Paper Matters</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-neutral-700">
                  <div>
                    <strong className="text-neutral-900 block text-[10px] uppercase">Research Problem:</strong>
                    Address computational complexity and non-Euclidean graph dependency modeling.
                  </div>
                  <div>
                    <strong className="text-neutral-900 block text-[10px] uppercase">Key Methodology:</strong>
                    Self-attensional graph convolution layers for dynamic node aggregation.
                  </div>
                </div>
              </div>
            )}

            {/* Research Context Timeline */}
            {node.type === 'paper' && (
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                <div className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider">Research Context Chain</div>
                <div className="flex items-center justify-between text-[11px] space-x-2">
                  <div className="bg-white p-2 rounded border border-neutral-200 flex-1 truncate">
                    <span className="text-[9px] font-bold text-neutral-400 block uppercase">PREVIOUS</span>
                    <span className="truncate block font-medium">GCN (2017)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <div className="bg-teal-50 p-2 rounded border border-teal-200 flex-1 truncate shadow-xs">
                    <span className="text-[9px] font-bold text-teal-800 block uppercase">THIS PAPER</span>
                    <span className="truncate block font-bold text-teal-900">GAT (2018)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <div className="bg-white p-2 rounded border border-neutral-200 flex-1 truncate">
                    <span className="text-[9px] font-bold text-neutral-400 block uppercase">SUBSEQUENT</span>
                    <span className="truncate block font-medium">BioGNN (2021)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Calculated Metrics Grid */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Graph Theory Metrics</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-neutral-100">
                  <span className="text-neutral-400 block text-[9px]">PAGERANK</span>
                  <span className="font-mono font-bold text-neutral-900">{pr.toFixed(4)}</span>
                </div>
                <div className="bg-white p-2 rounded border border-neutral-100">
                  <span className="text-neutral-400 block text-[9px]">DEGREE CENTR.</span>
                  <span className="font-mono font-bold text-neutral-900">{degree.toFixed(4)}</span>
                </div>
                <div className="bg-white p-2 rounded border border-neutral-100">
                  <span className="text-neutral-400 block text-[9px]">BETWEENNESS</span>
                  <span className="font-mono font-bold text-neutral-900">{betweenness.toFixed(4)}</span>
                </div>
                <div className="bg-white p-2 rounded border border-neutral-100">
                  <span className="text-neutral-400 block text-[9px]">COMMUNITY</span>
                  <span className="font-mono font-bold text-teal-800">Cluster #{commId}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Citations & References */}
        {activeTab === 'citations' && node.type === 'paper' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-neutral-200 pb-2">
              <button
                onClick={() => setCitationTab('references')}
                className={`text-xs font-bold pb-1 transition ${citationTab === 'references' ? 'text-academic-900 border-b-2 border-academic-900' : 'text-neutral-400 hover:text-neutral-700'}`}
              >
                References (Earlier Research)
              </button>
              <button
                onClick={() => setCitationTab('cited_by')}
                className={`text-xs font-bold pb-1 transition ${citationTab === 'cited_by' ? 'text-academic-900 border-b-2 border-academic-900' : 'text-neutral-400 hover:text-neutral-700'}`}
              >
                Cited By (Later Research)
              </button>
            </div>

            <div className="space-y-2">
              {(citationTab === 'references' ? sampleReferences : sampleCitedBy).map((item) => (
                <div key={item.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between hover:border-academic-900 transition">
                  <div>
                    <h4 className="font-semibold text-neutral-900 text-[11px]">{item.title}</h4>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{item.venue} ({item.year})</p>
                  </div>
                  {onPivotPaper && (
                    <button
                      onClick={() => onPivotPaper(item.id)}
                      className="p-1 text-neutral-400 hover:text-academic-900"
                      title="Inspect paper graph"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-neutral-100 bg-neutral-50 flex flex-col space-y-2">
        {node.type === 'paper' && (
          <button
            onClick={() => onOpenPaperStudy(node.id)}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-academic-900 hover:bg-academic-800 text-white font-medium rounded-xl text-xs transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Editorial Study View</span>
          </button>
        )}
        <button
          onClick={() => onAddBookmark(node)}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-700 font-medium rounded-xl text-xs border border-neutral-200 transition"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-500" />
          <span>Save to Workspace</span>
        </button>
      </div>
    </div>
  );
};
