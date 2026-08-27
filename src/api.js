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

  // Memória dos contatos (fatos, observações e pendências usadas pela IA)
  getContactMemory: (contactId) => request(`/contacts/${contactId}/memory`),
  createContactMemory: (contactId, data) =>
    request(`/contacts/${contactId}/memory`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMemory: (id, data) =>
    request(`/memories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMemory: (id) => request(`/memories/${id}`, { method: "DELETE" }),
  clearContactMemory: (contactId, scope = "automatica") =>
    request(`/contacts/${contactId}/memory${qs({ scope })}`, { method: "DELETE" }),

  // Regras de encaminhamento automático (assunto -> responsável -> telefone)
  getRoutingRules: (churchId) => request(`/churches/${churchId}/routing-rules`),
  createRoutingRule: (churchId, data) =>
    request(`/churches/${churchId}/routing-rules`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRoutingRule: (id, data) =>
    request(`/routing-rules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRoutingRule: (id) => request(`/routing-rules/${id}`, { method: "DELETE" }),

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

  // Membros e lembretes de aniversário
  getMembers: (churchId, search) => request(`/membros${qs({ church_id: churchId, search })}`),
  createMember: (data, churchId) =>
    request(`/membros${qs({ church_id: churchId })}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMember: (id, data, churchId) =>
    request(`/membros/${id}${qs({ church_id: churchId })}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMember: (id, churchId) =>
    request(`/membros/${id}${qs({ church_id: churchId })}`, { method: "DELETE" }),
  getTodayBirthdays: (churchId) => request(`/membros/hoje${qs({ church_id: churchId })}`),
  getUpcomingBirthdays: (churchId) => request(`/membros/proximos${qs({ church_id: churchId })}`),
  getBirthdayRecipients: (churchId) => request(`/membros/destinatarios${qs({ church_id: churchId })}`),
  createBirthdayRecipient: (data, churchId) =>
    request(`/membros/destinatarios${qs({ church_id: churchId })}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBirthdayRecipient: (id, data, churchId) =>
    request(`/membros/destinatarios/${id}${qs({ church_id: churchId })}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteBirthdayRecipient: (id, churchId) =>
    request(`/membros/destinatarios/${id}${qs({ church_id: churchId })}`, { method: "DELETE" }),
  getBirthdayConfig: (churchId) => request(`/membros/config${qs({ church_id: churchId })}`),
  updateBirthdayConfig: (data, churchId) =>
    request(`/membros/config${qs({ church_id: churchId })}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getBirthdayLogs: (churchId, limit = 50) =>
    request(`/membros/lembretes${qs({ church_id: churchId, limit })}`),
  testBirthdayReminder: (churchId) =>
    request(`/membros/lembretes/teste${qs({ church_id: churchId })}`, { method: "POST" }),
  getSafetyStatus: (churchId) => request(`/safety${qs({ church_id: churchId })}`),
  pauseSafety: (churchId) =>
    request(`/safety/pausar${qs({ church_id: churchId })}`, { method: "POST" }),
  resumeSafety: (churchId) =>
    request(`/safety/retomar${qs({ church_id: churchId })}`, { method: "POST" }),
  updateSafetyLimits: (churchId, data) =>
    request(`/safety/limites${qs({ church_id: churchId })}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getSafetyLogs: (churchId, limit = 50) =>
    request(`/safety/logs${qs({ church_id: churchId, limit })}`),

  // Usuários autorizados (Secretária Inteligente)
  getAuthorizedUsers: (churchId) => request(`/authorized${qs({ church_id: churchId })}`),
  createAuthorizedUser: (data, churchId) =>
    request(`/authorized${qs({ church_id: churchId })}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAuthorizedUser: (id, data, churchId) =>
    request(`/authorized/${id}${qs({ church_id: churchId })}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAuthorizedUser: (id, churchId) =>
    request(`/authorized/${id}${qs({ church_id: churchId })}`, { method: "DELETE" }),
  getAuthorizedActions: (churchId, limit = 50) =>
    request(`/authorized/actions${qs({ church_id: churchId, limit })}`),
  getAuthorizedProfiles: () => request("/authorized/profiles"),
  getAuthorizedPermissions: () => request("/authorized/permissions"),

  // Área de teste de envio do WhatsApp (aba Autorizados)
  getWhatsappStatus: (churchId) => request(`/whatsapp/status${qs({ church_id: churchId })}`),
  getWhatsappGroups: (refresh = false, churchId) =>
    request(`/whatsapp/grupos${qs({ refresh, church_id: churchId })}`),
  sendWhatsappToGroup: (data, churchId) =>
    request(`/whatsapp/enviar-grupo${qs({ church_id: churchId })}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getWhatsappSendLogs: (churchId, limit = 30, origin = "painel") =>
    request(`/whatsapp/logs${qs({ church_id: churchId, limit, origin })}`),
};
