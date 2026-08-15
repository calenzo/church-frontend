import { useEffect, useState } from 'react'
import { api } from '../api.js'

const STATUS_STYLE = {
  received: 'bg-slate-100 text-slate-600',
  routed: 'bg-emerald-100 text-emerald-700',
  routed_with_error: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  sent: 'bg-blue-100 text-blue-700',
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessagesPanel({ reloadKey }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setMessages(await api.getMessages())
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [reloadKey])

  useEffect(() => {
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Log de mensagens</h2>
          <p className="text-sm text-slate-500">Atualiza automaticamente a cada 5 segundos.</p>
        </div>
        <button onClick={load} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Atualizar
        </button>
      </div>

      {err && <p className="border-b border-slate-200 p-4 text-sm text-red-600">{err}</p>}

      {loading && messages.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">Carregando...</p>
      ) : messages.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">
          Nenhuma mensagem ainda. As mensagens que chegarem no contato da igreja aparecem aqui.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {m.direction === 'in' ? 'Recebida' : 'Enviada'}
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {m.direction === 'in' ? `De ${m.from_number}` : `Para ${m.from_number}`}
                  </span>
                  {m.department_name && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                      {m.department_name}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[m.status] || 'bg-slate-100 text-slate-600'}`}>
                    {m.status}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{formatDate(m.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700">{m.text}</p>
                {m.llm_reply && (
                  <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="mr-2 text-xs font-medium uppercase tracking-wide text-slate-400">Resposta da LLM</span>
                    <p className="text-sm text-slate-600">{m.llm_reply}</p>
                  </div>
                )}
                {m.error && <p className="mt-2 text-xs text-red-500">{m.error}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
