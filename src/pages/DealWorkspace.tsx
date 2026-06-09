import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Trash,
  Copy,
  CaretRight,
  FileText,
  Receipt,
  ChatCircleDots,
  DownloadSimple,
  BellRinging,
  Package,
  CheckCircle,
  Check,
  Star,
  Sparkle,
} from '@phosphor-icons/react'
import { useApp } from '../lib/store'
import { Btn, Card, Field, Input, NumField, Textarea, Toggle, Segmented, StatusPill, Badge, IconBtn, Divider } from '../components/ui'
import { STATUS_META } from '../components/ui'
import { DOCS } from '../lib/seed'
import {
  dealRevenue,
  dealCost,
  dealProfit,
  dealMargin,
  dealPaid,
  dealDue,
  mainVariant,
  variantRevenue,
  variantCost,
  variantMargin,
  readinessDate,
  itemSum,
  fmtRub,
  fmtRub2,
  fmtDate,
  fmtDateShort,
} from '../lib/money'
import type { CategoryDef, Deal, DealStatus, DocKind, LineItem, MaterialRow, PartyType, Variant } from '../lib/types'

const STATUS_FLOW: DealStatus[] = ['calc', 'contract', 'production', 'installation', 'closed']
const uid = () => Math.random().toString(36).slice(2, 9)
const EDGE_THICKNESS = ['0,4 мм', '1 мм', '2 мм']

type EditFn = (id: string, m: (d: Deal) => void) => void
type VarMut = (v: Variant) => void

const DOC_ICON: Record<DocKind, typeof FileText> = {
  contract: FileText,
  pko: Receipt,
  allonge: FileText,
  notice: ChatCircleDots,
  act_product: CheckCircle,
  act_install: Package,
  act_unilateral: FileText,
}

type Tab = 'smeta' | 'client' | 'payments' | 'docs'

