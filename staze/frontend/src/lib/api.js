const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.json()
}

export const api = {
  triage: (body) => request('/api/triage', { method: 'POST', body: JSON.stringify(body) }),
  hospitals: (body) => request('/api/hospitals', { method: 'POST', body: JSON.stringify(body) }),
  report: (body) => request('/api/report', { method: 'POST', body: JSON.stringify(body) }),
  health: () => request('/api/health'),
}

export { API_BASE_URL }
