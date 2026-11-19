import asyncio

import pytest
from fastapi import HTTPException

from app.config import settings
from app.services.graph_service import GraphService
from app.services.openalex_service import OpenAlexService
from app.services.paper_service import PaperService


class FakeResponse:
    def __init__(self, status_code, payload, headers=None):
        self.status_code = status_code
        self.payload = payload
        self.headers = headers or {}

    def json(self):
        if isinstance(self.payload, Exception):
            raise self.payload
        return self.payload


def test_daily_budget_429_stops_without_retry_and_reports_reset(monkeypatch):
    service = OpenAlexService()
    calls = 0

    async def fake_get(path, params):
        nonlocal calls
        calls += 1
        return FakeResponse(429, {"reason": "daily_budget"}, {"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "3600"})

    monkeypatch.setattr(service, "_http_get", fake_get)
    with pytest.raises(HTTPException) as error:
        asyncio.run(service._get_json("works", {"search": "climate change"}))

    assert error.value.status_code == 503
    assert "daily allowance is exhausted" in error.value.detail
    assert "UTC" in error.value.detail
    assert service.rate_limit_remaining == 0
    assert service.rate_limit_reset_seconds == 3600
    assert calls == 1


def test_requests_per_second_429_retries_after_header(monkeypatch):
    service = OpenAlexService()
    monkeypatch.setattr(settings, "OPENALEX_MAX_RETRIES", 1)
    monkeypatch.setattr(settings, "OPENALEX_MAX_RETRY_AFTER_SECONDS", 3)
    calls = 0
    sleeps = []

    async def fake_get(path, params):
        nonlocal calls
        calls += 1
        if calls == 1:
            return FakeResponse(429, {"reason": "requests_per_second"}, {"Retry-After": "2", "X-RateLimit-Remaining": "42", "X-RateLimit-Reset": "900"})
        return FakeResponse(200, {"results": ["ok"]}, {"X-RateLimit-Remaining": "41", "X-RateLimit-Reset": "899"})

    async def fake_sleep(delay):
        sleeps.append(delay)

    monkeypatch.setattr(service, "_http_get", fake_get)
    monkeypatch.setattr("app.services.openalex_service.asyncio.sleep", fake_sleep)
    response = asyncio.run(service._get_json("works", {"search": "climate change"}))

    assert response == {"results": ["ok"]}
    assert calls == 2
    assert sleeps == [2.0]
    assert service.rate_limit_remaining == 41
    assert service.rate_limit_reset_seconds == 899


def test_requests_per_second_retries_are_bounded(monkeypatch):
    service = OpenAlexService()
    monkeypatch.setattr(settings, "OPENALEX_MAX_RETRIES", 1)
    monkeypatch.setattr(settings, "OPENALEX_MAX_RETRY_AFTER_SECONDS", 3)
    calls = 0

    async def fake_get(path, params):
        nonlocal calls
        calls += 1
        return FakeResponse(429, {"reason": "requests_per_second"}, {"Retry-After": "1"})

    async def no_wait(_delay):
        return None

    monkeypatch.setattr(service, "_http_get", fake_get)
    monkeypatch.setattr("app.services.openalex_service.asyncio.sleep", no_wait)
    with pytest.raises(HTTPException) as error:
        asyncio.run(service._get_json("works", {"search": "climate change"}))
    assert calls == 2
    assert error.value.status_code == 503
    assert "throttling requests per second" in error.value.detail


def test_successful_provider_responses_are_cached_and_identical_requests_share_flight(monkeypatch):
    service = OpenAlexService()
    calls = 0

    async def fake_get(path, params):
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.01)
        return FakeResponse(200, {"meta": {"count": 1}, "results": [{"id": "W1"}]}, {"X-RateLimit-Remaining": "99", "X-RateLimit-Reset": "1000"})

    monkeypatch.setattr(service, "_http_get", fake_get)

    async def exercise():
        first, second = await asyncio.gather(
            service._get_json("works", {"search": "climate", "per_page": 100}),
            service._get_json("works", {"search": "climate", "per_page": 100}),
        )
        first["results"].clear()
        third = await service._get_json("works", {"search": "climate", "per_page": 100})
        return second, third

    second, third = asyncio.run(exercise())
    assert calls == 1
    assert second["results"] == [{"id": "W1"}]
    assert third["results"] == [{"id": "W1"}]
    assert service.rate_limit_remaining == 99


def test_request_concurrency_limit_is_configurable(monkeypatch):
    monkeypatch.setattr(settings, "OPENALEX_MAX_CONCURRENT_REQUESTS", 2)
    service = OpenAlexService()
    active = 0
    maximum_active = 0

    async def fake_get(path, params):
        nonlocal active, maximum_active
        active += 1
        maximum_active = max(maximum_active, active)
        await asyncio.sleep(0.01)
        active -= 1
        return FakeResponse(200, {"path": path})

    monkeypatch.setattr(service, "_http_get", fake_get)

    async def exercise():
        return await asyncio.gather(*(service._get_json("works", {"id": index}) for index in range(6)))

    results = asyncio.run(exercise())
    assert len(results) == 6
    assert maximum_active == 2


def test_api_key_is_sent_in_authorization_header_not_query(monkeypatch):
    monkeypatch.setattr(settings, "OPENALEX_API_KEY", "test-key")
    service = OpenAlexService()
    assert service.headers["Authorization"] == "Bearer test-key"
    assert "test-key" not in service.base_url


def test_graph_and_paper_study_responses_are_cached(monkeypatch):
    graph = GraphService()
    paper = PaperService()
    calls = {"graph": 0, "paper": 0}

    async def build_graph(*args):
        calls["graph"] += 1
        return {"nodes": [{"id": "W1"}], "edges": []}

    async def build_paper(*args):
        calls["paper"] += 1
        return {"id": "W1", "title": "Actual work"}

    monkeypatch.setattr(graph, "_build_graph_for_topic", build_graph)
    monkeypatch.setattr(paper, "_build_paper_study_view", build_paper)

    async def exercise():
        g1 = await graph.build_graph_for_topic("climate", scope="related")
        g1["nodes"].clear()
        g2 = await graph.build_graph_for_topic("climate", scope="related")
        p1 = await paper.get_paper_study_view("W1")
        p1["title"] = "mutated"
        p2 = await paper.get_paper_study_view("W1")
        return g2, p2

    graph_result, paper_result = asyncio.run(exercise())
    assert calls == {"graph": 1, "paper": 1}
    assert graph_result["nodes"] == [{"id": "W1"}]
    assert paper_result["title"] == "Actual work"
