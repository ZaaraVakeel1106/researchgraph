import networkx as nx
from app.services.graph_service import graph_service


class ResearchSignalService:
    async def get_structural_gaps(self, topic_query: str) -> list[dict]:
        # Sparse graph connections do not establish a scientific research gap.
        return []

    async def get_cross_domain_connections(self, domain_a: str, domain_b: str) -> dict:
        left, right = await graph_service.build_graph_for_topic(domain_a, scope="related"), await graph_service.build_graph_for_topic(domain_b, scope="related")
        node_map = {node["id"]: node for node in left["nodes"] + right["nodes"]}
        graph = nx.Graph()
        graph.add_nodes_from(node_map)
        graph.add_edges_from((edge["source"], edge["target"]) for edge in left["edges"] + right["edges"] if edge["source"] in node_map and edge["target"] in node_map)
        starts = [n["id"] for n in left["nodes"] if n["type"] == "paper" and n.get("relevance_tier") == "core"]
        ends = {n["id"] for n in right["nodes"] if n["type"] == "paper" and n.get("relevance_tier") == "core"}
        found_path = None
        for start in starts:
            if start not in graph:
                continue
            distances = nx.single_source_shortest_path_length(graph, start)
            reachable = ends.intersection(distances)
            if reachable:
                end = min(reachable, key=lambda work_id: distances[work_id])
                found_path = nx.shortest_path(graph, start, end)
                break
        details = [node_map[node_id] for node_id in found_path] if found_path else []
        topics = list(dict.fromkeys(n["label"] for n in details if n.get("type") == "topic"))
        authors = list(dict.fromkeys(n["id"] for n in details if n.get("type") == "author"))
        researchers = [{"name": node_map[author]["label"], "institution": "Not available in the source",
                        "betweenness": node_map[author].get("metrics", {}).get("betweenness_centrality", 0), "role": "Author on retrieved connection"}
                       for author in authors]
        if found_path:
            summary = f"A structural path of {len(found_path) - 1} edges connects retrieved works for {domain_a} and {domain_b}. This path is a graph connection, not evidence of a scientific bridge."
            path = {"found": True, "path_length": len(found_path) - 1, "path_nodes": found_path,
                    "path_details": [{"id": n["id"], "label": n["label"], "type": n["type"]} for n in details],
                    "explanation": "Undirected structural path through retrieved OpenAlex relationships."}
        else:
            summary = f"No structural connection was found in the bounded records retrieved for {domain_a} and {domain_b}."
            path = {"found": False, "explanation": summary}
        return {"domain_a": domain_a, "domain_b": domain_b, "bridge_found": bool(found_path), "shortest_path": path,
                "bridging_topics": topics, "bridging_researchers": researchers, "structural_summary": summary}


research_signal_service = ResearchSignalService()
