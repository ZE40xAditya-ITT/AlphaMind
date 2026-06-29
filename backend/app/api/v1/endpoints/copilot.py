from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from pydantic import BaseModel
from app.services.copilot_service import CopilotService
from app.api.v1.endpoints.stocks import get_stock_analysis_service

router = APIRouter()

class CopilotRequest(BaseModel):
    symbol: str
    question: str

class GlobalCopilotRequest(BaseModel):
    question: str

class CopilotResponse(BaseModel):
    answer: str

def get_copilot_service(
    stock_service = Depends(get_stock_analysis_service)
) -> CopilotService:
    return CopilotService(stock_service)

@router.post("/ask", response_model=CopilotResponse)
def ask_copilot(
    request: CopilotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    copilot_service: CopilotService = Depends(get_copilot_service)
):
    """Ask the AI Copilot a question about a specific stock."""
    try:
        answer = copilot_service.ask_question(db, current_user.id, request.symbol, request.question)
        return CopilotResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask-global", response_model=CopilotResponse)
def ask_global_copilot(
    request: GlobalCopilotRequest,
    current_user: User = Depends(get_current_user),
    service: CopilotService = Depends(get_copilot_service)
):
    """Ask the Global AI Copilot a general market question."""
    try:
        answer = service.ask_global_question(request.question)
        return CopilotResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
