import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { DealStatus } from '../lib/types'

// ─────────────────────────  Eyebrow / micro-label  ─────────────────────────
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted ${className}`}
    >
      {children}
    </span>
  )
}

// ─────────────────────────  Card (premium panel, no harsh shadow)  ─────────────────────────
export function Card({
  children,
  className = '',
  as: Tag = 'div',
  onClick,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'button'
  onClick?: () => void
}) {
  return (
    <Tag
      onClick={onClick}
      className={`rounded-[1.5rem] bg-surface ring-1 ring-line ${className}`}
    >
      {children}
    </Tag>
  )
}

// ─────────────────────────  Bezel (machined "hardware" nested card)  ─────────────────────────
export function Bezel({
  children,
  className = '',
  inner = '',
}: {
  children: ReactNode
  className?: string
  inner?: string
}) {
  return (
    <div className={`rounded-[2rem] bg-tray/70 p-1.5 ring-1 ring-line ${className}`}>
      <div className={`bezel-hi rounded-[calc(2rem-0.375rem)] bg-surface ${inner}`}>{children}</div>
    </div>
  )
}

// ─────────────────────────  Button (island + button-in-button icon)  ─────────────────────────
export function Btn({
  children,
  onClick,
  variant = 'primary',
  trailing,
  leading,
  size = 'md',
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'soft' | 'ghost' | 'outline' | 'danger'
  trailing?: ReactNode
  leading?: ReactNode
  size?: 'sm' | 'md'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const base =
    'group inline-flex items-center justify-center gap-2 rounded-full font-medium ease-spring transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none'
  const sizes = size === 'sm' ? 'px-4 py-2 text-[13px]' : 'px-5 py-2.5 text-sm'
  const variants: Record<string, string> = {
    primary: 'bg-accent text-accent-ink hover:brightness-[1.06] lift',
    soft: 'bg-accent-soft text-accent hover:brightness-[0.99]',
    ghost: 'text-ink-soft hover:bg-tray',
    outline: 'text-ink ring-1 ring-line-strong hover:bg-tray',
    danger: 'text-danger ring-1 ring-danger/30 hover:bg-danger-soft',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants[variant]} ${className}`}>
      {leading}
      {children}
      {trailing && (
        <span
          className={`flex items-center justify-center rounded-full transition-all duration-300 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-px ${
            size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
          } ${variant === 'primary' ? 'bg-white/15' : 'bg-ink/5'}`}
        >
          {trailing}
        </span>
      )}
    </button>
  )
}

export function IconBtn({
  children,
  onClick,
  active = false,
  title,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  active?: boolean
  title?: string
  className?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-all duration-300 ease-spring hover:bg-tray active:scale-90 ${
        active ? 'bg-tray text-ink' : ''
      } ${className}`}
    >
      {children}
    </button>
  )
}

// ─────────────────────────  Badge / status pill  ─────────────────────────
export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'positive' | 'warning' | 'danger' | 'sage'; className?: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-tray text-ink-soft',
    accent: 'bg-accent-soft text-accent',
    positive: 'bg-positive-soft text-positive',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    sage: 'text-sage',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export const STATUS_META: Record<DealStatus, { label: string; tone: 'neutral' | 'accent' | 'positive' | 'warning' | 'sage' }> = {
  calc: { label: 'Расчёт', tone: 'neutral' },
  contract: { label: 'Договор', tone: 'accent' },
  production: { label: 'Производство', tone: 'warning' },
  installation: { label: 'Монтаж', tone: 'sage' },
  closed: { label: 'Закрыт', tone: 'positive' },
}

export function StatusPill({ status }: { status: DealStatus }) {
  const m = STATUS_META[status]
  return (
    <Badge tone={m.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </Badge>
  )
}

// ─────────────────────────  Form controls  ─────────────────────────
export function Field({ label, children, hint, className = '' }: { label?: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-[12px] font-medium text-muted">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl bg-tray/55 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 outline-none ring-1 ring-transparent transition-all duration-200 focus:bg-surface focus:ring-2 focus:ring-accent/35'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} resize-none leading-relaxed ${props.className ?? ''}`} />
}

export function NumField({
  value,
  onChange,
  suffix,
  className = '',
  align = 'left',
}: {
  value: number
  onChange: (n: number) => void
  suffix?: string
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        inputMode="decimal"
        value={value === 0 ? '' : String(value)}
        placeholder="0"
        onChange={(e) => {
          const n = parseFloat(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))
          onChange(isNaN(n) ? 0 : n)
        }}
        className={`${inputCls} nums ${align === 'right' ? 'text-right' : ''} ${suffix ? 'pr-9' : ''}`}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{suffix}</span>}
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full ring-1 transition-colors duration-300 ease-spring ${
        checked ? 'bg-accent ring-transparent' : 'bg-tray ring-line'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300 ease-spring ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-full bg-tray/70 p-1 ring-1 ring-line">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300 ease-spring ${
            value === o.value ? 'bg-surface text-ink lift' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────  Misc  ─────────────────────────
export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-line ${className}`} />
}
