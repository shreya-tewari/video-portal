/**
 * AuthContext.jsx – stores the authenticated user in React context.
 *
 * Components can call useAuth() to get:
 *   - user: { id, email, full_name, role, is_active } | null
 *   - login(userData, token): persist token + user
 *   - logout(): clear token + user
 */

import { createContext, useContext, useState } from 'react'
import { clearToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Attempt to restore user from localStorage on first render
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  function login(userData, token) {
    setToken(token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
