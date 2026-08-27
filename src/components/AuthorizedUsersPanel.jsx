import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

const EMPTY = { name: '', phone: '', profile: 'operador', notes: '' }
const PROFILE_COLORS = {
  administrador: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  secretaria: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  lider: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  operador: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  comunicador: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  instrutor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
}

export default function AuthorizedUsersPanel({ churchId }) {
  const [users, setUsers] = useState([])
  const [actions, setActions] = useState([])
  const [profiles, setProfiles] = useState([])
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState('users')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    try {
      const [u, a, p] = await Promise.all([
        api.getAuthorizedUsers(churchId),
        api.getAuthorizedActions(churchId),
        api.getAuthorizedProfiles(),
      ])
      setUsers(u)
      setActions(a)
      setProfiles(p)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [churchId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const save = async () => {
    try {
      if (editId) {
        await api.updateAuthorizedUser(editId, form, churchId)
      } else {
        await api.createAuthorizedUser(form, churchId)
      }
      setForm(EMPTY)
      setEditId(null)
      setShowForm(false)
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  const remove = async (id) => {
    try {
      await api.deleteAuthorizedUser(id, churchId)
      setConfirmDelete(null)
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  const toggleStatus = async (user) => {
    try {
      await api.updateAuthorizedUser(
        user.id,
        { status: user.status === 'active' ? 'blocked' : 'active' },
        churchId,
      )
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  const startEdit = (u) => {
    setForm({ name: u.name, phone: u.phone, profile: u.profile, notes: u.notes || '' })
    setEditId(u.id)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500 dark:text-slate-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {err}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Usuários Autorizados
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pessoas que podem executar comandos administrativos via WhatsApp
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Novo Usuário
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'users', label: 'Usuários', count: users.length },
          { id: 'actions', label: 'Auditoria', count: actions.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {editId ? 'Editar Usuário' : 'Novo Usuário Autorizado'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Telefone (WhatsApp)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="21999999999"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Perfil</label>
              <select
                value={form.profile}
                onChange={(e) => setForm({ ...form, profile: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Observações</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opcional"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={save}
              disabled={!form.name || !form.phone}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {editId ? 'Salvar' : 'Cadastrar'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY) }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancelar
            </button>
          </div>
          {form.profile && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Permissões do perfil <strong>{form.profile}</strong>:
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(profiles.find((p) => p.id === form.profile)?.permissions || []).map((perm) => (
                  <span
                    key={perm}
                    className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  >
                    {perm.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-3">
          {users.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhum usuário autorizado cadastrado
            </p>
          )}
          {users.map((u) => (
            <div
              key={u.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                u.status === 'active'
                  ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PROFILE_COLORS[u.profile] || 'bg-slate-100 text-slate-600'}`}>
                    {u.profile}
                  </span>
                  {u.status !== 'active' && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                      Bloqueado
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {u.phone}
                  {u.last_used_at && ` — último uso: ${new Date(u.last_used_at).toLocaleDateString('pt-BR')}`}
                </p>
                {u.effective_permissions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {u.effective_permissions.slice(0, 6).map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {u.effective_permissions.length > 6 && (
                      <span className="text-[10px] text-slate-400">
                        +{u.effective_permissions.length - 6} mais
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="ml-4 flex shrink-0 gap-1">
                <button
                  onClick={() => toggleStatus(u)}
                  title={u.status === 'active' ? 'Bloquear' : 'Ativar'}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    u.status === 'active'
                      ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                  }`}
                >
                  {u.status === 'active' ? 'Bloquear' : 'Ativar'}
                </button>
                <button
                  onClick={() => startEdit(u)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Editar
                </button>
                {confirmDelete === u.id ? (
                  <span className="flex items-center gap-1">
                    <button
                      onClick={() => remove(u.id)}
                      className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Não
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(u.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit tab */}
      {tab === 'actions' && (
        <div className="space-y-2">
          {actions.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhuma ação registrada ainda
            </p>
          )}
          {actions.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    a.status === 'confirmado'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : a.status === 'pendente_confirmacao'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {a.status}
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {a.intent}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {a.created_at ? new Date(a.created_at).toLocaleString('pt-BR') : ''}
                </span>
              </div>
              {a.raw_command && (
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  &quot;{a.raw_command}&quot;
                </p>
              )}
              {a.user_name && (
                <p className="mt-0.5 text-[10px] text-slate-400">
                  por {a.user_name} ({a.phone})
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
