import type { Deal, LineItem, Settings, Variant } from './types'

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

const rubFine = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const fmtRub = (n: number): string => rub.format(Math.round(n || 0))
export const fmtRub2 = (n: number): string => rubFine.format(n || 0) + ' ₽'
export const fmtNum = (n: number): string => new Intl.NumberFormat('ru-RU').format(Math.round(n || 0))

export const fmtDate = (iso: string): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
}

export const fmtDateShort = (iso: string): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ──────────────────────────  Расчётные величины  ──────────────────────────

export const itemSum = (i: LineItem): number => (i.qty || 0) * (i.price || 0)
export const itemCostSum = (i: LineItem): number => (i.qty || 0) * (i.cost || 0)

// Вариант расчёта
export const variantItemsSum = (v: Variant): number => v.items.reduce((s, i) => s + itemSum(i), 0)
export const variantDelivery = (v: Variant): number => (v.delivery?.enabled ? v.delivery.amount || 0 : 0)
export const variantRevenue = (v: Variant): number => Math.max(0, variantItemsSum(v) + variantDelivery(v) - (v.discount || 0))
export const variantCost = (v: Variant): number => v.items.reduce((s, i) => s + itemCostSum(i), 0)
export const variantMargin = (v: Variant): number => {
  const r = variantRevenue(v)
  return r > 0 ? ((r - variantCost(v)) / r) * 100 : 0
}

// Сделка считается по ОСНОВНОМУ варианту
export const mainVariant = (d: Deal): Variant => d.variants.find((v) => v.id === d.mainVariantId) ?? d.variants[0]

export const dealRevenue = (d: Deal): number => variantRevenue(mainVariant(d))
export const dealCost = (d: Deal): number => variantCost(mainVariant(d))
export const dealProfit = (d: Deal): number => dealRevenue(d) - dealCost(d)
export const dealMargin = (d: Deal): number => {
  const rev = dealRevenue(d)
  return rev > 0 ? (dealProfit(d) / rev) * 100 : 0
}
export const dealWithInstall = (d: Deal): boolean => !!mainVariant(d).delivery?.enabled

export const dealPaid = (d: Deal): number =>
  d.payments.filter((p) => p.paid).reduce((s, p) => s + (p.amount || 0), 0)

export const dealDue = (d: Deal): number => Math.max(0, dealRevenue(d) - dealPaid(d))

// ──────────────────────────  Дата готовности (рабочие дни)  ──────────────────────────
const isoOf = (d: Date) => d.toISOString().slice(0, 10)
export const shiftDays = (iso: string, days: number): string => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return isoOf(d)
}
export function addWorkingDays(startISO: string, days: number, holidays: string[] = []): string {
  const hol = new Set(holidays)
  const d = new Date(startISO)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6 && !hol.has(isoOf(d))) added++
  }
  return isoOf(d)
}
export const readinessDate = (d: Deal, holidays: string[] = []): string => addWorkingDays(d.date, d.productionDays, holidays)

// ──────────────────────────  Движок напоминаний (checkAndSendReminders)  ──────────────────────────
export interface ReminderItem {
  dealId: string
  dealNumber: string
  clientName: string
  paymentId: string
  paymentLabel: string
  kind: 'client' | 'designer'
  amount: number
  paymentDate: string
  triggerDate: string
  status: 'sent' | 'due' | 'scheduled'
}

// Демо-«сегодня» (системная дата проекта). В проде заменяется на new Date().
export const TODAY = new Date('2026-06-09T10:00:00')

export function computeReminders(deals: Deal[], settings: Settings, today: Date = TODAY): ReminderItem[] {
  const t = isoOf(today)
  const out: ReminderItem[] = []
  for (const d of deals) {
    if (!d.reminderEnabled || d.archived) continue
    // Лимит из оригинала (F152): клиенту не напоминаем, если уже оплачено
    // достаточно «для запуска в работу». Дизайнеру контроль идёт всегда.
    const startLimit = (dealRevenue(d) * settings.commercial.startPercent) / 100
    const clientMuted = dealPaid(d) >= startLimit && startLimit > 0
    for (const p of d.payments) {
      if (p.paid || !(p.amount > 0)) continue
      const base = {
        dealId: d.id,
        dealNumber: d.number,
        clientName: d.client.name,
        paymentId: p.id,
        paymentLabel: p.label,
        amount: p.amount,
        paymentDate: p.date,
      }
      if (!clientMuted) {
        const clientTrig = shiftDays(p.date, -settings.reminders.clientDaysBefore)
        out.push({ ...base, kind: 'client', triggerDate: clientTrig, status: p.clientReminded ? 'sent' : clientTrig <= t ? 'due' : 'scheduled' })
      }
      const desTrig = shiftDays(p.date, settings.reminders.designerDaysAfter)
      out.push({ ...base, kind: 'designer', triggerDate: desTrig, status: p.designerChecked ? 'sent' : desTrig <= t ? 'due' : 'scheduled' })
    }
  }
  return out.sort((a, b) => a.triggerDate.localeCompare(b.triggerDate))
}

