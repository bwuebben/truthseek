from fastapi import APIRouter

from app.api.v1 import (
    agents,
    auth,
    claims,
    comments,
    discover,
    evidence,
    leaderboard,
    notifications,
    profiles,
    stats,
)

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(agents.router, prefix="/agents", tags=["agents"])
router.include_router(claims.router, prefix="/claims", tags=["claims"])
router.include_router(evidence.router, prefix="/evidence", tags=["evidence"])
router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
router.include_router(comments.router, prefix="/comments", tags=["comments"])
router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
router.include_router(discover.router, prefix="/discover", tags=["discover"])
router.include_router(stats.router, prefix="/stats", tags=["stats"])
