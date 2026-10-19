# RESEARCHGRAPH — Architecture Document

## System Architecture

```mermaid
graph TD
    Client[React + TypeScript + Cytoscape.js Frontend] -->|REST API Requests| FastAPI[FastAPI Backend Server]
    FastAPI --> OpenAlexService[OpenAlex Service]
    FastAPI --> GraphEngine[NetworkX Graph Engine]
    FastAPI --> DB[(SQLite / PostgreSQL Cache & Workspace DB)]

    OpenAlexService -->|HTTPS Requests & Mailto Header| OpenAlex[OpenAlex API Endpoint]
    OpenAlexService -->|Seed Fallback Cache| DB

    GraphEngine -->|Calculates PageRank, Centrality & Louvain| Metrics[Graph Metrics Engine]
    GraphEngine -->|Dijkstra Pathfinding| ShortestPath[Pathfinder]
```

## Data Model

- **Nodes ($V$)**:
  - `Paper`: Title, Year, Venue, Citation Count, DOI.
  - `Author`: Name, Affiliated Institution, Citation Influence.
  - `Institution`: Display Name, Country.
  - `Topic`: Field name, Sub-topics.
- **Edges ($E$)**:
  - `cites`: Directed arc $P_1 \rightarrow P_2$.
  - `authored`: Directed arc $A_1 \rightarrow P_1$.
  - `affiliated_with`: Directed arc $A_1 \rightarrow I_1$.
  - `has_topic`: Directed arc $P_1 \rightarrow T_1$.
  - `collaborates_with`: Undirected edge $A_1 \leftrightarrow A_2$ with co-authorship weights.
