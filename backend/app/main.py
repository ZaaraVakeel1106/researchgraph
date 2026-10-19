from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import search, graph, algorithms, papers, signals, workspace, docs

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ResearchGraph — Explore the connections behind research. B.Tech Graph Theory Project API."
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Initialization
init_db()

# Include Routers
app.include_router(search.router)
app.include_router(graph.router)
app.include_router(algorithms.router)
app.include_router(papers.router)
app.include_router(signals.router)
app.include_router(workspace.router)
app.include_router(docs.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "RESEARCHGRAPH",
        "tagline": "Explore the connections behind research.",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
