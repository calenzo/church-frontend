import { useState } from 'react'

const features = [
  {
    icon: '💬',
    title: 'Resposta instantanea',
    desc: 'O membro manda mensagem e recebe resposta em segundos, mesmo fora do horario. Sem fila, sem esquecimento.',
  },
  {
    icon: '🤖',
    title: 'IA que entende o contexto',
    desc: 'Classifica automaticamente por departamento: louvor, pastoral, eventos, jovens, criancas. Sem keyword rigida.',
  },
  {
    icon: '🔗',
    title: 'Encaminhamento inteligente',
    desc: 'Mensagens chegam direto no grupo certo da igreja. Cada departamento so ve o que e relevante pra ele.',
  },
  {
    icon: '🔒',
    title: 'Dados da sua igreja',
    desc: 'Rodada nos seus servidores. Nao terceiriza dados de membros para empresas externas.',
  },
  {
    icon: '📱',
    title: 'Funciona no WhatsApp',
    desc: 'Onde o fiel ja esta. Sem app pra baixar, sem link externo. Manda mensagem no WhatsApp e pronto.',
  },
  {
    icon: '⚙️',
    title: 'Setup em 5 minutos',
    desc: 'Pareia o QR code, cria os departamentos com descricao e funciona. Sem conhecimento tecnico necessario.',
  },
]

const steps = [
  { n: '1', title: 'Pareie o WhatsApp', desc: 'Escaneie o QR code com o numero da igreja. Pronto, ja esta conectado.' },
  { n: '2', title: 'Cadastre os departamentos', desc: 'Louvor, pastoral, eventos... cada um com sua descricao. A IA usa isso pra classificar.' },
  { n: '3', title: 'Funcionando', desc: 'Mensagens sao classificadas e encaminhadas automaticamente. Respostas geradas pela IA.' },
]

const testimonials = [
  {
    name: 'Pr. Marcos Silva',
    role: 'Pastor Presidente',
    church: 'Igreja Batista Central',
    text: 'Antes perdiamos mensagens de pedidos de oracao. Agora nenhuma fica sem resposta. O pessoal da pastoral adorou.',
  },
  {
    name: 'Ana Paula',
    role: 'Secretaria',
    church: 'Comunidade Viva',
    text: 'Economizo umas 2 horas por dia. Antes eu respondia tudo manualmente. Agora so atendo os casos que precisam de atendimento humano.',
  },
]

const plans = [
  {
    name: 'Igreja',
    price: 'R$ 97',
    period: '/mes',
    desc: 'Ideal para igrejas com ate 200 membros',
    features: [
      'WhatsApp ilimitado',
      'Ate 5 departamentos',
      'Classificacao com IA',
      'Suporte por WhatsApp',
      'Respostas 24/7',
    ],
    cta: 'Comecar agora',
    highlight: false,
  },
  {
    name: 'Igreja+',
    price: 'R$ 197',
    period: '/mes',
    desc: 'Para igrejas maiores e multi-campus',
    features: [
      'Tudo do plano Igreja',
      'Departamentos ilimitados',
      'Transcricao de audios',
      'Multi-numeros',
      'Dashboard com metricas',
      'Suporte prioritario',
    ],
    cta: 'Falar com vendas',
    highlight: true,
  },
]

function Bubble({ from, text }) {
  const isBot = from === 'bot'
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isBot
            ? 'border border-slate-100 bg-white text-slate-700 shadow-sm'
            : 'bg-emerald-600 text-white'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [sent, setSent] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛪</span>
            <span className="text-lg font-bold text-slate-900">IgrejaBot</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <a href="#funcionalidades" className="hover:text-blue-600">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-blue-600">Como funciona</a>
            <a href="#precos" className="hover:text-blue-600">Preco</a>
          </nav>
          <a
            href="#contato"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Testar gratis
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-blue-50 to-white pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              Inteligencia Artificial para igrejas
            </span>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Sua igreja nunca mais perde uma mensagem no WhatsApp
            </h1>
            <p className="mb-8 text-lg text-slate-600">
              O assistente inteligente que responde, classifica e encaminha automaticamente todas as
              mensagens da sua congregacao. 24 horas por dia, 7 dias por semana.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#contato"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 sm:w-auto"
              >
                Testar 14 dias gratis
              </a>
              <a
                href="#como-funciona"
                className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Ver como funciona
              </a>
            </div>
          </div>

          {/* Mockup */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-slate-400">WhatsApp - Igreja Bot</span>
              </div>
              <div className="space-y-3 p-4">
                <Bubble from="user" text="Ola, quero saber os horarios dos cultos de domingo" />
                <Bubble
                  from="bot"
                  text="Ola! Os cultos de domingo sao: Manha 9h e Noite 19h. Nos reunimos na Rua da Paz, 123. Quer que eu te envie a localizacao?"
                />
                <Bubble from="user" text="Sim por favor! E tem escola dominical pras criancas?" />
                <Bubble
                  from="bot"
                  text="Sim! Escola Dominical as 9h junto com o culto da manha, para criancas de 3 a 12 anos. Ja encaminhei sua mensagem para o departamento de criancas."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">Tudo que sua igreja precisa</h2>
            <p className="text-lg text-slate-500">Automatizacao inteligente sem perder o toque humano</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-100 bg-slate-50 p-6 transition hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">Funciona em 3 passos</h2>
            <p className="text-lg text-slate-500">Setup simples, sem precisar de equipe tecnica</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">Quem ja usa, recomenda</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-6">
                <p className="mb-4 text-sm leading-relaxed text-slate-600">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">
                    {t.role} - {t.church}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">Simples e acessivel</h2>
            <p className="text-lg text-slate-500">Muito menos que contratar um atendente</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border-2 p-6 ${
                  p.highlight ? 'border-blue-600 bg-white shadow-xl' : 'border-slate-200 bg-white'
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                    Mais popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.desc}</p>
                <div className="my-4">
                  <span className="text-4xl font-bold text-slate-900">{p.price}</span>
                  <span className="text-sm text-slate-500">{p.period}</span>
                </div>
                <ul className="mb-6 space-y-2">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contato"
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                    p.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contato" className="bg-gradient-to-b from-blue-600 to-blue-700 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">Comece seu teste gratuito</h2>
          <p className="mb-8 text-blue-100">
            14 dias gratis, sem cartao de credito. Configuracao em 5 minutos.
          </p>
          {sent ? (
            <div className="rounded-xl bg-white/10 p-6 text-white">
              <div className="mb-2 text-2xl">✅</div>
              <p className="font-medium">Mensagem enviada! Entraremos em contato em breve.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
              className="mx-auto max-w-md space-y-3"
            >
              <input
                required
                type="text"
                placeholder="Nome da igreja"
                className="w-full rounded-lg border-0 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                required
                type="email"
                placeholder="Seu e-mail"
                className="w-full rounded-lg border-0 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                required
                type="tel"
                placeholder="WhatsApp (com DDD)"
                className="w-full rounded-lg border-0 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-white px-6 py-3 text-base font-bold text-blue-700 shadow-lg hover:bg-blue-50"
              >
                Quero testar gratis
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-400">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-lg">⛪</span>
            <span className="font-semibold text-slate-600">IgrejaBot</span>
          </div>
          <p>Assistente inteligente para igrejas. Feito no Brasil.</p>
        </div>
      </footer>
    </div>
  )
}
