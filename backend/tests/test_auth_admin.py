"""
tests/test_auth_admin.py – core behaviour tests using SQLite.

Covers:
  - Pending user cannot log in (403 pending_approval)
  - Approved user can log in
  - Non-super-admin gets 403 on /admin/users
  - Super admin cannot assign super_admin role via the API
"""

import pytest
from app.config import settings


# ── Helpers ───────────────────────────────────────────────────────────────────

def register_user(client, email: str, password: str = "testpass123", full_name: str = "Test User"):
    resp = client.post(
        "/api/auth/register",
        json={"full_name": full_name, "email": email, "password": password},
    )
    assert resp.status_code == 201, resp.json()
    return resp.json()


def login(client, email: str, password: str):
    return client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )


def superadmin_token(client) -> str:
    resp = login(client, settings.FIRST_SUPERADMIN_EMAIL, settings.FIRST_SUPERADMIN_PASSWORD)
    assert resp.status_code == 200, resp.json()
    return resp.json()["access_token"]


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_pending_user_cannot_login(client):
    """A newly registered user (no role) should receive 403 pending_approval."""
    register_user(client, "pending@example.com")
    resp = login(client, "pending@example.com", "testpass123")
    assert resp.status_code == 403
    assert resp.json()["detail"] == "pending_approval"


def test_approved_user_can_login(client):
    """After a super admin assigns a role, the user can log in."""
    register_user(client, "approved@example.com")

    # Approve the user as super admin
    token = superadmin_token(client)
    # Find the user id
    users = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        params={"status": "pending"},
    ).json()
    target = next(u for u in users if u["email"] == "approved@example.com")

    patch_resp = client.patch(
        f"/api/admin/users/{target['id']}",
        json={"role": "content_manager"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch_resp.status_code == 200

    # Now the user should be able to log in
    resp = login(client, "approved@example.com", "testpass123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "content_manager"


def test_non_superadmin_cannot_access_admin_users(client):
    """A non-super-admin user should get 403 on GET /api/admin/users."""
    register_user(client, "reporter@example.com")

    # Approve as report_viewer
    token = superadmin_token(client)
    users = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        params={"status": "pending"},
    ).json()
    target = next(u for u in users if u["email"] == "reporter@example.com")
    client.patch(
        f"/api/admin/users/{target['id']}",
        json={"role": "report_viewer"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Log in as report_viewer
    resp = login(client, "reporter@example.com", "testpass123")
    user_token = resp.json()["access_token"]

    # Attempt to access admin endpoint
    forbidden = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert forbidden.status_code == 403


def test_superadmin_cannot_assign_superadmin_role(client):
    """Super admin should receive 422 when trying to assign super_admin role."""
    register_user(client, "targetuser@example.com")

    token = superadmin_token(client)
    users = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        params={"status": "pending"},
    ).json()
    target = next(u for u in users if u["email"] == "targetuser@example.com")

    resp = client.patch(
        f"/api/admin/users/{target['id']}",
        json={"role": "super_admin"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422
