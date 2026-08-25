import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { btnPrimary, btnSecondary, inputCls } from '../ui.js'

const emptyForm = {
  name: '',
  phone: '',
  role: '',
  contact_type: '',
  department_name: '',
  resumo_contexto: '',
}

const TIPOS = ['Membro', 'Visitante', 'Novo convertido', 'Liderança', 'Prestador de serviço', 'Contato externo']

const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const isExpired = (m) =>
  m.memory_type === 'temporaria' && m.expires_at && new Date(m.expires_at) < new Date()

function ContactSheet({ contact }) {
  const rows = [
    ['Nome', contact.name],
    ['Telefone', contact.phone],
    ['Função', contact.role],
    ['Departamento', contact.department_name],
    ['Tipo', contact.contact_type],
    ['Última conversa', fmtDate(contact.last_talk_at)],
    ['Última intenção', contact.last_intent],
  ].filter(([, v]) => v && String(v).trim())
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <p key={k} className="truncate" title={String(v)}>
            <span className="font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">{k}: </span>
            {v}
          </p>
        ))}
      </div>
      {contact.resumo_contexto && (
        <p className="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800">
          <span className="font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">Resumo do contexto: </span>
          {contact.resumo_contexto}
        </p>
      )}
    </div>
  )
}

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
  const ativos = outros.filter((m) => !isExpired(m))
  const expiradas = outros.filter((m) => isExpired(m))

  const badge = (m) =>
    m.kind === 'pendencia'
      ? m.status === 'resolvida'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
      : m.kind === 'fato'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'

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
        {m.memory_type === 'temporaria' && (
          <span
            className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isExpired(m)
                ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
            }`}
            title={m.expires_at ? `Válida até ${fmtDate(m.expires_at)}` : 'Memória temporária'}
          >
            {isExpired(m) ? 'expirada' : 'temporária'}
            {m.expires_at && !isExpired(m) ? ` · até ${fmtDate(m.expires_at)}` : ''}
          </span>
        )}
        <span
          className={`text-xs ${
            isExpired(m) ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {m.content}
        </span>
        {m.responsible && <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">({m.responsible})</span>}
      </div>
      <div className="flex shrink-0 gap-2">
        {m.kind === 'pendencia' && (
          <button onClick={() => togglePendencia(m)} className="text-[11px] text-emerald-600 hover:underline dark:text-emerald-400">
            {m.status === 'resolvida' ? 'Reabrir' : 'Resolver'}
          </button>
        )}
        <button onClick={() => removeMem(m.id)} className="text-[11px] text-red-500 hover:underline dark:text-red-400">
          Apagar
        </button>
      </div>
    </div>
  )

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <ContactSheet contact={contact} />

      {contact.memory_locked && (
        <p className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
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
        <p className="text-xs text-slate-400 dark:text-slate-500">Carregando memória...</p>
      ) : memories.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">Nenhuma memória registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {pendentes.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">Pendências abertas</p>
              {pendentes.map(item)}
            </div>
          )}
          {ativos.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">Fatos &amp; observações</p>
              {ativos.map(item)}
            </div>
          )}
          {resolvidas.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">Resolvidas</p>
              {resolvidas.map(item)}
            </div>
          )}
          {expiradas.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Expiradas (a IA não usa mais como informação atual)
              </p>
              {expiradas.map(item)}
            </div>
          )}
        </div>
      )}

      <button onClick={clearAuto} className="text-[11px] text-red-500 hover:underline dark:text-red-400">
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
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contatos da Igreja</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
            <button
              onClick={() => load()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Buscar
            </button>
          </div>
        </div>

        {!editing && (
          <button onClick={startNew} className={`mt-4 ${btnPrimary}`}>
            + Novo contato
          </button>
        )}

        {editing && (
          <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/30 dark:bg-blue-500/5">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {editing === 'new' ? 'Novo contato' : 'Editar contato'}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Nome
                <input required value={form.name} onChange={set('name')} placeholder="Ex.: Pastor Radchem" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                WhatsApp
                <input required value={form.phone} onChange={set('phone')} placeholder="(21) 99906-9940" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Cargo / Função
                <input value={form.role} onChange={set('role')} placeholder="Ex.: Pastor, Diácono, Líder de Louvor" className={`mt-1 ${inputCls}`} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Tipo de contato
                <select value={form.contact_type} onChange={set('contact_type')} className={`mt-1 ${inputCls}`}>
                  <option value="">Não definido</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Departamento / Ministério
                <input value={form.department_name} onChange={set('department_name')} placeholder="Ex.: Secretaria, Louvor, Diaconia" className={`mt-1 ${inputCls}`} />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Resumo do contexto (a IA lê isto antes de responder)
              <textarea
                value={form.resumo_contexto}
                onChange={set('resumo_contexto')}
                rows={2}
                placeholder="Ex.: Integra a Secretaria; trata escalas e agendamentos."
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Inclua o DDI se os contatos forem de outro país. No Brasil, DDD + número já bastam (ex.: 21 99906-9940).
            </p>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>
                Salvar
              </button>
              <button type="button" onClick={cancel} className={btnSecondary}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {err && <p className="mt-3 text-xs text-red-500 dark:text-red-400">{err}</p>}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Carregando...</p>
          ) : contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              Nenhum contato cadastrado ainda. Crie o primeiro para a IA passar a reconhecer esse número.
            </p>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {c.name}
                      {c.role && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {c.role}
                        </span>
                      )}
                      {c.contact_type && (
                        <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-normal text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                          {c.contact_type}
                        </span>
                      )}
                      {c.department_name && (
                        <span className="ml-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-normal text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
                          {c.department_name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.phone}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={toggleLock.bind(null, c)} className="text-xs text-slate-500 hover:underline dark:text-slate-400" title="Bloqueia/desbloqueia a gravação automática de memória">
                      {c.memory_locked ? 'Desbloquear memória' : 'Bloquear memória'}
                    </button>
                    <button onClick={() => startEdit(c)} className="text-xs text-blue-500 hover:underline dark:text-blue-400">Editar</button>
                    <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline dark:text-red-400">Remover</button>
                  </div>
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-blue-500 select-none hover:underline dark:text-blue-400">
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
