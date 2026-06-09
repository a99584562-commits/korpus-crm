import { CheckCircle, PaperPlaneTilt, Info } from '@phosphor-icons/react'
import { useApp } from '../lib/store'

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[340px] flex-col gap-2.5">
      {toasts.map((t) => {
        const Icon = t.kind === 'sent' ? PaperPlaneTilt : t.kind === 'success' ? CheckCircle : Info
        const color = t.kind === 'sent' ? 'text-accent' : t.kind === 'success' ? 'text-positive' : 'text-sage'
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto flex cursor-pointer items-start gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line lift-lg"
            style={{ animation: 'sheet-in 0.5s cubic-bezier(0.32,0.72,0,1) both' }}
          >
            <span className={`mt-0.5 ${color}`}>
              <Icon weight="fill" size={20} />
            </span>
            <div className="leading-snug">
              <p className="text-[13px] font-semibold text-ink">{t.title}</p>
              {t.detail && <p className="mt-0.5 text-[12px] text-muted">{t.detail}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
