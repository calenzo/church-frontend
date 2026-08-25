import { useEffect, useState } from 'react'
import { getTheme, setTheme } from '../theme.js'

export default function ThemeToggle({ className = '' }) {
  const [theme, setLocal] = useState(getTheme)

  useEffect(() => {
    const sync = () => setLocal(getTheme())
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    // Acompanha o sistema apenas enquanto nao houver escolha manual salva.
    if (!localStorage.getItem('church_theme')) {
      mq.addEventListener('change', sync)
      return () => mq.removeEventListener('change', sync)
    }
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setLocal(next)
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label="Alternar tema claro/escuro"
      className={`inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${className}`}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
