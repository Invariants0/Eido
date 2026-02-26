from fastapi import APIRouter
from ...db.mock_data import MOCK_DASHBOARD_SUMMARY, MOCK_ACTIVITY

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary():
    """Get summarized statistics for the dashboard."""
    return MOCK_DASHBOARD_SUMMARY

@router.get("/activity")
async def get_recent_activity():
    """Get recent system activity logs."""
    return MOCK_ACTIVITY
