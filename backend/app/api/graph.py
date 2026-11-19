from fastapi import APIRouter, Query
from typing import Optional
from app.models.schemas import ResearchGraph
from app.services.graph_service import graph_service

router = APIRouter(prefix="/api/graph", tags=["Graph"])

@router.get("/landscape", response_model=ResearchGraph)
async def get_graph_landscape(
    q: str = Query(..., min_length=1, description="Research topic or search query"),
    mode: str = Query("landscape", description="Graph mode: citation, author_collaboration, landscape, topic"),
    scope: str = Query("core", pattern="^(core|related|full)$"),
    limit: int = Query(15, ge=1, le=30)
):
    result = await graph_service.build_graph_for_topic(topic_query=q, mode=mode, scope=scope, limit=limit)
    return ResearchGraph(**result)

@router.get("/mode/{mode_name}", response_model=ResearchGraph)
async def get_graph_by_mode(
    mode_name: str,
    q: str = Query(..., min_length=1),
    scope: str = Query("core", pattern="^(core|related|full)$")
):
    result = await graph_service.build_graph_for_topic(topic_query=q, mode=mode_name, scope=scope)
    return ResearchGraph(**result)

@router.get("/entity/{entity_id}", response_model=ResearchGraph)
async def get_entity_neighborhood(
    entity_id: str,
    hops: int = Query(2, ge=1, le=3),
    scope: str = Query("full", pattern="^(core|related|full)$")
):
    result = await graph_service.build_graph_for_topic(entity_id, mode="landscape", scope=scope, center_node_id=entity_id, hops=hops)
    return ResearchGraph(**result)
