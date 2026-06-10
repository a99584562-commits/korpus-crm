import { useState } from 'react'
import { MagnifyingGlass, ArrowUpRight, Plus, User, Buildings, Storefront } from '@phosphor-icons/react'
import { useApp } from '../lib/store'
import { Btn, Card, Eyebrow, Input, Segmented, StatusPill, Badge } from '../components/ui'
import { STATUS_META } from '../components/ui'
import { dealRevenue, dealPaid, dealMargin, fmtRub, fmtDateShort } from '../lib/money'
import type { Deal, DealStatus, PartyType } from '../lib/types'

const PARTY_ICON: Record<PartyType, typeof User> = {
  individual: User,
  company: Buildings,
  entrepreneur: Storefront,
}

const FILTERS: { key: DealStatus | 'all' | 'active'; label: string }[] = [
  { key: 'active', label: 'В работе' },
  { key: 'all', label: 'Все' },
  { key: 'calc', label: 'Расчёт' },
  { key: 'contract', label: 'Договор' },
  { key: 'production', label: 'Производство' },
  { key: 'installation', label: 'Монтаж' },
  { key: 'closed', label: 'Закрыт' },
]

const BOARD_COLS: DealStatus[] = ['calc', 'contract', 'production', 'installation', 'closed']

const nextPay = (d: Deal) => d.payments.find((p) => !p.paid)

export function Deals() {
  const { deals, navigate, createDeal, editDeal } = useApp()
  const [filter, setFilter] = useState<DealStatus | 'all' | 'active'>('active')
  const [view, setView] = useState<'list' | 'board'>('list')
  const [q, setQ] = useState('')

  const matchQ = (d: Deal) => !q || `${d.number} ${d.client.name} ${d.designer}`.toLowerCase().includes(q.toLowerCase())

  const listed = deals.filter((d) => {
    if (filter === 'active' && (d.archived || d.status === 'closed')) return false
    if (filter !== 'all' && filter !== 'active' && d.status !== filter) return false
    return matchQ(d)
  })

  return (
    <div className="rise mx-auto max-w-[1320px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="-ml-3">База расчётов</Eyebrow>
          <h1 className="mt-1 text-[34px] leading-tight text-ink sm:text-[40px]">Расчёты</h1>
        </div>
        <Btn onClick={createDeal} trailing={<Plus size={14} weight="bold" />}>
          Новый расчёт
        </Btn>
      </div>

      {/* Controls */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {view === 'list' ? (
          <div className="flex flex-1 flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300 ease-spring ${
                  filter === f.key ? 'bg-ink text-bg lift' : 'bg-tray/60 text-ink-soft hover:bg-tray'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <Segmented<'list' | 'board'>
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: 'Список' },
            { value: 'board', label: 'Доска' },
          ]}
        />
        <div className="relative w-full sm:w-60">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Клиент, №, дизайнер" className="pl-9" />
        </div>
      </div>

      {view === 'list' ? (
        <DealList deals={listed} onOpen={(id) => navigate({ name: 'deal', id })} />
      ) : (
        <Board deals={deals.filter(matchQ)} onOpen={(id) => navigate({ name: 'deal', id })} onMove={(id, st) => editDeal(id, (d) => { d.status = st; if (st !== 'closed') d.archived = false })} />
      )}
    </div>
  )
}

