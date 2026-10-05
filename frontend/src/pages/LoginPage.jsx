/**
 * LoginPage.jsx – sign-in form with role-aware redirect.
 *
 * Error mapping:
 *   401 "Incorrect email or password" → show generic credential error
 *   403 "pending_approval"            → show waiting message
 *   403 "account_deactivated"         → show deactivated message
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiLogin } from '../api'
import { useAuth } from '../AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState('error') // 'error' | 'warning' | 'info'

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiLogin(form)
      login(data.user, data.access_token)

      // Route based on role
      if (data.user.role === 'super_admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err.message
      if (msg === 'pending_approval') {
        setError('⏳ Your account is waiting for Super Admin approval. Check back later.')
        setErrorType('warning')
      } else if (msg === 'account_deactivated') {
        setError('🚫 Your account has been deactivated. Please contact the administrator.')
        setErrorType('error')
      } else {
        setError(msg || 'An unexpected error occurred.')
        setErrorType('error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div className="card">
        {/* Header */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 className="brand-title" style={{ marginBottom: '6px' }}>Welcome Back</h1>
          <p className="text-muted">Sign in to your account</p>
        </div>

        {error && (
          <div className={`alert alert-${errorType}`}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Your password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-muted" style={{ textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
