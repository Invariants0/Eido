from fastapi import APIRouter

router = APIRouter()

@router.get("/list", tags=["mvp"])
def list_mvps():
    return {"mvps": []}