// ─────────────────────────  List view  ─────────────────────────
function DealList({ deals, onOpen }: { deals: Deal[]; onOpen: (id: string) => void }) {
  return (
    <Card className="mt-4 overflow-hidden">
      <div className="hidden grid-cols-[1.6fr_0.9fr_1fr_1fr_auto] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted md:grid">
        <span>Заказчик</span>
        <span>Статус</span>
        <span className="text-right">Сумма</span>
        <span>Оплата</span>
        <span className="w-20 text-right">Платёж</span>
      </div>
      <div className="px-2.5 pb-2.5">
        {deals.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted">Ничего не найдено</p>}
        {deals.map((d) => {
          const rev = dealRevenue(d)
          const paid = dealPaid(d)
          const pct = rev > 0 ? Math.min(100, (paid / rev) * 100) : 0
          const np = nextPay(d)
          const Icon = PARTY_ICON[d.client.type]
          return (
            <button
              key={d.id}
              onClick={() => onOpen(d.id)}
              className="group grid w-full grid-cols-1 items-center gap-2 rounded-2xl px-3.5 py-3 text-left transition-colors duration-200 hover:bg-tray/55 md:grid-cols-[1.6fr_0.9fr_1fr_1fr_auto] md:gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tray text-ink-soft">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-medium text-ink">{d.client.name || 'Без названия'}</p>
                  <p className="truncate text-[12px] text-muted">
                    №{d.number} · {d.designer} · {fmtDateShort(d.date)}
                  </p>
                </div>
              </div>
              <div>
                <StatusPill status={d.status} />
              </div>
              <div className="text-left md:text-right">
                <span className="text-[15px] font-semibold text-ink nums">{fmtRub(rev)}</span>
                <span className="ml-2 text-[12px] text-positive nums md:hidden">{dealMargin(d).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tray">
                  <div className="h-full rounded-full transition-all duration-700 ease-spring" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--c-positive)' : 'var(--c-accent)' }} />
                </div>
                <span className="w-9 text-right text-[11px] text-muted nums">{pct.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between md:w-20 md:justify-end">
                {np ? <span className="text-[12px] text-muted nums">{fmtDateShort(np.date)}</span> : <Badge tone="positive">оплачен</Badge>}
                <ArrowUpRight size={16} className="ml-2 hidden text-muted opacity-0 transition-opacity group-hover:opacity-100 md:block" />
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

// ─────────────────────────  Board (kanban) view  ─────────────────────────
function Board({ deals, onOpen, onMove }: { deals: Deal[]; onOpen: (id: string) => void; onMove: (id: string, st: DealStatus) => void }) {
  const [overCol, setOverCol] = useState<DealStatus | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  return (
    <div className="mt-4 flex gap-3.5 overflow-x-auto pb-3">
      {BOARD_COLS.map((st) => {
        const colDeals = deals.filter((d) => d.status === st)
        const sum = colDeals.reduce((s, d) => s + dealRevenue(d), 0)
        const isOver = overCol === st
        return (
          <div
            key={st}
            onDragOver={(e) => { e.preventDefault(); setOverCol(st) }}
            onDragLeave={() => setOverCol((c) => (c === st ? null : c))}
            onDrop={(e) => { e.preventDefault(); const id = (e.dataTransfer && e.dataTransfer.getData('id')) || dragId; if (id) onMove(id, st); setOverCol(null); setDragId(null) }}
            className={`flex w-[270px] shrink-0 flex-col rounded-[1.4rem] p-2.5 transition-colors duration-200 ${isOver ? 'bg-accent-soft/70 ring-1 ring-accent/30' : 'bg-tray/40'}`}
          >
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: st === 'closed' ? 'var(--c-positive)' : 'var(--c-accent)' }} />
                <span className="text-[13px] font-semibold text-ink">{STATUS_META[st].label}</span>
                <span className="text-[12px] text-muted nums">{colDeals.length}</span>
              </span>
              <span className="text-[11px] text-muted nums">{fmtRub(sum)}</span>
            </div>
            <div className="flex min-h-[120px] flex-col gap-2">
              {colDeals.map((d) => {
                const Icon = PARTY_ICON[d.client.type]
                const np = nextPay(d)
                return (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('id', d.id); e.dataTransfer.effectAllowed = 'move'; setDragId(d.id) }}
                    onDragEnd={() => { setDragId(null); setOverCol(null) }}
                    onClick={() => onOpen(d.id)}
                    className={`group cursor-pointer rounded-2xl bg-surface p-3.5 ring-1 ring-line transition-all duration-200 hover:lift ${dragId === d.id ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tray text-ink-soft">
                          <Icon size={14} />
                        </span>
                        <span className="text-[11px] text-muted nums">№{d.number}</span>
                      </div>
                      <span className="text-[11px] font-medium text-positive nums">{dealMargin(d).toFixed(0)}%</span>
                    </div>
                    <p className="mt-2 truncate text-[13.5px] font-medium text-ink">{d.client.name || 'Без названия'}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">{d.designer}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-ink nums">{fmtRub(dealRevenue(d))}</span>
                      {np ? (
                        <span className="text-[11px] text-muted nums">{fmtDateShort(np.date)}</span>
                      ) : (
                        <Badge tone="positive">оплачен</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
              {colDeals.length === 0 && <div className="rounded-2xl border border-dashed border-line py-6 text-center text-[12px] text-muted">перетащите сюда</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
