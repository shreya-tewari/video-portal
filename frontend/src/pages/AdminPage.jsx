/**
 * AdminPage.jsx – Super Admin Panel.
 *
 * Features:
 *  - Table of all users with name, email, status badge, role dropdown, dates, actions
 *  - Pending rows highlighted at top
 *  - "Pending only" filter toggle
 *  - Refresh button
 *  - Save button (sets role → approves user)
 *  - Activate / Deactivate toggle
 *  - Toast notifications after each action
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetRoles, apiGetUsers, apiPatchUser } from '../api'
import { useAuth } from '../AuthContext'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function statusBadge(user) {
  if (!user.role) return <span className="badge badge-pending">Pending</span>
  if (!user.is_active) return <span className="badge badge-deactivated">Deactivated</span>
  return <span className="badge badge-active">Active</span>
}

function roleBadgeClass(roleName) {
  return roleName?.replace(/_/g, '-') ?? ''
}

function roleLabel(roleName) {
  const map = {
    admin: 'Administrator',
    content_manager: 'Content Manager',
    report_viewer: 'Report Viewer',
    super_admin: 'Super Admin',
  }
  return map[roleName] ?? roleName ?? '—'
}

// ── Toast sub-component ────────────────────────────────────────────────────────

function ToastArea({ toasts }) {
  return (
    <div className="toast-area">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user: adminUser, logout } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])   // assignable roles
  const [loading, setLoading] = useState(true)
  const [pendingOnly, setPendingOnly] = useState(false)
  const [toasts, setToasts] = useState([])

  // Per-row selected role (tracks the dropdown value before saving)
  const [selectedRoles, setSelectedRoles] = useState({})
  // Track which rows are saving/toggling
  const [saving, setSaving] = useState({})

  const toastId = useRef(0)

  // ── Toasts ────────────────────────────────────────────────────────────────

  function addToast(msg, type = 'success') {
    const id = ++toastId.current
    setToasts(ts => [...ts, { id, msg, type }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 4000)
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([
        apiGetUsers(pendingOnly),
        apiGetRoles(),
      ])

      // Sort: pending users first, then by created_at desc (already server-ordered)
      const sorted = [...usersData].sort((a, b) => {
        const aP = !a.role ? 0 : 1
        const bP = !b.role ? 0 : 1
        return aP - bP
      })

      setUsers(sorted)
      setRoles(rolesData)

      // Initialise dropdown to the user's current role (or empty string for pending)
      const init = {}
      sorted.forEach(u => { init[u.id] = u.role ?? '' })
      setSelectedRoles(init)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [pendingOnly])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSaveRole(userId) {
    const roleName = selectedRoles[userId]
    if (!roleName) {
      addToast('Please select a role before saving.', 'error')
      return
    }
    setSaving(s => ({ ...s, [`role-${userId}`]: true }))
    try {
      await apiPatchUser(userId, { role: roleName })
      addToast(`Role updated to "${roleLabel(roleName)}" ✓`)
      await fetchData()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(s => ({ ...s, [`role-${userId}`]: false }))
    }
  }

  async function handleToggleActive(userId, currentActive) {
    setSaving(s => ({ ...s, [`active-${userId}`]: true }))
    try {
      await apiPatchUser(userId, { is_active: !currentActive })
      addToast(currentActive ? 'User deactivated.' : 'User reactivated. ✓')
      await fetchData()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(s => ({ ...s, [`active-${userId}`]: false }))
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>🛡️ Super Admin Panel</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            Manage user roles and account status
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            id="admin-logout"
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            id="filter-pending"
            type="checkbox"
            checked={pendingOnly}
            onChange={e => setPendingOnly(e.target.checked)}
            style={{ width: 'auto', accentColor: 'var(--clr-primary)' }}
          />
          <span style={{ color: 'var(--clr-text)', textTransform: 'none', letterSpacing: 'normal', fontSize: '.9rem' }}>
            Pending only
          </span>
        </label>

        <button
          id="admin-refresh"
          className="btn btn-ghost btn-sm"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '↻ Refresh'}
        </button>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--clr-text-muted)' }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 4 }} />
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--clr-text-muted)' }}>
          No users found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Last Login</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = u.id === adminUser?.id
                const isRoleSaving = saving[`role-${u.id}`]
                const isActiveSaving = saving[`active-${u.id}`]

                return (
                  <tr key={u.id} className={!u.role ? 'row-pending' : ''}>
                    {/* Name */}
                    <td>
                      <strong>{u.full_name}</strong>
                      {isSelf && (
                        <span className="badge badge-super-admin" style={{ marginLeft: 8, fontSize: '.65rem' }}>
                          You
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td style={{ color: 'var(--clr-text-muted)', fontSize: '.88rem' }}>
                      {u.email}
                    </td>

                    {/* Status badge */}
                    <td>{statusBadge(u)}</td>

                    {/* Role dropdown */}
                    <td>
                      {isSelf ? (
                        <span className={`badge badge-${roleBadgeClass(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      ) : (
                        <select
                          id={`role-select-${u.id}`}
                          className="role-select"
                          value={selectedRoles[u.id] ?? ''}
                          onChange={e =>
                            setSelectedRoles(prev => ({ ...prev, [u.id]: e.target.value }))
                          }
                          disabled={isRoleSaving}
                        >
                          <option value="">— Select role —</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.name}>
                              {roleLabel(r.name)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="text-small text-muted">{formatDate(u.created_at)}</td>
                    <td className="text-small text-muted">{formatDate(u.last_login_at)}</td>

                    {/* Actions */}
                    <td>
                      {isSelf ? (
                        <span className="text-muted text-small">—</span>
                      ) : (
                        <div className="action-cell">
                          {/* Save role */}
                          <button
                            id={`save-role-${u.id}`}
                            className="btn btn-success btn-sm"
                            onClick={() => handleSaveRole(u.id)}
                            disabled={isRoleSaving || !selectedRoles[u.id]}
                          >
                            {isRoleSaving ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : 'Save'}
                          </button>

                          {/* Activate / Deactivate */}
                          <button
                            id={`toggle-active-${u.id}`}
                            className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-ghost'}`}
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            disabled={isActiveSaving}
                          >
                            {isActiveSaving
                              ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                              : u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ToastArea toasts={toasts} />
    </div>
  )
}