export function DealWorkspace({ id }: { id: string }) {
  const { deals, navigate, editDeal, duplicateDeal, openDoc, signDeal, settings, toast } = useApp()
  const deal = deals.find((d) => d.id === id)
  const [tab, setTab] = useState<Tab>('smeta')

  if (!deal) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-muted">Сделка не найдена.</p>
        <Btn className="mt-4" variant="soft" onClick={() => navigate({ name: 'deals' })}>
          К списку сделок
        </Btn>
      </div>
    )
  }

  const rev = dealRevenue(deal)
  const margin = dealMargin(deal)
  const paid = dealPaid(deal)
  const due = dealDue(deal)

  return (
    <div className="rise mx-auto max-w-[1240px] px-5 py-7 sm:px-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBtn onClick={() => navigate({ name: 'deals' })} title="Назад">
            <ArrowLeft size={18} />
          </IconBtn>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[24px] leading-none text-ink">Договор №{deal.number}</h1>
              <StatusPill status={deal.status} />
            </div>
            <p className="mt-1 text-[13px] text-muted">
              {deal.client.name || 'Новый заказчик'} · открыт {fmtDate(deal.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" leading={<Copy size={15} />} onClick={() => duplicateDeal(deal.id)}>
            Дублировать
          </Btn>
          <Btn size="sm" leading={<FileText size={15} />} onClick={() => openDoc(deal.id, 'contract')}>
            Договор
          </Btn>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_336px]">
        {/* ─────────── Main column ─────────── */}
        <div>
          <div className="mb-4">
            <Segmented<Tab>
              value={tab}
              onChange={setTab}
              options={[
                { value: 'smeta', label: 'Смета' },
                { value: 'client', label: 'Заказчик' },
                { value: 'payments', label: 'Платежи' },
                { value: 'docs', label: 'Документы' },
              ]}
            />
          </div>

          {tab === 'smeta' && <SmetaTab deal={deal} editDeal={editDeal} />}
          {tab === 'client' && <ClientTab deal={deal} editDeal={editDeal} />}
          {tab === 'payments' && <PaymentsTab deal={deal} editDeal={editDeal} />}
          {tab === 'docs' && <DocsTab deal={deal} openDoc={openDoc} />}
        </div>

        {/* ─────────── Sticky rail ─────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* Money summary */}
          <Card className="overflow-hidden">
            <div className="bg-ink px-5 py-5 text-bg">
              <p className="text-[12px] text-bg/60">Итого по договору</p>
              <p className="mt-1 text-[32px] leading-none nums" style={{ fontFamily: 'var(--font-display)' }}>
                {fmtRub(rev)}
              </p>
            </div>
            <div className="space-y-2.5 px-5 py-4">
              <SummaryRow label="Себестоимость" value={fmtRub(dealCost(deal))} />
              <SummaryRow label="Прибыль" value={fmtRub(dealProfit(deal))} strong />
              <div>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-muted">Маржинальность</span>
                  <span className="font-semibold text-positive nums">{margin.toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-tray">
                  <div className="h-full rounded-full bg-positive transition-all duration-700 ease-spring" style={{ width: `${Math.min(100, margin)}%` }} />
                </div>
              </div>
              <Divider className="my-1.5" />
              <SummaryRow label="Оплачено" value={fmtRub(paid)} />
              <SummaryRow label="Осталось" value={fmtRub(due)} strong tone={due > 0 ? 'warning' : 'positive'} />
            </div>
          </Card>

          {/* Stage */}
          <Card className="p-5">
            <p className="mb-3 text-[13px] font-medium text-muted">Этап сделки</p>
            <div className="flex flex-col gap-1.5">
              {STATUS_FLOW.map((st) => {
                const activeIdx = STATUS_FLOW.indexOf(deal.status)
                const idx = STATUS_FLOW.indexOf(st)
                const done = idx < activeIdx
                const current = st === deal.status
                return (
                  <button
                    key={st}
                    onClick={() => editDeal(deal.id, (d) => { d.status = st })}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors duration-200 ${
                      current ? 'bg-accent-soft font-medium text-ink' : 'text-ink-soft hover:bg-tray/60'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        current ? 'bg-accent text-accent-ink' : done ? 'bg-positive text-white' : 'bg-tray text-muted'
                      }`}
                    >
                      {done ? <CheckCircle size={13} weight="fill" /> : idx + 1}
                    </span>
                    {STATUS_META[st].label}
                  </button>
                )
              })}
            </div>
            {(deal.status === 'calc' || deal.status === 'contract') && (
              <Btn className="mt-3.5 w-full" size="sm" leading={<CheckCircle size={15} weight="fill" />} onClick={() => signDeal(deal.id)}>
                Договор подписан → в работу
              </Btn>
            )}
            {deal.status === 'installation' && (
              <Btn
                className="mt-3.5 w-full"
                size="sm"
                variant="soft"
                leading={<CheckCircle size={15} weight="fill" />}
                onClick={() => {
                  editDeal(deal.id, (d) => { d.status = 'closed'; d.archived = true })
                  toast({ kind: 'success', title: 'Сделка закрыта', detail: 'Перенесена в архив' })
                }}
              >
                Закрыть сделку
              </Btn>
            )}
          </Card>

          {/* Reminders */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                <BellRinging size={17} className="text-warning" /> Напоминания
              </span>
              <Toggle checked={deal.reminderEnabled} onChange={(v) => editDeal(deal.id, (d) => { d.reminderEnabled = v })} />
            </div>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
              {deal.reminderEnabled ? (
                <>
                  Клиенту — за <b className="text-ink-soft">{settings.reminders.clientDaysBefore} дня</b> до платежа, в{' '}
                  {settings.reminders.hour}:00. Дизайнеру — через {settings.reminders.designerDaysAfter} дня после.
                </>
              ) : (
                'Авто-напоминания об оплате отключены для этой сделки.'
              )}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'warning' | 'positive' }) {
  const color = tone === 'warning' ? 'text-warning' : tone === 'positive' ? 'text-positive' : 'text-ink'
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={`nums ${strong ? 'text-[15px] font-semibold' : ''} ${color}`}>{value}</span>
    </div>
  )
}

// ─────────────────────────  СМЕТА (блочная, с вариантами)  ─────────────────────────
function SmetaRow({ deal, variantId, it, cat, editDeal }: { deal: Deal; variantId: string; it: LineItem; cat?: CategoryDef; editDeal: EditFn }) {
  const upd = (m: (x: LineItem) => void) =>
    editDeal(deal.id, (d) => {
      const v = d.variants.find((x) => x.id === variantId)
      const x = v?.items.find((i) => i.id === it.id)
      if (x) m(x)
    })
  const isEdge = cat?.kind === 'edge'
  return (
    <div className="grid grid-cols-2 items-center gap-2 rounded-2xl px-2.5 py-2 transition-colors hover:bg-tray/40 sm:grid-cols-[1.8fr_0.7fr_0.8fr_0.8fr_0.9fr_auto] sm:gap-3">
      <div className="col-span-2 sm:col-span-1">
        <input
          value={it.name}
          onChange={(e) => upd((x) => { x.name = e.target.value })}
          placeholder="Наименование"
          className="w-full bg-transparent text-[14px] font-medium text-ink outline-none placeholder:text-muted/60"
        />
        <div className="mt-0.5">
          {isEdge ? (
            <select
              value={it.detail || EDGE_THICKNESS[2]}
              onChange={(e) => upd((x) => { x.detail = e.target.value })}
              className="rounded-md bg-tray/60 px-1.5 py-0.5 text-[11px] text-ink-soft outline-none"
            >
              {EDGE_THICKNESS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          ) : (
            <input
              value={it.detail || ''}
              onChange={(e) => upd((x) => { x.detail = e.target.value })}
              placeholder={cat?.detailLabel?.toLowerCase() || 'материал / цвет'}
              className="w-full bg-transparent text-[12px] text-muted outline-none placeholder:text-muted/50"
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <NumField value={it.qty} onChange={(n) => upd((x) => { x.qty = n })} align="right" className="flex-1" />
        <span className="w-9 shrink-0 text-[11px] text-muted">{it.unit}</span>
      </div>
      <NumField value={it.price} onChange={(n) => upd((x) => { x.price = n })} align="right" />
      <NumField value={it.cost} onChange={(n) => upd((x) => { x.cost = n })} align="right" />
      <div className="text-right text-[14px] font-semibold text-ink nums">{fmtRub(itemSum(it))}</div>
      <IconBtn
        className="h-8 w-8 justify-self-end"
        title="Удалить"
        onClick={() => editDeal(deal.id, (d) => { const v = d.variants.find((x) => x.id === variantId); if (v) v.items = v.items.filter((i) => i.id !== it.id) })}
      >
        <Trash size={15} />
      </IconBtn>
    </div>
  )
}

// ─────────────────────────  СМЕТА (блочная, с вариантами)  ─────────────────────────
function CategoryBlock({ deal, variantId, cat, materials, editDeal }: { deal: Deal; variantId: string; cat: CategoryDef; materials: MaterialRow[]; editDeal: EditFn }) {
  const [open, setOpen] = useState(false)
  const variant = deal.variants.find((v) => v.id === variantId)
  const rows = (variant?.items ?? []).filter((i) => i.group === cat.name)
  const subtotal = rows.reduce((s, i) => s + itemSum(i), 0)

  const pushItem = (item: LineItem) =>
    editDeal(deal.id, (d) => {
      const v = d.variants.find((x) => x.id === variantId)
      v?.items.push(item)
    })
  const addBlank = () => {
    pushItem(
      cat.kind === 'edge'
        ? { id: uid(), group: cat.name, name: 'Кромка в цвет', detail: '2 мм', qty: 0, unit: cat.unit, price: 95, cost: 40 }
        : { id: uid(), group: cat.name, name: '', detail: '', qty: 0, unit: cat.unit, price: 0, cost: 0 },
    )
    setOpen(false)
  }
  const addMaterial = (m: MaterialRow) =>
    pushItem({ id: uid(), group: cat.name, name: m.name, detail: cat.kind === 'edge' ? '2 мм' : '', qty: 1, unit: m.unit, price: m.price, cost: Math.round(m.price * 0.55) })

  return (
    <div className="border-t border-line first:border-t-0">
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <span className="flex items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-accent">{cat.name}</span>
          {rows.length > 0 && <span className="text-[11px] text-muted nums">· {rows.length}</span>}
        </span>
        {subtotal > 0 && <span className="text-[12.5px] font-medium text-ink-soft nums">{fmtRub(subtotal)}</span>}
      </div>
      <div className="px-1.5">{rows.map((it) => <SmetaRow key={it.id} deal={deal} variantId={variantId} it={it} cat={cat} editDeal={editDeal} />)}</div>

      <div className="px-4 pb-2.5 pt-0.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-lg py-1 text-[12px] font-medium transition-colors duration-200 ${open ? 'text-accent' : 'text-muted hover:text-accent'}`}
        >
          <Plus size={13} weight="bold" /> добавить позицию
        </button>
        {open && (
          <div className="mt-1.5 overflow-hidden rounded-xl bg-tray/45 ring-1 ring-line" style={{ animation: 'sheet-in 0.35s cubic-bezier(0.32,0.72,0,1) both' }}>
            <button onClick={addBlank} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surface">
              <Plus size={13} /> Пустая строка
            </button>
            {materials.length > 0 && <div className="h-px bg-line" />}
            <div className="max-h-56 overflow-y-auto">
              {materials.map((m) => (
                <button key={m.id} onClick={() => addMaterial(m)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-surface">
                  <span className="truncate text-[13px] text-ink">{m.name}</span>
                  <span className="shrink-0 text-[12px] font-medium text-muted nums">{fmtRub(m.price)}/{m.unit}</span>
                </button>
              ))}
            </div>
            {materials.length === 0 && (
              <p className="px-3 pb-2.5 pt-1 text-[11.5px] leading-relaxed text-muted">
                Каталог «{cat.name}» пуст. Добавьте материалы в Настройки → Каталог материалов — и они появятся здесь.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SmetaTab({ deal, editDeal }: { deal: Deal; editDeal: EditFn }) {
  const { settings, setMainVariant, removeVariant, toast } = useApp()
  const [picker, setPicker] = useState(false)
  const [selId, setSelId] = useState(deal.mainVariantId)
  useEffect(() => { setSelId(deal.mainVariantId) }, [deal.id, deal.mainVariantId])

  const variant = deal.variants.find((v) => v.id === selId) ?? mainVariant(deal)
  const variantId = variant.id
  const isMain = variantId === deal.mainVariantId
  const cats = settings.categories
  const known = new Set(cats.map((c) => c.name))
  const other = variant.items.filter((i) => !known.has(i.group))

  const addVariant = () => {
    const newId = 'v' + uid()
    const n = Math.max(1, ...deal.variants.map((v) => parseInt((v.name.match(/\d+/) || ['1'])[0], 10) || 1)) + 1
    editDeal(deal.id, (d) => {
      const src = d.variants.find((x) => x.id === variantId) ?? d.variants[0]
      d.variants.push({ ...structuredClone(src), id: newId, name: 'Расчёт ' + n, items: src.items.map((i) => ({ ...i, id: uid() })) })
    })
    setSelId(newId)
    toast({ kind: 'info', title: 'Добавлен вариант', detail: 'Расчёт ' + n })
  }

  return (
    <div className="space-y-4">
      {/* Переключатель вариантов расчёта */}
      <div className="flex flex-wrap items-center gap-1.5">
        {deal.variants.map((v) => {
          const sel = v.id === selId
          const main = v.id === deal.mainVariantId
          return (
            <button
              key={v.id}
              onClick={() => setSelId(v.id)}
              className={`group flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300 ease-spring ${
                sel ? 'bg-ink text-bg lift' : 'bg-tray/60 text-ink-soft hover:bg-tray'
              }`}
            >
              {main && <Star size={12} weight="fill" className={sel ? 'text-amber-300' : 'text-accent'} />}
              {v.name}
            </button>
          )
        })}
        <button onClick={addVariant} className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[13px] font-medium text-accent transition-all duration-300 ease-spring hover:brightness-95 active:scale-95">
          <Copy size={13} /> дублировать
        </button>
      </div>

      {!isMain && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-warning-soft/60 px-4 py-2.5 ring-1 ring-line">
          <span className="text-[12.5px] text-ink-soft">Это не основной вариант. Документы и оплата считаются по основному.</span>
          <div className="flex gap-2">
            <Btn size="sm" variant="soft" leading={<Star size={14} weight="fill" />} onClick={() => setMainVariant(deal.id, variantId)}>
              Сделать основным
            </Btn>
            {deal.variants.length > 1 && (
              <IconBtn className="h-8 w-8" title="Удалить вариант" onClick={() => { removeVariant(deal.id, variantId); setSelId(deal.mainVariantId) }}>
                <Trash size={15} />
              </IconBtn>
            )}
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.8fr_0.7fr_0.8fr_0.8fr_0.9fr_auto] gap-3 px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted sm:grid">
          <span>Позиция</span>
          <span className="text-right">Кол-во</span>
          <span className="text-right">Цена</span>
          <span className="text-right">Себест.</span>
          <span className="text-right">Сумма</span>
          <span className="w-6" />
        </div>
        {cats.map((cat) => (
          <CategoryBlock key={cat.id} deal={deal} variantId={variantId} cat={cat} materials={settings.materials.filter((m) => m.group === cat.name)} editDeal={editDeal} />
        ))}
        {other.length > 0 && (
          <div className="border-t border-line">
            <div className="px-4 pb-1 pt-3">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">Прочее</span>
            </div>
            <div className="px-1.5 pb-2">{other.map((it) => <SmetaRow key={it.id} deal={deal} variantId={variantId} it={it} editDeal={editDeal} />)}</div>
          </div>
        )}

        <div className="border-t border-line px-4 py-3">
          <Btn size="sm" variant="ghost" leading={<Sparkle size={15} />} onClick={() => setPicker((v) => !v)}>
            Добавить из каталога материалов
          </Btn>
          {picker && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl bg-tray/40 p-2 ring-1 ring-line" style={{ animation: 'sheet-in 0.4s cubic-bezier(0.32,0.72,0,1) both' }}>
              {settings.materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    editDeal(deal.id, (d) => {
                      const v = d.variants.find((x) => x.id === variantId)
                      v?.items.push({ id: uid(), group: m.group, name: m.name, detail: '', qty: 1, unit: m.unit, price: m.price, cost: Math.round(m.price * 0.55) })
                    })
                    setPicker(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface"
                >
                  <span className="flex items-center gap-2">
                    <Badge tone="neutral">{m.group}</Badge>
                    <span className="text-[13px] text-ink">{m.name}</span>
                  </span>
                  <span className="text-[13px] font-medium text-ink-soft nums">{fmtRub(m.price)}/{m.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <CommercialBlock deal={deal} variantId={variantId} editDeal={editDeal} />
    </div>
  )
}

// ─────────────────────────  КОММЕРЧЕСКИЙ БЛОК  ─────────────────────────
function CommercialBlock({ deal, variantId, editDeal }: { deal: Deal; variantId: string; editDeal: EditFn }) {
  const { settings } = useApp()
  const variant = deal.variants.find((v) => v.id === variantId) ?? mainVariant(deal)
  const editVar = (m: VarMut) => editDeal(deal.id, (d) => { const v = d.variants.find((x) => x.id === variantId); if (v) m(v) })
  const rev = variantRevenue(variant)
  const signAmt = Math.round((rev * settings.commercial.signPercent) / 100)
  const startAmt = Math.round((rev * settings.commercial.startPercent) / 100)
  const ready = readinessDate(deal, settings.holidays)
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-[16px] text-ink">Коммерческие условия</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-tray/35 p-4 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-medium text-ink">Доставка и установка</span>
            <Toggle checked={variant.delivery.enabled} onChange={(v) => editVar((vr) => { vr.delivery.enabled = v })} />
          </div>
          {variant.delivery.enabled ? (
            <div className="mt-3">
              <NumField value={variant.delivery.amount} onChange={(n) => editVar((vr) => { vr.delivery.amount = n })} suffix="₽" align="right" />
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-muted">Самовывоз — без доставки и монтажа</p>
          )}
        </div>
        <div className="rounded-2xl bg-tray/35 p-4 ring-1 ring-line">
          <span className="text-[13.5px] font-medium text-ink">Способ оплаты</span>
          <div className="mt-3">
            <Segmented<'cash' | 'transfer'>
              value={deal.payMethod}
              onChange={(v) => editDeal(deal.id, (d) => { d.payMethod = v })}
              options={[
                { value: 'cash', label: 'Наличные' },
                { value: 'transfer', label: 'Перевод' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Скидка, ₽">
          <NumField value={variant.discount} onChange={(n) => editVar((vr) => { vr.discount = n })} suffix="₽" align="right" />
        </Field>
        <div className="rounded-2xl bg-accent-soft/50 px-4 py-2.5">
          <p className="text-[11px] text-muted">Для заключения договора · {settings.commercial.signPercent}%</p>
          <p className="text-[16px] font-semibold text-ink nums">{fmtRub(signAmt)}</p>
        </div>
        <div className="rounded-2xl bg-accent-soft/50 px-4 py-2.5">
          <p className="text-[11px] text-muted">Для запуска в работу · {settings.commercial.startPercent}%</p>
          <p className="text-[16px] font-semibold text-ink nums">{fmtRub(startAmt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-[13px] text-muted">
          Себестоимость {fmtRub(variantCost(variant))} · маржа <b className="text-positive">{variantMargin(variant).toFixed(1)}%</b> · готовность ~ {fmtDateShort(ready)}
        </span>
        <div className="text-right">
          <p className="text-[12px] text-muted">Итого по варианту</p>
          <p className="text-[24px] leading-none text-ink nums" style={{ fontFamily: 'var(--font-display)' }}>{fmtRub2(rev)}</p>
        </div>
      </div>
    </Card>
  )
}

// ─────────────────────────  ЗАКАЗЧИК  ─────────────────────────
const PARTY_OPTS: { value: PartyType; label: string }[] = [
  { value: 'individual', label: 'Физлицо' },
  { value: 'company', label: 'Юрлицо' },
  { value: 'entrepreneur', label: 'ИП' },
]

function ClientTab({ deal, editDeal }: { deal: Deal; editDeal: EditFn }) {
  const { settings } = useApp()
  const c = deal.client
  const set = (m: (d: Deal) => void) => editDeal(deal.id, m)
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<PartyType> value={c.type} onChange={(v) => set((d) => { d.client.type = v })} options={PARTY_OPTS} />
        <Field label="" className="w-56">
          <Input value={deal.designer} onChange={(e) => set((d) => { d.designer = e.target.value })} placeholder="Дизайнер" />
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={c.type === 'individual' ? 'ФИО' : 'Наименование'} className="sm:col-span-2">
          <Input value={c.name} onChange={(e) => set((d) => { d.client.name = e.target.value })} placeholder="Иванов Иван Иванович" />
        </Field>
        <Field label="Телефон">
          <Input value={c.phone} onChange={(e) => set((d) => { d.client.phone = e.target.value })} placeholder="+7 ___ ___-__-__" />
        </Field>
        <Field label="E-mail или VK" hint="по этому контакту уходят документы и напоминания">
          <Input value={c.contact} onChange={(e) => set((d) => { d.client.contact = e.target.value })} placeholder="mail@... или vk.com/..." />
        </Field>
        <Field label="Адрес установки" className="sm:col-span-2">
          <Input value={c.installAddress} onChange={(e) => set((d) => { d.client.installAddress = e.target.value })} />
        </Field>

        {c.type === 'individual' ? (
          <>
            <Field label="Паспорт">
              <Input value={c.passport || ''} onChange={(e) => set((d) => { d.client.passport = e.target.value })} placeholder="серия номер" />
            </Field>
            <Field label="Дата рождения">
              <Input type="date" value={c.birthDate || ''} onChange={(e) => set((d) => { d.client.birthDate = e.target.value })} />
            </Field>
            <Field label="Код подразделения" hint="«Кем выдан» подставится из справочника">
              <Input
                value={c.deptCode || ''}
                onChange={(e) => {
                  const code = e.target.value
                  const match = settings.passportDepts.find((p) => p.code === code.trim())
                  set((d) => { d.client.deptCode = code; if (match) d.client.issuedBy = match.name })
                }}
                placeholder="770-001"
              />
            </Field>
            <Field label="Кем выдан">
              <Input value={c.issuedBy || ''} onChange={(e) => set((d) => { d.client.issuedBy = e.target.value })} placeholder="авто по коду" />
            </Field>
          </>
        ) : (
          <>
            <Field label="ИНН">
              <Input value={c.inn || ''} onChange={(e) => set((d) => { d.client.inn = e.target.value })} />
            </Field>
            <Field label={c.type === 'entrepreneur' ? 'ОГРНИП' : 'ОГРН'}>
              <Input value={c.ogrn || ''} onChange={(e) => set((d) => { d.client.ogrn = e.target.value })} />
            </Field>
            <Field label="Юр. адрес" className="sm:col-span-2">
              <Input value={c.legalAddress || ''} onChange={(e) => set((d) => { d.client.legalAddress = e.target.value })} />
            </Field>
            <Field label="Расчётный счёт">
              <Input value={c.bankAccount || ''} onChange={(e) => set((d) => { d.client.bankAccount = e.target.value })} />
            </Field>
            <Field label="Банк / БИК">
              <Input value={c.bank || ''} onChange={(e) => set((d) => { d.client.bank = e.target.value })} placeholder="Банк" />
            </Field>
          </>
        )}
      </div>
    </Card>
  )
}

// ─────────────────────────  ПЛАТЕЖИ  ─────────────────────────
function PaymentsTab({ deal, editDeal }: { deal: Deal; editDeal: EditFn }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-2.5">
        {deal.payments.map((p, idx) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-tray/35 p-3 ring-1 ring-line sm:flex-nowrap">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-[13px] font-semibold text-ink-soft ring-1 ring-line nums">
              {idx + 1}
            </span>
            <input
              value={p.label}
              onChange={(e) => editDeal(deal.id, (d) => { d.payments.find((x) => x.id === p.id)!.label = e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-ink outline-none"
            />
            <input
              type="date"
              value={p.date}
              onChange={(e) => editDeal(deal.id, (d) => { d.payments.find((x) => x.id === p.id)!.date = e.target.value })}
              className="rounded-lg bg-surface px-2.5 py-1.5 text-[13px] text-ink-soft outline-none ring-1 ring-line nums"
            />
            <NumField
              className="w-32"
              value={p.amount}
              onChange={(n) => editDeal(deal.id, (d) => { d.payments.find((x) => x.id === p.id)!.amount = n })}
              suffix="₽"
              align="right"
            />
            <button
              onClick={() => editDeal(deal.id, (d) => { const x = d.payments.find((y) => y.id === p.id)!; x.paid = !x.paid })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all duration-300 ease-spring active:scale-95 ${
                p.paid ? 'bg-positive-soft text-positive' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
              }`}
            >
              <CheckCircle size={15} weight={p.paid ? 'fill' : 'regular'} />
              {p.paid ? 'Оплачен' : 'Ждём'}
            </button>
            <IconBtn className="h-8 w-8" onClick={() => editDeal(deal.id, (d) => { d.payments = d.payments.filter((x) => x.id !== p.id) })} title="Удалить">
              <Trash size={15} />
            </IconBtn>
          </div>
        ))}
      </div>
      <Btn
        className="mt-3"
        size="sm"
        variant="soft"
        leading={<Plus size={15} weight="bold" />}
        onClick={() => editDeal(deal.id, (d) => { d.payments.push({ id: uid(), label: `Платёж ${d.payments.length + 1}`, date: deal.date, amount: 0, paid: false, clientReminded: false, designerChecked: false }) })}
      >
        Добавить платёж
      </Btn>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink px-5 py-3.5 text-bg">
        <span className="text-[13px] text-bg/70">Оплачено {fmtRub(dealPaid(deal))} из {fmtRub(dealRevenue(deal))}</span>
        <span className="text-[15px] font-semibold nums">Осталось {fmtRub(dealDue(deal))}</span>
      </div>
    </Card>
  )
}

// ─────────────────────────  ДОКУМЕНТЫ + параметры допов/актов  ─────────────────────────
function DocsTab({ deal, openDoc }: { deal: Deal; openDoc: (id: string, k: DocKind) => void }) {
  const { editDeal, settings } = useApp()
  const a = deal.allonge
  const ap = deal.actParams
  return (
    <div className="space-y-4">
      {/* Допсоглашение */}
      <Card className="p-5 sm:p-6">
        <h3 className="text-[16px] text-ink">Параметры допсоглашения</h3>
        <p className="mt-1 text-[12.5px] text-muted">Отмеченные пункты, сумма и текст подставятся в документ «Допсоглашение».</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {settings.allongeTypes.map((t) => {
            const on = a.types.includes(t)
            return (
              <button
                key={t}
                onClick={() => editDeal(deal.id, (d) => { const arr = d.allonge.types; const i = arr.indexOf(t); if (i >= 0) arr.splice(i, 1); else arr.push(t) })}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200 ${
                  on ? 'bg-accent text-accent-ink' : 'bg-tray/60 text-ink-soft hover:bg-tray'
                }`}
              >
                {on && <Check size={12} weight="bold" />}
                {t}
              </button>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_190px]">
          <Field label="Текст допсоглашения">
            <Textarea rows={2} value={a.text} onChange={(e) => editDeal(deal.id, (d) => { d.allonge.text = e.target.value })} placeholder="Например: стороны договорились…" />
          </Field>
          <Field label="Новая итоговая сумма">
            <NumField value={a.newAmount} onChange={(n) => editDeal(deal.id, (d) => { d.allonge.newAmount = n })} suffix="₽" align="right" />
          </Field>
        </div>
      </Card>

      {/* Параметры актов */}
      <Card className="p-5 sm:p-6">
        <h3 className="text-[16px] text-ink">Параметры актов и уведомления</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Недостатки">
            <Textarea rows={2} value={ap.defects} onChange={(e) => editDeal(deal.id, (d) => { d.actParams.defects = e.target.value })} placeholder="Перечень недостатков для акта" />
          </Field>
          <Field label="Что добавить / доукомплектовать">
            <Textarea rows={2} value={ap.additions} onChange={(e) => editDeal(deal.id, (d) => { d.actParams.additions = e.target.value })} />
          </Field>
          <Field label="Сумма компенсации">
            <NumField value={ap.compensation} onChange={(n) => editDeal(deal.id, (d) => { d.actParams.compensation = n })} suffix="₽" align="right" />
          </Field>
          <Field label="Сумма возврата">
            <NumField value={ap.refund} onChange={(n) => editDeal(deal.id, (d) => { d.actParams.refund = n })} suffix="₽" align="right" />
          </Field>
          <Field label="Сумма ПКО" hint="для приходного ордера; пусто = ближайший платёж">
            <NumField value={deal.pkoAmount || 0} onChange={(n) => editDeal(deal.id, (d) => { d.pkoAmount = n })} suffix="₽" align="right" />
          </Field>
        </div>
      </Card>

      {/* Документы */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DOCS.map((doc) => {
          const Icon = DOC_ICON[doc.kind]
          const primary = doc.kind === 'contract'
          return (
            <Card key={doc.kind} className={`group p-5 transition-all duration-300 ease-spring hover:-translate-y-0.5 ${primary ? 'ring-accent/30' : ''}`}>
              <div className="flex items-start justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${primary ? 'bg-accent text-accent-ink' : 'bg-tray text-ink-soft'}`}>
                  <Icon size={20} weight={primary ? 'fill' : 'regular'} />
                </span>
                {primary && <Badge tone="accent">основной</Badge>}
              </div>
              <h4 className="mt-3 text-[16px] text-ink">{doc.title}</h4>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{doc.short}</p>
              <div className="mt-4 flex items-center gap-2">
                <Btn size="sm" variant={primary ? 'primary' : 'outline'} trailing={<CaretRight size={13} />} onClick={() => openDoc(deal.id, doc.kind)}>
                  Открыть
                </Btn>
                <IconBtn onClick={() => openDoc(deal.id, doc.kind)} title="Скачать">
                  <DownloadSimple size={17} />
                </IconBtn>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
