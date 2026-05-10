import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

const renderWithAuth = (user, loading = false) =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthContext.Provider value={{ user, loading, hasRole: () => false }}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Contenu protégé</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Page Login</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    renderWithAuth({ id: 1, name: 'Admin', roles: [] })
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
  })

  it('redirects to /login when user is null', () => {
    renderWithAuth(null)
    expect(screen.getByText('Page Login')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it('shows spinner while loading', () => {
    renderWithAuth(null, true)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
