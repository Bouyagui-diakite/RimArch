import api from './axios'

export const updateProfile  = (data) => api.put('/auth/profile', data)
export const updatePassword = (data) => api.put('/auth/password', data)
