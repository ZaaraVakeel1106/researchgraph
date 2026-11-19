from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

# Node & Edge Models
class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # paper, author, institution, topic
    year: Optional[int] = None
    citations: Optional[int] = 0
    works_count: Optional[int] = 0
    sub_label: Optional[str] = None
    relevance_tier: Optional[str] = None
    connection_rationale: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = Field(default_factory=dict)
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # cites, authored, affiliated_with, has_topic, collaborates_with
    label: Optional[str] = None
    weight: Optional[float] = 1.0
    rationale: Optional[str] = None

class ResearchGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any]
    communities: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

# Search schemas
class SearchResultItem(BaseModel):
    id: str
    type: str  # paper, author, topic, institution
    title: str
    subtitle: Optional[str] = None
    year: Optional[int] = None
    citation_count: Optional[int] = 0
    works_count: Optional[int] = 0
    venue: Optional[str] = None
    authors: Optional[List[str]] = Field(default_factory=list)
    open_access: Optional[bool] = False
    source_id: Optional[str] = None
    source_url: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
    provider_total: Optional[int] = None
    next_cursor: Optional[str] = None

# Paper Study View
class AbstractSection(BaseModel):
    problem: str
    methodology: str
    results: str
    limitations: str

class PaperStudyView(BaseModel):
    id: str
    title: str
    authors: List[Dict[str, Any]] = Field(default_factory=list)
    institutions: List[Dict[str, Any]] = Field(default_factory=list)
    publication_year: Optional[int] = None
    publication_date: Optional[str] = None
    venue: Optional[str] = None
    citation_count: Optional[int] = None
    open_access: Optional[bool] = None
    open_access_pdf: Optional[str] = None
    doi: Optional[str] = None
    landing_page: Optional[str] = None
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    abstract: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    abstract_breakdown: Optional[AbstractSection] = None
    research_context: Dict[str, List[Dict[str, Any]]]  # predecessors, current, successors
    references: List[Dict[str, Any]] = Field(default_factory=list)
    cited_by: List[Dict[str, Any]] = Field(default_factory=list)
    related_papers: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_next: List[Dict[str, Any]] = Field(default_factory=list)

# Bookmark & Note schemas
class BookmarkCreate(BaseModel):
    entity_id: str
    entity_type: str
    title: str
    subtitle: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = Field(default_factory=dict)
    folder_name: Optional[str] = "General"

class BookmarkResponse(BaseModel):
    id: int
    entity_id: str
    entity_type: str
    title: str
    subtitle: Optional[str] = None
    folder_name: str
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: str

class PaperNoteUpdate(BaseModel):
    paper_id: str
    reading_status: str = Field(pattern="^(Unread|Reading|Read|Important)$")
    notes_markdown: str

class PaperNoteResponse(BaseModel):
    paper_id: str
    reading_status: str
    notes_markdown: str
    updated_at: str
