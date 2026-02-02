"""
Background worker for processing async jobs.

Handles:
- Gradient recalculation batching
- Consensus checking
- Reputation updates
"""

import asyncio
import json
import logging
from datetime import UTC, datetime

import redis.asyncio as redis

from app.core.config import settings
from app.core.database import async_session_maker
from app.services.gradient_service import GradientService
from app.services.reputation_service import ReputationService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Worker:
    def __init__(self):
        self.redis: redis.Redis | None = None
        self.running = False

    async def start(self):
        """Start the worker."""
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
        self.running = True
        logger.info("Worker started")

        # Run tasks concurrently
        await asyncio.gather(
            self.process_gradient_updates(),
            self.process_consensus_checks(),
            self.cleanup_expired_tokens(),
        )

    async def stop(self):
        """Stop the worker."""
        self.running = False
        if self.redis:
            await self.redis.close()
        logger.info("Worker stopped")

    async def process_gradient_updates(self):
        """Process pending gradient update requests."""
        queue_key = "queue:gradient_updates"

        while self.running:
            try:
                # Batch process gradient updates
                claim_ids = []
                for _ in range(100):  # Max batch size
                    claim_id = await self.redis.lpop(queue_key)
                    if not claim_id:
                        break
                    if claim_id not in claim_ids:
                        claim_ids.append(claim_id)

                if claim_ids:
                    async with async_session_maker() as db:
                        gradient_service = GradientService(db, self.redis)
                        for claim_id in claim_ids:
                            try:
                                await gradient_service.update_gradient(claim_id)
                                logger.debug(f"Updated gradient for claim {claim_id}")
                            except Exception as e:
                                logger.error(f"Failed to update gradient for {claim_id}: {e}")
                        await db.commit()

                    logger.info(f"Processed {len(claim_ids)} gradient updates")

                # Wait before next batch
                await asyncio.sleep(5)

            except Exception as e:
                logger.error(f"Error processing gradient updates: {e}")
                await asyncio.sleep(10)

    async def process_consensus_checks(self):
        """Check for claims reaching consensus and update reputation."""
        while self.running:
            try:
                # Check claims that have enough votes for consensus
                async with async_session_maker() as db:
                    from sqlalchemy import select
                    from app.models.claim import Claim, ClaimVote

                    # Find claims with significant vote counts that need consensus check
                    result = await db.execute(
                        select(Claim)
                        .where(Claim.vote_count >= 10)  # Minimum votes for consensus
                        .order_by(Claim.updated_at.desc())
                        .limit(50)
                    )
                    claims = result.scalars().all()

                    for claim in claims:
                        gradient = claim.gradient

                        # Check if consensus reached (strong agreement)
                        if gradient > 0.7 or gradient < 0.3:
                            # Get all votes for this claim
                            votes_result = await db.execute(
                                select(ClaimVote).where(ClaimVote.claim_id == claim.id)
                            )
                            votes = votes_result.scalars().all()

                            # Check if consensus was already processed
                            cache_key = f"consensus_processed:{claim.id}"
                            already_processed = await self.redis.get(cache_key)

                            if not already_processed:
                                reputation_service = ReputationService(db, self.redis)
                                await reputation_service.on_consensus_reached(
                                    claim.id,
                                    gradient,
                                    [(v.agent_id, v.value) for v in votes],
                                )
                                # Mark as processed (expires after 24 hours)
                                await self.redis.setex(cache_key, 86400, "1")
                                logger.info(f"Processed consensus for claim {claim.id}")

                    await db.commit()

                # Check every 5 minutes
                await asyncio.sleep(300)

            except Exception as e:
                logger.error(f"Error processing consensus checks: {e}")
                await asyncio.sleep(60)

    async def cleanup_expired_tokens(self):
        """Clean up expired refresh tokens."""
        while self.running:
            try:
                async with async_session_maker() as db:
                    from sqlalchemy import delete
                    from app.models.refresh_token import RefreshToken

                    # Delete expired or revoked tokens
                    result = await db.execute(
                        delete(RefreshToken).where(
                            (RefreshToken.expires_at < datetime.now(UTC))
                            | (RefreshToken.is_revoked == True)
                        )
                    )
                    deleted_count = result.rowcount
                    await db.commit()

                    if deleted_count > 0:
                        logger.info(f"Cleaned up {deleted_count} expired/revoked tokens")

                # Run every hour
                await asyncio.sleep(3600)

            except Exception as e:
                logger.error(f"Error cleaning up tokens: {e}")
                await asyncio.sleep(600)


async def main():
    worker = Worker()

    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        await worker.stop()


if __name__ == "__main__":
    asyncio.run(main())
