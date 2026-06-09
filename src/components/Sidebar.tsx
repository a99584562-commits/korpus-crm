import type { ReactNode } from 'react'
import { SquaresFour, Stack, GearSix, Plus, ArrowUpRight, SealCheck } from '@phosphor-icons/react'
import { useApp } from '../lib/store'
import type { Route } from '../lib/types'

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ease-spring ${
        active ? 'bg-surface text-ink lift ring-1 ring-line' : 'text-ink-soft hover:bg-surface/60'
      }`}
    >
      <span className={`transition-colors duration-300 ${active ? 'text-accent' : 'text-muted group-hover:text-ink'}`}>{icon}</span>
      {label}
    </button>
  )
}

export function Sidebar() {
  const { route, navigate, settings, createDeal } = useApp()
  const is = (n: Route['name']) => route.name === n
  const brand = settings.brand

  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-[264px] shrink-0 flex-col gap-2 bg-tray/40 px-4 py-6 lg:flex">
      {/* Brand */}
      <button onClick={() => navigate({ name: 'dashboard' })} className="mb-4 flex items-center gap-3 px-2 text-left">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold text-accent-ink lift"
          style={{ background: 'var(--c-accent)', fontFamily: 'var(--font-display)' }}
        >
          {brand.name.trim().charAt(0) || 'К'}
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            {brand.name}
          </span>
          <span className="block text-[11px] text-muted">{brand.tagline}</span>
        </span>
      </button>

      <button
        onClick={createDeal}
        className="group mb-3 flex items-center justify-between rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-accent-ink lift transition-all duration-300 ease-spring active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5">
          <Plus weight="bold" size={17} />
          Новый расчёт
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-px">
          <ArrowUpRight size={14} />
        </span>
      </button>

      <nav className="flex flex-col gap-1">
        <NavItem icon={<SquaresFour size={20} />} label="Дашборд" active={is('dashboard')} onClick={() => navigate({ name: 'dashboard' })} />
        <NavItem icon={<Stack size={20} />} label="Сделки" active={is('deals') || is('deal')} onClick={() => navigate({ name: 'deals' })} />
        <NavItem icon={<GearSix size={20} />} label="Настройки" active={is('admin')} onClick={() => navigate({ name: 'admin' })} />
      </nav>

      <div className="mt-auto">
        <div className="rounded-2xl bg-surface/70 p-3 ring-1 ring-line">
          <div className="flex items-center gap-2 text-[11px] font-medium text-positive">
            <SealCheck weight="fill" size={15} />
            Все системы в норме
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            Напоминания и документы работают автоматически
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tray text-xs font-semibold text-ink-soft">
            {brand.manager.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-medium text-ink">{brand.manager}</span>
            <span className="block text-[11px] text-muted">{brand.city}</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
