/**
 * RegisterPage.jsx – new user sign-up form.
 * On success shows a pending-approval message instead of redirecting.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRegister } from '../api'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRegister(form)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="page-center">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <h2 className="brand-title" style={{ marginBottom: '12px' }}>Registration Successful</h2>
          <p className="text-muted">
            Your account has been created. Please wait for a Super Administrator to
            approve your account before you can log in.
          </p>
          <hr className="divider" />
          <Link to="/login" className="btn btn-primary btn-full">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-center">
      <div className="card">
        {/* Header */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 className="brand-title" style={{ marginBottom: '6px' }}>Create Account</h1>
          <p className="text-muted">Fill in your details to get started</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              name="full_name"
              type="text"
              placeholder="Jane Doe"
              required
              value={form.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            id="reg-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-muted" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
