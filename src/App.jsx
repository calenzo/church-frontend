import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { api, getToken, setToken } from './api.js'
import ChurchesPanel from './components/ChurchesPanel.jsx'
import ConfigPanel from './components/ConfigPanel.jsx'
import DepartmentsPanel from './components/DepartmentsPanel.jsx'
import LandingPage from './components/LandingPage.jsx'
import LoginPage from './components/LoginPage.jsx'
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

function AdminDashboard() {
  const [user, setUser] = useState(undefined)
  const [churches, setChurches] = useState([])
  const [churchId, setChurchId] = useState(null)
  const [tab, setTab] = useState('config')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!getToken()) {
      setUser(null)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => {
        setToken(null)
        setUser(null)
      })
  }, [])

  useEffect(() => {
    if (!user) return
    api
      .getChurches()
      .then((list) => {
        setChurches(list)
        setChurchId((current) => current || user.church_id || list[0]?.id || null)
      })
      .catch(() => setChurches([]))
  }, [user])

  useEffect(() => {
    if (!user || !churchId) return
    let cancelled = false
    const load = async () => {
      try {
        const s = await api.getStatus(churchId)
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
  }, [user, churchId])

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    )
  }

  if (user === null) {
    return (
      <LoginPage
        onLogin={(u) => {
          setUser(u)
          setTab('config')
        }}
      />
    )
  }

  const isSuperAdmin = user.role === 'super_admin'
  const tabs = isSuperAdmin ? [...TABS, { id: 'igrejas', label: 'Igrejas' }] : TABS

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    setToken(null)
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Assistente da Igreja</h1>
            <p className="text-sm text-slate-500">
              WhatsApp + LLM + departamentos{isSuperAdmin ? ' (plataforma)' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isSuperAdmin && churches.length > 0 && (
              <select
                value={churchId ?? ''}
                onChange={(e) => setChurchId(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {status && (
              <>
                <StatusDot label="LLM" value={status.llm} />
                <StatusDot label="WhatsApp" value={status.evolution} />
              </>
            )}
            {!status && (
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-500">Verificando...</span>
            )}
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4">
          {tabs.map((t) => (
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

      <main className="mx-auto max-w-5xl px-4 py-6" key={churchId}>
        {tab === 'config' && churchId && <ConfigPanel churchId={churchId} />}
        {tab === 'departments' && churchId && <DepartmentsPanel churchId={churchId} />}
        {tab === 'messages' && churchId && <MessagesPanel churchId={churchId} reloadKey={status?.updated_at} />}
        {tab === 'igrejas' && isSuperAdmin && <ChurchesPanel />}
      </main>
    </div>
  )
}
