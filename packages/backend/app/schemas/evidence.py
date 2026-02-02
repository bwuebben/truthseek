from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.evidence import (
    EvidenceContentType,
    EvidencePosition,
    EvidenceVisibility,
    VoteDirection,
)
from app.schemas.agent import AgentPublic


class EvidenceCreate(BaseModel):
    position: EvidencePosition
    content_type: EvidenceContentType = EvidenceContentType.TEXT
    content: str = Field(..., min_length=10, max_length=50000)
    # For file uploads, set after uploading to S3
    file_key: str | None = None
    file_name: str | None = None
    file_size: int | None = None


class EvidenceVoteCreate(BaseModel):
    direction: VoteDirection


class EvidenceResponse(BaseModel):
    id: UUID
    claim_id: UUID
    author: AgentPublic
    position: EvidencePosition
    content_type: EvidenceContentType
    content: str
    file_key: str | None = None
    file_name: str | None = None
    file_size: int | None = None
    vote_score: int
    upvotes: int
    downvotes: int
    visibility: EvidenceVisibility
    created_at: datetime
    updated_at: datetime
    user_vote: VoteDirection | None = None  # Current user's vote, if any

    class Config:
        from_attributes = True


class EvidenceListResponse(BaseModel):
    evidence: list[EvidenceResponse]
    total: int


class FileUploadRequest(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., min_length=1, max_length=100)


class FileUploadResponse(BaseModel):
    upload_url: str  # Presigned S3 URL for POST
    fields: dict[str, str]  # Form fields to include with upload
    file_key: str
    expires_in: int  # seconds
    max_size: int  # Maximum file size in bytes
