import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Deal, DocKind, Route, Settings, Toast } from './types'
import { defaultSettings, makeSeedDeals } from './seed'
import { computeReminders, fmtRub, mainVariant } from './money'

const uid = () => Math.random().toString(36).slice(2, 9)
const today = () => new Date().toISOString().slice(0, 10)

export function applyAccent(hex: string) {
  document.documentElement.style.setProperty('--c-accent', hex)
}

interface AppState {
  route: Route
  settings: Settings
  deals: Deal[]
  toasts: Toast[]
  doc: { dealId: string; kind: DocKind } | null

  navigate: (r: Route) => void

  editDeal: (id: string, mut: (d: Deal) => void) => void
  createDeal: () => void
  duplicateDeal: (id: string) => void
  archiveDeal: (id: string) => void
  signDeal: (id: string) => void

  addVariant: (id: string) => void
  setMainVariant: (id: string, variantId: string) => void
  removeVariant: (id: string, variantId: string) => void

  runReminders: () => void
  sendReminder: (dealId: string, paymentId: string, kind: 'client' | 'designer') => void

  editSettings: (mut: (s: Settings) => void) => void

  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void

  openDoc: (dealId: string, kind: DocKind) => void
  closeDoc: () => void
  sendDoc: (channel: 'vk' | 'email') => void

  resetDemo: () => void
}

