from fastapi import APIRouter

router = APIRouter()

@router.get("/{mvp_id}", tags=["token"])
def get_token(mvp_id: int):
    return {"token": None}
