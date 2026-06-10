import { ArrowUpRight, TrendUp, Wallet, BellRinging, CalendarBlank, Stack, PaperPlaneTilt, User, PenNib, Lightning } from '@phosphor-icons/react'
import { useApp } from '../lib/store'
import { Bezel, Btn, Card, Eyebrow, Badge } from '../components/ui'
import { STATUS_META } from '../components/ui'
import { dealRevenue, dealProfit, dealMargin, dealDue, fmtRub, fmtDateShort, computeReminders } from '../lib/money'
import type { DealStatus } from '../lib/types'

const STATUS_ORDER: DealStatus[] = ['calc', 'contract', 'production', 'installation', 'closed']

export function Dashboard() {
  const { deals, settings, navigate, createDeal, runReminders, sendReminder } = useApp()
  const active = deals.filter((d) => !d.archived)
  const reminders = computeReminders(deals, settings).filter((r) => r.status !== 'sent').slice(0, 6)
  const dueCount = computeReminders(deals, settings).filter((r) => r.status === 'due').length

  const revenue = active.reduce((s, d) => s + dealRevenue(d), 0)
  const profit = active.reduce((s, d) => s + dealProfit(d), 0)
  const avgMargin = active.length ? active.reduce((s, d) => s + dealMargin(d), 0) / active.length : 0

  // ближайшие неоплаченные платежи
  const upcoming = active
    .flatMap((d) => d.payments.filter((p) => !p.paid).map((p) => ({ d, p })))
    .sort((a, b) => a.p.date.localeCompare(b.p.date))
    .slice(0, 5)

  const dueSoon = active.filter((d) => dealDue(d) > 0 && d.reminderEnabled).length

  const counts = STATUS_ORDER.map((st) => ({ st, n: deals.filter((d) => d.status === st).length }))
  const maxCount = Math.max(1, ...counts.map((c) => c.n))

  const hour = new Date().getHours()
  const greet = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="rise mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="-ml-3">Обзор · {settings.brand.name}</Eyebrow>
          <h1 className="mt-1 text-[34px] leading-tight text-ink sm:text-[40px]">
            {greet}, {settings.brand.manager.split(' ')[1] || settings.brand.manager}
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })} · в работе {active.length} сделок
          </p>
        </div>
        <Btn onClick={createDeal} trailing={<ArrowUpRight size={14} />}>
          Новый расчёт
        </Btn>
      </div>

      {/* KPI bento */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-12">
        <Bezel className="md:col-span-5">
          <div className="p-6">
            <div className="flex items-center gap-2 text-muted">
              <Wallet size={18} className="text-accent" />
              <span className="text-[13px] font-medium">Выручка в работе</span>
            </div>
            <p className="mt-4 text-[44px] leading-none text-ink nums" style={{ fontFamily: 'var(--font-display)' }}>
              {fmtRub(revenue)}
            </p>
            <div className="mt-5 flex items-center gap-5">
              <div>
                <p className="text-[12px] text-muted">Прибыль</p>
                <p className="text-[17px] font-semibold text-ink nums">{fmtRub(profit)}</p>
              </div>
              <div className="h-9 w-px bg-line" />
              <div>
                <p className="text-[12px] text-muted">Средняя маржа</p>
                <p className="flex items-center gap-1 text-[17px] font-semibold text-positive nums">
                  <TrendUp size={16} weight="bold" /> {avgMargin.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </Bezel>

        <Card className="md:col-span-4">
          <button onClick={() => navigate({ name: 'deals' })} className="group flex h-full w-full flex-col p-6 text-left">
            <div className="flex items-center justify-between text-muted">
              <span className="flex items-center gap-2 text-[13px] font-medium">
                <Stack size={18} /> Активные сделки
              </span>
              <ArrowUpRight size={16} className="text-muted transition-transform duration-300 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="mt-4 text-[44px] leading-none text-ink nums" style={{ fontFamily: 'var(--font-display)' }}>
              {active.length}
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
              {counts
                .filter((c) => c.st !== 'closed' && c.n > 0)
                .map((c) => (
                  <Badge key={c.st} tone={STATUS_META[c.st].tone}>
                    {STATUS_META[c.st].label} · {c.n}
                  </Badge>
                ))}
            </div>
          </button>
        </Card>

        <Card className="md:col-span-3">
          <div className="flex h-full flex-col p-6">
            <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
              <BellRinging size={18} className="text-warning" /> Напоминаний к отправке
            </span>
            <p className="mt-4 text-[44px] leading-none text-ink nums" style={{ fontFamily: 'var(--font-display)' }}>
              {dueCount}
            </p>
            <p className="mt-auto pt-5 text-[12px] leading-relaxed text-muted">
              авто-контроль оплат включён для {dueSoon} сделок
            </p>
          </div>
        </Card>
      </div>

      {/* Lower row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Upcoming payments */}
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between px-6 pt-5">
            <h3 className="text-[17px] text-ink">Ближайшие платежи</h3>
            <Badge tone="neutral">
              <CalendarBlank size={14} /> график
            </Badge>
          </div>
          <div className="mt-2 px-2.5 pb-3">
            {upcoming.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Все платежи закрыты 🎉</p>}
            {upcoming.map(({ d, p }) => (
              <button
                key={d.id + p.id}
                onClick={() => navigate({ name: 'deal', id: d.id })}
                className="group flex w-full items-center gap-4 rounded-2xl px-3.5 py-3 text-left transition-colors duration-200 hover:bg-tray/60"
              >
                <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-tray text-ink-soft">
                  <span className="text-[14px] font-semibold leading-none nums">{new Date(p.date).getDate()}</span>
                  <span className="text-[9px] uppercase">{new Date(p.date).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{d.client.name}</p>
                  <p className="truncate text-[12px] text-muted">
                    №{d.number} · {p.label}
                  </p>
                </div>
                {p.clientReminded && (
                  <Badge tone="accent">
                    <BellRinging size={12} weight="fill" /> напомнили
                  </Badge>
                )}
                <span className="text-[15px] font-semibold text-ink nums">{fmtRub(p.amount)}</span>
                <ArrowUpRight size={16} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </Card>

        {/* Funnel */}
        <Card className="lg:col-span-5">
          <div className="px-6 pt-5">
            <h3 className="text-[17px] text-ink">Воронка</h3>
          </div>
          <div className="space-y-3 px-6 py-5">
            {counts.map(({ st, n }) => (
              <div key={st}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-ink-soft">{STATUS_META[st].label}</span>
                  <span className="font-semibold text-ink nums">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-tray">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-spring"
                    style={{
                      width: `${(n / maxCount) * 100}%`,
                      background: st === 'closed' ? 'var(--c-positive)' : 'var(--c-accent)',
                      opacity: st === 'closed' ? 0.85 : 0.4 + 0.6 * (n / maxCount),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Очередь напоминаний (checkAndSendReminders) */}
      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-[17px] text-ink">Очередь напоминаний</h3>
            {dueCount > 0 && <Badge tone="warning">{dueCount} к отправке</Badge>}
          </div>
          <Btn size="sm" variant={dueCount > 0 ? 'primary' : 'soft'} leading={<Lightning size={15} weight="fill" />} onClick={runReminders}>
            Проверить сейчас
          </Btn>
        </div>
        <div className="mt-2 px-2.5 pb-3">
          {reminders.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Очередь пуста — все актуальные напоминания отправлены 🎉</p>}
          {reminders.map((r) => (
            <div key={r.dealId + r.paymentId + r.kind} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-colors hover:bg-tray/50">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${r.kind === 'client' ? 'bg-accent-soft text-accent' : 'bg-tray text-ink-soft'}`}>
                {r.kind === 'client' ? <User size={17} /> : <PenNib size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">
                  {r.kind === 'client' ? r.clientName : 'Дизайнеру'} · {fmtRub(r.amount)}
                </p>
                <p className="truncate text-[12px] text-muted">
                  №{r.dealNumber} · {r.kind === 'client' ? 'напомнить' : 'контроль'} {fmtDateShort(r.triggerDate)}
                </p>
              </div>
              {r.status === 'due' ? <Badge tone="warning">пора</Badge> : <Badge tone="neutral">{fmtDateShort(r.triggerDate)}</Badge>}
              <button
                onClick={() => sendReminder(r.dealId, r.paymentId, r.kind)}
                className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft ring-1 ring-line transition-all duration-300 ease-spring hover:text-ink active:scale-95"
              >
                <PaperPlaneTilt size={13} /> Отправить
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
