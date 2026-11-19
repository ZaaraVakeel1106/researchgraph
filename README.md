# ResearchGraph

ResearchGraph searches OpenAlex and turns retrieved scholarly works into a bounded graph of papers, authors, affiliations, topics, and source relationships. Citation arrows run from a citing work to a referenced work. OpenAlex outages are reported; the application does not substitute sample research records.

## Run locally

Requirements: Python 3.11+, Node.js 18+, and npm.

Backend (terminal 1):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python run.py
```

Frontend (terminal 2):

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. FastAPI docs are at `http://127.0.0.1:8000/docs`. The Vite dev server proxies `/api` to port 8000.

`OPENALEX_MAILTO` in `backend/.env` is recommended. The API key is optional. The SQLite workspace database is stored at `backend/researchgraph.db`; notes and bookmarks persist across restarts. OpenAlex data is fetched fresh.

## Graph scopes

- **Core Only**: the bounded set of direct search results and their authors, institutions, and topics.
- **Core + Related**: core works plus a bounded set of actual references and OpenAlex related works.
- **Explore Full Network**: expands those records with a bounded set of citing works.

Graph metrics describe the retrieved graph only. A sparse or disconnected graph does not establish a scientific research gap.

## Verify changes

```powershell
cd backend
python -m pytest tests -q
cd ..\frontend
npm run build
```

## Project map

- `backend/app/services/openalex_service.py`: OpenAlex requests and record normalization.
- `backend/app/services/graph_service.py`: bounded graph assembly and NetworkX measures.
- `backend/app/services/paper_service.py`: metadata, abstract, references, citing works, and related works.
- `backend/app/api/workspace.py`: SQLite notes, bookmarks, and BibTeX export.
- `frontend/src/services/api.ts`: frontend API client; failed requests surface errors instead of sample data.
