import { useEffect, useState } from 'react'
import { api } from './api.js'
import ConfigPanel from './components/ConfigPanel.jsx'
import DepartmentsPanel from './components/DepartmentsPanel.jsx'
import MessagesPanel from './components/MessagesPanel.jsx'

const TABS = [
  { id: 'config', label: 'Configuracao' },
  { id: 'departments', label: 'Departamentos' },
  { id: 'messages', label: 'Mensagens' },
]

function StatusDot({ label, value }) {
  const ok = value === 'ok' || value === 'open'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
      title={value}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {label}: {value}
    </span>
  )
}

export default function App() {
  const [tab, setTab] = useState('config')
  const [status, setStatus] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const s = await api.getStatus()
        if (!cancelled) setStatus(s)
      } catch {
        if (!cancelled) setStatus(null)
      }
    }
    load()
    const id = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Assistente da Igreja</h1>
            <p className="text-sm text-slate-500">WhatsApp + LLM + departamentos</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {status && (
              <>
                <StatusDot label="Ollama" value={status.ollama} />
                <StatusDot label="WhatsApp" value={status.evolution} />
              </>
            )}
            {!status && (
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-500">Verificando...</span>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'config' && <ConfigPanel onSaved={() => setReloadKey((k) => k + 1)} />}
        {tab === 'departments' && <DepartmentsPanel />}
        {tab === 'messages' && <MessagesPanel reloadKey={reloadKey} />}
      </main>
    </div>
  )
}
