import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { btnPrimary, btnSecondary, inputCls } from '../ui.js'

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
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Encaminhamentos Automáticos</h3>
            <p className="mt-1 max-w-3xl text-xs text-slate-500 dark:text-slate-400">
              Cadastre apenas o necessário: <strong>Assunto</strong> → <strong>Responsável</strong> →{' '}
              <strong>Telefone</strong>. A IA entende a intenção da mensagem e decide sozinha quando
              encaminhar — por exemplo, quando não tiver a informação cadastrada ou quando o pedido
              exigir ação humana. Se ela souber responder (horário do culto, endereço etc.),
              responde normalmente sem encaminhar. Mensagens repetidas sobre o mesmo assunto geram
              um único encaminhamento.
            </p>
          </div>
          {!editing && (
            <button onClick={startNew} className={btnPrimary}>
              + Nova regra
            </button>
          )}
        </div>

        {editing && (
          <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/30 dark:bg-blue-500/5">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {editing === 'new' ? 'Nova regra' : 'Editar regra'}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Assunto / Intenção
                <input required value={form.topic} onChange={set('topic')} placeholder='Ex.: Escala da limpeza' className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Responsável / Setor
                <input value={form.responsible} onChange={set('responsible')} placeholder="Ex.: Secretaria" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                WhatsApp do responsável
                <input required value={form.phone} onChange={set('phone')} placeholder="(21) 99999-8888" className={`mt-1 ${inputCls}`} />
              </label>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Departamento responsável (opcional)
                <input value={form.department_name} onChange={set('department_name')} placeholder="Ex.: Secretaria" className={`mt-1 ${inputCls}`} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={form.active} onChange={set('active')} className="size-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800" />
              Regra ativa
            </label>
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
          ) : rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              Nenhuma regra ainda. Cadastre assuntos que devem ser encaminhados a um responsável
              quando a IA não puder responder sozinha.
            </p>
          ) : (
            rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {r.topic}
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {r.responsible || 'Responsável'}
                    </span>
                    {!r.active && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        inativa
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.phone}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => toggleActive(r)} className="text-xs text-slate-500 hover:underline dark:text-slate-400">
                    {r.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => startEdit(r)} className="text-xs text-blue-500 hover:underline dark:text-blue-400">Editar</button>
                  <button onClick={() => remove(r.id)} className="text-xs text-red-500 hover:underline dark:text-red-400">Remover</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
