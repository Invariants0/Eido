from fastapi import APIRouter

router = APIRouter()

@router.get("/status", tags=["agent"])
def agent_status():
    return {"status": "idle"}
