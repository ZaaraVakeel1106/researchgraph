import networkx as nx
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.services.openalex_service import openalex_service, SEED_WORKS

logger = logging.getLogger("graph_service")

class GraphService:
    def build_graph_for_topic(
        self,
        topic_query: str = "Graph Neural Networks",
        mode: str = "landscape",
        center_node_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Constructs a NetworkX graph with topological relevance tiering (Core, Related, Adjacent) and connection explanations."""
        G = nx.Graph()
        diG = nx.DiGraph()

        raw_works = SEED_WORKS
        query_lower = topic_query.lower()

        # Add Nodes & Edges from SEED_WORKS / OpenAlex data
        for work in raw_works:
            w_id = work["id"]

            # Relevance score & tier calculation
            title_lower = work["title"].lower()
            is_core_paper = query_lower in title_lower or any(query_lower in t.lower() for t in work.get("topics", []))
            rel_tier = "core" if is_core_paper else "related"

            paper_attr = {
                "id": w_id,
                "label": work["title"],
                "type": "paper",
                "year": work["publication_year"],
                "citations": work["cited_by_count"],
                "sub_label": f"{work['venue']} ({work['publication_year']})",
                "relevance_tier": rel_tier,
                "connection_rationale": f"Core paper matching '{topic_query}'" if is_core_paper else f"Connected work cited by or citing core literature in {topic_query}."
            }
            G.add_node(w_id, **paper_attr)
            diG.add_node(w_id, **paper_attr)

            # Author Nodes & Authorship Edges
            for author in work.get("authors", []):
                a_id = author["id"]
                if not G.has_node(a_id):
                    author_attr = {
                        "id": a_id,
                        "label": author["name"],
                        "type": "author",
                        "sub_label": author.get("institution", "Academic Researcher"),
                        "citations": work["cited_by_count"],
                        "relevance_tier": "core" if is_core_paper else "related",
                        "connection_rationale": f"Author of key paper '{work['title']}' in {topic_query}."
                    }
                    G.add_node(a_id, **author_attr)
                    diG.add_node(a_id, **author_attr)
                
                G.add_edge(a_id, w_id, type="authored", weight=1.0)
                diG.add_edge(a_id, w_id, type="authored", weight=1.0)

                # Institution Node & Affiliation Edge
                inst_name = author.get("institution")
                if inst_name:
                    inst_id = f"I_{inst_name.replace(' ', '_')}"
                    if not G.has_node(inst_id):
                        inst_attr = {
                            "id": inst_id,
                            "label": inst_name,
                            "type": "institution",
                            "sub_label": "Research Institution",
                            "relevance_tier": "related",
                            "connection_rationale": f"Affiliated institution of researchers publishing in {topic_query}."
                        }
                        G.add_node(inst_id, **inst_attr)
                        diG.add_node(inst_id, **inst_attr)
                    G.add_edge(a_id, inst_id, type="affiliated_with", weight=1.0)

            # Topic Nodes & Topic Edges with Relevance Tiering
            for topic in work.get("topics", []):
                t_id = f"T_{topic.replace(' ', '_')}"
                t_lower = topic.lower()

                if "graph" in t_lower or query_lower in t_lower:
                    topic_tier = "core"
                    rationale = f"Direct core research topic matching '{topic_query}'."
                elif any(term in t_lower for term in ["attention", "semi-supervised", "learning", "deep"]):
                    topic_tier = "related"
                    rationale = f"Strongly connected research area linked through paper methodology in {topic_query}."
                else:
                    topic_tier = "adjacent"
                    rationale = f"Adjacent research domain connected via interdisciplinary paper applications (e.g. Transformers & NLP)."

                if not G.has_node(t_id):
                    topic_attr = {
                        "id": t_id,
                        "label": topic,
                        "type": "topic",
                        "sub_label": f"{topic_tier.capitalize()} Research Area",
                        "relevance_tier": topic_tier,
                        "connection_rationale": rationale
                    }
                    G.add_node(t_id, **topic_attr)
                    diG.add_node(t_id, **topic_attr)
                G.add_edge(w_id, t_id, type="has_topic", weight=1.0)

            # Citation Edges
            for cited_id in work.get("citations", []):
                if cited_id in [w["id"] for w in raw_works]:
                    G.add_edge(w_id, cited_id, type="cites", weight=1.0)
                    diG.add_edge(w_id, cited_id, type="cites", weight=1.0)

        # Mode Filtering
        filtered_G = self._apply_mode_filter(G, mode)

        # If re-centered on a node, compute k-hop subgraph around center
        if center_node_id and filtered_G.has_node(center_node_id):
            center_neighbors = set(nx.single_source_shortest_path_length(filtered_G, center_node_id, cutoff=2).keys())
            filtered_G = filtered_G.subgraph(center_neighbors).copy()

        # Calculate Graph Metrics using NetworkX
        metrics = self._compute_graph_metrics(filtered_G, diG)

        # Detect Communities
        communities = self._detect_communities(filtered_G)

        # Format output
        nodes_output = []
        for n, data in filtered_G.nodes(data=True):
            node_metrics = {
                "pagerank": round(metrics["pagerank"].get(n, 0.0), 4),
                "degree_centrality": round(metrics["degree_centrality"].get(n, 0.0), 4),
                "betweenness_centrality": round(metrics["betweenness_centrality"].get(n, 0.0), 4),
                "community_id": metrics["community_map"].get(n, 0)
            }
            node_copy = dict(data)
            node_copy["metrics"] = node_metrics
            nodes_output.append(node_copy)

        edges_output = []
        for u, v, data in filtered_G.edges(data=True):
            edges_output.append({
                "id": f"{u}->{v}",
                "source": u,
                "target": v,
                "type": data.get("type", "connected_to"),
                "label": data.get("label", data.get("type")),
                "weight": data.get("weight", 1.0)
            })

        stats = {
            "total_nodes": len(nodes_output),
            "total_edges": len(edges_output),
            "paper_count": len([n for n in nodes_output if n.get("type") == "paper"]),
            "author_count": len([n for n in nodes_output if n.get("type") == "author"]),
            "institution_count": len([n for n in nodes_output if n.get("type") == "institution"]),
            "topic_count": len([n for n in nodes_output if n.get("type") == "topic"]),
            "core_count": len([n for n in nodes_output if n.get("relevance_tier") == "core"]),
            "related_count": len([n for n in nodes_output if n.get("relevance_tier") == "related"]),
            "adjacent_count": len([n for n in nodes_output if n.get("relevance_tier") == "adjacent"]),
            "community_count": len(communities),
            "density": round(nx.density(filtered_G), 4)
        }

        return {
            "nodes": nodes_output,
            "edges": edges_output,
            "stats": stats,
            "communities": communities
        }

    def _apply_mode_filter(self, G: nx.Graph, mode: str) -> nx.Graph:
        if mode == "citation":
            paper_nodes = [n for n, d in G.nodes(data=True) if d.get("type") == "paper"]
            subG = G.subgraph(paper_nodes).copy()
            edges_to_remove = [(u, v) for u, v, d in subG.edges(data=True) if d.get("type") != "cites"]
            subG.remove_edges_from(edges_to_remove)
            return subG

        elif mode == "author_collaboration":
            author_nodes = [n for n, d in G.nodes(data=True) if d.get("type") == "author"]
            subG = G.subgraph(author_nodes).copy()
            edges_to_remove = [(u, v) for u, v, d in subG.edges(data=True) if d.get("type") != "collaborates_with"]
            subG.remove_edges_from(edges_to_remove)
            return subG

        elif mode == "topic":
            topic_nodes = [n for n, d in G.nodes(data=True) if d.get("type") == "topic"]
            subG = nx.Graph()
            for t in topic_nodes:
                subG.add_node(t, **G.nodes[t])
            paper_nodes = [n for n, d in G.nodes(data=True) if d.get("type") == "paper"]
            for p in paper_nodes:
                p_topics = [nbr for nbr in G.neighbors(p) if G.nodes[nbr].get("type") == "topic"]
                for i in range(len(p_topics)):
                    for j in range(i + 1, len(p_topics)):
                        t1, t2 = p_topics[i], p_topics[j]
                        if subG.has_edge(t1, t2):
                            subG[t1][t2]["weight"] += 1.0
                        else:
                            subG.add_edge(t1, t2, type="topic_rel", weight=1.0, label="Co-occurring Topics")
            return subG

        return G

    def _compute_graph_metrics(self, G: nx.Graph, diG: nx.DiGraph) -> Dict[str, Any]:
        if len(G) == 0:
            return {"pagerank": {}, "degree_centrality": {}, "betweenness_centrality": {}, "community_map": {}}

        try:
            pagerank = nx.pagerank(G, alpha=0.85)
        except Exception:
            pagerank = {n: 1.0 / len(G) for n in G.nodes()}

        degree_centrality = nx.degree_centrality(G)
        betweenness_centrality = nx.betweenness_centrality(G)

        community_map = {}
        try:
            comms = list(nx.community.greedy_modularity_communities(G))
            for cid, comm in enumerate(comms):
                for node in comm:
                    community_map[node] = cid + 1
        except Exception:
            for node in G.nodes():
                community_map[node] = 1

        return {
            "pagerank": pagerank,
            "degree_centrality": degree_centrality,
            "betweenness_centrality": betweenness_centrality,
            "community_map": community_map
        }

    def _detect_communities(self, G: nx.Graph) -> List[Dict[str, Any]]:
        if len(G) == 0:
            return []

        try:
            comms = list(nx.community.greedy_modularity_communities(G))
        except Exception:
            comms = [set(G.nodes())]

        community_list = []
        for cid, comm in enumerate(comms):
            nodes = list(comm)
            papers = [n for n in nodes if G.nodes[n].get("type") == "paper"]
            authors = [n for n in nodes if G.nodes[n].get("type") == "author"]
            topics = [n for n in nodes if G.nodes[n].get("type") == "topic"]
            
            dominant_topic = G.nodes[topics[0]].get("label") if topics else "Interdisciplinary Cluster"

            community_list.append({
                "id": cid + 1,
                "name": f"Community {cid + 1}: {dominant_topic}",
                "size": len(nodes),
                "dominant_topic": dominant_topic,
                "paper_count": len(papers),
                "author_count": len(authors),
                "topic_count": len(topics),
                "sample_papers": [G.nodes[p].get("label") for p in papers[:3]],
                "sample_authors": [G.nodes[a].get("label") for a in authors[:3]]
            })

        return community_list

    def find_shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        graph_data = self.build_graph_for_topic(mode="landscape")
        G = nx.Graph()
        for edge in graph_data["edges"]:
            G.add_edge(edge["source"], edge["target"], weight=edge.get("weight", 1.0))
        
        for node in graph_data["nodes"]:
            if node["id"] not in G:
                G.add_node(node["id"])

        if not G.has_node(source_id) or not G.has_node(target_id):
            return {"found": False, "message": "Source or target node not found in graph."}

        try:
            path_nodes = nx.shortest_path(G, source=source_id, target=target_id)
            path_length = nx.shortest_path_length(G, source=source_id, target=target_id)
            node_map = {n["id"]: n for n in graph_data["nodes"]}
            path_details = [node_map.get(n, {"id": n, "label": n, "type": "unknown"}) for n in path_nodes]

            return {
                "found": True,
                "path_length": path_length,
                "path_nodes": path_nodes,
                "path_details": path_details,
                "explanation": f"Found shortest connection of {path_length} hops passing through {len(path_nodes) - 2} intermediate entities."
            }
        except nx.NetworkXNoPath:
            return {"found": False, "message": "No connected citation or collaboration path exists between these entities."}

graph_service = GraphService()
