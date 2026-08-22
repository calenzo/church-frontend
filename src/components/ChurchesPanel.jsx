import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

export default function ChurchesPanel({ onOpenChurch }) {
  const [churches, setChurches] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editName, setEditName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const load = useCallback(async () => {
    try {
      const list = await api.getChurches()
      setChurches(list)
      setSelectedId((current) => (list.some((c) => c.id === current) ? current : list[0]?.id ?? null))
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selected = churches.find((c) => c.id === selectedId) || null

  useEffect(() => {
    setEditName(selected?.name || '')
  }, [selected?.id])

  const createChurch = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setErr(null)
    try {
      await api.createChurch(newName.trim())
      setNewName('')
      await load()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setCreating(false)
    }
  }

  const saveName = async () => {
    if (!selected || !editName.trim()) return
    setSavingName(true)
    try {
      await api.updateChurch(selected.id, { name: editName.trim() })
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSavingName(false)
    }
  }

  const toggleActive = async () => {
    if (!selected) return
    try {
      await api.updateChurch(selected.id, { active: !selected.active })
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  const removeChurch = async () => {
    if (!selected) return
    if (
      !window.confirm(
        `Excluir a igreja "${selected.name}" com todos os números, departamentos e mensagens?`,
      )
    )
      return
    try {
      await api.deleteChurch(selected.id)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Igrejas da plataforma</h2>
            <p className="text-sm text-slate-500">
              Crie igrejas e defina o login de acesso de cada uma. Cada igreja gerencia apenas a si
              mesma.
            </p>
          </div>
        </div>

        {err && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}

        <form onSubmit={createChurch} className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da nova igreja"
            className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Criando...' : '+ Nova igreja'}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : churches.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma igreja cadastrada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {churches.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full flex-wrap items-center justify-between gap-3 px-2 py-3 text-left transition ${
                    c.id === selectedId ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span className="font-medium text-slate-900">{c.name}</span>
                    {!c.active && <span className="text-xs text-red-500">(inativa)</span>}
                  </span>
                  {c.id === selectedId && (
                    <span className="text-xs font-medium text-blue-600">Selecionada</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-slate-900">{selected.name}</h2>
            <p className="mb-4 text-sm text-slate-500">Configurações gerais da igreja.</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={saveName}
                disabled={savingName || editName.trim() === selected.name}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingName ? 'Salvando...' : 'Renomear'}
              </button>
              <button
                onClick={toggleActive}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {selected.active ? 'Desativar' : 'Ativar'}
              </button>
              {onOpenChurch && selected.active && (
                <button
                  onClick={() => onOpenChurch(selected)}
                  className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Abrir painel da igreja
                </button>
              )}
              <button
                onClick={removeChurch}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Excluir igreja
              </button>
            </div>
          </section>

          <ChurchUsersPanel churchId={selected.id} churchName={selected.name} />
        </>
      )}
    </div>
  )
}

function ChurchUsersPanel({ churchId, churchName }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setUsers(await api.getChurchUsers(churchId))
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [churchId])

  useEffect(() => {
    setLoading(true)
    setName('')
    setEmail('')
    setPassword('')
    load()
  }, [churchId])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      await api.createChurchUser(churchId, { name, email, password })
      setName('')
      setEmail('')
      setPassword('')
      await load()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setSaving(false)
    }
  }

  const removeUser = async (u) => {
    if (!window.confirm(`Excluir o acesso de "${u.email}"?`)) return
    try {
      await api.deleteUser(u.id)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Acessos da igreja</h2>
      <p className="mb-4 text-sm text-slate-500">
        Logins com perfil &quot;igreja&quot; que enxergam e gerenciam somente {churchName}.
      </p>

      {err && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando acessos...</p>
      ) : users.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">
          Nenhum acesso criado. A igreja precisa de um login para gerenciar os próprios números,
          departamentos e mensagens.
        </p>
      ) : (
        <ul className="mb-4 divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">
                  {u.name || u.email}
                </div>
                <div className="truncate text-xs text-slate-500">{u.email}</div>
              </div>
              <button
                onClick={() => removeUser(u)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-600">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="min-w-48 flex-[2]">
          <span className="mb-1 block text-xs font-medium text-slate-600">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@igreja.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-600">Senha</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Criando...' : '+ Criar acesso'}
        </button>
      </form>
    </section>
  )
}
