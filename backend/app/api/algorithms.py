from fastapi import APIRouter, Query
from typing import Dict, Any, List
from app.services.graph_service import graph_service

router = APIRouter(prefix="/api/analytics", tags=["Graph Algorithms & Analytics"])

@router.get("/pagerank")
async def get_pagerank_leaderboard(q: str = Query(..., min_length=1)):
    g = await graph_service.build_graph_for_topic(q, mode="landscape", scope="related")
    nodes = g["nodes"]
    sorted_nodes = sorted(nodes, key=lambda x: x["metrics"]["pagerank"], reverse=True)
    return {
        "algorithm": "PageRank (NetworkX nx.pagerank, d=0.85)",
        "explanation": "PageRank is calculated on the directed citation edges retrieved for this query.",
        "rankings": [
            {
                "id": n["id"],
                "label": n["label"],
                "type": n["type"],
                "pagerank": n["metrics"]["pagerank"],
                "sub_label": n.get("sub_label")
            }
            for n in sorted_nodes[:10]
        ]
    }

@router.get("/centrality")
async def get_centrality_leaderboard(q: str = Query(..., min_length=1)):
    g = await graph_service.build_graph_for_topic(q, mode="landscape", scope="related")
    nodes = g["nodes"]
    by_degree = sorted(nodes, key=lambda x: x["metrics"]["degree_centrality"], reverse=True)
    by_betweenness = sorted(nodes, key=lambda x: x["metrics"]["betweenness_centrality"], reverse=True)
    return {
        "degree_centrality": [
            {"id": n["id"], "label": n["label"], "type": n["type"], "score": n["metrics"]["degree_centrality"]}
            for n in by_degree[:10]
        ],
        "betweenness_centrality": [
            {"id": n["id"], "label": n["label"], "type": n["type"], "score": n["metrics"]["betweenness_centrality"]}
            for n in by_betweenness[:10]
        ]
    }

@router.get("/communities")
async def get_detected_communities(q: str = Query(..., min_length=1)):
    g = await graph_service.build_graph_for_topic(q, mode="landscape", scope="related")
    return {
        "algorithm": "NetworkX Greedy Modularity Community Detection",
        "communities": g["communities"],
        "total_communities": len(g["communities"])
    }

@router.get("/shortest-path")
async def get_shortest_path(source: str = Query(...), target: str = Query(...)):
    return await graph_service.find_shortest_path(source_id=source, target_id=target)
