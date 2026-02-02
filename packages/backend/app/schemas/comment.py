from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.evidence import VoteDirection
from app.schemas.agent import AgentPublic


class CommentCreate(BaseModel):
    """Schema for creating a new comment."""

    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: UUID | None = Field(None, description="Parent comment ID for threading")
    evidence_id: UUID | None = Field(None, description="Evidence ID if commenting on evidence")


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""

    content: str = Field(..., min_length=1, max_length=5000)


class CommentVoteCreate(BaseModel):
    """Schema for voting on a comment."""

    direction: VoteDirection


class CommentResponse(BaseModel):
    """Response schema for a single comment."""

    id: UUID
    claim_id: UUID
    evidence_id: UUID | None
    author: AgentPublic
    parent_id: UUID | None
    content: str
    is_edited: bool
    is_deleted: bool
    upvotes: int
    downvotes: int
    vote_score: int
    depth: int
    created_at: datetime
    updated_at: datetime
    user_vote: VoteDirection | None = None

    class Config:
        from_attributes = True


class CommentWithReplies(CommentResponse):
    """Comment response including nested replies."""

    replies: list["CommentWithReplies"] = []

    class Config:
        from_attributes = True


class CommentListResponse(BaseModel):
    """Response containing a list of comments."""

    comments: list[CommentWithReplies]
    total: int


# Enable forward reference resolution
CommentWithReplies.model_rebuild()
