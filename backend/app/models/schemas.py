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
    metrics: Optional[Dict[str, Any]] = Field(default_factory=dict)
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # cites, authored, affiliated_with, has_topic, collaborates_with
    label: Optional[str] = None
    weight: Optional[float] = 1.0

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

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]

# Paper Study View
class AbstractSection(BaseModel):
    problem: str
    methodology: str
    results: str
    limitations: str

class PaperStudyView(BaseModel):
    id: str
    title: str
    authors: List[Dict[str, str]]
    institutions: List[Dict[str, str]]
    publication_year: int
    venue: Optional[str] = "Scholarly Proceedings"
    citation_count: int
    open_access_pdf: Optional[str] = None
    doi: Optional[str] = None
    abstract: str
    abstract_breakdown: AbstractSection
    research_context: Dict[str, List[Dict[str, Any]]]  # predecessors, current, successors
    related_papers: List[Dict[str, Any]]
    recommended_next: List[Dict[str, Any]]
    local_graph: ResearchGraph

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
    created_at: str

class PaperNoteUpdate(BaseModel):
    paper_id: str
    reading_status: str  # Unread, Reading, Read, Important
    notes_markdown: str

class PaperNoteResponse(BaseModel):
    paper_id: str
    reading_status: str
    notes_markdown: str
    updated_at: str
