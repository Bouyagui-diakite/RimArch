import { vi } from 'vitest'

export const mockUser = {
  id: 1,
  name: 'Super Admin',
  email: 'admin@rimarch.com',
  email_verified_at: '2026-01-01T00:00:00.000Z',
  roles: [{ name: 'admin', label: 'Administrateur' }],
  documents_count: 5,
  last_login: '2026-05-09T10:00:00.000Z',
}

export const mockLecteur = {
  id: 2,
  name: 'Jean Lecteur',
  email: 'lecteur@rimarch.com',
  email_verified_at: '2026-01-01T00:00:00.000Z',
  roles: [{ name: 'lecteur', label: 'Lecteur' }],
  documents_count: 0,
  last_login: null,
}

export const mockDocument = {
  id: 1,
  title: 'Rapport 2024',
  description: 'Rapport annuel',
  categorie: 'RH',
  file_name: 'rapport.pdf',
  file_type: 'application/pdf',
  file_size: 102400,
  created_at: '2026-05-01T10:00:00.000Z',
  updated_at: '2026-05-01T10:00:00.000Z',
  uploader: { id: 1, name: 'Super Admin', email: 'admin@rimarch.com' },
}

// Mock api/axios
vi.mock('../api/axios', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request:  { use: vi.fn() },
      response: { use: vi.fn() },
    },
    create: vi.fn().mockReturnThis(),
    defaults: { headers: { common: {} } },
  },
}))