// ──────────────────────────  Маски конструктора документов  ──────────────────────────
// Подставляет данные расчёта в шаблон секции документа.
export function mergeDocTemplate(tpl: string, d: Deal, s: Settings): string {
  const v = mainVariant(d)
  const total = dealRevenue(d)
  const newAmount = d.allonge?.newAmount && d.allonge.newAmount > 0 ? d.allonge.newAmount : total
  const withInstall = !!v.delivery?.enabled
  return tpl
    .replaceAll('{{number}}', d.number)
    .replaceAll('{{date}}', fmtDate(d.date))
    .replaceAll('{{client}}', d.client.name || '—')
    .replaceAll('{{address}}', d.client.installAddress || '—')
    .replaceAll('{{total}}', fmtRub2(total))
    .replaceAll('{{totalWords}}', summaPropisyu(total).toLowerCase())
    .replaceAll('{{newTotal}}', fmtRub2(newAmount))
    .replaceAll('{{newTotalWords}}', summaPropisyu(newAmount).toLowerCase())
    .replaceAll('{{days}}', String(d.productionDays))
    .replaceAll('{{readyDate}}', fmtDate(readinessDate(d, s.holidays || [])))
    .replaceAll('{{designer}}', d.designer)
    .replaceAll('{{manager}}', s.brand.manager)
    .replaceAll('{{brand}}', s.brand.name)
    .replaceAll('{{company}}', s.company.legalName)
    .replaceAll('{{city}}', s.brand.city)
    .replaceAll('{{delivery}}', withInstall ? ', выполнить доставку и монтаж' : '')
    .replaceAll('{{readyMode}}', withInstall ? 'к монтажу' : 'к выдаче')
    .replaceAll('{{readyAction}}', withInstall ? 'монтажа' : 'получения')
    .replaceAll('{{defects}}', d.actParams?.defects || '—')
    .replaceAll('{{compensation}}', fmtRub2(d.actParams?.compensation || 0))
    .replaceAll('{{refund}}', fmtRub2(d.actParams?.refund || 0))
    .replaceAll('{{additions}}', d.actParams?.additions || '—')
}

// ──────────────────────────  Сумма прописью (порт из Apps Script)  ──────────────────────────

export function summaPropisyu(value: number): string {
  if (isNaN(value) || value === null) return ''
  const rubles = Math.floor(value)
  let kop: string | number = Math.round((value - rubles) * 100)
  if (kop < 10) kop = '0' + kop

  const words = [
    ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
    ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
    ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
    ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'],
  ]
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
  const forms: [string, string, string, number][] = [
    ['рубль', 'рубля', 'рублей', 0],
    ['тысяча', 'тысячи', 'тысяч', 1],
    ['миллион', 'миллиона', 'миллионов', 0],
  ]

  if (rubles === 0) return 'ноль рублей ' + kop + ' копеек'

  let str = ''
  let r = rubles.toString()
  const parts: string[] = []
  while (r.length > 0) {
    parts.push(r.slice(-3))
    r = r.slice(0, -3)
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parseInt(parts[i], 10)
    if (part === 0) continue
    const gender = forms[i][3]
    let s = ''
    const n1 = part % 10
    const n10 = Math.floor(part / 10) % 10
    const n100 = Math.floor(part / 100)
    if (n100 > 0) s += words[3][n100] + ' '
    if (n10 === 1) {
      s += teens[n1] + ' '
    } else {
      if (n10 > 1) s += words[2][n10] + ' '
      if (n1 > 0) s += words[gender][n1] + ' '
    }
    let idx = 2
    if (n10 !== 1) {
      if (n1 === 1) idx = 0
      else if (n1 >= 2 && n1 <= 4) idx = 1
    }
    s += forms[i][idx] + ' '
    str = s + str
  }

  const finalResult = str.trim() + ' ' + kop + ' копеек'
  return finalResult.charAt(0).toUpperCase() + finalResult.slice(1)
}
