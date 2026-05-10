import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthContext } from '../context/AuthContext'
import { useAuth } from '../hooks/useAuth'

const makeWrapper = (value) => ({ children }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
)

describe('useAuth hook', () => {
  it('returns user from context', () => {
    const user = { id: 1, name: 'Admin', roles: [{ name: 'admin' }] }
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ user, loading: false, login: vi.fn(), logout: vi.fn(), hasRole: vi.fn() }),
    })
    expect(result.current.user).toEqual(user)
  })

  it('returns loading state from context', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ user: null, loading: true, login: vi.fn(), logout: vi.fn(), hasRole: vi.fn() }),
    })
    expect(result.current.loading).toBe(true)
  })

  it('hasRole returns true when user has the role', () => {
    const hasRole = (role) => role === 'admin'
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ user: { roles: [{ name: 'admin' }] }, loading: false, login: vi.fn(), logout: vi.fn(), hasRole }),
    })
    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('lecteur')).toBe(false)
  })

  it('throws if used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth doit être utilisé dans un AuthProvider')
  })

  it('calls login function with credentials', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ id: 1, roles: [] })
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ user: null, loading: false, login: mockLogin, logout: vi.fn(), hasRole: vi.fn() }),
    })

    await act(async () => {
      await result.current.login('test@test.com', 'password')
    })
    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password')
  })

  it('calls logout function', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ user: { id: 1 }, loading: false, login: vi.fn(), logout: mockLogout, hasRole: vi.fn() }),
    })

    await act(async () => {
      await result.current.logout()
    })
    expect(mockLogout).toHaveBeenCalledOnce()
  })
})
