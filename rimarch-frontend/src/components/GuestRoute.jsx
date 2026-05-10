import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    const isAdmin = user.roles?.some(r => r.name === 'admin')
    return <Navigate to={isAdmin ? '/admin/utilisateurs' : '/dashboard'} replace />
  }

  return children
}
