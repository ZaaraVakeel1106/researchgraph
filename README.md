# RESEARCHGRAPH — "Explore the Connections Behind Research"

**RESEARCHGRAPH** is a production-quality research intelligence and discovery platform built around **Graph Theory**. It models academic literature as a connected network of **Papers**, **Authors**, **Institutions**, and **Topics**, using real scholarly data from OpenAlex and NetworkX graph algorithms.

---

## Key Features

1. **Interactive Cytoscape Research Landscape**:
   - Visualizes heterogeneous networks with 4 graph perspectives: **Citation Network**, **Author Collaboration**, **Research Landscape**, and **Topic Network**.
   - Supports 2D layout physics, zoom, pan, hover node highlighting, and 1-click neighborhood inspection.

2. **NetworkX Graph Theory Algorithms**:
   - **PageRank ($PR$)**: Calculates node prestige and citation influence ($d=0.85$).
   - **Betweenness Centrality ($C_B$)**: Discovers bridge researchers and interdisciplinary topics connecting clusters.
   - **Degree Centrality ($C_D$)**: Surfacing highly connected entities.
   - **Louvain Community Detection**: Groups research into modular clusters based on network topology.
   - **Dijkstra Shortest Path**: Traces exact citation and collaboration chains connecting any two entities.

3. **Paper Study View**:
   - Editorial breakdown: Research Problem, Methodology, Key Results, and Limitations.
   - Research Context Timeline: Predecessors → Target Paper → Successors.
   - **"What Should I Read Next?"**: Graph-based recommendations with explicit structural justifications.

4. **Structural Research Gap Signals & Cross-Domain Finder**:
   - Surfaces weakly connected topic clusters and cross-domain connections (e.g. *Computer Vision* ↔ *Healthcare*) with mathematical edge-density rationale.

5. **Personal Workspace & Export**:
   - Save bookmarks, tag reading status (`Unread`, `Reading`, `Read`, `Important`), write research notes, and export BibTeX.

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, NetworkX, SQLite, HTTPX, Pydantic v2, python-dotenv.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Cytoscape.js, Lucide Icons.
- **Data Source**: OpenAlex REST API (`https://api.openalex.org`) + DB caching & offline fallback seed.

---

## Prerequisites

Before you start, make sure the following are installed on your machine:

| Tool | Minimum Version | Check |
|---|---|---|
| Python | 3.11+ | `python --version` |
| pip | 21+ | `pip --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

> **Note:** Python and Node.js are the only system-level requirements. No database server (PostgreSQL, MySQL, etc.) is needed — the project uses SQLite, which is built into Python.

---

## Environment Configuration

The backend reads configuration from an optional `.env` file.

1. Copy the provided example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Open `backend/.env` and set your values:
   ```env
   # Your email — enables higher OpenAlex API rate limits (recommended)
   OPENALEX_MAILTO=your-email@example.com

   # Leave blank — OpenAlex is free, no key required for standard use
   OPENALEX_API_KEY=

   # SQLite database path (default, no changes needed)
   DATABASE_URL=sqlite:///./researchgraph.db
   ```

> **The application works without a `.env` file.** All variables have sensible defaults. The only value worth setting is `OPENALEX_MAILTO` to get a higher API rate limit from OpenAlex.

---

## Running Locally

Open **two separate terminals** — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python run.py
```

The backend API will be available at:
- **API server**: `http://127.0.0.1:8000`
- **Interactive API docs**: `http://127.0.0.1:8000/docs`

> The SQLite database file (`researchgraph.db`) is created automatically on first run. You do not need to run any database migrations.

---

### Terminal 2 — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at: **`http://localhost:5173`**

> The frontend development server proxies all `/api/*` requests to the backend at `http://127.0.0.1:8000`. Both servers must be running simultaneously.

---

## Project Structure

```
researchgraph/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Environment variable configuration
│   │   ├── database.py          # SQLite setup & helper functions
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── openalex_service.py   # OpenAlex API client + offline seed
│   │   │   ├── graph_service.py      # NetworkX graph engine & algorithms
│   │   │   ├── paper_service.py      # Paper study & recommendation logic
│   │   │   └── research_signals.py  # Research gap & cross-domain detection
│   │   └── api/
│   │       ├── search.py        # /api/search endpoint
│   │       ├── graph.py         # /api/graph endpoint
│   │       ├── algorithms.py    # /api/algorithms (PageRank, centrality, Dijkstra)
│   │       ├── papers.py        # /api/papers endpoint
│   │       ├── signals.py       # /api/signals endpoint
│   │       ├── workspace.py     # /api/workspace (bookmarks, notes, BibTeX)
│   │       └── docs.py          # /api/docs endpoint
│   ├── tests/
│   ├── run.py                   # Uvicorn server launcher
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment variable template (copy to .env)
├── frontend/
│   ├── src/
│   │   ├── components/          # UI components (graph, modals, panels)
│   │   ├── pages/               # LandingPage & ResearchWorkspace
│   │   ├── services/
│   │   │   └── api.ts           # API client (also contains offline fallback data)
│   │   └── types/               # TypeScript type definitions
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts           # Dev server + API proxy configuration
├── ARCHITECTURE.md
├── README.md
└── .gitignore
```

---

## External Services

| Service | Required | Purpose | Cost |
|---|---|---|---|
| [OpenAlex API](https://openalex.org) | Optional | Live scholarly data (papers, authors, citations) | Free |

> **No external services are strictly required.** The application ships with an embedded offline seed dataset covering Graph Neural Networks, Transformers, Federated Learning, Computer Vision, and Quantum Computing. This seed data is used automatically if the OpenAlex API is unavailable or rate-limited.

---

## Troubleshooting

### Backend fails to start — `ModuleNotFoundError`
You are likely running Python outside the virtual environment. Activate it first:
```bash
# Windows
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate
```
Then retry `pip install -r requirements.txt` and `python run.py`.

---

### Frontend shows "Failed to fetch" / API errors
Make sure the **backend is running** at `http://127.0.0.1:8000`. The frontend proxies all `/api` calls to the backend. If the backend is down, the frontend falls back to its built-in offline seed graph data.

---

### Port already in use
- **Backend port 8000**: Change the port in `backend/run.py` (edit `port=8000`) and update `vite.config.ts` proxy target accordingly.
- **Frontend port 5173**: Run `npm run dev -- --port 3000` to use a different port.

---

### OpenAlex rate limiting (429 errors)
Set `OPENALEX_MAILTO` in `backend/.env` to your email address. This places your requests in OpenAlex's "polite pool" with a much higher rate limit. The application will still function using cached data and the offline seed while rate-limited.

---

### Reset the database
Delete `backend/researchgraph.db`. It will be recreated automatically with empty tables on the next server start.

```bash
# Windows
del backend\researchgraph.db

# macOS / Linux
rm backend/researchgraph.db
```
