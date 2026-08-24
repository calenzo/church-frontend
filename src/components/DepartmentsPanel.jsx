import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const emptyForm = { name: '', description: '', group_name: '', group_jid: '', active: true }

export default function DepartmentsPanel({ churchId }) {
  const [departments, setDepartments] = useState([])
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupsErr, setGroupsErr] = useState(null)
  const [groupsLoadedAt, setGroupsLoadedAt] = useState(0)
  const [groupSearch, setGroupSearch] = useState('')
  const [groupOpen, setGroupOpen] = useState(false)
  const groupRef = useRef(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [testMsg, setTestMsg] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      setDepartments(await api.getDepartments(churchId))
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

  const loadGroups = async (retries = 3, forceRefresh = false) => {
    setGroupsLoading(true)
    setGroupsErr(null)
    for (let i = 0; i < retries; i++) {
      try {
        setGroups(await api.getGroups(forceRefresh, churchId))
        setGroupsLoadedAt(Date.now())
        setGroupsErr(null)
        break
      } catch (e) {
        if (i < retries - 1) await new Promise((r) => setTimeout(r, 3000 * (i + 1)))
        else setGroupsErr(e.message)
      }
    }
    setGroupsLoading(false)
  }

  // Recarrega a lista em segundo plano quando estiver velha (>60s) ou vazia.
  const refreshGroupsIfStale = () => {
    if (groupsLoading) return
    if (!groupsLoadedAt || Date.now() - groupsLoadedAt > 60000 || groups.length === 0) {
      loadGroups()
    }
  }

  useEffect(() => {
    loadGroups()
  }, [churchId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (groupRef.current && !groupRef.current.contains(e.target)) setGroupOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const filteredGroups = groups.filter((g) =>
    (g.subject || '').toLowerCase().includes(groupSearch.toLowerCase()),
  )

  const selectGroup = (g) => {
    setForm({ ...form, group_jid: g.id, group_name: g.subject })
    setGroupSearch('')
    setGroupOpen(false)
  }

  const clearGroup = () => {
    setForm({ ...form, group_jid: '', group_name: '' })
    setGroupSearch('')
  }

  const selectedGroup = groups.find((g) => g.id === form.group_jid)

  const startEdit = (dep) => {
    setEditing(dep.id)
    setForm({ ...dep })
    refreshGroupsIfStale()
  }

  const startNew = () => {
    setEditing('new')
    setForm(emptyForm)
    refreshGroupsIfStale()
  }

  const cancel = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing === 'new') await api.createDepartment(form, churchId)
      else await api.updateDepartment(editing, form, churchId)
      cancel()
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const remove = async (dep) => {
    if (!window.confirm(`Excluir o departamento "${dep.name}"?`)) return
    try {
      await api.deleteDepartment(dep.id, churchId)
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
      }, churchId)
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
              <div className="relative" ref={groupRef}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Grupo do WhatsApp</label>
                  <button
                    type="button"
                    onClick={() => loadGroups(2, true)}
                    disabled={groupsLoading}
                    className="text-xs text-blue-500 hover:underline disabled:opacity-40"
                  >
                    {groupsLoading ? 'Atualizando...' : 'Atualizar lista'}
                  </button>
                </div>

                {selectedGroup ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                      {selectedGroup.subject}
                      <span className="ml-2 text-xs text-slate-400">{selectedGroup.id}</span>
                    </div>
                    <button type="button" onClick={clearGroup} className="text-xs text-red-500 hover:underline">
                      Limpar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      className={inputCls}
                      placeholder={
                        groupsLoading
                          ? 'Carregando grupos...'
                          : 'Pesquisar grupo...'
                      }
                      value={groupSearch}
                      onChange={(e) => {
                        setGroupSearch(e.target.value)
                        setGroupOpen(true)
                      }}
                      onFocus={() => setGroupOpen(true)}
                      disabled={groupsLoading}
                    />
                    {groupOpen && (
                      <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {groupsLoading && (
                          <li className="px-3 py-2 text-sm text-slate-400">Carregando...</li>
                        )}
                        {!groupsLoading && filteredGroups.length === 0 && (
                          <li className="px-3 py-2 text-sm text-slate-400">
                            {groupSearch ? 'Nenhum grupo encontrado' : 'Nenhum grupo disponivel'}
                          </li>
                        )}
                        {filteredGroups.map((g) => (
                          <li
                            key={g.id}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50"
                            onClick={() => selectGroup(g)}
                          >
                            <div className="font-medium text-slate-900">{g.subject}</div>
                            <div className="text-xs text-slate-400">{g.id}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {groupsErr && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-red-600">
                    <span>Falha ao carregar grupos: {groupsErr}</span>
                    <button type="button" onClick={() => loadGroups()} className="font-medium underline hover:no-underline">
                      Tentar novamente
                    </button>
                  </div>
                )}
                {!groupsErr && !groupsLoading && groups.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    Nenhum grupo encontrado. Confira se o numero esta conectado (aba Numeros) e,
                    se o grupo foi criado agora, aguarde alguns segundos e clique em "Atualizar lista".
                  </p>
                )}
                {!groupsErr && !groupsLoading && groups.length > 0 && groupsLoadedAt > 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    Lista carregada as {new Date(groupsLoadedAt).toLocaleTimeString()} com os grupos
                    da conexao ativa.
                  </p>
                )}
                {form.group_name && selectedGroup && (
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
                      {dep.description && (
                        <div
                          className="line-clamp-2 max-w-sm break-words text-xs text-slate-500"
                          title={dep.description}
                        >
                          {dep.description}
                        </div>
                      )}
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
