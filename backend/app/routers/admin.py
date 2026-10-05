"""
routers/admin.py – super_admin-only endpoints for user management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Role, User
from app.schemas import PatchUserRequest, RoleOut, UserAdminOut

router = APIRouter(prefix="/admin", tags=["admin"])

# Roles that can be ASSIGNED via the API (super_admin is excluded by design)
ASSIGNABLE_ROLES = {"admin", "content_manager", "report_viewer"}


@router.get("/users", response_model=list[UserAdminOut])
def list_users(
    status: str | None = Query(None, description="'pending' to show only unapproved users"),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    """
    Returns all users ordered newest-first.
    Pass ?status=pending to show only users with no assigned role.
    """
    q = db.query(User)
    if status == "pending":
        q = q.filter(User.role_id == None)  # noqa: E711
    users = q.order_by(User.created_at.desc()).all()

    return [
        UserAdminOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.name if u.role else None,
            is_active=u.is_active,
            created_at=u.created_at,
            last_login_at=u.last_login_at,
        )
        for u in users
    ]


@router.get("/roles", response_model=list[RoleOut])
def list_assignable_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    """Returns roles that can be assigned to users (super_admin excluded)."""
    roles = (
        db.query(Role)
        .filter(Role.name.in_(ASSIGNABLE_ROLES))
        .all()
    )
    return roles


@router.patch("/users/{user_id}", response_model=UserAdminOut)
def patch_user(
    user_id: str,
    body: PatchUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("super_admin")),
):
    """
    Assign a role and/or toggle is_active for a user.

    Rules enforced server-side:
    - super_admin role cannot be assigned via the API.
    - A super admin cannot modify their own role or deactivate themselves.
    - Unknown role name returns 422.
    """
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent self-modification of role / active status
    if target.id == current_admin.id:
        raise HTTPException(
            status_code=403,
            detail="Super admin cannot modify their own account via this endpoint",
        )

    if body.role is not None:
        # Disallow assigning super_admin through the API
        if body.role == "super_admin":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot assign super_admin role via the API",
            )
        if body.role not in ASSIGNABLE_ROLES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown role '{body.role}'. Assignable roles: {sorted(ASSIGNABLE_ROLES)}",
            )
        role_obj = db.query(Role).filter(Role.name == body.role).first()
        if not role_obj:
            raise HTTPException(status_code=404, detail="Role not found in DB")
        target.role_id = role_obj.id

    if body.is_active is not None:
        target.is_active = body.is_active

    db.commit()
    db.refresh(target)

    return UserAdminOut(
        id=target.id,
        email=target.email,
        full_name=target.full_name,
        role=target.role.name if target.role else None,
        is_active=target.is_active,
        created_at=target.created_at,
        last_login_at=target.last_login_at,
    )
