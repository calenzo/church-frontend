import { useEffect, useState } from 'react'
import { api } from '../api.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const emptyForm = { name: '', phone: '', role: '' }

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
    setForm({ name: contact.name, phone: contact.phone, role: contact.role })
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
              <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {c.name}
                    {c.role && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">{c.role}</span>}
                  </p>
                  <p className="text-xs text-slate-500">{c.phone}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => startEdit(c)} className="text-xs text-blue-500 hover:underline">Editar</button>
                  <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline">Remover</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
