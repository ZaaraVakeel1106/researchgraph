import React, { useEffect, useState } from 'react';
import { Header } from '../components/common/Header';
import { CytoscapeCanvas } from '../components/graph/CytoscapeCanvas';
import { NodeDetailsPanel } from '../components/details/NodeDetailsPanel';
import { PaperStudyModal } from '../components/study/PaperStudyModal';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { GapExplorer } from '../components/signals/GapExplorer';
import { WorkspaceModal } from '../components/workspace/WorkspaceModal';
import { GraphTheoryGuideModal } from '../components/guide/GraphTheoryGuideModal';
import { api } from '../services/api';
import { ResearchGraphData, GraphNode } from '../types';
import { Network, Sparkles, Compass, BookOpen, GitBranch, Users, Clock, ArrowLeft, Filter, Search, Info } from 'lucide-react';

interface ResearchWorkspaceProps {
  initialQuery: string;
  onBackToHome: () => void;
}

export const ResearchWorkspace: React.FC<ResearchWorkspaceProps> = ({ initialQuery, onBackToHome }) => {
  const [query, setQuery] = useState(initialQuery);
  const [graphMode, setGraphMode] = useState('landscape');
  const [activeTab, setActiveTab] = useState<'overview' | 'canvas' | 'insights' | 'connections'>('overview');
  
  const [graphData, setGraphData] = useState<ResearchGraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([2015, 2026]);
  const [graphSearchTerm, setGraphSearchTerm] = useState('');

  // Modals
  const [studyPaperId, setStudyPaperId] = useState<string | null>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadGraph(query, graphMode);
  }, [query, graphMode]);

  const loadGraph = (q: string, mode: string) => {
    setLoadingGraph(true);
    api.fetchGraphLandscape(q, mode)
      .then((data) => {
        setGraphData(data);
        setSelectedNode(null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingGraph(false));
  };

  const handleAddBookmark = async (node: GraphNode) => {
    try {
      await api.addBookmark({
        entity_id: node.id,
        entity_type: node.type,
        title: node.label,
        subtitle: node.sub_label || ''
      });
      alert(`Saved "${node.label}" to your literature workspace!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePivotPaper = (paperId: string) => {
    setStudyPaperId(paperId);
  };

  const handleRecenterGraph = (nodeId: string, nodeLabel: string) => {
    setQuery(nodeLabel);
    loadGraph(nodeLabel, graphMode);
    setActiveTab('canvas');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#fafafa] text-neutral-900 font-sans overflow-hidden">
      {/* Top Bar Header */}
      <Header
        query={query}
        onSearch={(q) => { setQuery(q); setActiveTab('overview'); }}
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
        onOpenWorkspace={() => setShowWorkspace(true)}
        onOpenDoc={() => setShowGuide(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-neutral-200 bg-white/95 backdrop-blur-md flex flex-col justify-between p-4 z-20">
          <div className="space-y-6">
            <button
              onClick={onBackToHome}
              className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Search</span>
            </button>

            {/* Research Summary Card */}
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">CURRENT FIELD</span>
              <h4 className="font-bold text-neutral-900 text-sm truncate">{query}</h4>
              {graphData?.stats && (
                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                  <div className="bg-white p-1.5 rounded border border-neutral-100">
                    <span className="text-neutral-400 block text-[9px]">PAPERS</span>
                    <span className="font-bold text-neutral-800">{graphData.stats.paper_count}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-neutral-100">
                    <span className="text-neutral-400 block text-[9px]">AUTHORS</span>
                    <span className="font-bold text-neutral-800">{graphData.stats.author_count}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-neutral-100">
                    <span className="text-neutral-400 block text-[9px]">COMMUNITIES</span>
                    <span className="font-bold text-teal-800">{graphData.stats.community_count}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-neutral-100">
                    <span className="text-neutral-400 block text-[9px]">DENSITY</span>
                    <span className="font-bold text-neutral-800">{graphData.stats.density}</span>
                  </div>
                </div>
              )}
            </div>

            {/* View Tabs */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: Compass },
                { id: 'canvas', label: 'Research Map', icon: Network },
                { id: 'insights', label: 'Research Insights', icon: Sparkles }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-academic-900 text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Timeline Filters */}
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <span className="flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </span>
                <span className="font-mono text-neutral-800">{yearRange[0]}–{yearRange[1]}</span>
              </div>
              <input
                type="range"
                min="2015"
                max="2026"
                value={yearRange[0]}
                onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                className="w-full accent-academic-900"
              />
            </div>
          </div>
        </aside>

        {/* Center Main View Area */}
        <main className="flex-1 relative flex flex-col overflow-hidden bg-neutral-100/50 p-6">
          {/* TAB 1: RESEARCH OVERVIEW (Task-based Entry) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 overflow-y-auto pr-2 max-w-5xl mx-auto w-full">
              {/* Field Header */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">{query}</h1>
                  {graphData?.stats && (
                    <div className="flex items-center space-x-3 text-xs font-mono text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
                      <span>🟢 {graphData.stats.core_count || 5} Core</span> • 
                      <span>🔵 {graphData.stats.related_count || 6} Related</span> • 
                      <span>🟠 {graphData.stats.adjacent_count || 4} Adjacent</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-neutral-600">
                  Select a research task below or explore the relevance-tiered research map.
                </p>
              </div>

              {/* Task Action Cards Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">What are you looking to do?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => setActiveTab('canvas')}
                    className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs hover:border-academic-900 transition cursor-pointer space-y-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-sm">📚 Find Papers</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Discover foundational literature and high-impact works.</p>
                  </div>

                  <div
                    onClick={() => setActiveTab('canvas')}
                    className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs hover:border-academic-900 transition cursor-pointer space-y-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-sm">🧭 Understand the Field</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Explore major research areas & how they connect visually.</p>
                  </div>

                  <div
                    onClick={() => setStudyPaperId('W2741809807')}
                    className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs hover:border-academic-900 transition cursor-pointer space-y-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-sm">🔗 Trace a Paper</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Follow citation chains to see what came before and after.</p>
                  </div>
                </div>
              </div>

              {/* Research Map Preview Banner */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Interactive Research Map</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Click any paper node to see what it builds on, what came after it, and related research.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('canvas')}
                  className="px-5 py-2.5 bg-academic-900 text-white rounded-xl text-xs font-semibold hover:bg-academic-800 transition shrink-0"
                >
                  Open Research Map →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RESEARCH MAP (Canvas) */}
          {activeTab === 'canvas' && (
            <div className="relative w-full h-full flex flex-col space-y-3">
              {/* Contextual Banner Above Graph */}
              <div className="bg-white px-4 py-2.5 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10">
                <div className="flex items-center space-x-2 text-xs">
                  <Info className="w-4 h-4 text-academic-900 shrink-0" />
                  <span className="text-neutral-700 font-medium">
                    <strong>Click any node</strong> to inspect connection rationale or re-center the landscape around it.
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={graphSearchTerm}
                    onChange={(e) => setGraphSearchTerm(e.target.value)}
                    placeholder="Filter graph nodes by title..."
                    className="bg-neutral-100 px-2 py-1 rounded border border-neutral-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Cytoscape Graph Canvas */}
              <div className="flex-1 relative">
                {loadingGraph ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl border border-neutral-200 space-y-3">
                    <div className="w-8 h-8 border-2 border-academic-900 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-neutral-500 font-medium">Mapping research landscape for {query}...</p>
                  </div>
                ) : graphData ? (
                  <CytoscapeCanvas
                    graphData={graphData}
                    selectedNodeId={selectedNode?.id || null}
                    onSelectNode={(n) => setSelectedNode(n)}
                    yearRange={yearRange}
                    searchTerm={graphSearchTerm}
                  />
                ) : null}

                {/* Right Slide-over Context Panel */}
                <NodeDetailsPanel
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  onOpenPaperStudy={(pid) => setStudyPaperId(pid)}
                  onAddBookmark={handleAddBookmark}
                  onPivotPaper={handlePivotPaper}
                  onRecenterGraph={handleRecenterGraph}
                />
              </div>
            </div>
          )}

          {/* TAB 3: INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="overflow-y-auto h-full pr-2 max-w-5xl mx-auto w-full">
              <AnalyticsDashboard query={query} />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {studyPaperId && (
        <PaperStudyModal
          paperId={studyPaperId}
          onClose={() => setStudyPaperId(null)}
          onPivotPaper={handlePivotPaper}
        />
      )}

      {showWorkspace && (
        <WorkspaceModal
          onClose={() => setShowWorkspace(false)}
          onOpenPaperStudy={(pid) => setStudyPaperId(pid)}
        />
      )}

      {showGuide && (
        <GraphTheoryGuideModal
          onClose={() => setShowGuide(false)}
        />
      )}
    </div>
  );
};
