import api from './axios'

export const getStats      = ()           => api.get('/admin/stats')
export const getRoles      = ()           => api.get('/admin/roles')
export const getUsers      = ()           => api.get('/admin/users')
export const createUser    = (data)       => api.post('/admin/users', data)
export const updateUserRole = (id, role)  => api.put(`/admin/users/${id}/role`, { role })
export const deleteUser    = (id)         => api.delete(`/admin/users/${id}`)
export const getLogs       = (params)     => api.get('/admin/logs', { params })
export const exportLogs    = (params)     => api.get('/admin/export/logs',     { params, responseType: 'blob' })
export const exportLogsPdf = (params)     => api.get('/admin/export/logs/pdf', { params, responseType: 'blob' })
