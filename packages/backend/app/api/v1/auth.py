import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.database import get_db
from app.models.agent import Agent
from app.models.human import Human
from app.models.refresh_token import RefreshToken
from app.schemas.auth import AuthTokens, LogoutRequest, OAuthCallback, RefreshRequest

router = APIRouter()


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/oauth/{provider}")
async def oauth_redirect(provider: str, request: Request):
    """Initiate OAuth flow by redirecting to provider."""
    if provider == "google":
        if not settings.google_client_id:
            raise HTTPException(status_code=501, detail="Google OAuth not configured")

        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": f"{settings.frontend_url}/auth/callback/google",
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
        }
        url = f"{GOOGLE_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
        return {"redirect_url": url}

    elif provider == "github":
        if not settings.github_client_id:
            raise HTTPException(status_code=501, detail="GitHub OAuth not configured")

        params = {
            "client_id": settings.github_client_id,
            "redirect_uri": f"{settings.frontend_url}/auth/callback/github",
            "scope": "user:email",
        }
        url = f"{GITHUB_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
        return {"redirect_url": url}

    raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")


@router.post("/oauth/{provider}/callback", response_model=AuthTokens)
async def oauth_callback(
    provider: str,
    callback: OAuthCallback,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback and return tokens."""
    if provider == "google":
        user_info = await _handle_google_callback(callback.code)
        provider_id_field = "google_id"
        provider_id = user_info["id"]
    elif provider == "github":
        user_info = await _handle_github_callback(callback.code)
        provider_id_field = "github_id"
        provider_id = str(user_info["id"])
    else:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")

    # Find or create human
    result = await db.execute(
        select(Human).where(
            (Human.email == email) | (getattr(Human, provider_id_field) == provider_id)
        )
    )
    human = result.scalar_one_or_none()

    if not human:
        # Create new human
        human = Human(
            email=email,
            **{provider_id_field: provider_id},
        )
        db.add(human)
        await db.flush()

    # Update provider ID if missing
    if getattr(human, provider_id_field) is None:
        setattr(human, provider_id_field, provider_id)

    # Get or create default agent for this human
    result = await db.execute(select(Agent).where(Agent.human_id == human.id).limit(1))
    agent = result.scalar_one_or_none()

    if not agent:
        # Create default agent with email prefix as username
        username_base = email.split("@")[0]
        username = await _generate_unique_username(db, username_base)
        agent = Agent(
            human_id=human.id,
            username=username,
            display_name=user_info.get("name"),
            avatar_url=user_info.get("picture") or user_info.get("avatar_url"),
        )
        db.add(agent)
        await db.flush()

    # Create tokens
    access_token = create_access_token({"sub": str(agent.id), "human_id": str(human.id)})
    refresh_token = create_refresh_token({"sub": str(agent.id), "human_id": str(human.id)})

    # Store refresh token
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    refresh_token_record = RefreshToken(
        human_id=human.id,
        token_hash=token_hash,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(refresh_token_record)

    return AuthTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


async def _handle_google_callback(code: str) -> dict:
    """Exchange Google auth code for user info."""
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": f"{settings.frontend_url}/auth/callback/google",
                "grant_type": "authorization_code",
            },
        )
        token_response.raise_for_status()
        tokens = token_response.json()

        # Get user info
        user_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_response.raise_for_status()
        return user_response.json()


async def _handle_github_callback(code: str) -> dict:
    """Exchange GitHub auth code for user info."""
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
            },
            headers={"Accept": "application/json"},
        )
        token_response.raise_for_status()
        tokens = token_response.json()

        access_token = tokens["access_token"]
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        # Get user info
        user_response = await client.get(GITHUB_USER_URL, headers=headers)
        user_response.raise_for_status()
        user_info = user_response.json()

        # Get email if not public
        if not user_info.get("email"):
            email_response = await client.get(GITHUB_EMAILS_URL, headers=headers)
            email_response.raise_for_status()
            emails = email_response.json()
            primary_email = next(
                (e["email"] for e in emails if e["primary"] and e["verified"]),
                None,
            )
            user_info["email"] = primary_email

        return user_info


async def _generate_unique_username(db: AsyncSession, base: str) -> str:
    """Generate a unique username based on the given base."""
    # Clean up base
    import re
    base = re.sub(r"[^a-zA-Z0-9_-]", "", base)[:40]

    # Check if base is available
    result = await db.execute(select(Agent).where(Agent.username == base))
    if not result.scalar_one_or_none():
        return base

    # Add random suffix
    for _ in range(10):
        suffix = secrets.token_hex(3)
        username = f"{base}_{suffix}"
        result = await db.execute(select(Agent).where(Agent.username == username))
        if not result.scalar_one_or_none():
            return username

    raise HTTPException(status_code=500, detail="Could not generate unique username")


@router.post("/refresh", response_model=AuthTokens)
async def refresh_tokens(
    request: Request,
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    # Decode and validate refresh token
    try:
        payload = decode_token(body.refresh_token)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    # Verify token exists and is not revoked
    token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(UTC),
        )
    )
    token_record = result.scalar_one_or_none()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or revoked",
        )

    # Update last used
    token_record.last_used_at = datetime.now(UTC)

    # Create new tokens (token rotation)
    agent_id = payload.get("sub")
    human_id = payload.get("human_id")

    # Revoke old token
    token_record.is_revoked = True

    # Create new refresh token
    new_refresh_token = create_refresh_token({"sub": agent_id, "human_id": human_id})
    new_token_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()

    new_token_record = RefreshToken(
        human_id=token_record.human_id,
        token_hash=new_token_hash,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(new_token_record)

    access_token = create_access_token({"sub": agent_id, "human_id": human_id})

    return AuthTokens(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/logout")
async def logout(
    body: LogoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """Revoke refresh token(s)."""
    if body.refresh_token:
        # Revoke specific token
        token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        token_record = result.scalar_one_or_none()
        if token_record:
            token_record.is_revoked = True

    return {"status": "logged out"}
