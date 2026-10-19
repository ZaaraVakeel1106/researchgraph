from fastapi import APIRouter

router = APIRouter(prefix="/api/graph-theory", tags=["Academic Documentation"])

@router.get("/doc")
async def get_graph_theory_doc():
    return {
        "title": "ResearchGraph — Academic Graph Theory Documentation",
        "author": "B.Tech Graph Theory Project",
        "sections": [
            {
                "topic": "1. Graph Representation",
                "content": "The scholarly landscape is modeled as a heterogeneous Graph G = (V, E) where Vertices V include Papers, Authors, Institutions, and Topics. Edges E comprise directed citation arcs, undirected co-authorship links, authorship affiliations, and topic associations."
            },
            {
                "topic": "2. PageRank Algorithm",
                "content": "Computes node prestige using the stochastic stationary distribution vector: PR(u) = (1-d)/N + d * sum_{v in B_u} (PR(v) / L(v)), with damping factor d=0.85."
            },
            {
                "topic": "3. Betweenness Centrality",
                "content": "Quantifies node bridging control over graph information flows: C_B(v) = sum_{s != v != t} (sigma_{st}(v) / sigma_{st}). Used to discover bridge researchers and interdisciplinary topics."
            },
            {
                "topic": "4. Community Detection (Louvain / Greedy Modularity)",
                "content": "Optimizes modularity Q = (1 / 2m) * sum_{ij} [A_{ij} - (k_i * k_j / 2m)] * delta(c_i, c_j), clustering papers and authors into distinct thematic research communities."
            },
            {
                "topic": "5. Shortest Path Analysis",
                "content": "Uses Dijkstra's algorithm to trace shortest relational citation chains connecting disparate papers A and B."
            }
        ]
    }
