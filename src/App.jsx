import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { api, getToken, setToken } from './api.js'
import ChurchesPanel from './components/ChurchesPanel.jsx'
import ConfigPanel from './components/ConfigPanel.jsx'
import DepartmentsPanel from './components/DepartmentsPanel.jsx'
import ContactsPanel from './components/ContactsPanel.jsx'
import RoutingRulesPanel from './components/RoutingRulesPanel.jsx'
import LandingPage from './components/LandingPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import MessagesPanel from './components/MessagesPanel.jsx'
import NumbersManager from './components/NumbersManager.jsx'

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

const CHURCH_TABS = [
  { id: 'numbers', label: 'Números' },
  { id: 'config', label: 'Configuração' },
  { id: 'departments', label: 'Departamentos' },
  { id: 'contacts', label: 'Contatos' },
  { id: 'routing', label: 'Encaminhamentos' },
  { id: 'messages', label: 'Mensagens' },
]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminRoot />} />
      </Routes>
    </BrowserRouter>
  )
}

function AdminRoot() {
  const [user, setUser] = useState(undefined)

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

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    setToken(null)
    setUser(null)
  }

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    )
  }

  if (user === null) {
    return <LoginPage onLogin={setUser} />
  }

  // Mesmo login, áreas separadas: super admin gerencia igrejas,
  // perfil "igreja" gerencia somente a própria igreja.
  if (user.role === 'super_admin') {
    return <SuperAdminArea onLogout={logout} />
  }
  return <ChurchArea user={user} onLogout={logout} />
}

function SuperAdminArea({ onLogout }) {
  const [openChurch, setOpenChurch] = useState(null)

  if (openChurch) {
    return (
      <ChurchArea
        churchId={openChurch.id}
        churchName={openChurch.name}
        onBack={() => setOpenChurch(null)}
        onLogout={onLogout}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Administração</h1>
            <p className="text-sm text-slate-500">Gestão das igrejas da plataforma</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <ChurchesPanel onOpenChurch={(church) => setOpenChurch({ id: church.id, name: church.name })} />
      </main>
    </div>
  )
}

function ChurchArea({ user = null, churchId = null, churchName = '', onBack = null, onLogout }) {
  const [church, setChurch] = useState(churchId ? { id: churchId, name: churchName } : null)
  const [tab, setTab] = useState('numbers')
  const [status, setStatus] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (churchId) return
    let cancelled = false
    api
      .getChurches()
      .then((list) => {
        if (cancelled) return
        if (!list.length) {
          setErr('Nenhuma igreja vinculada ao seu acesso. Fale com o administrador da plataforma.')
          return
        }
        setChurch(list[0])
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [churchId])

  const activeChurchId = church?.id ?? null

  useEffect(() => {
    if (!activeChurchId) return
    let cancelled = false
    const load = async () => {
      try {
        const s = await api.getStatus(activeChurchId)
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
  }, [activeChurchId])

  if (err && !church) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-sm text-red-700">{err}</p>
          <button
            onClick={onLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ← Voltar
              </button>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">
                {church?.name || 'Minha igreja'}
              </h1>
              <p className="text-sm text-slate-500">
                {onBack ? 'Operando como administrador da plataforma' : 'Painel da igreja'}
                {user?.email ? ` — ${user.email}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {status && (
              <>
                <StatusDot label="LLM" value={status.llm} />
                <StatusDot label="WhatsApp" value={status.evolution} />
              </>
            )}
            {!status && activeChurchId && (
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-500">
                Verificando...
              </span>
            )}
            <button
              onClick={onLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
          {CHURCH_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
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

      <main className="mx-auto max-w-5xl px-4 py-6" key={activeChurchId}>
        {!activeChurchId ? (
          <p className="text-sm text-slate-500">Carregando igreja...</p>
        ) : (
          <>
            {tab === 'numbers' && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">Números do WhatsApp</h2>
                <NumbersManager churchId={activeChurchId} canManage onChanged={() => {}} />
              </section>
            )}
            {tab === 'config' && <ConfigPanel churchId={activeChurchId} />}
            {tab === 'departments' && <DepartmentsPanel churchId={activeChurchId} />}
            {tab === 'contacts' && <ContactsPanel churchId={activeChurchId} />}
            {tab === 'routing' && <RoutingRulesPanel churchId={activeChurchId} />}
            {tab === 'messages' && (
              <MessagesPanel churchId={activeChurchId} reloadKey={status?.updated_at} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
