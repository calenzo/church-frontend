import { useEffect, useState } from 'react'
import { api } from '../api.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-800'

const STATUS_BADGE = {
  enviado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  falhou: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const fmtDateTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const emptyMember = { name: '', birth_day: '', birth_month: '' }

function SectionCard({ title, subtitle, children, right }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export default function MembersPanel({ churchId }) {
  // ---- membros ----
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [memberForm, setMemberForm] = useState(emptyMember)
  const [editingMember, setEditingMember] = useState(null)
  const [loadingMembers, setLoadingMembers] = useState(true)

  // ---- próximos / hoje ----
  const [upcoming, setUpcoming] = useState([])
  const [todayList, setTodayList] = useState(null)

  // ---- destinatários ----
  const [recipients, setRecipients] = useState([])
  const [recipientForm, setRecipientForm] = useState({ name: '', phone: '' })
  const [editingRecipient, setEditingRecipient] = useState(null)

  // ---- config + histórico + ações ----
  const [sendTime, setSendTime] = useState('08:00')
  const [logs, setLogs] = useState([])
  const [err, setErr] = useState(null)
  const [notice, setNotice] = useState(null)
  const [testing, setTesting] = useState(false)

  const loadAll = async (term = search) => {
    try {
      const [m, up, rec, cfg, lg] = await Promise.all([
        api.getMembers(churchId, term),
        api.getUpcomingBirthdays(churchId),
        api.getBirthdayRecipients(churchId),
        api.getBirthdayConfig(churchId),
        api.getBirthdayLogs(churchId),
      ])
      setMembers(m)
      setUpcoming(up)
      setRecipients(rec)
      setSendTime(cfg.send_time || '08:00')
      setLogs(lg)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    setLoadingMembers(true)
    loadAll()
  }, [churchId])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 4000)
  }

  // ---------------- membros ----------------
  const searchMembers = () => loadAll(search)

  const submitMember = async (e) => {
    e.preventDefault()
    const day = Number(memberForm.birth_day)
    const month = Number(memberForm.birth_month)
    if (!memberForm.name.trim()) return setErr('Informe o nome completo')
    if (!(day >= 1 && day <= 31)) return setErr('Dia deve estar entre 1 e 31')
    if (!(month >= 1 && month <= 12)) return setErr('Mês deve estar entre 1 e 12')
    try {
      if (editingMember) await api.updateMember(editingMember, { name: memberForm.name.trim(), birth_day: day, birth_month: month }, churchId)
      else await api.createMember({ name: memberForm.name.trim(), birth_day: day, birth_month: month }, churchId)
      setMemberForm(emptyMember)
      setEditingMember(null)
      await loadAll()
      flash(editingMember ? 'Membro atualizado.' : 'Membro adicionado.')
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const startEditMember = (m) => {
    setEditingMember(m.id)
    setMemberForm({ name: m.name, birth_day: String(m.birth_day), birth_month: String(m.birth_month) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const removeMember = async (m) => {
    if (!window.confirm(`Excluir ${m.name}?`)) return
    try {
      await api.deleteMember(m.id, churchId)
      if (editingMember === m.id) {
        setEditingMember(null)
        setMemberForm(emptyMember)
      }
      await loadAll()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  // ---------------- destinatários ----------------
  const submitRecipient = async (e) => {
    e.preventDefault()
    try {
      if (editingRecipient) await api.updateBirthdayRecipient(editingRecipient, recipientForm, churchId)
      else await api.createBirthdayRecipient(recipientForm, churchId)
      setRecipientForm({ name: '', phone: '' })
      setEditingRecipient(null)
      await loadAll()
      flash('Destinatário salvo.')
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const removeRecipient = async (r) => {
    if (!window.confirm(`Remover o destinatário ${r.name || r.phone}?`)) return
    try {
      await api.deleteBirthdayRecipient(r.id, churchId)
      await loadAll()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  // ---------------- config / ações ----------------
  const saveTime = async () => {
    try {
      await api.updateBirthdayConfig({ send_time: sendTime }, churchId)
      flash(`Horário salvo: ${sendTime}`)
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const showToday = async () => {
    try {
      const list = await api.getTodayBirthdays(churchId)
      setTodayList(list)
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const runTest = async () => {
    if (!window.confirm('Enviar mensagem de teste para todos os destinatários cadastrados?')) return
    setTesting(true)
    try {
      const res = await api.testBirthdayReminder(churchId)
      flash(`Teste concluído: ${res.sent} enviado(s), ${res.failed} falha(s).`)
      await loadAll()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setTesting(false)
    }
  }

  const memberItem = (m) => (
    <tr key={m.id} className={m.is_today ? 'bg-pink-50 dark:bg-pink-950/30' : ''}>
      <td className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        {m.name}
        {m.is_today && (
          <span className="ml-2 whitespace-nowrap rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
            🎂 HOJE
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{m.birthday}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        <button onClick={() => startEditMember(m)} className="mr-3 text-xs text-blue-500 hover:underline dark:text-blue-400">Editar</button>
        <button onClick={() => removeMember(m)} className="text-xs text-red-500 hover:underline dark:text-red-400">Excluir</button>
      </td>
    </tr>
  )

  return (
    <div className="space-y-4">
      {/* Próximos aniversariantes */}
      <SectionCard
        title="Próximos aniversariantes"
        subtitle="Lista visual — a partir de hoje."
      >
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum membro cadastrado ainda.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {upcoming.map((u, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm dark:bg-slate-800">
                <span className={u.is_today ? 'font-semibold text-pink-700 dark:text-pink-300' : 'text-slate-700 dark:text-slate-300'}>
                  {u.is_today && '🎂 '}
                  {u.name}
                </span>
                <span className={`shrink-0 text-xs ${u.is_today ? 'font-bold text-pink-700 dark:text-pink-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {u.birthday}{!u.is_today && u.days_until > 0 ? ` · em ${u.days_until} dia${u.days_until > 1 ? 's' : ''}` : ''}
                  {u.is_today ? ' · HOJE' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Cadastro de membro */}
      <SectionCard
        title={editingMember ? 'Editar membro' : 'Cadastrar membro'}
        subtitle="Somente dia e mês do aniversário — o sistema cuida do resto todos os anos."
      >
        <form onSubmit={submitMember} className="space-y-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Nome completo
            <input
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              placeholder="Ex.: João da Silva"
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Dia do aniversário
              <input
                type="number"
                min="1"
                max="31"
                value={memberForm.birth_day}
                onChange={(e) => setMemberForm({ ...memberForm, birth_day: e.target.value })}
                placeholder="Ex.: 25"
                className={`mt-1 w-32 ${inputCls}`}
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Mês do aniversário
              <input
                type="number"
                min="1"
                max="12"
                value={memberForm.birth_month}
                onChange={(e) => setMemberForm({ ...memberForm, birth_month: e.target.value })}
                placeholder="Ex.: 8"
                className={`mt-1 w-32 ${inputCls}`}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {editingMember ? 'Salvar alterações' : 'ADICIONAR MEMBRO'}
            </button>
            {editingMember && (
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null)
                  setMemberForm(emptyMember)
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </SectionCard>

      {/* Lista de membros + busca */}
      <SectionCard
        title={`Membros (${members.length})`}
        subtitle="Ordem alfabética. Aniversariante do dia aparece destacado."
        right={
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMembers()}
              placeholder="Buscar membro..."
              className={`${inputCls} w-52`}
            />
            <button onClick={searchMembers} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700">
              Buscar
            </button>
          </div>
        }
      >
        {loadingMembers ? (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Carregando...</p>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            Nenhum membro encontrado{search ? ' para esta busca' : ' ainda'}.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Nome</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Aniversário</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white dark:divide-slate-700 dark:bg-slate-900">{members.map(memberItem)}</tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Destinatários dos lembretes */}
      <SectionCard
        title="Destinatários dos lembretes de aniversário"
        subtitle="Telefones que recebem o aviso automático diário. Adicione, edite ou remova quando quiser."
      >
        <form onSubmit={submitRecipient} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Nome
              <input
                value={recipientForm.name}
                onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                placeholder="Ex.: Pastor Radchem"
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Telefone WhatsApp
              <input
                value={recipientForm.phone}
                onChange={(e) => setRecipientForm({ ...recipientForm, phone: e.target.value })}
                placeholder="(21) 99906-9940"
                className={`mt-1 ${inputCls}`}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {editingRecipient ? 'Salvar destinatário' : 'ADICIONAR DESTINATÁRIO'}
            </button>
            {editingRecipient && (
              <button
                type="button"
                onClick={() => {
                  setEditingRecipient(null)
                  setRecipientForm({ name: '', phone: '' })
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
          {recipients.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Nenhum destinatário cadastrado.</p>
          ) : (
            recipients.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {r.name || '(sem nome)'}
                    {!r.active && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">inativo</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.phone}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await api.updateBirthdayRecipient(r.id, { active: !r.active }, churchId)
                        await loadAll()
                      } catch (e2) {
                        setErr(e2.message)
                      }
                    }}
                    className="text-xs text-slate-500 hover:underline dark:text-slate-400"
                  >
                    {r.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRecipient(r.id)
                      setRecipientForm({ name: r.name, phone: r.phone })
                    }}
                    className="text-xs text-blue-500 hover:underline dark:text-blue-400"
                  >
                    Editar
                  </button>
                  <button onClick={() => removeRecipient(r)} className="text-xs text-red-500 hover:underline dark:text-red-400">
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      {/* Horário + ferramentas administrativas */}
      <SectionCard
        title="Horário do lembrete automático"
        subtitle="O backend envia sozinho nesse horário (fuso America/Sao_Paulo), mesmo com o painel fechado."
      >
        <div className="flex flex-wrap items-center gap-3">
          <input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className={`${inputCls} w-32`} />
          <button onClick={saveTime} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Salvar horário
          </button>
          <span className="mx-1 hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
          <button onClick={showToday} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            ANIVERSARIANTES DE HOJE
          </button>
          <button
            onClick={runTest}
            disabled={testing}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60"
          >
            {testing ? 'Enviando...' : 'TESTAR LEMBRETE'}
          </button>
        </div>

        {todayList && (
          <div className="mt-3 rounded-lg border border-pink-200 bg-pink-50 p-3 dark:border-pink-800 dark:bg-pink-950/40">
            <p className="text-sm font-semibold text-pink-700 dark:text-pink-300">
              🎂 Hoje — {new Date().toLocaleDateString('pt-BR')}
            </p>
            {todayList.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nenhum aniversariante hoje.</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {todayList.map((t, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                    {t.name} <span className="text-xs text-slate-400 dark:text-slate-500">({t.birthday})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </SectionCard>

      {/* Histórico de lembretes */}
      <SectionCard
        title="Histórico de lembretes"
        subtitle="Um registro por destinatário. Pendente = tentaremos de novo no mesmo dia."
      >
        {logs.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Nenhum lembrete enviado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Data / Hora</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Aniversariante(s)</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Destinatário</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white dark:divide-slate-700 dark:bg-slate-900">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      {l.ref_date?.split('-')?.reverse()?.join('/')} {l.sent_at ? `· ${fmtDateTime(l.sent_at).split(' ')[1]}` : ''}
                      {l.kind === 'teste' && (
                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">teste</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">{l.members_text}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                      {l.recipient_name || '(sem nome)'}
                      <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({l.phone})</span>
                      {l.error && <p className="mt-0.5 max-w-xs truncate text-[10px] text-red-400" title={l.error}>{l.error}</p>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_BADGE[l.status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {err && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">{err}</p>}
      {notice && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">{notice}</p>}
    </div>
  )
}
