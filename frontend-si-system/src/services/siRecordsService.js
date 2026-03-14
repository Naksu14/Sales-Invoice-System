import axios from 'axios'
import { setupInterceptors } from './sessionManager'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({ baseURL: API_URL })
setupInterceptors(api)

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const createSiRecord = async (payload) => {
  try {
    const res = await api.post('/si-records', payload, { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    throw err.response ? err.response.data : err
  }
}

export const getSiRecords = async () => {
  try {
    const res = await api.get('/si-records', { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    console.error(err)
    return []
  }
}

export const getSiRecordsBySheet = async (sheetId) => {
  try {
    const res = await api.get(`/si-records/by-sheet/${sheetId}`, { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    console.error(err)
    return []
  }
}

export const getSiRecord = async (id) => {
  try {
    const res = await api.get(`/si-records/${id}`, { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    throw err.response ? err.response.data : err
  }
}

export const updateSiRecord = async (id, payload) => {
  try {
    const res = await api.patch(`/si-records/${id}`, payload, { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    throw err.response ? err.response.data : err
  }
}

export const deleteSiRecord = async (id) => {
  try {
    const res = await api.delete(`/si-records/${id}`, { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    throw err.response ? err.response.data : err
  }
}
