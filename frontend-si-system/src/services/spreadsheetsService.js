import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({ baseURL: API_URL })

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const createSpreadsheet = async (payload) => {
  try {
    const res = await api.post('/spreadsheets', payload, { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    throw err.response ? err.response.data : err
  }
}

export const getSpreadsheets = async () => {
  try {
    const res = await api.get('/spreadsheets', { headers: getAuthHeaders() })
    return res.data
  } catch (err) {
    console.error(err)
    return []
  }
}
