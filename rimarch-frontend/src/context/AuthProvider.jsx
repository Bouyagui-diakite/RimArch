import { useState, useEffect } from 'react'
import api from '../api/axios'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const { data } = await api.get('/auth/me')
        if (!cancelled) {
          setUser(data)
          localStorage.setItem('user', JSON.stringify(data))
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkAuth()

    return () => { cancelled = true }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const hasRole = (role) => {
    if (!user?.roles) return false
    return user.roles.some((r) => r.name === role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}
