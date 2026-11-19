import asyncio
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
import sqlite3

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.graph_service import GraphService
from app.services.openalex_service import OpenAlexService, normalize_work
from app.services.research_signals import ResearchSignalService
from app.main import app


@pytest.fixture
def workspace_client(tmp_path, monkeypatch):
    db_path = tmp_path / "workspace.sqlite3"
    def get_test_db():
        connection = sqlite3.connect(db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("CREATE TABLE IF NOT EXISTS paper_notes (paper_id TEXT PRIMARY KEY, reading_status TEXT, notes_markdown TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
        connection.execute("CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_id TEXT UNIQUE, entity_type TEXT, title TEXT, subtitle TEXT, metadata_json TEXT, folder_name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
        connection.commit()
        return connection
    monkeypatch.setattr("app.api.workspace.get_db", get_test_db)
    return TestClient(app)


RECORDS = {
    "W1": {"id": "https://openalex.org/W1", "title": "Climate adaptation study", "publication_year": 2022,
           "cited_by_count": 4, "referenced_works": ["https://openalex.org/W2"], "related_works": [], "authorships": [],
           "topics": [{"display_name": "Climate change"}], "abstract_inverted_index": {"Climate": [0], "adaptation": [1]}},
    "W2": {"id": "https://openalex.org/W2", "title": "Climate impacts review", "publication_year": 2020,
           "cited_by_count": 9, "referenced_works": [], "related_works": [], "authorships": [], "topics": [{"display_name": "Climate"}]},
    "W3": {"id": "https://openalex.org/W3", "title": "Cognitive psychology study", "publication_year": 2021,
           "cited_by_count": 2, "referenced_works": [], "related_works": [], "authorships": [], "topics": [{"display_name": "Psychology"}]},
}


def test_unrelated_queries_produce_distinct_graphs(monkeypatch):
    service = GraphService()
    async def search(query, entity_type, limit):
        return [{"id": "W3" if "psych" in query.lower() else "W1"}]
    async def get_works(ids, limit=40):
        return [normalize_work(RECORDS[x]) for x in ids if x in RECORDS]
    monkeypatch.setattr("app.services.graph_service.openalex_service.search", search)
    monkeypatch.setattr("app.services.graph_service.openalex_service.get_works", get_works)
    climate = asyncio.run(service.build_graph_for_topic("climate change", scope="core"))
    psych = asyncio.run(service.build_graph_for_topic("psychological thinking", scope="core"))
    assert {n["label"] for n in climate["nodes"] if n["type"] == "paper"} == {"Climate adaptation study"}
    assert {n["label"] for n in psych["nodes"] if n["type"] == "paper"} == {"Cognitive psychology study"}


def test_scope_fetches_real_reference_and_direction(monkeypatch):
    service = GraphService()
    async def search(query, entity_type, limit): return [{"id": "W1"}]
    async def get_works(ids, limit=40): return [normalize_work(RECORDS[x]) for x in ids if x in RECORDS]
    monkeypatch.setattr("app.services.graph_service.openalex_service.search", search)
    monkeypatch.setattr("app.services.graph_service.openalex_service.get_works", get_works)
    core = asyncio.run(service.build_graph_for_topic("climate", scope="core"))
    related = asyncio.run(service.build_graph_for_topic("climate", scope="related"))
    assert related["stats"]["paper_count"] > core["stats"]["paper_count"]
    citation = next(edge for edge in related["edges"] if edge["type"] == "cites")
    assert citation["source"] == "W1" and citation["target"] == "W2"
    assert len({node["id"] for node in related["nodes"]}) == len(related["nodes"])


def test_openalex_failure_is_error_not_seed():
    service = OpenAlexService()
    async def fail(*args, **kwargs): raise HTTPException(status_code=502, detail="OpenAlex could not retrieve scholarly data. Please retry.")
    service._get_json = fail
    with pytest.raises(HTTPException) as exc:
        asyncio.run(service.search("computer vision"))
    assert exc.value.status_code == 502
    assert "SEED_WORKS" not in vars(service)


def test_abstract_reconstruction_and_missing_abstract():
    record = {**RECORDS["W1"]}
    assert normalize_work(record)["abstract"] == "Climate adaptation"
    del record["abstract_inverted_index"]
    assert normalize_work(record)["abstract"] is None


def test_notes_persist_and_update(workspace_client):
    client = workspace_client
    saved = client.post("/api/workspace/notes", json={"paper_id": "W1", "reading_status": "Reading", "notes_markdown": "Read methods"})
    assert saved.status_code == 200
    assert client.get("/api/workspace/notes/W1").json()["notes_markdown"] == "Read methods"
    client.post("/api/workspace/notes", json={"paper_id": "W1", "reading_status": "Read", "notes_markdown": "Finished"})
    assert client.get("/api/workspace/notes/W1").json()["reading_status"] == "Read"


def test_bookmark_metadata_and_bibtex_use_saved_record(workspace_client):
    client = workspace_client
    response = client.post("/api/workspace/bookmarks", json={"entity_id": "W9", "entity_type": "paper", "title": "Actual paper", "metadata_json": {"year": 2024, "doi": "https://doi.org/10/example"}})
    assert response.status_code == 200
    assert client.get("/api/workspace/bookmarks").json()[0]["metadata_json"]["year"] == 2024
    bib = client.get("/api/workspace/export/bibtex").text
    assert "Actual paper" in bib and "2024" in bib and "10/example" in bib
    assert client.delete("/api/workspace/bookmarks/W9").status_code == 200
    assert client.get("/api/workspace/bookmarks").json() == []


def test_graph_api_preserves_scope_and_relationship_metadata(workspace_client, monkeypatch):
    async def search(query, entity_type="works", limit=15, page=1):
        return [{"id": "W1"}]
    async def get_works(ids, limit=40):
        return [normalize_work(RECORDS[value]) for value in ids if value in RECORDS]
    monkeypatch.setattr("app.services.graph_service.openalex_service.search", search)
    monkeypatch.setattr("app.services.graph_service.openalex_service.get_works", get_works)
    response = workspace_client.get("/api/graph/landscape?q=climate&scope=related")
    assert response.status_code == 200
    payload = response.json()
    assert payload["stats"]["scope"] == "related"
    assert payload["stats"]["paper_count"] == 2
    edge = next(item for item in payload["edges"] if item["type"] == "cites")
    assert (edge["source"], edge["target"]) == ("W1", "W2")
    assert edge["rationale"] == "OpenAlex referenced_works"


def test_study_api_returns_actual_references_and_no_fake_cited_by(workspace_client, monkeypatch):
    async def get_work(work_id): return normalize_work(RECORDS["W1"])
    async def get_works(ids, limit=40): return [normalize_work(RECORDS[value]) for value in ids if value in RECORDS]
    async def citing_works(work_id, limit=20): return []
    async def search(query, entity_type="works", limit=15, page=1): return [{"id": "W1"}]
    monkeypatch.setattr("app.services.paper_service.openalex_service.get_work", get_work)
    monkeypatch.setattr("app.services.paper_service.openalex_service.get_works", get_works)
    monkeypatch.setattr("app.services.paper_service.openalex_service.citing_works", citing_works)
    monkeypatch.setattr("app.services.graph_service.openalex_service.search", search)
    monkeypatch.setattr("app.services.graph_service.openalex_service.get_works", get_works)
    response = workspace_client.get("/api/papers/W1/study")
    assert response.status_code == 200
    payload = response.json()
    assert payload["abstract"] == "Climate adaptation"
    assert [item["id"] for item in payload["references"]] == ["W2"]
    assert payload["cited_by"] == []


def test_cross_domain_reports_no_path_for_disconnected_records(monkeypatch):
    async def empty_graph(query, **kwargs):
        return {"nodes": [], "edges": []}
    monkeypatch.setattr("app.services.research_signals.graph_service.build_graph_for_topic", empty_graph)
    result = asyncio.run(ResearchSignalService().get_cross_domain_connections("climate", "psychology"))
    assert result["bridge_found"] is False
    assert result["shortest_path"]["found"] is False
    assert result["bridging_topics"] == []
