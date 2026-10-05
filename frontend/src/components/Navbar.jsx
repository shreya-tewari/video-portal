/**
 * Navbar.jsx – top navigation bar.
 * Shows the Admin Panel link only for super_admin.
 * Shows login/register links when unauthenticated.
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">🔐 RoleGuard</span>

      <ul className="navbar-links">
        {user ? (
          <>
            {user.role === 'super_admin' && (
              <li>
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                  Admin Panel
                </NavLink>
              </li>
            )}
            {user.role !== 'super_admin' && (
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                  Dashboard
                </NavLink>
              </li>
            )}
            <li>
              <span className="text-muted text-small">{user.email}</span>
            </li>
            <li>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
                Login
              </NavLink>
            </li>
            <li>
              <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
                Register
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}
