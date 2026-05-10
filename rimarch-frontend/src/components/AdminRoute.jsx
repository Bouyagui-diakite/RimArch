import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminRoute({ children }) {
  const { user, loading, hasRole } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  if (!hasRole('admin')) return <Navigate to="/dashboard" replace />

  return children
}
