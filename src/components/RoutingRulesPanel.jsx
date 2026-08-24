import { useEffect, useState } from 'react'
import { api } from '../api.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const emptyForm = { topic: '', responsible: '', phone: '', department_name: '', active: true }

export default function RoutingRulesPanel({ churchId }) {
  const [rules, setRules] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setRules(await api.getRoutingRules(churchId))
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

  const set = (field) => (e) =>
    setForm({ ...form, [field]: field === 'active' ? e.target.checked : e.target.value })

  const startEdit = (rule) => {
    setEditing(rule.id)
    setForm({
      topic: rule.topic,
      responsible: rule.responsible,
      phone: rule.phone,
      department_name: rule.department_name || '',
      active: rule.active,
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
      if (editing === 'new') await api.createRoutingRule(churchId, form)
      else await api.updateRoutingRule(editing, form)
      cancel()
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remover esta regra de encaminhamento?')) return
    try {
      await api.deleteRoutingRule(id)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const toggleActive = async (rule) => {
    try {
      await api.updateRoutingRule(rule.id, { active: !rule.active })
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
            <h3 className="text-sm font-semibold text-slate-900">Encaminhamentos Automáticos</h3>
            <p className="mt-1 max-w-3xl text-xs text-slate-500">
              Cadastre apenas o necessário: <strong>Assunto</strong> → <strong>Responsável</strong> →{' '}
              <strong>Telefone</strong>. A IA entende a intenção da mensagem e decide sozinha quando
              encaminhar — por exemplo, quando não tiver a informação cadastrada ou quando o pedido
              exigir ação humana. Se ela souber responder (horário do culto, endereço etc.),
              responde normalmente sem encaminhar. Mensagens repetidas sobre o mesmo assunto geram
              um único encaminhamento.
            </p>
          </div>
          {!editing && (
            <button
              onClick={startNew}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Nova regra
            </button>
          )}
        </div>

        {editing && (
          <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <h4 className="text-sm font-semibold text-slate-800">
              {editing === 'new' ? 'Nova regra' : 'Editar regra'}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Assunto / Intenção
                <input required value={form.topic} onChange={set('topic')} placeholder='Ex.: Escala da limpeza' className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Responsável / Setor
                <input value={form.responsible} onChange={set('responsible')} placeholder="Ex.: Secretaria" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600">
                WhatsApp do responsável
                <input required value={form.phone} onChange={set('phone')} placeholder="(21) 99999-8888" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Departamento responsável (opcional)
                <input value={form.department_name} onChange={set('department_name')} placeholder="Ex.: Secretaria" className={`mt-1 ${inputCls}`} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input type="checkbox" checked={form.active} onChange={set('active')} className="size-4 rounded border-slate-300" />
              Regra ativa
            </label>
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
          ) : rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Nenhuma regra ainda. Cadastre assuntos que devem ser encaminhados a um responsável
              quando a IA não puder responder sozinha.
            </p>
          ) : (
            rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {r.topic}
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">
                      {r.responsible || 'Responsável'}
                    </span>
                    {!r.active && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-700">
                        inativa
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{r.phone}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => toggleActive(r)} className="text-xs text-slate-500 hover:underline">
                    {r.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => startEdit(r)} className="text-xs text-blue-500 hover:underline">Editar</button>
                  <button onClick={() => remove(r.id)} className="text-xs text-red-500 hover:underline">Remover</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
