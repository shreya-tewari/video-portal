"""
dependencies.py – reusable FastAPI dependencies.

`get_current_user` – validates the Bearer token and returns the User row.
`require_roles(*roles)` – returns a dependency that enforces role membership.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the Bearer JWT and load the corresponding User from the DB.
    Raises 401 for missing / invalid tokens.
    """
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*allowed_roles: str):
    """
    Factory that returns a FastAPI dependency enforcing that the current
    user has one of the *allowed_roles*.

    Example:
        @router.get("/admin/users", dependencies=[Depends(require_roles("super_admin"))])
    """

    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role is None or user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _checker
