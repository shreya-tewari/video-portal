/**
 * DashboardPage.jsx – shown to any approved, active user.
 * Displays name, email, role badge, and a role-specific heading.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Administrator',
    heading: '🛡️ Super Admin Dashboard',
    description: 'You have full system access including user management.',
    badgeClass: 'badge-super-admin',
  },
  admin: {
    label: 'Administrator',
    heading: '⚙️ Administrator Dashboard',
    description: 'You have administrator access to manage the platform.',
    badgeClass: 'badge-admin',
  },
  content_manager: {
    label: 'Content Manager',
    heading: '✏️ Content Manager Dashboard',
    description: 'You can create and manage content across the platform.',
    badgeClass: 'badge-content-manager',
  },
  report_viewer: {
    label: 'Report Viewer',
    heading: '📊 Report Viewer Dashboard',
    description: 'You have read-only access to reports and analytics.',
    badgeClass: 'badge-report-viewer',
  },
}

function roleBadgeClass(role) {
  return role?.replace(/_/g, '-') ?? 'pending'
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const config = ROLE_CONFIG[user?.role] ?? {
    label: user?.role ?? 'Unknown',
    heading: '👤 Dashboard',
    description: 'Welcome to your dashboard.',
    badgeClass: 'badge-admin',
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="page">
      <div className="dashboard-hero">
        <p className="text-muted text-small" style={{ marginBottom: '8px' }}>
          {config.description}
        </p>
        <h1>{config.heading}</h1>
        <p style={{ marginTop: '10px', fontSize: '1.15rem' }}>
          Welcome back, <strong>{user?.full_name}</strong>!
        </p>

        <div style={{ marginTop: '20px' }}>
          <span className={`badge badge-${roleBadgeClass(user?.role)}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="dashboard-info-grid">
        <div className="info-card">
          <div className="label">Full Name</div>
          <div className="value">{user?.full_name}</div>
        </div>
        <div className="info-card">
          <div className="label">Email Address</div>
          <div className="value" style={{ wordBreak: 'break-all' }}>{user?.email}</div>
        </div>
        <div className="info-card">
          <div className="label">Role</div>
          <div className="value">
            <span className={`badge badge-${roleBadgeClass(user?.role)}`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className="info-card">
          <div className="label">Account Status</div>
          <div className="value">
            <span className={`badge badge-${user?.is_active ? 'active' : 'deactivated'}`}>
              {user?.is_active ? 'Active' : 'Deactivated'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <button
          id="dashboard-logout"
          className="btn btn-danger"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
