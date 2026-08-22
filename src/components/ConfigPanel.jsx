import { useEffect, useState } from 'react'
import { api } from '../api.js'
import NumbersManager from './NumbersManager.jsx'

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

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

  if (!form) return <p className="text-sm text-slate-500">Carregando configuracoes...</p>

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
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Contato principal da igreja</h2>
        <p className="mb-4 text-sm text-slate-500">
          Conecte o WhatsApp escaneando o QR code ou usando o codigo de pareamento por telefone.
        </p>
        <NumbersManager churchId={churchId} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">LLM</h2>
        <p className="mb-4 text-sm text-slate-500">
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
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar configuracoes'}
          </button>
          <button
            onClick={test}
            disabled={testing}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? 'Testando...' : 'Testar conexao'}
          </button>
          {msg && (
            <span className={`text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>{msg.text}</span>
          )}
        </div>
        {testResult && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              testResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {testResult.text}
            {testResult.ok && (
              <pre className="mt-2 whitespace-pre-wrap text-xs opacity-80">{JSON.stringify(testResult.data, null, 2)}</pre>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
