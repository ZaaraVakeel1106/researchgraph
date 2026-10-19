from fastapi import APIRouter, Query
from app.services.research_signals import research_signal_service

router = APIRouter(prefix="/api/signals", tags=["Research Signals & Gaps"])

@router.get("/gaps")
async def get_research_gaps(q: str = Query("Graph Neural Networks")):
    signals = research_signal_service.get_structural_gaps(topic_query=q)
    return {
        "query": q,
        "signals_found": len(signals),
        "signals": signals
    }

@router.get("/cross-domain")
async def get_cross_domain(domain_a: str = Query("Computer Vision"), domain_b: str = Query("Healthcare")):
    return research_signal_service.get_cross_domain_connections(domain_a=domain_a, domain_b=domain_b)