const blankDeal = (number: string): Deal => {
  const vId = 'v' + uid()
  return {
    id: 'd-' + uid(),
    number,
    date: today(),
    status: 'calc',
    designer: 'Александр Кривчиков',
    reminderEnabled: false,
    reminderHour: 13,
    productionDays: 45,
    payMethod: 'transfer',
    allonge: { types: [], newAmount: 0, text: '' },
    actParams: { defects: '', compensation: 0, refund: 0, additions: '' },
    createdAt: today(),
    client: { type: 'individual', name: '', phone: '', contact: '', installAddress: '' },
    variants: [
      {
        id: vId,
        name: 'Расчёт',
        items: [{ id: uid(), group: 'ЛДСП', name: 'Корпуса', detail: '', qty: 0, unit: 'м²', price: 3200, cost: 1700 }],
        discount: 0,
        delivery: { enabled: true, amount: 9000 },
      },
    ],
    mainVariantId: vId,
    payments: [
      { id: uid(), label: 'Аванс 50%', date: today(), amount: 0, paid: false, clientReminded: false, designerChecked: false },
    ],
  }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      route: { name: 'dashboard' },
      settings: defaultSettings,
      deals: makeSeedDeals(),
      toasts: [],
      doc: null,

      navigate: (route) => set({ route }),

      editDeal: (id, mut) =>
        set((s) => ({
          deals: s.deals.map((d) => {
            if (d.id !== id) return d
            const copy = structuredClone(d)
            mut(copy)
            return copy
          }),
        })),

      createDeal: () => {
        const nextNum = String(
          Math.max(2000, ...get().deals.map((d) => parseInt(d.number, 10) || 0)) + 1,
        )
        const deal = blankDeal(nextNum)
        set((s) => ({ deals: [deal, ...s.deals], route: { name: 'deal', id: deal.id } }))
        get().toast({ kind: 'success', title: 'Создан новый расчёт', detail: `Договор №${nextNum}` })
      },

      duplicateDeal: (id) => {
        const src = get().deals.find((d) => d.id === id)
        if (!src) return
        const copy = structuredClone(src)
        copy.id = 'd-' + uid()
        copy.number = src.number + '-копия'
        copy.status = 'calc'
        copy.signed = false
        copy.archived = false
        copy.variants = copy.variants.map((v) => ({ ...v, id: 'v' + uid(), items: v.items.map((i) => ({ ...i, id: uid() })) }))
        copy.mainVariantId = copy.variants[0].id
        copy.payments = copy.payments.map((p) => ({ ...p, id: uid(), paid: false, clientReminded: false, designerChecked: false }))
        set((s) => ({ deals: [copy, ...s.deals], route: { name: 'deal', id: copy.id } }))
        get().toast({ kind: 'info', title: 'Расчёт дублирован', detail: 'Создана независимая копия' })
      },

      archiveDeal: (id) => {
        get().editDeal(id, (d) => {
          d.archived = true
          d.status = 'closed'
        })
        get().toast({ kind: 'success', title: 'Расчёт закрыт и заархивирован' })
      },

      // «Договор подписан» — заморозка даты, генерация пакета, отправка, запуск в работу (renameAndMoveTable)
      signDeal: (id) => {
        const deal = get().deals.find((d) => d.id === id)
        if (!deal) return
        const viaVk = !deal.client.contact.includes('@')
        get().editDeal(id, (d) => {
          d.signed = true
          d.status = 'production'
          d.date = today()
        })
        get().toast({ kind: 'success', title: 'Дата договора зафиксирована', detail: `№${deal.number}` })
        get().toast({ kind: 'success', title: 'Пакет документов сформирован', detail: 'Договор, спецификация, акты — сохранены' })
        get().toast({ kind: 'sent', title: `Договор отправлен ${viaVk ? 'в VK' : 'на e-mail'}`, detail: deal.client.name })
      },

      // Варианты расчёта (addNewCalculationOption / setMainCalculationOption)
      addVariant: (id) => {
        const deal = get().deals.find((d) => d.id === id)
        if (!deal) return
        const src = mainVariant(deal)
        const maxN = Math.max(1, ...deal.variants.map((v) => parseInt((v.name.match(/\d+/) || ['1'])[0], 10) || 1))
        const newId = 'v' + uid()
        get().editDeal(id, (d) => {
          d.variants.push({ ...structuredClone(src), id: newId, name: 'Расчёт ' + (maxN + 1), items: src.items.map((i) => ({ ...i, id: uid() })) })
        })
        get().toast({ kind: 'info', title: 'Добавлен вариант расчёта', detail: 'Расчёт ' + (maxN + 1) })
      },
      setMainVariant: (id, variantId) => {
        get().editDeal(id, (d) => { d.mainVariantId = variantId })
        get().toast({ kind: 'success', title: 'Вариант выбран основным', detail: 'Документы считаются по нему' })
      },
      removeVariant: (id, variantId) => {
        const deal = get().deals.find((d) => d.id === id)
        if (!deal || deal.variants.length <= 1) return
        get().editDeal(id, (d) => {
          d.variants = d.variants.filter((v) => v.id !== variantId)
          if (d.mainVariantId === variantId) d.mainVariantId = d.variants[0].id
        })
      },

      // Движок напоминаний (checkAndSendReminders)
      runReminders: () => {
        const { deals, settings } = get()
        const due = computeReminders(deals, settings).filter((r) => r.status === 'due')
        if (due.length === 0) {
          get().toast({ kind: 'info', title: 'Напоминаний к отправке нет', detail: 'Все актуальные уже отправлены' })
          return
        }
        set((s) => ({
          deals: s.deals.map((d) => {
            const mine = due.filter((r) => r.dealId === d.id)
            if (mine.length === 0) return d
            const copy = structuredClone(d)
            for (const r of mine) {
              const p = copy.payments.find((x) => x.id === r.paymentId)
              if (!p) continue
              if (r.kind === 'client') p.clientReminded = true
              else p.designerChecked = true
            }
            return copy
          }),
        }))
        const clients = due.filter((r) => r.kind === 'client').length
        const designers = due.filter((r) => r.kind === 'designer').length
        get().toast({ kind: 'sent', title: `Отправлено напоминаний: ${due.length}`, detail: `Клиентам — ${clients}, дизайнеру — ${designers}` })
      },
      sendReminder: (dealId, paymentId, kind) => {
        const deal = get().deals.find((d) => d.id === dealId)
        const pay = deal?.payments.find((p) => p.id === paymentId)
        get().editDeal(dealId, (d) => {
          const p = d.payments.find((x) => x.id === paymentId)
          if (!p) return
          if (kind === 'client') p.clientReminded = true
          else p.designerChecked = true
        })
        const who = kind === 'client' ? deal?.client.name : deal?.designer
        get().toast({ kind: 'sent', title: kind === 'client' ? 'Напоминание клиенту отправлено' : 'Контроль отправлен дизайнеру', detail: pay ? `${who} · ${fmtRub(pay.amount)}` : who })
      },

      editSettings: (mut) =>
        set((s) => {
          const copy = structuredClone(s.settings)
          mut(copy)
          applyAccent(copy.brand.accent)
          return { settings: copy }
        }),

      toast: (t) => {
        const id = uid()
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
        setTimeout(() => get().dismissToast(id), 4200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      openDoc: (dealId, kind) => set({ doc: { dealId, kind } }),
      closeDoc: () => set({ doc: null }),
      sendDoc: (channel) => {
        const doc = get().doc
        if (!doc) return
        const deal = get().deals.find((d) => d.id === doc.dealId)
        const via = channel === 'vk' ? 'ВКонтакте' : 'на e-mail'
        set({ doc: null })
        get().toast({
          kind: 'sent',
          title: `Документ отправлен ${via}`,
          detail: deal ? `${deal.client.name || 'Заказчику'} · ${deal.client.contact || ''}` : undefined,
        })
      },

      resetDemo: () => {
        applyAccent(defaultSettings.brand.accent)
        set({ settings: structuredClone(defaultSettings), deals: makeSeedDeals(), route: { name: 'dashboard' }, doc: null })
        get().toast({ kind: 'info', title: 'Демо-данные восстановлены' })
      },
    }),
    {
      name: 'korpus-crm-v3',
      partialize: (s) => ({ settings: s.settings, deals: s.deals }),
    },
  ),
)
