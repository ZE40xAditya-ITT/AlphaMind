from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.core.security import hash_password

def seed_database():
    """Seed the database with default admin and demo user accounts."""
    # Create tables automatically if they don't exist
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # Check and create Admin
        admin = db.query(User).filter(User.email == "admin@alphamind.com").first()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@alphamind.com",
                password_hash=hash_password("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            print("Successfully seeded Admin User: admin@alphamind.com / admin123")
        else:
            # Update password hash to match direct bcrypt format
            admin.password_hash = hash_password("admin123")
            print("Admin User password updated.")

        # Check and create Demo User
        demo = db.query(User).filter(User.email == "user@alphamind.com").first()
        if not demo:
            demo_user = User(
                username="user",
                email="user@alphamind.com",
                password_hash=hash_password("user123"),
                role="user",
                is_active=True
            )
            db.add(demo_user)
            print("Successfully seeded Demo User: user@alphamind.com / user123")
        else:
            # Update password hash to match direct bcrypt format
            demo.password_hash = hash_password("user123")
            print("Demo User password updated.")

        db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
