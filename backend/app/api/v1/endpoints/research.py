from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.dependencies import get_db, get_current_user, get_current_user_from_query
from app.models.user import User
from app.models.research_report import ResearchReport
from app.services.research_pipeline_service import ResearchPipelineService

router = APIRouter()
pipeline_service = ResearchPipelineService()


class ResearchRequest(BaseModel):
    query: str


# NOTE: /history MUST be declared before /{report_id} to avoid FastAPI
# treating the string "history" as an integer path param.
@router.get("/history")
def get_research_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(ResearchReport).filter(
        ResearchReport.user_id == current_user.id
    ).order_by(ResearchReport.created_at.desc()).limit(20).all()
    return [{
        "id": r.id,
        "query": r.query,
        "status": r.status,
        "created_at": r.created_at,
        "candidate_count": len(r.candidates) if r.candidates else 0
    } for r in reports]


@router.post("/run")
def start_research(
    request: ResearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = ResearchReport(user_id=current_user.id, query=request.query, status="pending")
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"report_id": report.id, "query": request.query, "status": report.status}


@router.get("/{report_id}/stream")
def stream_research(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_query)
):
    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = "running"
    db.commit()
    return StreamingResponse(
        pipeline_service.run_pipeline_stream(db, current_user.id, report.query, report_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.get("/{report_id}")
def get_research_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "id": report.id,
        "query": report.query,
        "status": report.status,
        "candidates": report.candidates,
        "generated_report": report.generated_report,
        "created_at": report.created_at,
    }
