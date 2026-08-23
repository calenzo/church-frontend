// Dev usa o proxy do Vite (/api -> localhost:8000). Em producao,
// defina VITE_API_URL na hora do build para apontar ao backend.
const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "https://church-backend-vzzp.onrender.com/api");

const TOKEN_KEY = "church_auth_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-auth-token": token } : {}),
    },
    ...options,
  });
  if (res.status === 401 && token) {
    setToken(null);
  }
  if (!res.ok) {
    let detail = "Erro inesperado";
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(
      typeof detail === "string" ? detail : JSON.stringify(detail),
    );
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params) {
  const entries = Object.entries(params || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  changePassword: (current, next) =>
    request("/auth/password", { method: "POST", body: JSON.stringify({ current, next }) }),

  // Igrejas
  getChurches: () => request("/churches"),
  createChurch: (name) =>
    request("/churches", { method: "POST", body: JSON.stringify({ name }) }),
  updateChurch: (id, data) =>
    request(`/churches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChurch: (id) => request(`/churches/${id}`, { method: "DELETE" }),

  // Usuários de uma igreja (super admin)
  getChurchUsers: (churchId) => request(`/churches/${churchId}/users`),
  createChurchUser: (churchId, data) =>
    request(`/churches/${churchId}/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  // Contatos da igreja (número -> nome/cargo, usado pela IA)
  getContacts: (churchId, search) =>
    request(`/churches/${churchId}/contacts${qs({ search })}`),
  createContact: (churchId, data) =>
    request(`/churches/${churchId}/contacts`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateContact: (id, data) =>
    request(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: "DELETE" }),

  // Números do WhatsApp (instâncias da Evolution)
  getNumbers: (churchId) => request(`/churches/${churchId}/numbers`),
  createNumber: (churchId, label) =>
    request(`/churches/${churchId}/numbers`, {
      method: "POST",
      body: JSON.stringify({ label }),
    }),
  deleteNumber: (id) => request(`/numbers/${id}`, { method: "DELETE" }),
  getNumberState: (id) => request(`/numbers/${id}/state`),
  getNumberQrCode: (id) => request(`/numbers/${id}/qrcode`),
  getNumberPairingCode: (id, number) =>
    request(`/numbers/${id}/pairing-code`, {
      method: "POST",
      body: JSON.stringify({ number }),
    }),
  disconnectNumber: (id) => request(`/numbers/${id}/disconnect`, { method: "POST" }),

  // Escopo por igreja
  getConfig: (churchId) => request(`/config${qs({ church_id: churchId })}`),
  updateConfig: (data, churchId) =>
    request(`/config${qs({ church_id: churchId })}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  testLlm: (churchId) => request(`/config/test${qs({ church_id: churchId })}`, { method: "POST" }),

  getDepartments: (churchId) => request(`/departments${qs({ church_id: churchId })}`),
  createDepartment: (data, churchId) =>
    request(`/departments${qs({ church_id: churchId })}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDepartment: (id, data, churchId) =>
    request(`/departments/${id}${qs({ church_id: churchId })}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteDepartment: (id, churchId) =>
    request(`/departments/${id}${qs({ church_id: churchId })}`, { method: "DELETE" }),
  testDepartment: (id, data, churchId) =>
    request(`/departments/${id}/test${qs({ church_id: churchId })}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMessages: (limit = 100, churchId) =>
    request(`/messages${qs({ limit, church_id: churchId })}`),
  getStatus: (churchId) => request(`/status${qs({ church_id: churchId })}`),
  getGroups: (refresh = false, churchId) =>
    request(`/evolution/groups${qs({ refresh: refresh || undefined, church_id: churchId })}`),
};
