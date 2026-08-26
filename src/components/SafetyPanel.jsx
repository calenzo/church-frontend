import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

const MODE_COLORS = {
  NORMAL: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ATENCAO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  PROTECAO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  PAUSADO: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const MODE_LABELS = {
  NORMAL: 'Normal',
  ATENCAO: 'Atenção',
  PROTECAO: 'Proteção',
  PAUSADO: 'Pausado',
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</div>}
    </div>
  )
}

export default function SafetyPanel({ churchId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [limits, setLimits] = useState({})
  const [msg, setMsg] = useState('')

  const load = useCallback(() => {
    if (!churchId) return
    setLoading(true)
    api.getSafetyStatus(churchId).then((d) => {
      setData(d)
      setLimits(d.limits || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [churchId])

  useEffect(() => { load() }, [load])

  const pause = async () => {
    setSaving(true); setMsg('')
    try {
      await api.pauseSafety(churchId)
      setMsg('Automação pausada')
      load()
    } catch (e) { setMsg(e.message) }
    setSaving(false)
  }

  const resume = async () => {
    setSaving(true); setMsg('')
    try {
      await api.resumeSafety(churchId)
      setMsg('Automação retomada')
      load()
    } catch (e) { setMsg(e.message) }
    setSaving(false)
  }

  const saveLimits = async () => {
    setSaving(true); setMsg('')
    try {
      await api.updateSafetyLimits(churchId, limits)
      setMsg('Limites salvos')
      load()
    } catch (e) { setMsg(e.message) }
    setSaving(false)
  }

  if (loading) return <div className="py-8 text-center text-slate-400">Carregando...</div>
  if (!data) return <div className="py-8 text-center text-red-500">Erro ao carregar</div>

  const isPaused = data.mode === 'PAUSADO'

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Segurança WhatsApp</h2>

      {/* Status + Botões de emergência */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Status atual</div>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${MODE_COLORS[data.mode] || ''}`}>
            {MODE_LABELS[data.mode] || data.mode}
          </span>
        </div>
        <div className="flex gap-2">
          {!isPaused ? (
            <button
              onClick={pause}
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Pausar Automação
            </button>
          ) : (
            <button
              onClick={resume}
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Retomar Automação
            </button>
          )}
        </div>
      </div>

      {msg && <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{msg}</div>}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Enviadas (min)" value={data.sent_minute} sub={`Limite: ${data.limits?.max_per_minute}/min`} />
        <MetricCard label="Enviadas (hora)" value={data.sent_hour} sub={`Limite: ${data.limits?.max_per_hour}/hora`} />
        <MetricCard label="Recebidas (min)" value={data.received_minute} />
        <MetricCard label="Recebidas (hora)" value={data.received_hour} />
        <MetricCard label="Duplicatas bloqueadas" value={data.duplicate_blocked} />
        <MetricCard label="Bloqueadas (proteção)" value={data.protection_blocked} />
        <MetricCard label="Total enviado" value={data.total_sent} />
        <MetricCard label="Fila atual" value={data.queue_size} />
      </div>

      {/* Limites configuráveis */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Limites de envio</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { key: 'min_delay_sec', label: 'Atraso mínimo (s)', min: 1, max: 60 },
            { key: 'max_delay_sec', label: 'Atraso máximo (s)', min: 1, max: 120 },
            { key: 'max_per_minute', label: 'Máx. por minuto', min: 1, max: 100 },
            { key: 'max_per_hour', label: 'Máx. por hora', min: 1, max: 1000 },
            { key: 'cooldown_sec', label: 'Cooldown por contato (s)', min: 0, max: 60 },
            { key: 'debounce_sec', label: 'Debounce agrupamento (s)', min: 0, max: 30 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                step={key.includes('delay') || key.includes('sec') ? 0.5 : 1}
                value={limits[key] ?? ''}
                onChange={(e) => setLimits((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveLimits}
          disabled={saving}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Salvar Limites
        </button>
      </div>

      {/* Último erro / status */}
      {(data.last_error || data.last_disconnect || data.last_reconnect) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Eventos recentes</h3>
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            {data.last_error && <div>Último erro: {data.last_error}</div>}
            {data.last_disconnect && <div>Última desconexão: {data.last_disconnect}</div>}
            {data.last_reconnect && <div>Última reconexão: {data.last_reconnect}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
