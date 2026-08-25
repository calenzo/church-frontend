import { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'
import NumbersManager from './NumbersManager.jsx'
import { btnPrimary, btnSecondary, inputCls } from '../ui.js'

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  )
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className="h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-emerald-500 transition-colors dark:bg-slate-600 dark:peer-checked:bg-emerald-600" />
        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4 dark:bg-slate-200" />
      </div>
      <div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
      </div>
    </label>
  )
}

export default function ConfigPanel({ churchId }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    setForm(null)
    api.getConfig(churchId).then(setForm).catch(() => setForm(null))
  }, [churchId])

  if (!form)
    return <p className="text-sm text-slate-500 dark:text-slate-400">Carregando configuracoes...</p>

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const saved = await api.updateConfig(form, churchId)
      setForm(saved)
      setMsg({ type: 'ok', text: 'Configuracao salva.' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = useCallback(async (field) => {
    const newVal = !form[field]
    const updated = { ...form, [field]: newVal }
    setForm(updated)
    try {
      const saved = await api.updateConfig(updated, churchId)
      setForm(saved)
    } catch (err) {
      setForm((prev) => ({ ...prev, [field]: !newVal }))
      setMsg({ type: 'err', text: err.message })
    }
  }, [form, churchId])

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await api.testLlm(churchId)
      setTestResult({
        ok: true,
        data: res,
        text: `LLM respondeu. Classificou como "${res.classification.department}".`,
      })
    } catch (err) {
      setTestResult({ ok: false, text: err.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Contato principal da igreja</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Conecte o WhatsApp escaneando o QR code ou usando o codigo de pareamento por telefone.
        </p>
        <NumbersManager churchId={churchId} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">LLM</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Qualquer API compativel com OpenAI funciona aqui (online, ex.: OpenAI, Groq, Mistral).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL base" hint="Ex.: https://api.openai.com/v1">
            <input className={inputCls} value={form.base_url} onChange={set('base_url')} placeholder="https://api.openai.com/v1" />
          </Field>
          <Field label="Modelo" hint="Ex.: gpt-4o-mini, llama3.1, mistral">
            <input className={inputCls} value={form.model} onChange={set('model')} placeholder="gpt-4o-mini" />
          </Field>
          <Field label="API key (obrigatoria para LLM online)">
            <input className={inputCls} type="password" value={form.api_key} onChange={set('api_key')} placeholder="sk-..." />
          </Field>
          <Field label="Temperatura">
            <input className={inputCls} type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={set('temperature')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Prompt de sistema (opcional)">
              <textarea className={inputCls} rows="5" value={form.system_prompt} onChange={set('system_prompt')} placeholder="Deixe vazio para usar o prompt padrao." />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
          <button onClick={test} disabled={testing} className={btnSecondary}>
            {testing ? 'Testando...' : 'Testar conexao'}
          </button>
          {msg && (
            <span
              className={`text-sm ${
                msg.type === 'ok'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {msg.text}
            </span>
          )}
        </div>
        {testResult && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              testResult.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
            }`}
          >
            {testResult.text}
            {testResult.ok && (
              <pre className="mt-2 whitespace-pre-wrap text-xs opacity-80">{JSON.stringify(testResult.data, null, 2)}</pre>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Permissoes do Webhook</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Controle quais funcionalidades estao ativas. Desligue algo que nao usa para reduzir custo de LLM e evitar respostas indesejadas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-3">Tipos de mensagem</h4>
            <div className="space-y-3">
              <Toggle checked={form.process_text} onChange={() => togglePermission('process_text')} label="Texto" hint="Mensagens de texto" />
              <Toggle checked={form.process_audio} onChange={() => togglePermission('process_audio')} label="Audio" hint="Transcreve e responde audios" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-3">Canais</h4>
            <div className="space-y-3">
              <Toggle checked={form.process_groups} onChange={() => togglePermission('process_groups')} label="Grupos" hint="Responde em grupos vinculados" />
              <Toggle checked={form.process_private} onChange={() => togglePermission('process_private')} label="Privado" hint="Responde no chat privado" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-3">Funcionalidades da IA</h4>
            <div className="space-y-3">
              <Toggle checked={form.auto_reply} onChange={() => togglePermission('auto_reply')} label="Resposta automatica" hint="Envia resposta da LLM" />
              <Toggle checked={form.forward_to_groups} onChange={() => togglePermission('forward_to_groups')} label="Encaminhar para grupos" hint="Encaminha msg para grupo do depto" />
              <Toggle checked={form.apply_routing_rules} onChange={() => togglePermission('apply_routing_rules')} label="Regras de roteamento" hint="Encaminha para responsaveis" />
              <Toggle checked={form.auto_register_contacts} onChange={() => togglePermission('auto_register_contacts')} label="Cadastro automatico" hint="Salva contatos que se identificam" />
              <Toggle checked={form.auto_memory} onChange={() => togglePermission('auto_memory')} label="Memoria" hint="Salva fatos e pendencias" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
