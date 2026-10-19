export type EntityType = 'paper' | 'author' | 'institution' | 'topic';
export type RelevanceTier = 'core' | 'related' | 'adjacent';

export interface NodeMetrics {
  pagerank: number;
  degree_centrality: number;
  betweenness_centrality: number;
  community_id: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  year?: number;
  citations?: number;
  works_count?: number;
  sub_label?: string;
  relevance_tier?: RelevanceTier;
  connection_rationale?: string;
  metrics?: NodeMetrics;
  data?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  weight?: number;
}

export interface CommunityInfo {
  id: number;
  name: string;
  size: number;
  dominant_topic: string;
  paper_count: number;
  author_count: number;
  topic_count: number;
  sample_papers: string[];
  sample_authors: string[];
}

export interface ResearchGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    paper_count: number;
    author_count: number;
    institution_count: number;
    topic_count: number;
    core_count?: number;
    related_count?: number;
    adjacent_count?: number;
    community_count: number;
    density: number;
  };
  communities?: CommunityInfo[];
}

export interface SearchItem {
  id: string;
  type: EntityType;
  title: string;
  subtitle?: string;
  year?: number;
  citation_count?: number;
  works_count?: number;
  venue?: string;
  authors?: string[];
  open_access?: boolean;
}

export interface AbstractSection {
  problem: string;
  methodology: string;
  results: string;
  limitations: string;
}

export interface PaperReferenceItem {
  id: string;
  title: string;
  year: number;
  venue?: string;
  citation_count?: number;
  authors?: string[];
  rationale?: string;
}

export interface PaperStudyData {
  id: string;
  title: string;
  authors: { id?: string; name: string; institution?: string }[];
  institutions: { name: string }[];
  publication_year: number;
  venue: string;
  citation_count: number;
  open_access_pdf?: string;
  doi?: string;
  abstract: string;
  abstract_breakdown: AbstractSection;
  research_context: {
    predecessors: { id: string; title: string; year: number; venue?: string }[];
    current: { id: string; title: string; year: number }[];
    successors: { id: string; title: string; year: number; venue?: string }[];
  };
  references: PaperReferenceItem[];
  cited_by: PaperReferenceItem[];
  related_papers: { id: string; title: string; year: number; venue: string; citations: number; graph_rationale?: string }[];
  recommended_next: { id: string; title: string; venue: string; year: number; graph_rationale: string }[];
  local_graph: ResearchGraphData;
}

export interface ResearchGapSignal {
  id: string;
  title: string;
  community_a: string;
  community_b: string;
  observed_cross_edges: number;
  expected_density: number;
  confidence_score: number;
  explanation: string;
  actionable_signal: string;
}

export interface CrossDomainData {
  domain_a: string;
  domain_b: string;
  bridge_found: boolean;
  shortest_path: {
    found: boolean;
    path_length?: number;
    path_nodes?: string[];
    path_details?: { id: string; label: string; type: string }[];
    explanation?: string;
  };
  bridging_topics: string[];
  bridging_researchers: { name: string; institution: string; betweenness: number; role: string }[];
  structural_summary: string;
}

export interface BookmarkItem {
  id: number;
  entity_id: string;
  entity_type: EntityType;
  title: string;
  subtitle?: string;
  folder_name: string;
  created_at: string;
}

export interface PaperNote {
  paper_id: string;
  reading_status: 'Unread' | 'Reading' | 'Read' | 'Important';
  notes_markdown: string;
  updated_at?: string;
}
