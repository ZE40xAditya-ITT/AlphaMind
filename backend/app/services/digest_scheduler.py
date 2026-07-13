"""
Weekly Digest Scheduler - runs as a standalone script for Render Cron Job.
Run: python -m app.services.digest_scheduler
"""
import logging
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.models.user import User
from app.services.digest_service import DigestService
from app.services.digest_email_service import send_digest_email

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DigestScheduler")


def run_weekly_digests():
    logger.info("Starting weekly digest generation...")
    db = SessionLocal()
    digest_service = DigestService()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        logger.info("Found %d active users.", len(users))
        for user in users:
            try:
                logger.info("Generating digest for user %s (%s)", user.id, user.email)
                digest = digest_service.generate_digest(db, user.id)
                email_sent = send_digest_email(digest, user)
                logger.info("Email sent=%s for user %s", email_sent, user.id)
            except Exception as e:
                logger.error("Error for user %s: %s", user.id, e)
                continue
        logger.info("Weekly digest generation complete.")
    finally:
        db.close()

if __name__ == "__main__":
    run_weekly_digests()
