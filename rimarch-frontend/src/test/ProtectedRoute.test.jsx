import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

/* ProtectedRoute exige un compte dont l'email est vérifié : sans
   email_verified_at, il redirige vers /verify-email. */
const VERIFIED_USER = { id: 1, name: 'Admin', roles: [], email_verified_at: '2026-01-04T10:00:00.000Z' }

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
          <Route path="/verify-email" element={<div>Page Vérification</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    renderWithAuth(VERIFIED_USER)
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
  })

  it('redirects to /verify-email when email is not verified', () => {
    renderWithAuth({ ...VERIFIED_USER, email_verified_at: null })
    expect(screen.getByText('Page Vérification')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
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
