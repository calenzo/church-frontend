import { useEffect, useState } from 'react'
import { api } from '../api.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const emptyForm = {
  name: '',
  phone: '',
  role: '',
  contact_type: '',
  department_name: '',
  resumo_contexto: '',
}

const TIPOS = ['Membro', 'Visitante', 'Novo convertido', 'Liderança', 'Prestador de serviço', 'Contato externo']

function MemorySection({ contact, onErr }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ kind: 'observacao', content: '', responsible: '' })
  const [memoryType, setMemoryType] = useState('permanente')
  const [expiresDays, setExpiresDays] = useState('')

  const load = async () => {
    try {
      setMemories(await api.getContactMemory(contact.id))
    } catch (e) {
      onErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [contact.id])

  const pendentes = memories.filter((m) => m.kind === 'pendencia' && m.status !== 'resolvida')
  const resolvidas = memories.filter((m) => m.kind === 'pendencia' && m.status === 'resolvida')
  const outros = memories.filter((m) => m.kind !== 'pendencia')

  const badge = (m) =>
    m.kind === 'pendencia'
      ? m.status === 'resolvida'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-amber-100 text-amber-700'
      : m.kind === 'fato'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-slate-100 text-slate-600'

  const add = async (e) => {
    e.preventDefault()
    if (!draft.content.trim()) return
    const data = { ...draft }
    if (data.kind !== 'pendencia') delete data.responsible
    if (memoryType === 'temporaria' && expiresDays)
      data.expires_at = new Date(Date.now() + Number(expiresDays) * 86400000).toISOString()
    else data.memory_type = memoryType
    try {
      await api.createContactMemory(contact.id, data)
      setDraft({ kind: draft.kind, content: '', responsible: '' })
      setExpiresDays('')
      await load()
    } catch (e2) {
      onErr(e2.message)
    }
  }

  const togglePendencia = async (m) => {
    try {
      await api.updateMemory(m.id, { status: m.status === 'resolvida' ? 'aberta' : 'resolvida' })
      await load()
    } catch (e2) {
      onErr(e2.message)
    }
  }

  const removeMem = async (id) => {
    if (!window.confirm('Apagar este registro da memória?')) return
    try {
      await api.deleteMemory(id)
      await load()
    } catch (e2) {
      onErr(e2.message)
    }
  }

  const clearAuto = async () => {
    if (
      !window.confirm(
        'Apagar TODOS os registros automáticos desta memória? Registros manuais serão mantidos.',
      )
    )
      return
    try {
      await api.clearContactMemory(contact.id)
      await load()
    } catch (e2) {
      onErr(e2.message)
    }
  }

  const item = (m) => (
    <div key={m.id} className="flex items-start justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge(m)}`}>
          {m.kind === 'pendencia' ? (m.status === 'resolvida' ? 'resolvida' : 'pendente') : m.kind}
          {m.source === 'automatica' ? ' · auto' : ''}
        </span>
        <span className="text-xs text-slate-700">{m.content}</span>
        {m.responsible && <span className="ml-1 text-[10px] text-slate-400">({m.responsible})</span>}
      </div>
      <div className="flex shrink-0 gap-2">
        {m.kind === 'pendencia' && (
          <button onClick={() => togglePendencia(m)} className="text-[11px] text-emerald-600 hover:underline">
            {m.status === 'resolvida' ? 'Reabrir' : 'Resolver'}
          </button>
        )}
        <button onClick={() => removeMem(m.id)} className="text-[11px] text-red-500 hover:underline">
          Apagar
        </button>
      </div>
    </div>
  )

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      {contact.memory_locked && (
        <p className="text-[11px] font-medium text-orange-600">
          Memória automática bloqueada — a IA não grava novos fatos deste contato.
        </p>
      )}

      <form onSubmit={add} className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} className={`${inputCls} w-40`}>
            <option value="observacao">Observação</option>
            <option value="fato">Fato</option>
            <option value="pendencia">Pendência</option>
          </select>
          <select value={memoryType} onChange={(e) => setMemoryType(e.target.value)} className={`${inputCls} w-40`}>
            <option value="permanente">Permanente</option>
            <option value="temporaria">Temporária</option>
          </select>
          {memoryType === 'temporaria' && (
            <input
              type="number"
              min="1"
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              placeholder="Dias de validade"
              className={`${inputCls} w-36`}
            />
          )}
        </div>
        <textarea
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          placeholder="Ex.: Prefere culto das 19h / Aguardando retorno sobre batismo..."
          rows={2}
          className={inputCls}
        />
        {draft.kind === 'pendencia' && (
          <input
            value={draft.responsible}
            onChange={(e) => setDraft({ ...draft, responsible: e.target.value })}
            placeholder="Responsável por resolver (opcional)"
            className={`${inputCls} w-full sm:w-72`}
          />
        )}
        <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          Adicionar à memória
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-slate-400">Carregando memória...</p>
      ) : memories.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhuma memória registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {pendentes.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pendências abertas</p>
              {pendentes.map(item)}
            </div>
          )}
          {outros.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Fatos & observações</p>
              {outros.map(item)}
            </div>
          )}
          {resolvidas.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Resolvidas</p>
              {resolvidas.map(item)}
            </div>
          )}
        </div>
      )}

      <button onClick={clearAuto} className="text-[11px] text-red-500 hover:underline">
        Limpar memória automática
      </button>
    </div>
  )
}

