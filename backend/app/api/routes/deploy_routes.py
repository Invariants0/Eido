from fastapi import APIRouter

router = APIRouter()

@router.post("/{mvp_id}", tags=["deploy"])
def deploy_mvp(mvp_id: int):
    return {"url": None, "status": "pending"}
