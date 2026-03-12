import { queryClient } from './queryClient'

let expiryTimeout = null
let checkInterval = null

export function logout(redirect = true) {
  try {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
    if (queryClient) {
      if (typeof queryClient.clear === 'function') queryClient.clear()
      else if (typeof queryClient.removeQueries === 'function') queryClient.removeQueries()
    }
  } catch (e) {
    console.warn('logout cleanup error', e)
  }
  if (redirect) {
    window.location.href = '/login'
  }
}

export function setupInterceptors(apiInstance) {
  if (!apiInstance || !apiInstance.interceptors) return
  apiInstance.interceptors.response.use(
    (resp) => resp,
    (error) => {
      const status = error?.response?.status
      if (status === 401) {
        console.warn('Session expired (401) - logging out')
        logout()
      }
      return Promise.reject(error)
    }
  )
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

export function scheduleTokenExpiryCheck() {
  // clear existing timers
  if (expiryTimeout) {
    clearTimeout(expiryTimeout)
    expiryTimeout = null
  }
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  if (!token) return

  const payload = decodeJwtPayload(token)
  if (!payload || !payload.exp) return

  const expiresAt = payload.exp * 1000
  const msLeft = expiresAt - Date.now()
  if (msLeft <= 0) {
    logout()
    return
  }

  // set a timeout to logout exactly when token expires
  expiryTimeout = setTimeout(() => {
    logout()
  }, msLeft + 1000)

  // as a safety net, check every minute whether token still valid
  checkInterval = setInterval(() => {
    const t = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (!t) {
      logout()
    }
  }, 60 * 1000)
}
