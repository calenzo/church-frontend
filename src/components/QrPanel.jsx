import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function QrPanel() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("loading");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);

      // Primeiro verifica o estado REAL do WhatsApp
      const statusRes = await api.getStatus();
      const whatsappStatus =
        statusRes?.whatsapp ||
        statusRes?.whatsapp_status ||
        statusRes?.status ||
        "unknown";

      setStatus(whatsappStatus);

      // Se estiver realmente conectado, não precisamos de QR
      if (
        whatsappStatus === "open" ||
        whatsappStatus === "connected" ||
        whatsappStatus === "ok"
      ) {
        setQr(null);
        return;
      }

      // Se não estiver conectado, tenta obter novo QR
      const qrRes = await api.getQrCode();

      if (qrRes?.qrcode) {
        setQr(qrRes.qrcode);
      } else {
        setQr(null);
      }
    } catch (e) {
      setErr(e.message || "Erro ao verificar conexão do WhatsApp");
      setQr(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // Continua verificando mesmo depois de gerar o QR,
    // pois precisamos saber quando o celular terminou de conectar.
    const id = setInterval(load, 5000);

    return () => clearInterval(id);
  }, []);

  if (err) {
    return (
      <div>
        <p className="mb-3 text-sm text-red-700">
          Não foi possível verificar o WhatsApp: {err}
        </p>

        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (status === "open" || status === "connected" || status === "ok") {
    return (
      <div>
        <p className="flex items-center gap-2 text-sm text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          WhatsApp conectado.
        </p>

        <p className="mt-2 text-xs text-slate-400">
          A conexão com o WhatsApp está ativa.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <p className="text-sm text-amber-600">
          WhatsApp não conectado. Escaneie o QR Code para conectar.
        </p>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Atualizando..." : "Gerar novo QR Code"}
        </button>
      </div>

      {qr ? (
        <>
          <p className="mb-3 text-sm text-slate-500">
            No WhatsApp, abra Ajustes &gt; Aparelhos conectados &gt; Conectar
            aparelho e escaneie o código abaixo.
          </p>

          <img
            src={qr}
            alt="QR code para conectar o WhatsApp"
            className="h-56 w-56 rounded-lg border border-slate-200"
          />

          <p className="mt-3 text-xs text-slate-400">
            O estado da conexão é verificado automaticamente a cada 5 segundos.
          </p>
        </>
      ) : (
        <div>
          <p className="text-sm text-slate-500">
            {loading
              ? "Obtendo QR Code..."
              : `Estado atual: ${status}. Aguardando QR Code...`}
          </p>
        </div>
      )}
    </div>
  );
}
