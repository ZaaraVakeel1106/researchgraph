from fastapi import APIRouter, Query
from typing import Literal
from app.models.schemas import SearchResponse, SearchResultItem
from app.services.openalex_service import openalex_service

router = APIRouter(prefix="/api", tags=["Search"])

@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., description="Search query string"),
    entity_type: Literal["works", "authors", "topics", "institutions"] = Query("works", description="Entity type"),
    limit: int = Query(15, ge=1, le=50),
    page: int = Query(1, ge=1, le=1000)
):
    results_raw = await openalex_service.search(query=q, entity_type=entity_type, limit=limit, page=page)
    items = [SearchResultItem(**item) for item in results_raw]
    return SearchResponse(
        query=q,
        total_results=len(items),
        results=items
    )
