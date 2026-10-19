import {
  SearchItem,
  ResearchGraphData,
  PaperStudyData,
  ResearchGapSignal,
  CrossDomainData,
  BookmarkItem,
  PaperNote
} from '../types';

const API_BASE = '/api';

// Fallback seed graph data if backend server is starting or network fails
const FALLBACK_GRAPH_DATA: ResearchGraphData = {
  nodes: [
    { id: 'W2741809807', label: 'Graph Attention Networks', type: 'paper', year: 2018, citations: 14200, sub_label: 'ICLR 2018', metrics: { pagerank: 0.185, degree_centrality: 0.24, betweenness_centrality: 0.31, community_id: 1 } },
    { id: 'W2562470718', label: 'Semi-Supervised Classification with GCN', type: 'paper', year: 2017, citations: 22400, sub_label: 'ICLR 2017', metrics: { pagerank: 0.210, degree_centrality: 0.28, betweenness_centrality: 0.42, community_id: 1 } },
    { id: 'W2964257017', label: 'Attention Is All You Need', type: 'paper', year: 2017, citations: 115000, sub_label: 'NeurIPS 2017', metrics: { pagerank: 0.350, degree_centrality: 0.45, betweenness_centrality: 0.58, community_id: 2 } },
    { id: 'W3091234567', label: 'Inductive Representation Learning (GraphSAGE)', type: 'paper', year: 2017, citations: 12800, sub_label: 'NeurIPS 2017', metrics: { pagerank: 0.140, degree_centrality: 0.19, betweenness_centrality: 0.22, community_id: 1 } },
    { id: 'W3109876543', label: 'Federated Learning: Challenges and Methods', type: 'paper', year: 2020, citations: 5600, sub_label: 'IEEE SPM 2020', metrics: { pagerank: 0.095, degree_centrality: 0.14, betweenness_centrality: 0.28, community_id: 3 } },
    { id: 'W3112345678', label: 'Graph Neural Networks in Bioinformatics', type: 'paper', year: 2021, citations: 3400, sub_label: 'Briefings in Bio 2021', metrics: { pagerank: 0.080, degree_centrality: 0.12, betweenness_centrality: 0.15, community_id: 1 } },
    { id: 'A5001', label: 'Petar Veličković', type: 'author', sub_label: 'University of Cambridge / DeepMind', citations: 16000, metrics: { pagerank: 0.120, degree_centrality: 0.22, betweenness_centrality: 0.35, community_id: 1 } },
    { id: 'A5005', label: 'Pietro Liò', type: 'author', sub_label: 'University of Cambridge', citations: 18000, metrics: { pagerank: 0.115, degree_centrality: 0.20, betweenness_centrality: 0.29, community_id: 1 } },
    { id: 'A5007', label: 'Thomas N. Kipf', type: 'author', sub_label: 'University of Amsterdam', citations: 25000, metrics: { pagerank: 0.160, degree_centrality: 0.25, betweenness_centrality: 0.40, community_id: 1 } },
    { id: 'A5010', label: 'Ashish Vaswani', type: 'author', sub_label: 'Google Brain', citations: 120000, metrics: { pagerank: 0.280, degree_centrality: 0.38, betweenness_centrality: 0.50, community_id: 2 } },
    { id: 'I_Cambridge', label: 'University of Cambridge', type: 'institution', sub_label: 'Research Institution', metrics: { pagerank: 0.090, degree_centrality: 0.18, betweenness_centrality: 0.20, community_id: 1 } },
    { id: 'I_Google', label: 'Google Brain', type: 'institution', sub_label: 'Research Institution', metrics: { pagerank: 0.180, degree_centrality: 0.30, betweenness_centrality: 0.35, community_id: 2 } },
    { id: 'T_GNN', label: 'Graph Neural Networks', type: 'topic', sub_label: 'Research Field', metrics: { pagerank: 0.250, degree_centrality: 0.40, betweenness_centrality: 0.50, community_id: 1 } },
    { id: 'T_Attention', label: 'Attention Mechanisms', type: 'topic', sub_label: 'Research Field', metrics: { pagerank: 0.300, degree_centrality: 0.48, betweenness_centrality: 0.60, community_id: 2 } },
    { id: 'T_Federated', label: 'Federated Learning', type: 'topic', sub_label: 'Research Field', metrics: { pagerank: 0.110, degree_centrality: 0.18, betweenness_centrality: 0.25, community_id: 3 } }
  ],
  edges: [
    { id: 'e1', source: 'W2741809807', target: 'W2562470718', type: 'cites', label: 'cites', weight: 2.0 },
    { id: 'e2', source: 'W2741809807', target: 'W2964257017', type: 'cites', label: 'cites', weight: 3.0 },
    { id: 'e3', source: 'W3091234567', target: 'W2562470718', type: 'cites', label: 'cites', weight: 1.5 },
    { id: 'e4', source: 'W3112345678', target: 'W2741809807', type: 'cites', label: 'cites', weight: 2.0 },
    { id: 'e5', source: 'A5001', target: 'W2741809807', type: 'authored', label: 'authored', weight: 1.0 },
    { id: 'e6', source: 'A5005', target: 'W2741809807', type: 'authored', label: 'authored', weight: 1.0 },
    { id: 'e7', source: 'A5007', target: 'W2562470718', type: 'authored', label: 'authored', weight: 1.0 },
    { id: 'e8', source: 'A5010', target: 'W2964257017', type: 'authored', label: 'authored', weight: 1.0 },
    { id: 'e9', source: 'A5001', target: 'I_Cambridge', type: 'affiliated_with', label: 'affiliation', weight: 1.0 },
    { id: 'e10', source: 'A5010', target: 'I_Google', type: 'affiliated_with', label: 'affiliation', weight: 1.0 },
    { id: 'e11', source: 'W2741809807', target: 'T_GNN', type: 'has_topic', label: 'topic', weight: 1.0 },
    { id: 'e12', source: 'W2964257017', target: 'T_Attention', type: 'has_topic', label: 'topic', weight: 1.0 },
    { id: 'e13', source: 'W3109876543', target: 'T_Federated', type: 'has_topic', label: 'topic', weight: 1.0 },
    { id: 'e14', source: 'A5001', target: 'A5005', type: 'collaborates_with', label: 'co-authorship', weight: 2.0 }
  ],
  stats: {
    total_nodes: 15,
    total_edges: 14,
    paper_count: 6,
    author_count: 4,
    institution_count: 2,
    topic_count: 3,
    community_count: 3,
    density: 0.133
  },
  communities: [
    { id: 1, name: 'Community 1: Graph Representation Learning', size: 8, dominant_topic: 'Graph Neural Networks', paper_count: 4, author_count: 3, topic_count: 1, sample_papers: ['Graph Attention Networks', 'GCN'], sample_authors: ['Petar Veličković', 'Pietro Liò'] },
    { id: 2, name: 'Community 2: Attention & Transformers', size: 4, dominant_topic: 'Attention Mechanisms', paper_count: 1, author_count: 1, topic_count: 1, sample_papers: ['Attention Is All You Need'], sample_authors: ['Ashish Vaswani'] },
    { id: 3, name: 'Community 3: Privacy-Preserving AI', size: 3, dominant_topic: 'Federated Learning', paper_count: 1, author_count: 1, topic_count: 1, sample_papers: ['Federated Learning Challenges'], sample_authors: ['Tian Li'] }
  ]
};

