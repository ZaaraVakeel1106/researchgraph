from fastapi import APIRouter, HTTPException
from app.models.schemas import PaperStudyView
from app.services.paper_service import paper_service

router = APIRouter(prefix="/api/papers", tags=["Paper Study"])

@router.get("/{paper_id}/study", response_model=PaperStudyView)
async def get_paper_study(paper_id: str):
    try:
        data = paper_service.get_paper_study_view(paper_id)
        return PaperStudyView(**data)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Paper with ID '{paper_id}' not found. {str(e)}")
