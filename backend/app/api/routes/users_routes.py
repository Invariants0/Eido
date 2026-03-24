from fastapi import APIRouter, Depends

from ...models.user import User
from ..dependencies.auth import get_current_user
from ..schemas.auth import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user