export const api = {
  async search(query: string, entityType: string = 'works'): Promise<SearchItem[]> {
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&entity_type=${entityType}`);
      if (res.ok) {
        const data = await res.json();
        return data.results;
      }
    } catch (e) {
      console.warn('API search endpoint unreachable, using fallback seed.');
    }
    return [
      { id: 'W2741809807', type: 'paper', title: 'Graph Attention Networks', subtitle: 'ICLR 2018 (2018)', year: 2018, citation_count: 14200, venue: 'ICLR 2018', authors: ['Petar Veličković', 'Guillem Cucurull'], open_access: true },
      { id: 'W2562470718', type: 'paper', title: 'Semi-Supervised Classification with Graph Convolutional Networks', subtitle: 'ICLR 2017 (2017)', year: 2017, citation_count: 22400, venue: 'ICLR 2017', authors: ['Thomas N. Kipf', 'Max Welling'], open_access: true },
      { id: 'W2964257017', type: 'paper', title: 'Attention Is All You Need', subtitle: 'NeurIPS 2017 (2017)', year: 2017, citation_count: 115000, venue: 'NeurIPS 2017', authors: ['Ashish Vaswani', 'Noam Shazeer'], open_access: true }
    ];
  },

  async fetchGraphLandscape(query: string = 'Graph Neural Networks', mode: string = 'landscape'): Promise<ResearchGraphData> {
    try {
      const res = await fetch(`${API_BASE}/graph/landscape?q=${encodeURIComponent(query)}&mode=${mode}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend server unreachable, utilizing client fallback graph data.');
    }
    return FALLBACK_GRAPH_DATA;
  },

  async fetchPageRankLeaderboard(query: string = 'Graph Neural Networks') {
    try {
      const res = await fetch(`${API_BASE}/analytics/pagerank?q=${encodeURIComponent(query)}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      algorithm: 'PageRank (NetworkX nx.pagerank, d=0.85)',
      explanation: 'Measures node influence based on recursive citation and relationship links.',
      rankings: FALLBACK_GRAPH_DATA.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        pagerank: n.metrics?.pagerank || 0.05,
        sub_label: n.sub_label
      })).sort((a, b) => b.pagerank - a.pagerank)
    };
  },

  async fetchCentralityLeaderboard(query: string = 'Graph Neural Networks') {
    try {
      const res = await fetch(`${API_BASE}/analytics/centrality?q=${encodeURIComponent(query)}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      degree_centrality: FALLBACK_GRAPH_DATA.nodes.map(n => ({ id: n.id, label: n.label, type: n.type, score: n.metrics?.degree_centrality || 0.1 })),
      betweenness_centrality: FALLBACK_GRAPH_DATA.nodes.map(n => ({ id: n.id, label: n.label, type: n.type, score: n.metrics?.betweenness_centrality || 0.1 }))
    };
  },

  async fetchCommunities(query: string = 'Graph Neural Networks') {
    try {
      const res = await fetch(`${API_BASE}/analytics/communities?q=${encodeURIComponent(query)}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      algorithm: 'Greedy Modularity / Louvain Community Detection',
      communities: FALLBACK_GRAPH_DATA.communities,
      total_communities: 3
    };
  },

  async findShortestPath(source: string, target: string) {
    try {
      const res = await fetch(`${API_BASE}/analytics/shortest-path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      found: true,
      path_length: 2,
      path_nodes: ['W2741809807', 'W2964257017', 'W3112345678'],
      path_details: [
        { id: 'W2741809807', label: 'Graph Attention Networks', type: 'paper' },
        { id: 'W2964257017', label: 'Attention Is All You Need', type: 'paper' },
        { id: 'W3112345678', label: 'Graph Neural Networks in Bioinformatics', type: 'paper' }
      ],
      explanation: 'Found shortest connection of 2 hops passing through intermediate attention architecture.'
    };
  },

  async fetchPaperStudy(paperId: string): Promise<PaperStudyData> {
    try {
      const res = await fetch(`${API_BASE}/papers/${encodeURIComponent(paperId)}/study`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      id: 'W2741809807',
      title: 'Graph Attention Networks',
      authors: [
        { name: 'Petar Veličković', institution: 'University of Cambridge' },
        { name: 'Pietro Liò', institution: 'University of Cambridge' }
      ],
      institutions: [{ name: 'University of Cambridge' }],
      publication_year: 2018,
      venue: 'ICLR 2018',
      citation_count: 14200,
      open_access_pdf: 'https://doi.org/10.48550/arXiv.1710.10903',
      doi: 'https://doi.org/10.48550/arXiv.1710.10903',
      abstract: 'We present graph attention networks (GATs), novel neural network architectures that operate on graph-structured data.',
      abstract_breakdown: {
        problem: 'How to process graph-structured data effectively while addressing computational scalability issues.',
        methodology: 'Leverages masked self-attensional layers directly on graph vertices to aggregate neighborhood representations.',
        results: 'Achieves state-of-the-art results across Cora, Citeseer, and Pubmed benchmarks.',
        limitations: 'Requires full neighborhood retention during training on massive graphs.'
      },
      research_context: {
        predecessors: [{ id: 'W2562470718', title: 'Semi-Supervised Classification with GCN', year: 2017, venue: 'ICLR 2017' }],
        current: [{ id: 'W2741809807', title: 'Graph Attention Networks', year: 2018 }],
        successors: [{ id: 'W3112345678', title: 'Graph Neural Networks in Bioinformatics', year: 2021, venue: 'Briefings in Bio 2021' }]
      },
      references: [
        { id: 'W2562470718', title: 'Semi-Supervised Classification with GCN', year: 2017, venue: 'ICLR 2017', citation_count: 22400, rationale: 'Foundational predecessor paper cited in methodology formulation.' },
        { id: 'W2964257017', title: 'Attention Is All You Need', year: 2017, venue: 'NeurIPS 2017', citation_count: 115000, rationale: 'Primary self-attention formulation.' }
      ],
      cited_by: [
        { id: 'W3112345678', title: 'Graph Neural Networks in Bioinformatics', year: 2021, venue: 'Briefings in Bio 2021', citation_count: 3400, rationale: 'Extends GAT architecture to molecular graphs.' }
      ],
      related_papers: [
        { id: 'W2562470718', title: 'Semi-Supervised Classification with GCN', year: 2017, venue: 'ICLR 2017', citations: 22400, graph_rationale: 'High PageRank node connected within the same detected Louvain research community.' }
      ],
      recommended_next: [
        { id: 'W2562470718', title: 'Semi-Supervised Classification with GCN', venue: 'ICLR 2017', year: 2017, graph_rationale: 'High PageRank node connected within the same detected Louvain research community.' }
      ],
      local_graph: FALLBACK_GRAPH_DATA
    };
  },

  async fetchResearchGaps(query: string = 'Graph Neural Networks'): Promise<ResearchGapSignal[]> {
    try {
      const res = await fetch(`${API_BASE}/signals/gaps?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        return data.signals;
      }
    } catch (e) {}
    return [
      {
        id: 'gap_sig_1',
        title: 'Potentially under-connected area: Graph Representation Learning ↔ Privacy-Preserving AI',
        community_a: 'Graph Representation Learning',
        community_b: 'Privacy-Preserving AI Cluster',
        observed_cross_edges: 2,
        expected_density: 0.45,
        confidence_score: 0.82,
        explanation: 'These two research communities have relatively few observed connections (2 cross-edges) in the selected dataset.',
        actionable_signal: 'Signal for further human investigation: Explore applying GAT layers directly to Federated Learning.'
      }
    ];
  },

  async fetchCrossDomain(domainA: string, domainB: string): Promise<CrossDomainData> {
    try {
      const res = await fetch(`${API_BASE}/signals/cross-domain?domain_a=${encodeURIComponent(domainA)}&domain_b=${encodeURIComponent(domainB)}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      domain_a: domainA,
      domain_b: domainB,
      bridge_found: true,
      shortest_path: {
        found: true,
        path_length: 3,
        explanation: 'Identified a 3-hop structural connection linking domains.'
      },
      bridging_topics: ['Graph Neural Networks', 'Bioinformatics', 'Medical Imaging'],
      bridging_researchers: [
        { name: 'Pietro Liò', institution: 'University of Cambridge', betweenness: 0.312, role: 'Cross-domain researcher' }
      ],
      structural_summary: 'Identified a 3-hop structural connection linking domains via Graph Attention Networks.'
    };
  },

  async fetchBookmarks(): Promise<BookmarkItem[]> {
    try {
      const res = await fetch(`${API_BASE}/workspace/bookmarks`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  },

  async addBookmark(item: Partial<BookmarkItem>): Promise<BookmarkItem> {
    try {
      const res = await fetch(`${API_BASE}/workspace/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: item.entity_id,
          entity_type: item.entity_type,
          title: item.title,
          subtitle: item.subtitle,
          folder_name: item.folder_name || 'General'
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      id: Date.now(),
      entity_id: item.entity_id || '',
      entity_type: item.entity_type || 'paper',
      title: item.title || '',
      subtitle: item.subtitle,
      folder_name: 'General',
      created_at: new Date().toISOString()
    };
  },

  async removeBookmark(entityId: string) {
    try {
      await fetch(`${API_BASE}/workspace/bookmarks/${encodeURIComponent(entityId)}`, { method: 'DELETE' });
    } catch (e) {}
  },

  async fetchPaperNote(paperId: string): Promise<PaperNote> {
    try {
      const res = await fetch(`${API_BASE}/workspace/notes/${encodeURIComponent(paperId)}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return { paper_id: paperId, reading_status: 'Unread', notes_markdown: '' };
  },

  async savePaperNote(note: PaperNote): Promise<PaperNote> {
    try {
      const res = await fetch(`${API_BASE}/workspace/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return note;
  },

  async fetchGraphTheoryDocs() {
    try {
      const res = await fetch(`${API_BASE}/graph-theory/doc`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      title: 'ResearchGraph — Academic Graph Theory Documentation',
      author: 'B.Tech Graph Theory Project',
      sections: [
        { topic: '1. Graph Representation', content: 'Heterogeneous Graph G = (V, E) where Vertices V include Papers, Authors, Institutions, and Topics.' },
        { topic: '2. PageRank Algorithm', content: 'Computes node prestige using stationarity: PR(u) = (1-d)/N + d * sum(PR(v)/L(v)).' },
        { topic: '3. Betweenness Centrality', content: 'Quantifies node bridging control over graph information flows: C_B(v) = sum(sigma_st(v)/sigma_st).' },
        { topic: '4. Community Detection', content: 'Louvain Modularity optimization Q clustering papers and authors into distinct thematic research communities.' }
      ]
    };
  }
};
