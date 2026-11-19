"""Bounded, source-grounded OpenAlex client."""
import asyncio
import logging
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger(__name__)


def openalex_id(value: str | None) -> str | None:
    if not value:
        return None
    return value.rstrip("/").split("/")[-1]


def reconstruct_abstract(inverted: dict | None) -> str | None:
    if not inverted:
        return None
    words: list[str | None] = []
    for word, positions in inverted.items():
        for position in positions:
            if position >= len(words):
                words.extend([None] * (position + 1 - len(words)))
            words[position] = word
    return " ".join(word for word in words if word)


def normalize_work(item: dict[str, Any]) -> dict[str, Any]:
    location = item.get("primary_location") or {}
    source = location.get("source") or {}
    oa = item.get("open_access") or {}
    authors = []
    for authorship in item.get("authorships") or []:
        author = authorship.get("author") or {}
        if not author.get("id") and not author.get("display_name"):
            continue
        authors.append({
            "id": openalex_id(author.get("id")), "name": author.get("display_name"),
            "institutions": [{"id": openalex_id(i.get("id")), "name": i.get("display_name")}
                             for i in authorship.get("institutions") or [] if i.get("display_name")]
        })
    doi = item.get("doi")
    topic_records = [{"id": openalex_id(t.get("id")), "name": t.get("display_name"), "source_url": t.get("id")}
                     for t in item.get("topics") or [] if t.get("display_name")]
    topics = [t["name"] for t in topic_records]
    primary_topic = item.get("primary_topic") or {}
    if primary_topic.get("display_name") and primary_topic["display_name"] not in topics:
        topics.insert(0, primary_topic["display_name"])
        topic_records.insert(0, {"id": openalex_id(primary_topic.get("id")), "name": primary_topic["display_name"], "source_url": primary_topic.get("id")})
    best_oa = item.get("best_oa_location") or {}
    pdf = (location.get("pdf_url") if location else None) or best_oa.get("pdf_url")
    landing = location.get("landing_page_url") or best_oa.get("landing_page_url") or oa.get("oa_url")
    return {
        "id": openalex_id(item.get("id")), "source_id": item.get("id"), "source_url": item.get("id"),
        "type": "paper", "title": item.get("title"), "publication_year": item.get("publication_year"),
        "publication_date": item.get("publication_date"), "venue": source.get("display_name"),
        "doi": doi, "citation_count": item.get("cited_by_count"), "abstract": reconstruct_abstract(item.get("abstract_inverted_index")),
        "authors": authors, "topics": topics, "topic_records": topic_records, "open_access": oa.get("is_oa"), "open_access_pdf": pdf,
        "landing_page": landing, "referenced_works": [openalex_id(x) for x in item.get("referenced_works") or [] if openalex_id(x)],
        "related_works": [openalex_id(x) for x in item.get("related_works") or [] if openalex_id(x)],
        "cited_by_api_url": item.get("cited_by_api_url"),
    }


class OpenAlexService:
    def __init__(self):
        self.base_url = settings.OPENALEX_BASE_URL.rstrip("/")
        self.headers = {"User-Agent": f"ResearchGraph/1.0 (mailto:{settings.OPENALEX_MAILTO})"}

    async def _get_json(self, path: str, params: dict | None = None) -> dict:
        request_params = dict(params or {})
        if settings.OPENALEX_API_KEY:
            request_params["api_key"] = settings.OPENALEX_API_KEY
        last_error = None
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(headers=self.headers, timeout=12.0) as client:
                    response = await client.get(f"{self.base_url}/{path.lstrip('/')}", params=request_params)
                if response.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                    await asyncio.sleep(0.25 * (attempt + 1))
                    continue
                if response.status_code == 404:
                    raise HTTPException(status_code=404, detail="This OpenAlex record was not found.")
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                if attempt < 2:
                    await asyncio.sleep(0.25 * (attempt + 1))
        logger.warning("OpenAlex request failed: %s", last_error)
        raise HTTPException(status_code=502, detail="OpenAlex could not retrieve scholarly data. Please retry.")

    async def search(self, query: str, entity_type: str = "works", limit: int = 15, page: int = 1) -> list[dict]:
        data = await self._get_json(entity_type, {"search": query, "per_page": limit, "page": page})
        if entity_type != "works":
            return [self._normalize_entity(x, entity_type) for x in data.get("results", [])]
        return [self.to_search_item(normalize_work(x)) for x in data.get("results", [])]

    def to_search_item(self, work: dict) -> dict:
        return {"id": work["id"], "type": "paper", "title": work.get("title") or "Not available in the source",
                "subtitle": " · ".join(filter(None, [work.get("venue"), str(work.get("publication_year") or "")])),
                "year": work.get("publication_year"), "citation_count": work.get("citation_count"), "venue": work.get("venue"),
                "authors": [a["name"] for a in work.get("authors", []) if a.get("name")], "open_access": work.get("open_access"),
                "source_id": work.get("source_id"), "source_url": work.get("source_url")}

    async def get_work(self, work_id: str) -> dict:
        wid = openalex_id(work_id)
        if not wid or not wid.startswith("W"):
            raise HTTPException(status_code=422, detail="A valid OpenAlex work ID is required.")
        result = await self._get_json(f"works/{wid}")
        return normalize_work(result)

    async def get_works(self, ids: list[str], limit: int = 40) -> list[dict]:
        ids = list(dict.fromkeys(openalex_id(x) for x in ids if openalex_id(x)))[:limit]
        if not ids:
            return []
        data = await self._get_json("works", {"filter": "openalex:" + "|".join(ids), "per_page": min(limit, 50)})
        return [normalize_work(x) for x in data.get("results", [])]

    async def citing_works(self, work_id: str, limit: int = 20) -> list[dict]:
        data = await self._get_json("works", {"filter": f"cites:{openalex_id(work_id)}", "per_page": min(limit, 50), "sort": "publication_date:desc"})
        return [normalize_work(x) for x in data.get("results", [])]

    def _normalize_entity(self, item: dict, entity_type: str) -> dict:
        kind = {"authors": "author", "institutions": "institution", "topics": "topic", "concepts": "topic"}.get(entity_type, "topic")
        return {"id": openalex_id(item.get("id")), "type": kind,
                "title": item.get("display_name") or "Not available in the source", "subtitle": None,
                "works_count": item.get("works_count"), "citation_count": item.get("cited_by_count"),
                "source_id": item.get("id"), "source_url": item.get("id")}


openalex_service = OpenAlexService()
