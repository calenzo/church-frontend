import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'

const tabCls = (active) =>
  `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
    active
      ? 'bg-emerald-600 text-white shadow-sm'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  }`

export default function QrPanel() {
  const [mode, setMode] = useState('qr')
  const [qr, setQr] = useState(null)
  const [err, setErr] = useState(null)
  const hasQr = useRef(false)

  const loadQr = async () => {
    try {
      const res = await api.getQrCode()
      setQr(res.qrcode)
      hasQr.current = Boolean(res.qrcode)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    if (mode === 'qr') {
      loadQr()
      const id = setInterval(() => {
        if (!hasQr.current) loadQr()
      }, 5000)
      return () => clearInterval(id)
    }
  }, [mode])

  if (err && mode === 'qr') {
    return <p className="text-sm text-red-700">Nao foi possivel obter o QR code: {err}</p>
  }

  if (!qr && mode === 'qr') {
    return (
      <div>
        <ModeTabs mode={mode} setMode={setMode} />
        <p className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          WhatsApp conectado.
        </p>
      </div>
    )
  }

  if (mode === 'qr') {
    return (
      <div>
        <ModeTabs mode={mode} setMode={setMode} />
        <p className="mt-4 mb-3 text-sm text-slate-500">
          Escaneie o QR code abaixo com o WhatsApp (Ajustes &gt; Aparelhos conectados &gt; Conectar aparelho) para parear o numero da igreja.
        </p>
        <img src={qr} alt="QR code para conectar o WhatsApp" className="h-56 w-56 rounded-lg border border-slate-200" />
        <p className="mt-3 text-xs text-slate-400">Atualiza automaticamente a cada 5 segundos.</p>
      </div>
    )
  }

  return (
    <div>
      <ModeTabs mode={mode} setMode={setMode} />
      <PairingForm />
    </div>
  )
}

function ModeTabs({ mode, setMode }) {
  return (
    <div className="flex gap-2">
      <button className={tabCls(mode === 'qr')} onClick={() => setMode('qr')}>
        QR Code
      </button>
      <button className={tabCls(mode === 'code')} onClick={() => setMode('code')}>
        Codigo por telefone
      </button>
    </div>
  )
}

function PairingForm() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const generate = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setErr('Informe o numero com DDD (ex.: 11999998888).')
      return
    }
    setLoading(true)
    setErr(null)
    setCode(null)
    try {
      const res = await api.getPairingCode(digits)
      setCode(res.pairingCode)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-slate-500">
        Digite o numero de telefone da igreja para gerar um codigo de pareamento. No celular, vá em Ajustes &gt; Aparelhos conectados &gt; Conectar aparelho &gt; Conectar com numero do telefone.
      </p>
      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="5511999999999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Gerar codigo'}
        </button>
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {code && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-xs text-slate-500">Seu codigo de pareamento:</p>
          <p className="mt-1 text-2xl font-bold tracking-widest text-emerald-700">{code}</p>
          <p className="mt-2 text-xs text-slate-400">Digite este codigo no celular para conectar.</p>
        </div>
      )}
    </div>
  )
}
