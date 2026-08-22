import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import QrPanel from './QrPanel.jsx'

const STATE_STYLE = {
  open: 'bg-emerald-100 text-emerald-700',
  connecting: 'bg-amber-100 text-amber-700',
}
const stateLabel = (s) => ({ open: 'Conectado', connecting: 'Conectando', close: 'Desconectado', offline: 'Evolution offline' })[s] || s || '—'

export default function NumbersManager({ churchId, canManage = false, onChanged }) {
  const [numbers, setNumbers] = useState([])
  const [states, setStates] = useState({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [openNumberId, setOpenNumberId] = useState(null)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const list = await api.getNumbers(churchId)
      setNumbers(list)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
      onChanged?.()
    }
  }, [churchId])

  useEffect(() => {
    setLoading(true)
    setOpenNumberId(null)
    load()
  }, [churchId])

  const refreshStates = useCallback(async () => {
    if (!numbers.length) return
    const entries = await Promise.all(
      numbers.map(async (n) => {
        try {
          const res = await api.getNumberState(n.id)
          return [n.id, res.state]
        } catch {
          return [n.id, 'offline']
        }
      }),
    )
    setStates(Object.fromEntries(entries))
  }, [numbers])

  useEffect(() => {
    refreshStates()
    const id = setInterval(refreshStates, 15000)
    return () => clearInterval(id)
  }, [refreshStates])

  const addNumber = async (e) => {
    e.preventDefault()
    setCreating(true)
    setErr(null)
    try {
      const created = await api.createNumber(churchId, newLabel.trim())
      setNewLabel('')
      await load()
      setOpenNumberId(created.id)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setCreating(false)
    }
  }

  const removeNumber = async (number) => {
    if (!window.confirm(`Excluir o numero "${number.label || number.instance_name}"? A conexao com o WhatsApp sera apagada.`)) return
    try {
      await api.deleteNumber(number.id)
      if (openNumberId === number.id) setOpenNumberId(null)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="space-y-4">
      {err && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando numeros...</p>
      ) : numbers.length === 0 ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-slate-600">
          {canManage
            ? 'Nenhum numero cadastrado ainda. Adicione um numero abaixo para gerar o QR code ou o codigo de pareamento do WhatsApp.'
            : 'Nenhum numero cadastrado para esta igreja.'}
        </p>
      ) : (
        <div className="space-y-3">
          {numbers.map((n) => (
            <div key={n.id} className="rounded-lg border border-slate-200">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">{n.label || n.instance_name}</div>
                  <code className="text-xs text-slate-400">{n.instance_name}</code>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATE_STYLE[states[n.id]] || 'bg-slate-100 text-slate-600'}`}>
                  {stateLabel(states[n.id])}
                </span>
                <button
                  onClick={() => setOpenNumberId(openNumberId === n.id ? null : n.id)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  {openNumberId === n.id ? 'Fechar' : states[n.id] === 'open' ? 'Gerenciar' : 'Conectar'}
                </button>
                {canManage && (
                  <button
                    onClick={() => removeNumber(n)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                )}
              </div>
              {openNumberId === n.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  <QrPanel number={n} onStateChange={refreshStates} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <form onSubmit={addNumber} className="flex flex-wrap items-center gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Identificacao do numero (ex.: Contato da secretaria)"
            className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Criando...' : '+ Adicionar numero'}
          </button>
        </form>
      )}
    </div>
  )
}
