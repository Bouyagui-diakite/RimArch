import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Login from '../pages/Login'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLogin = vi.fn()

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ login: mockLogin, user: null, loading: false }}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  )

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('renders the forgot password link', () => {
    renderLogin()
    expect(screen.getByText(/mot de passe oublié/i)).toBeInTheDocument()
  })

  it('renders the register link', () => {
    renderLogin()
    expect(screen.getByText(/s'inscrire/i)).toBeInTheDocument()
  })

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue({ roles: [{ name: 'lecteur' }] })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), {
      target: { value: 'test@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123')
    })
  })

  it('redirects admin to /admin/utilisateurs after login', async () => {
    mockLogin.mockResolvedValue({ roles: [{ name: 'admin' }] })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), {
      target: { value: 'admin@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/utilisateurs')
    })
  })

  it('redirects lecteur to /dashboard after login', async () => {
    mockLogin.mockResolvedValue({ roles: [{ name: 'lecteur' }] })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Identifiants incorrects.' } },
    })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), {
      target: { value: 'bad@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByText('Identifiants incorrects.')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    renderLogin()
    const input = screen.getByPlaceholderText('••••••••')
    expect(input).toHaveAttribute('type', 'password')

    const toggleBtn = input.parentElement.querySelector('button[type="button"]')
    fireEvent.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'text')

    fireEvent.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'password')
  })
})