export default function ContactsPanel({ churchId }) {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = async (term = search) => {
    setLoading(true)
    try {
      setContacts(await api.getContacts(churchId, term))
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [churchId])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const startEdit = (contact) => {
    setEditing(contact.id)
    setForm({
      name: contact.name,
      phone: contact.phone,
      role: contact.role || '',
      contact_type: contact.contact_type || '',
      department_name: contact.department_name || '',
      resumo_contexto: contact.resumo_contexto || '',
    })
  }

  const startNew = () => {
    setEditing('new')
    setForm(emptyForm)
  }

  const cancel = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing === 'new') await api.createContact(churchId, form)
      else await api.updateContact(editing, form)
      cancel()
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remover este contato? A IA deixará de reconhecer este número.')) return
    try {
      await api.deleteContact(id)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const toggleLock = async (c) => {
    try {
      await api.updateContact(c.id, { memory_locked: !c.memory_locked })
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Contatos da Igreja</h3>
            <p className="mt-1 text-xs text-slate-500">
              Cadastre aqui os números de membros e líderes. A IA usa esta base para
              reconhecer quem está falando no WhatsApp (nome e cargo) e responder sem inventar informações.
              Números fora desta lista são tratados com identidade desconhecida.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Buscar nome ou número..."
              className={`${inputCls} w-56`}
            />
            <button onClick={() => load()} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Buscar
            </button>
          </div>
        </div>

        {!editing && (
          <button
            onClick={startNew}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo contato
          </button>
        )}

        {editing && (
          <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <h4 className="text-sm font-semibold text-slate-800">
              {editing === 'new' ? 'Novo contato' : 'Editar contato'}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-slate-600">
                Nome
                <input required value={form.name} onChange={set('name')} placeholder="Ex.: Pastor Radchem" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600">
                WhatsApp
                <input required value={form.phone} onChange={set('phone')} placeholder="(21) 99906-9940" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Cargo / Função
                <input value={form.role} onChange={set('role')} placeholder="Ex.: Pastor, Diácono, Líder de Louvor" className={`mt-1 ${inputCls}`} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Tipo de contato
                <select value={form.contact_type} onChange={set('contact_type')} className={`mt-1 ${inputCls}`}>
                  <option value="">Não definido</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600">
                Departamento / Ministério
                <input value={form.department_name} onChange={set('department_name')} placeholder="Ex.: Secretaria, Louvor, Diaconia" className={`mt-1 ${inputCls}`} />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-600">
              Resumo do contexto (a IA lê isto antes de responder)
              <textarea
                value={form.resumo_contexto}
                onChange={set('resumo_contexto')}
                rows={2}
                placeholder="Ex.: Integra a Secretaria; trata escalas e agendamentos."
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <p className="text-xs text-slate-400">
              Inclua o DDI se os contatos forem de outro país. No Brasil, DDD + número já bastam (ex.: 21 99906-9940).
            </p>
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Salvar
              </button>
              <button type="button" onClick={cancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {err && <p className="mt-3 text-xs text-red-500">{err}</p>}

        <div className="mt-4 divide-y divide-slate-100">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Carregando...</p>
          ) : contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Nenhum contato cadastrado ainda. Crie o primeiro para a IA passar a reconhecer esse número.
            </p>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {c.name}
                      {c.role && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">{c.role}</span>}
                      {c.contact_type && <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-normal text-indigo-600">{c.contact_type}</span>}
                      {c.department_name && <span className="ml-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-normal text-teal-700">{c.department_name}</span>}
                    </p>
                    <p className="text-xs text-slate-500">{c.phone}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={toggleLock.bind(null, c)} className="text-xs text-slate-500 hover:underline" title="Bloqueia/desbloqueia a gravação automática de memória">
                      {c.memory_locked ? 'Desbloquear memória' : 'Bloquear memória'}
                    </button>
                    <button onClick={() => startEdit(c)} className="text-xs text-blue-500 hover:underline">Editar</button>
                    <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline">Remover</button>
                  </div>
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer select-none text-xs text-blue-500 hover:underline">
                    Ver memória do contato
                  </summary>
                  <MemorySection contact={c} onErr={setErr} />
                </details>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
