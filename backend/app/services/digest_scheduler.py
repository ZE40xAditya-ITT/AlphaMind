"""
Weekly Digest Scheduler - runs as a standalone script for Render Cron Job.
Run: python -m app.services.digest_scheduler
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.models.user import User
from app.services.digest_service import DigestService
from app.services.digest_email_service import send_digest_email


def run_weekly_digests():
    print("[DigestScheduler] Starting weekly digest generation...")
    db = SessionLocal()
    digest_service = DigestService()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        print(f"[DigestScheduler] Found {len(users)} active users.")
        for user in users:
            try:
                print(f"[DigestScheduler] Generating digest for user {user.id} ({user.email})")
                digest = digest_service.generate_digest(db, user.id)
                email_sent = send_digest_email(digest, user)
                print(f"[DigestScheduler] Email sent={email_sent} for user {user.id}")
            except Exception as e:
                print(f"[DigestScheduler] Error for user {user.id}: {e}")
                continue
        print("[DigestScheduler] Complete.")
    finally:
        db.close()

if __name__ == "__main__":
    run_weekly_digests()
