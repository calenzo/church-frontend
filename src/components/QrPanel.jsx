import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'

export default function QrPanel() {
  const [qr, setQr] = useState(null)
  const [err, setErr] = useState(null)
  const hasQr = useRef(false)

  const load = async () => {
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
    load()
    const id = setInterval(() => {
      if (!hasQr.current) load()
    }, 5000)
    return () => clearInterval(id)
  }, [])

  if (err) {
    return <p className="text-sm text-red-700">Nao foi possivel obter o QR code: {err}</p>
  }

  if (!qr) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        WhatsApp conectado.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        Escaneie o QR code abaixo com o WhatsApp (Ajustes &gt; Aparelhos conectados &gt; Conectar aparelho) para parear o numero da igreja.
      </p>
      <img src={qr} alt="QR code para conectar o WhatsApp" className="h-56 w-56 rounded-lg border border-slate-200" />
      <p className="mt-3 text-xs text-slate-400">Atualiza automaticamente a cada 5 segundos.</p>
    </div>
  )
}
