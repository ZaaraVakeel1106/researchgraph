from fastapi import APIRouter, Query
from typing import Literal
from app.models.schemas import SearchResponse, SearchResultItem
from app.services.openalex_service import openalex_service

router = APIRouter(prefix="/api", tags=["Search"])

@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., description="Search query string"),
    entity_type: Literal["works", "authors", "topics", "institutions"] = Query("works", description="Entity type"),
    limit: int = Query(15, ge=1, le=100),
    page: int = Query(1, ge=1, le=1000),
    cursor: str | None = Query(None, description="OpenAlex cursor for progressive pagination")
):
    page_data = await openalex_service.search_page(query=q, entity_type=entity_type, limit=limit, page=page, cursor=cursor)
    items = [SearchResultItem(**item) for item in page_data["results"]]
    return SearchResponse(
        query=q,
        total_results=len(items),
        results=items,
        provider_total=page_data.get("provider_total"),
        next_cursor=page_data.get("next_cursor")
    )
