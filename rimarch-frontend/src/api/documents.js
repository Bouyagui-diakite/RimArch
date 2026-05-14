import api from './axios'

export const getDocuments = (params) => api.get('/documents', { params })
export const getDocument  = (id)     => api.get(`/documents/${id}`)
export const uploadDocument = (form)  => api.post('/documents', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data)
export const deleteDocument = (id)       => api.delete(`/documents/${id}`)
export const downloadDocument = (id) =>
  api.get(`/documents/${id}/download`, { responseType: 'blob' })

export const previewDocument    = (id) =>
  api.get(`/documents/${id}/preview`, { responseType: 'blob' })

export const getBinDocuments    = ()   => api.get('/documents/bin')
export const restoreDocument    = (id) => api.post(`/documents/${id}/restore`)
export const forceDeleteDocument = (id) => api.delete(`/documents/${id}/force`)
export const emptyBin           = ()   => api.delete('/documents/bin/empty')

export const exportDocuments    = (params) =>
  api.get('/export/documents',     { params, responseType: 'blob' })

export const exportDocumentsPdf = (params) =>
  api.get('/export/documents/pdf', { params, responseType: 'blob' })
