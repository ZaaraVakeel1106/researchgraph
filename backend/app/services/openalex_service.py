"""Bounded, source-grounded OpenAlex client."""
import asyncio
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import json
import logging
from typing import Any

import httpx
from fastapi import HTTPException

from app.config import settings
from app.services.ttl_cache import TTLCache

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
        if settings.OPENALEX_API_KEY:
            # Authorization avoids exposing the key in URLs, proxy logs, and cache keys.
            self.headers["Authorization"] = f"Bearer {settings.OPENALEX_API_KEY}"
        self._request_semaphore = asyncio.Semaphore(settings.OPENALEX_MAX_CONCURRENT_REQUESTS)
        self._cache = TTLCache(max_entries=2048)
        self._inflight: dict[str, asyncio.Task] = {}
        self._cache_lock = asyncio.Lock()
        self.rate_limit_remaining: float | None = None
        self.rate_limit_reset_seconds: float | None = None

    async def _get_json(self, path: str, params: dict | None = None) -> dict:
        request_params = dict(params or {})
        cache_key = json.dumps([path.lstrip("/"), request_params], sort_keys=True, separators=(",", ":"), default=str)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached
        async with self._cache_lock:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached
            task = self._inflight.get(cache_key)
            if task is None:
                task = asyncio.create_task(self._fetch_and_cache(cache_key, path, request_params))
                self._inflight[cache_key] = task
        return deepcopy(await asyncio.shield(task))

    async def _fetch_and_cache(self, cache_key: str, path: str, params: dict) -> dict:
        task = asyncio.current_task()
        try:
            data = await self._request_json(path, params)
            self._cache.set(cache_key, data, self._cache_ttl(path, params))
            return data
        finally:
            async with self._cache_lock:
                if self._inflight.get(cache_key) is task:
                    self._inflight.pop(cache_key, None)

    def _cache_ttl(self, path: str, params: dict) -> int:
        if "search" in params:
            return settings.OPENALEX_SEARCH_CACHE_TTL
        clean_path = path.strip("/")
        if clean_path.startswith("works/") and "/" not in clean_path[len("works/"):]:
            return settings.OPENALEX_WORK_CACHE_TTL
        return settings.OPENALEX_RESPONSE_CACHE_TTL

    async def _http_get(self, path: str, params: dict) -> httpx.Response:
        async with httpx.AsyncClient(headers=self.headers, timeout=12.0) as client:
            return await client.get(f"{self.base_url}/{path.lstrip('/')}", params=params)

    def _read_rate_limit_headers(self, response: httpx.Response) -> None:
        def number(value: str | None) -> float | None:
            try:
                return float(value) if value is not None else None
            except (TypeError, ValueError):
                return None
        self.rate_limit_remaining = number(response.headers.get("X-RateLimit-Remaining"))
        self.rate_limit_reset_seconds = number(response.headers.get("X-RateLimit-Reset"))

    @staticmethod
    def _retry_after_seconds(value: str | None) -> float | None:
        if not value:
            return None
        try:
            return max(0.0, float(value))
        except ValueError:
            try:
                reset_at = parsedate_to_datetime(value)
                if reset_at.tzinfo is None:
                    reset_at = reset_at.replace(tzinfo=timezone.utc)
                return max(0.0, (reset_at - datetime.now(timezone.utc)).total_seconds())
            except (TypeError, ValueError, OverflowError):
                return None

    def _daily_budget_message(self) -> str:
        reset = self.rate_limit_reset_seconds
        if reset is not None and reset >= 0:
            reset_at = datetime.now(timezone.utc) + timedelta(seconds=reset)
            reset_text = f" It resets at {reset_at.strftime('%Y-%m-%d %H:%M:%S')} UTC."
        else:
            reset_text = " It resets at midnight UTC."
        if self.rate_limit_remaining is not None:
            reset_text += f" Remaining daily allowance: {self.rate_limit_remaining:g}."
        return "OpenAlex daily allowance is exhausted. No retries were made." + reset_text

    async def _request_json(self, path: str, params: dict) -> dict:
        last_error: Exception | None = None
        max_retries = settings.OPENALEX_MAX_RETRIES
        for attempt in range(max_retries + 1):
            try:
                async with self._request_semaphore:
                    response = await self._http_get(path, params)
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt < max_retries:
                    await asyncio.sleep(min(settings.OPENALEX_RETRY_BACKOFF_SECONDS * (2 ** attempt), 5.0))
                    continue
                break

            self._read_rate_limit_headers(response)
            if response.status_code == 429:
                try:
                    payload = response.json()
                except ValueError:
                    payload = {}
                reason = str(payload.get("reason") or "").strip().lower() if isinstance(payload, dict) else ""
                if reason == "daily_budget":
                    raise HTTPException(status_code=503, detail=self._daily_budget_message())
                if reason == "requests_per_second":
                    retry_after = self._retry_after_seconds(response.headers.get("Retry-After"))
                    if attempt < max_retries and retry_after is not None and retry_after <= settings.OPENALEX_MAX_RETRY_AFTER_SECONDS:
                        await asyncio.sleep(retry_after)
                        continue
                    wait_text = f" Wait {retry_after:g} seconds before retrying." if retry_after is not None else " Wait briefly before retrying."
                    raise HTTPException(status_code=503, detail="OpenAlex is throttling requests per second; the daily allowance is not exhausted." + wait_text)
                reason_text = f" (reason: {reason})" if reason else ""
                retry_after = self._retry_after_seconds(response.headers.get("Retry-After"))
                wait_text = f" Wait {retry_after:g} seconds before retrying." if retry_after is not None else ""
                raise HTTPException(status_code=503, detail=f"OpenAlex returned HTTP 429{reason_text}. No automatic retry was made because the limit reason is not a per-second request limit." + wait_text)

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="This OpenAlex record was not found.")
            if response.status_code in (500, 502, 503, 504):
                last_error = httpx.HTTPStatusError(f"OpenAlex returned HTTP {response.status_code}", request=response.request, response=response)
                if attempt < max_retries:
                    await asyncio.sleep(min(settings.OPENALEX_RETRY_BACKOFF_SECONDS * (2 ** attempt), 5.0))
                    continue
                break
            if response.status_code >= 400:
                raise HTTPException(status_code=502, detail=f"OpenAlex rejected the request with HTTP {response.status_code}.")
            try:
                return response.json()
            except ValueError as exc:
                last_error = exc
                if attempt < max_retries:
                    await asyncio.sleep(min(settings.OPENALEX_RETRY_BACKOFF_SECONDS * (2 ** attempt), 5.0))
                    continue
                break
        logger.warning("OpenAlex request failed: %s", last_error)
        raise HTTPException(status_code=502, detail="OpenAlex could not retrieve scholarly data. Please retry.")

    async def search_page(self, query: str, entity_type: str = "works", limit: int = 15, page: int = 1,
                          cursor: str | None = None) -> dict[str, Any]:
        params = {"search": query, "per_page": limit}
        params["cursor" if cursor is not None else "page"] = cursor if cursor is not None else page
        data = await self._get_json(entity_type, params)
        if entity_type != "works":
            results = [self._normalize_entity(x, entity_type) for x in data.get("results", [])]
        else:
            results = [self.to_search_item(normalize_work(x)) for x in data.get("results", [])]
        meta = data.get("meta") or {}
        return {"results": results, "provider_total": meta.get("count"), "next_cursor": meta.get("next_cursor")}

    async def search(self, query: str, entity_type: str = "works", limit: int = 15, page: int = 1) -> list[dict]:
        # Keep the legacy list-returning helper available to graph and signal callers.
        return (await self.search_page(query, entity_type, limit, page))["results"]

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
