import { useEffect, useState } from 'react'
import { api } from '../api.js'

const STATUS_STYLE = {
  received: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  routed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  routed_with_error: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function parseSteps(raw) {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function StepsTimeline({ steps }) {
  if (!steps.length) return null
  return (
    <div className="mt-3 space-y-0">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex flex-col items-center">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                s.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
            {i < steps.length - 1 && <span className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
          </div>
          <div className="min-w-0 pb-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span
                className={`text-xs font-medium ${
                  s.status === 'error'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {s.step}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(s.ts)}</span>
            </div>
            {s.detail && <p className="text-xs text-slate-500 dark:text-slate-400">{s.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MessagesPanel({ churchId, reloadKey }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setMessages(await api.getMessages(100, churchId))
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [reloadKey, churchId])

  useEffect(() => {
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [churchId])

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Log de mensagens</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Atualiza automaticamente a cada 5 segundos.</p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Atualizar
        </button>
      </div>

      {err && (
        <p className="border-b border-slate-200 p-4 text-sm text-red-600 dark:border-slate-800 dark:text-red-400">{err}</p>
      )}

      {loading && messages.length === 0 ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Carregando...</p>
      ) : messages.length === 0 ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
          Nenhuma mensagem ainda. As mensagens que chegarem no contato da igreja aparecem aqui.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {m.direction === 'in' ? 'Recebida' : 'Enviada'}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {m.direction === 'in' ? `De ${m.from_number}` : `Para ${m.from_number}`}
                  </span>
                  {m.department_name && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                      {m.department_name}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      STATUS_STYLE[m.status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {m.status}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(m.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{m.text}</p>
                {m.llm_reply && (
                  <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <span className="mr-2 text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                      Resposta da LLM
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{m.llm_reply}</p>
                  </div>
                )}
                {m.error && (
                  <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    <span className="font-medium tracking-wide uppercase">Erro: </span>
                    {m.error}
                  </p>
                )}
                <StepsTimeline steps={parseSteps(m.steps)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
