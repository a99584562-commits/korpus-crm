import { useState, type ReactNode } from 'react'
import { ArrowRight, LockSimple } from '@phosphor-icons/react'

// Парольный доступ к демо. Чтобы сменить пароль — поменяйте значение ниже и запушьте.
const PASSWORD = 'korpus2026'
const KEY = 'korpus-access'

export function Gate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)

  if (ok) return <>{children}</>

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (val.trim().toLowerCase() === PASSWORD) {
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* ignore */
      }
      setOk(true)
    } else {
      setErr(true)
      setTimeout(() => setErr(false), 600)
    }
  }

  return (
    <div className="relative z-[2] flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <form onSubmit={submit} className={`w-full max-w-[380px] rounded-[2rem] bg-tray/70 p-1.5 ring-1 ring-line ${err ? 'shake' : ''}`}>
        <div className="bezel-hi rounded-[calc(2rem-0.375rem)] bg-surface px-7 py-9 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-[22px] font-semibold text-accent-ink lift"
            style={{ background: 'var(--c-accent)', fontFamily: 'var(--font-display)' }}
          >
            К
          </span>
          <h1 className="mt-5 text-[26px] leading-tight text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            КОРПУС
          </h1>
          <p className="mt-1 text-[13px] text-muted">CRM для мебельного производства</p>

          <div className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-tray/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            <LockSimple size={12} /> Закрытый доступ
          </div>

          <div className="relative mt-5">
            <input
              autoFocus
              type="password"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Пароль доступа"
              className="w-full rounded-2xl bg-tray/55 px-4 py-3 text-center text-[15px] text-ink outline-none ring-1 ring-transparent transition-all duration-200 focus:bg-surface focus:ring-2 focus:ring-accent/35"
            />
          </div>
          {err && <p className="mt-2 text-[12px] text-danger">Неверный пароль — попробуйте ещё раз</p>}

          <button
            type="submit"
            className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-[14px] font-medium text-accent-ink lift transition-all duration-300 ease-spring active:scale-[0.98]"
          >
            Войти в демо
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-spring group-hover:translate-x-0.5">
              <ArrowRight size={14} />
            </span>
          </button>

          <p className="mt-5 text-[11px] leading-relaxed text-muted">Демонстрационная версия. Доступ по приглашению.</p>
        </div>
      </form>
    </div>
  )
}
