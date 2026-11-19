from typing import Any
from app.config import settings
from app.services.openalex_service import openalex_service
from app.services.ttl_cache import TTLCache


def _citation_item(work: dict) -> dict:
    return {"id": work.get("id"), "title": work.get("title") or "Not available in the source", "year": work.get("publication_year"),
            "venue": work.get("venue"), "citation_count": work.get("citation_count"),
            "authors": [a.get("name") for a in work.get("authors", []) if a.get("name")], "rationale": None,
            "doi": work.get("doi"), "source_url": work.get("source_url")}


class PaperService:
    def __init__(self):
        self._study_cache = TTLCache(max_entries=512)

    async def get_paper_study_view(self, paper_id: str) -> dict[str, Any]:
        cached = self._study_cache.get(paper_id)
        if cached is not None:
            return cached
        result = await self._build_paper_study_view(paper_id)
        self._study_cache.set(paper_id, result, settings.OPENALEX_PAPER_STUDY_CACHE_TTL)
        return result

    async def _build_paper_study_view(self, paper_id: str) -> dict[str, Any]:
        work = await openalex_service.get_work(paper_id)
        refs = await openalex_service.get_works(work.get("referenced_works", [])[:30], 30)
        citing = await openalex_service.citing_works(work["id"], 20)
        related = await openalex_service.get_works(work.get("related_works", [])[:15], 15)
        references = [_citation_item(w) for w in refs]
        cited_by = [_citation_item(w) for w in citing]
        related_items = [_citation_item(w) for w in related]
        unavailable = "Not stated in the available abstract."
        has_abstract = bool(work.get("abstract"))
        authors = work.get("authors", [])
        institutions = list({i["name"]: {"name": i["name"]} for a in authors for i in a.get("institutions", []) if i.get("name")}.values())
        return {"id": work["id"], "title": work.get("title") or "Not available in the source", "authors": authors,
                "institutions": institutions, "publication_year": work.get("publication_year"), "publication_date": work.get("publication_date"),
                "venue": work.get("venue"), "citation_count": work.get("citation_count"), "open_access": work.get("open_access"),
                "open_access_pdf": work.get("open_access_pdf"), "landing_page": work.get("landing_page"), "doi": work.get("doi"),
                "source_id": work.get("source_id"), "source_url": work.get("source_url"), "abstract": work.get("abstract"), "topics": work.get("topics", []),
                "abstract_breakdown": {"problem": unavailable, "methodology": unavailable, "results": unavailable, "limitations": unavailable} if has_abstract else {"problem": unavailable, "methodology": unavailable, "results": unavailable, "limitations": unavailable},
                "research_context": {"predecessors": references, "current": [{"id": work["id"], "title": work.get("title"), "year": work.get("publication_year")}], "successors": cited_by},
                "references": references, "cited_by": cited_by, "related_papers": related_items, "recommended_next": []}


paper_service = PaperService()
