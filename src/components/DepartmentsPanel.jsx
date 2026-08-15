import { useEffect, useState } from 'react'
import { api } from '../api.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const emptyForm = { name: '', description: '', group_name: '', group_jid: '', active: true }

export default function DepartmentsPanel() {
  const [departments, setDepartments] = useState([])
  const [groups, setGroups] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [testMsg, setTestMsg] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      setDepartments(await api.getDepartments())
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    api.getGroups().then(setGroups).catch(() => setGroups([]))
  }, [])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const setJid = (e) => {
    const id = e.target.value
    const g = groups.find((x) => x.id === id)
    setForm({ ...form, group_jid: id, group_name: g ? g.subject : form.group_name })
  }

  const startEdit = (dep) => {
    setEditing(dep.id)
    setForm({ ...dep })
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
      if (editing === 'new') await api.createDepartment(form)
      else await api.updateDepartment(editing, form)
      cancel()
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const remove = async (dep) => {
    if (!window.confirm(`Excluir o departamento "${dep.name}"?`)) return
    try {
      await api.deleteDepartment(dep.id)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const testSend = async (dep) => {
    setTestMsg((m) => ({ ...m, [dep.id]: { busy: true, text: '' } }))
    try {
      await api.testDepartment(dep.id, {
        number: dep.group_jid,
        text: 'Teste de encaminhamento para o grupo do departamento.',
      })
      setTestMsg((m) => ({ ...m, [dep.id]: { busy: false, text: 'Mensagem de teste enviada.' } }))
    } catch (e2) {
      setTestMsg((m) => ({ ...m, [dep.id]: { busy: false, text: e2.message } }))
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Departamentos e grupos</h2>
            <p className="text-sm text-slate-500">
              Mensagens sao classificadas pela LLM e encaminhadas ao grupo do departamento.
            </p>
          </div>
          <button
            onClick={startNew}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo departamento
          </button>
        </div>

        {err && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}

        {editing && (
          <form onSubmit={submit} className="mb-6 space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {editing === 'new' ? 'Novo departamento' : 'Editar departamento'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
                <input className={inputCls} required value={form.name} onChange={set('name')} placeholder="Ex.: Louvor" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome do grupo no WhatsApp</label>
                <input className={inputCls} value={form.group_name} onChange={set('group_name')} placeholder="Ex.: Grupo Louvor 2026" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Descricao (ajuda a LLM a classificar)</label>
                <input className={inputCls} value={form.description} onChange={set('description')} placeholder="Ex.: Equipe de musica, instrumentos e ministerio" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Grupo do WhatsApp</label>
                <select className={inputCls} value={form.group_jid} onChange={setJid}>
                  <option value="">— Selecione um grupo —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.subject}
                    </option>
                  ))}
                </select>
                {form.group_name && (
                  <span className="mt-1 block text-xs text-slate-400">
                    Grupo vinculado: <span className="font-medium text-slate-600">{form.group_name}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Salvar
              </button>
              <button type="button" onClick={cancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : departments.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum departamento cadastrado. Clique em "+ Novo departamento" para comecar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Departamento</th>
                  <th className="py-2 pr-4">Grupo / JID</th>
                  <th className="py-2 pr-4">Ativo</th>
                  <th className="py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dep) => (
                  <tr key={dep.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{dep.name}</div>
                      {dep.description && <div className="text-xs text-slate-500">{dep.description}</div>}
                    </td>
                    <td className="py-3 pr-4">
                      {dep.group_name && <div className="text-slate-700">{dep.group_name}</div>}
                      {dep.group_jid ? (
                        <code className="text-xs text-slate-500">{dep.group_jid}</code>
                      ) : (
                        <span className="text-xs text-amber-600">Sem grupo configurado</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {dep.active ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Ativo</span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inativo</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => testSend(dep)}
                          disabled={!dep.group_jid || testMsg[dep.id]?.busy}
                          className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-40 disabled:hover:no-underline"
                          title={dep.group_jid ? 'Enviar mensagem de teste ao grupo' : 'Configure o JID do grupo primeiro'}
                        >
                          {testMsg[dep.id]?.busy ? 'Enviando...' : 'Testar'}
                        </button>
                        <button onClick={() => startEdit(dep)} className="text-xs font-medium text-slate-500 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => remove(dep)} className="text-xs font-medium text-red-600 hover:underline">
                          Excluir
                        </button>
                      </div>
                      {testMsg[dep.id]?.text && (
                        <div className="mt-1 text-xs text-slate-500">{testMsg[dep.id].text}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Grupo do WhatsApp</h3>
        <p className="text-sm">
          Selecione o grupo na lista acima. A lista e carregada direto da instancia conectada na Evolution API
          (cada departamento recebe as mensagens classificadas pela LLM). O campo "Nome do grupo" e preenchido automaticamente.
        </p>
      </section>
    </div>
  )
}
