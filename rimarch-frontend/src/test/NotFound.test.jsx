import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '../pages/NotFound'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('NotFound page', () => {
  it('renders 404 text', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders page introuvable message', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByText('Page introuvable')).toBeInTheDocument()
  })

  it('navigates back on retour button click', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    fireEvent.click(screen.getByText(/retour/i))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('navigates to dashboard on dashboard button click', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    fireEvent.click(screen.getByText(/tableau de bord/i))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })
})
