"""Build bounded graphs only from records and relationships returned by OpenAlex."""
from typing import Any
import networkx as nx

from app.services.openalex_service import openalex_service


class GraphService:
    async def build_graph_for_topic(self, topic_query: str, mode: str = "landscape", scope: str = "core", center_node_id: str | None = None, limit: int = 15, hops: int = 2) -> dict[str, Any]:
        if center_node_id:
            center_work = await openalex_service.get_work(center_node_id)
            core_ids = [center_work["id"]]
        else:
            core_items = await openalex_service.search(topic_query, "works", limit=max(1, min(limit, 30)))
            core_ids = [x["id"] for x in core_items]
        works = {w["id"]: w for w in await openalex_service.get_works(core_ids, 30)}
        if center_node_id and core_ids[0] not in works:
            center_work = await openalex_service.get_work(center_node_id)
            works[center_work["id"]] = center_work
        core_ids = [x for x in core_ids if x in works]
        expanded: set[str] = set()
        if scope in ("related", "full"):
            for wid in core_ids[:10]:
                w = works[wid]
                expanded.update(w.get("referenced_works", [])[:8])
                expanded.update(w.get("related_works", [])[:5])
            expanded -= set(core_ids)
            for item in await openalex_service.get_works(list(expanded), 40):
                works[item["id"]] = item
        if scope == "full":
            citing_ids = []
            for wid in core_ids[:5]:
                citing_ids.extend(w["id"] for w in await openalex_service.citing_works(wid, 10))
            citing_ids = list(dict.fromkeys(citing_ids))[:20]
            for item in await openalex_service.get_works(citing_ids, 20):
                works[item["id"]] = item

        graph = nx.Graph()
        directed_citations = nx.DiGraph()
        core_set = set(core_ids)
        for wid, work in works.items():
            tier = "core" if wid in core_set else "related"
            node = {"id": wid, "label": work.get("title") or "Not available in the source", "type": "paper",
                    "year": work.get("publication_year"), "citations": work.get("citation_count"),
                    "sub_label": " · ".join(filter(None, [work.get("venue"), str(work.get("publication_year") or "")])),
                    "relevance_tier": tier, "data": {"source_id": work.get("source_id"), "source_url": work.get("source_url"), "doi": work.get("doi"),
                                                         "venue": work.get("venue"), "authors": [a.get("name") for a in work.get("authors", []) if a.get("name")]}}
            graph.add_node(wid, **node); directed_citations.add_node(wid)
            for author in work.get("authors", []):
                aid = author.get("id")
                if aid:
                    graph.add_node(aid, id=aid, label=author.get("name") or "Not available in the source", type="author", sub_label=None, relevance_tier=tier,
                                   data={"source_id": aid, "source_url": f"https://openalex.org/{aid}"})
                    graph.add_edge(wid, aid, type="authored", label="authorship", rationale="OpenAlex authorship record")
                for inst in author.get("institutions", []):
                    iid = inst.get("id")
                    if aid and iid:
                        graph.add_node(iid, id=iid, label=inst.get("name") or "Not available in the source", type="institution", relevance_tier=tier,
                                       data={"source_id": iid, "source_url": f"https://openalex.org/{iid}"})
                        graph.add_edge(aid, iid, type="affiliated_with", label="affiliation", rationale="OpenAlex authorship affiliation")
            topic_records = work.get("topic_records") or [{"name": name} for name in work.get("topics", [])]
            for topic in topic_records[:8]:
                tid = topic.get("id") or ("T:" + topic["name"].strip().casefold())
                graph.add_node(tid, id=tid, label=topic.get("name"), type="topic", relevance_tier=tier,
                               data={"source_id": topic.get("id"), "source_url": topic.get("source_url")} if topic.get("id") else {})
                graph.add_edge(wid, tid, type="has_topic", label="topic", rationale="OpenAlex topic assignment")

        # Citation edges point from the citing paper to its referenced work.
        for wid, work in works.items():
            for ref_id in work.get("referenced_works", []):
                if ref_id in works:
                    graph.add_edge(wid, ref_id, type="cites", label="cites", rationale="OpenAlex referenced_works", citation_source=wid, citation_target=ref_id)
                    directed_citations.add_edge(wid, ref_id)
            for related_id in work.get("related_works", []):
                if related_id in works:
                    graph.add_edge(wid, related_id, type="related_work", label="related work", rationale="OpenAlex related_works")

        if center_node_id and center_node_id in graph:
            keep = set(nx.single_source_shortest_path_length(graph, center_node_id, cutoff=max(1, min(hops, 3))))
            graph = graph.subgraph(keep).copy()
        if mode == "citation":
            graph = graph.subgraph([n for n, d in graph.nodes(data=True) if d.get("type") == "paper"]).copy()
            graph.remove_edges_from([(u, v) for u, v, d in graph.edges(data=True) if d.get("type") != "cites"])
        elif mode == "author_collaboration":
            papers = [n for n, d in graph.nodes(data=True) if d.get("type") == "paper"]
            collab = nx.Graph()
            for paper in papers:
                authors = [n for n in graph.neighbors(paper) if graph.nodes[n].get("type") == "author"]
                collab.add_nodes_from((a, graph.nodes[a]) for a in authors)
                for i, author in enumerate(authors):
                    for other in authors[i + 1:]: collab.add_edge(author, other, type="collaborates_with", label="co-authorship", rationale=f"Both authors are listed on OpenAlex work {paper}")
            graph = collab
        elif mode == "topic":
            topics = [n for n, d in graph.nodes(data=True) if d.get("type") == "topic"]
            topic_graph = nx.Graph(); topic_graph.add_nodes_from((n, graph.nodes[n]) for n in topics)
            for paper in [n for n, d in graph.nodes(data=True) if d.get("type") == "paper"]:
                attached = [n for n in graph.neighbors(paper) if graph.nodes[n].get("type") == "topic"]
                for i, left in enumerate(attached):
                    for right in attached[i + 1:]: topic_graph.add_edge(left, right, type="topic_association", label="co-occurs on work", rationale=f"Both topics are assigned to OpenAlex work {paper}")
            graph = topic_graph

        metrics = self._metrics(graph)
        communities = self._communities(graph)
        nodes = []
        for n, data in graph.nodes(data=True):
            nd = dict(data)
            nd["metrics"] = {"pagerank": round(metrics["pagerank"].get(n, 0), 5), "degree_centrality": round(metrics["degree"].get(n, 0), 5),
                             "betweenness_centrality": round(metrics["between"].get(n, 0), 5), "community_id": metrics["community"].get(n, 0)}
            nodes.append(nd)
        edges = [{"id": f"{d.get('citation_source', u)}->{d.get('citation_target', v)}:{d.get('type')}",
                  "source": d.get("citation_source", u), "target": d.get("citation_target", v), "type": d.get("type", "related"),
                  "label": d.get("label"), "weight": 1.0, "rationale": d.get("rationale")} for u, v, d in graph.edges(data=True)]
        counts = {kind: sum(1 for _, d in graph.nodes(data=True) if d.get("type") == kind) for kind in ("paper", "author", "institution", "topic")}
        return {"nodes": nodes, "edges": edges, "communities": communities,
                "stats": {"total_nodes": graph.number_of_nodes(), "total_edges": graph.number_of_edges(), **{f"{k}_count": v for k, v in counts.items()},
                          "core_count": sum(1 for _, d in graph.nodes(data=True) if d.get("relevance_tier") == "core"),
                          "related_count": sum(1 for _, d in graph.nodes(data=True) if d.get("relevance_tier") == "related"), "community_count": len(communities),
                          "density": round(nx.density(graph), 5) if graph.number_of_nodes() > 1 else 0.0,
                          "query": topic_query, "scope": scope, "expansion_depth": 0 if scope == "core" else (1 if scope == "related" else 2)}}

    def _metrics(self, graph: nx.Graph) -> dict:
        if not len(graph): return {"pagerank": {}, "degree": {}, "between": {}, "community": {}}
        citation_graph = nx.DiGraph()
        citation_graph.add_nodes_from(graph.nodes)
        citation_graph.add_edges_from((data.get("citation_source", u), data.get("citation_target", v)) for u, v, data in graph.edges(data=True) if data.get("type") == "cites")
        try:
            pagerank = nx.pagerank(citation_graph, alpha=.85) if citation_graph.number_of_edges() else {n: 0.0 for n in graph}
        except Exception:
            pagerank = {n: 0.0 for n in graph}
        degree = nx.degree_centrality(graph)
        between = nx.betweenness_centrality(graph) if len(graph) > 2 else {n: 0 for n in graph}
        comm = {}
        try:
            for i, group in enumerate(nx.community.greedy_modularity_communities(graph), 1):
                for n in group: comm[n] = i
        except (nx.NetworkXError, ZeroDivisionError):
            comm = {n: i for i, n in enumerate(graph, 1)}
        return {"pagerank": pagerank, "degree": degree, "between": between, "community": comm}

    def _communities(self, graph: nx.Graph) -> list[dict]:
        if not graph.number_of_edges(): return []
        metrics = self._metrics(graph)
        result = []
        groups = {}
        for n in graph: groups.setdefault(metrics["community"].get(n, 0), []).append(n)
        for cid, members in groups.items():
            papers = [n for n in members if graph.nodes[n].get("type") == "paper"]
            authors = [n for n in members if graph.nodes[n].get("type") == "author"]
            topics = [n for n in members if graph.nodes[n].get("type") == "topic"]
            result.append({"id": cid, "name": f"Community {cid}", "size": len(members), "dominant_topic": graph.nodes[topics[0]]["label"] if topics else "Not available in the source",
                           "paper_count": len(papers), "author_count": len(authors), "topic_count": len(topics),
                           "sample_papers": [graph.nodes[n]["label"] for n in papers[:3]], "sample_authors": [graph.nodes[n]["label"] for n in authors[:3]]})
        return result

    async def find_shortest_path(self, source_id: str, target_id: str) -> dict:
        from fastapi import HTTPException
        source = await openalex_service.get_work(source_id)
        target = await openalex_service.get_work(target_id)
        ids = [source["id"], target["id"]]
        ids += source.get("referenced_works", [])[:20] + target.get("referenced_works", [])[:20]
        works = await openalex_service.get_works(list(dict.fromkeys(ids)), 42)
        by_id = {work["id"]: work for work in works}
        by_id[source["id"]] = source; by_id[target["id"]] = target
        graph = nx.DiGraph()
        graph.add_nodes_from(by_id)
        for work in by_id.values():
            for reference in work.get("referenced_works", []):
                if reference in by_id:
                    graph.add_edge(work["id"], reference)
        try:
            path = nx.shortest_path(graph, source["id"], target["id"])
        except nx.NetworkXNoPath:
            return {"found": False, "message": "No directed citation path was found in the bounded retrieved records."}
        except nx.NodeNotFound as exc:
            raise HTTPException(status_code=404, detail="A selected OpenAlex work was not found.") from exc
        details = [{"id": wid, "label": by_id[wid].get("title") or "Not available in the source", "type": "paper"} for wid in path]
        return {"found": True, "path_length": len(path) - 1, "path_nodes": path, "path_details": details,
                "explanation": "A directed citation path was found; each arrow points from a citing work to a referenced work."}


graph_service = GraphService()
