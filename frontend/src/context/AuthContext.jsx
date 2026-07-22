import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const data = res.data
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const demoLogin = (role) => {
    const data = {
      token: 'demo-jwt-token-' + role.toLowerCase(),
      id: 999,
      email: `${role.toLowerCase()}@meritdesk.com`,
      name: role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      role: role,
      company: { id: 1, name: 'Acme Technologies' },
      department: { id: 1, name: 'Customer Engineering' }
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAuthenticated = !!user
  const role = user?.role

  return (
    <AuthContext.Provider value={{ user, login, logout, demoLogin, isAuthenticated, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
