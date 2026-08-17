const API = import.meta.env.PROD
  ? 'https://church-backend-vzzp.onrender.com/api'
  : '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = 'Erro inesperado'
    try {
      detail = (await res.json()).detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getConfig: () => request('/config'),
  updateConfig: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) }),
  testLlm: () => request('/config/test', { method: 'POST' }),

  getDepartments: () => request('/departments'),
  createDepartment: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
  testDepartment: (id, data) => request(`/departments/${id}/test`, { method: 'POST', body: JSON.stringify(data) }),

  getMessages: (limit = 100) => request(`/messages?limit=${limit}`),
  getStatus: () => request('/status'),
  getQrCode: () => request('/evolution/qrcode'),
  getGroups: (refresh = false) => request(`/evolution/groups${refresh ? '?refresh=true' : ''}`),
  getEvolutionDebug: () => request('/evolution/debug'),
}
