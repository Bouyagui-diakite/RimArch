import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from '../components/ConfirmModal'

const defaultProps = {
  title:        'Supprimer le document',
  message:      'Êtes-vous sûr ?',
  confirmLabel: 'Supprimer',
  onConfirm:    vi.fn(),
  onCancel:     vi.fn(),
  loading:      false,
}

describe('ConfirmModal', () => {
  it('renders title and message', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Supprimer le document')).toBeInTheDocument()
    expect(screen.getByText('Êtes-vous sûr ?')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Supprimer'))
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Annuler'))
    expect(defaultProps.onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when overlay is clicked', () => {
    render(<ConfirmModal {...defaultProps} />)
    const overlay = document.querySelector('.absolute.inset-0')
    fireEvent.click(overlay)
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('disables buttons when loading', () => {
    render(<ConfirmModal {...defaultProps} loading={true} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => expect(btn).toBeDisabled())
  })

  it('shows spinner when loading', () => {
    render(<ConfirmModal {...defaultProps} loading={true} />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
