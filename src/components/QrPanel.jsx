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
  const [connected, setConnected] = useState(false)
  const [qr, setQr] = useState(null)
  const [err, setErr] = useState(null)
  const hasQr = useRef(false)

  const loadQr = async () => {
    try {
      const res = await api.getQrCode()
      if (res.qrcode) {
        setQr(res.qrcode)
        hasQr.current = true
        setConnected(false)
      } else {
        setQr(null)
        hasQr.current = false
        setConnected(true)
      }
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

  if (connected) {
    return (
      <div>
        <ModeTabs mode={mode} setMode={setMode} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            WhatsApp conectado.
          </p>
          <DisconnectButton
            onDisconnected={() => {
              setConnected(false)
              setQr(null)
              loadQr()
            }}
          />
        </div>
      </div>
    )
  }

  if (mode === 'qr') {
    return (
      <div>
        <ModeTabs mode={mode} setMode={setMode} />
        {err && <p className="mt-3 text-sm text-red-700">Nao foi possivel obter o QR code: {err}</p>}
        {!qr && !err && (
          <p className="mt-4 text-sm text-slate-400">Carregando QR code...</p>
        )}
        {qr && (
          <>
            <p className="mt-4 mb-3 text-sm text-slate-500">
              Escaneie o QR code abaixo com o WhatsApp (Ajustes &gt; Aparelhos conectados &gt; Conectar aparelho) para parear o numero da igreja.
            </p>
            <img src={qr} alt="QR code para conectar o WhatsApp" className="h-56 w-56 rounded-lg border border-slate-200" />
            <p className="mt-3 text-xs text-slate-400">Atualiza automaticamente a cada 5 segundos.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <ModeTabs mode={mode} setMode={setMode} />
      <PairingForm onQrFallback={(qr) => { setQr(qr); setMode('qr') }} />
    </div>
  )
}

function DisconnectButton({ onDisconnected }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const disconnect = async () => {
    setLoading(true)
    setErr(null)
    try {
      await api.disconnectWhatsApp()
      setConfirming(false)
      onDisconnected()
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {confirming ? (
        <>
          <span className="text-sm text-slate-500">Desconectar o WhatsApp da plataforma?</span>
          <button
            onClick={disconnect}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Desconectando...' : 'Confirmar'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            Cancelar
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Desconectar
        </button>
      )}
      {err && <p className="w-full text-sm text-red-700">{err}</p>}
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

function PairingForm({ onQrFallback }) {
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
      if (res.pairingCode) {
        setCode(res.pairingCode)
      } else if (res.qrcode && onQrFallback) {
        onQrFallback(res.qrcode)
      } else {
        setErr('Nao foi possivel gerar o codigo de pareamento. Tente novamente ou use o QR Code para conectar.')
      }
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
