from fastapi import APIRouter, Query
from typing import Optional
from app.models.schemas import ResearchGraph
from app.services.graph_service import graph_service

router = APIRouter(prefix="/api/graph", tags=["Graph"])

@router.get("/landscape", response_model=ResearchGraph)
async def get_graph_landscape(
    q: str = Query("Graph Neural Networks", description="Research topic or search query"),
    mode: str = Query("landscape", description="Graph mode: citation, author_collaboration, landscape, topic")
):
    result = graph_service.build_graph_for_topic(topic_query=q, mode=mode)
    return ResearchGraph(**result)

@router.get("/mode/{mode_name}", response_model=ResearchGraph)
async def get_graph_by_mode(
    mode_name: str,
    q: str = Query("Graph Neural Networks")
):
    result = graph_service.build_graph_for_topic(topic_query=q, mode=mode_name)
    return ResearchGraph(**result)

@router.get("/entity/{entity_id}", response_model=ResearchGraph)
async def get_entity_neighborhood(
    entity_id: str,
    hops: int = Query(2, ge=1, le=3)
):
    result = graph_service.build_graph_for_topic(mode="landscape")
    return ResearchGraph(**result)
