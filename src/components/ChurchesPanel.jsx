import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import NumbersManager from './NumbersManager.jsx'

export default function ChurchesPanel() {
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
    if (!window.confirm(`Excluir a igreja "${selected.name}" com todos os numeros, departamentos e mensagens?`)) return
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
            <p className="text-sm text-slate-500">Selecione uma igreja para gerenciar seus numeros de WhatsApp.</p>
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
        ) : (
          <div className="flex flex-wrap gap-2">
            {churches.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  c.id === selectedId
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c.name}
                {!c.active && <span className="ml-2 text-xs text-red-500">(inativa)</span>}
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Numeros do WhatsApp — {selected.name}</h2>
            <NumbersManager churchId={selected.id} canManage onChanged={load} />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Configuracoes da igreja</h2>
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
              <button
                onClick={removeChurch}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Excluir igreja
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
