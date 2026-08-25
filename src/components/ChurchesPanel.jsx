import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { btnPrimary, btnSecondary, card, inputCls } from '../ui.js'

export default function ChurchesPanel({ onOpenChurch }) {
  const [churches, setChurches] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      const list = await api.getChurches()
      setChurches(list)
      setSelectedId((current) =>
        list.some((c) => c.id === current) ? current : list[0]?.id ?? null,
      )
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? churches.filter((c) => c.name.toLowerCase().includes(q)) : churches
  }, [churches, search])

  const selected = churches.find((c) => c.id === selectedId) || null

  const createChurch = async (e) => {
    e.preventDefault()
    const name = e.target.elements.churchName.value.trim()
    if (!name) return
    setCreating(true)
    setErr(null)
    try {
      const created = await api.createChurch(name)
      setShowCreate(false)
      await load()
      setSelectedId(created.id ?? null)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {err}
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Lista de igrejas */}
        <div className={`${card} overflow-hidden lg:sticky lg:top-6`}>
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Igrejas{' '}
                {!loading && (
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {churches.length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowCreate((v) => !v)}
                aria-expanded={showCreate}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  showCreate
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showCreate ? 'Cancelar' : '+ Nova'}
              </button>
            </div>

            {showCreate && (
              <form onSubmit={createChurch} className="mt-3 space-y-2">
                <input
                  name="churchName"
                  autoFocus
                  required
                  placeholder="Nome da nova igreja"
                  className={inputCls}
                />
                <button type="submit" disabled={creating} className={`${btnPrimary} w-full`}>
                  {creating ? 'Criando...' : 'Criar igreja'}
                </button>
              </form>
            )}

            {churches.length > 5 && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar igreja..."
                className={`mt-3 ${inputCls}`}
              />
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
                {search ? 'Nenhuma igreja encontrada.' : 'Nenhuma igreja cadastrada ainda.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        c.id === selectedId
                          ? 'bg-blue-50 dark:bg-blue-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${c.active ? 'bg-emerald-500' : 'bg-red-400'}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-medium ${
                            c.id === selectedId
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {c.name}
                        </span>
                        <span className="block text-xs text-slate-400 dark:text-slate-500">
                          {c.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </span>
                      {c.id === selectedId && (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-blue-500 dark:text-blue-400">
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detalhes */}
        {selected ? (
          <div className="space-y-4">
            <ChurchDetail church={selected} onOpenChurch={onOpenChurch} onChanged={load} />
            <ChurchUsersPanel churchId={selected.id} churchName={selected.name} />
          </div>
        ) : (
          !loading && (
            <div className={`${card} flex min-h-40 items-center justify-center p-8`}>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selecione uma igreja na lista para ver os detalhes.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5.5 w-10 rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4.5' : ''
          }`}
        />
      </button>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
    </label>
  )
}

function ChurchDetail({ church, onOpenChurch, onChanged }) {
  const [name, setName] = useState(church.name)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(church.name)
  }, [church.id, church.name])

  const saveName = async () => {
    if (!name.trim() || name.trim() === church.name) return
    setSaving(true)
    try {
      await api.updateChurch(church.id, { name: name.trim() })
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async () => {
    await api.updateChurch(church.id, { active: !church.active })
    await onChanged()
  }

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
              {church.name}
            </h2>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                church.active
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${church.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {church.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          {onOpenChurch && church.active && (
            <button onClick={() => onOpenChurch(church)} className={btnPrimary}>
              Abrir painel da igreja →
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <label className="min-w-48 flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Nome da igreja
            </span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <div className="flex items-center gap-4">
            <Toggle
              checked={church.active}
              onChange={toggleActive}
              label={church.active ? 'Recebendo mensagens' : 'Pausada'}
            />
            <button
              onClick={saveName}
              disabled={saving || name.trim() === church.name || !name.trim()}
              className={btnSecondary}
            >
              {saving ? 'Salvando...' : 'Renomear'}
            </button>
          </div>
        </div>
      </div>

      <DangerZone church={church} onChanged={onChanged} />
    </div>
  )
}

function DangerZone({ church, onChanged }) {
  const [confirming, setConfirming] = useState(false)
  const [typeName, setTypeName] = useState('')
  const [err, setErr] = useState(null)

  const remove = async () => {
    try {
      await api.deleteChurch(church.id)
      setConfirming(false)
      setTypeName('')
      await onChanged()
    } catch (e) {
      setErr(e.message)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-xl border border-dashed border-red-300 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        Excluir igreja e todos os dados dela...
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10">
      <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Excluir "{church.name}"</h3>
      <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
        Isso apaga permanentemente números, departamentos, contatos e mensagens. Digite{' '}
        <strong>{church.name}</strong> para confirmar.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          placeholder={church.name}
          className={`${inputCls} max-w-xs border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-500/40`}
        />
        <button
          onClick={remove}
          disabled={typeName !== church.name}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Excluir definitivamente
        </button>
        <button
          onClick={() => {
            setConfirming(false)
            setTypeName('')
            setErr(null)
          }}
          className={btnSecondary}
        >
          Cancelar
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{err}</p>}
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
    <div className={`${card} p-5`}>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Acessos</h3>
      <p className="mb-4 mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        Logins que enxergam e gerenciam somente <strong>{churchName}</strong>.
      </p>

      {err && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {err}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Carregando acessos...</p>
      ) : users.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Nenhum acesso criado ainda — a igreja precisa de um login para usar o painel.
        </p>
      ) : (
        <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {(u.name || u.email).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {u.name || u.email}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                </div>
              </div>
              <button
                onClick={() => removeUser(u)}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <label className="min-w-36 flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Nome</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Opcional" className={inputCls} />
        </label>
        <label className="min-w-44 flex-[2]">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@igreja.com"
            className={inputCls}
          />
        </label>
        <label className="min-w-36 flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Senha</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={inputCls}
          />
        </label>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'Criando...' : '+ Criar acesso'}
        </button>
      </form>
    </div>
  )
}
