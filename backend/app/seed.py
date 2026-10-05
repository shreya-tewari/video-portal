"""
seed.py – idempotent data seeding called once at startup.

Creates the four base roles and the first super-admin user
(credentials taken from .env) if they don't already exist.
"""

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Role, User
from app.security import hash_password

# All roles the system knows about
ROLES = [
    ("super_admin", "Full system access"),
    ("admin", "Administrator access"),
    ("content_manager", "Can manage content"),
    ("report_viewer", "Can view reports"),
]


def seed_roles(db: Session) -> dict[str, Role]:
    """Ensure all roles exist; return a name→Role mapping."""
    role_map: dict[str, Role] = {}
    for name, description in ROLES:
        role = db.query(Role).filter(Role.name == name).first()
        if not role:
            role = Role(name=name, description=description)
            db.add(role)
        role_map[name] = role
    db.commit()
    # Refresh to get DB-assigned IDs
    for role in role_map.values():
        db.refresh(role)
    return role_map


def seed_superadmin(db: Session, role_map: dict[str, Role]) -> None:
    """Create the first super-admin if not already present."""
    email = settings.FIRST_SUPERADMIN_EMAIL.lower()
    if db.query(User).filter(User.email == email).first():
        return  # Already exists, nothing to do

    super_admin_role = role_map["super_admin"]
    admin = User(
        email=email,
        full_name="Super Administrator",
        password_hash=hash_password(settings.FIRST_SUPERADMIN_PASSWORD),
        role_id=super_admin_role.id,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print(f"[seed] Super admin created: {email}")


def run_seed(db: Session) -> None:
    """Entry point called from app startup."""
    role_map = seed_roles(db)
    seed_superadmin(db, role_map)
