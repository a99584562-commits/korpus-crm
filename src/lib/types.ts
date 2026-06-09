// ──────────────────────────  Domain model  ──────────────────────────

export type PartyType = 'individual' | 'company' | 'entrepreneur'

export type DealStatus = 'calc' | 'contract' | 'production' | 'installation' | 'closed'

export interface LineItem {
  id: string
  group: string // ЛДСП, Фасады, Столешница, Фурнитура …
  name: string
  detail?: string // цвет / материал / комплектующие
  qty: number
  unit: string // шт, м², компл.
  price: number // продажная цена за единицу
  cost: number // себестоимость за единицу
}

export interface Payment {
  id: string
  label: string
  date: string // ISO yyyy-mm-dd
  amount: number
  paid: boolean
  clientReminded: boolean
  designerChecked: boolean
}

export interface Client {
  type: PartyType
  name: string
  phone: string
  contact: string // email или vk-ссылка
  installAddress: string
  regAddress?: string
  passport?: string
  birthDate?: string
  deptCode?: string // код подразделения
  issuedBy?: string // кем выдан (автоподстановка по коду)
  // юрлицо / ИП
  inn?: string
  ogrn?: string
  legalAddress?: string
  director?: string
  bankAccount?: string
  bank?: string
  bik?: string
}

// Вариант расчёта внутри сделки (Расчёт, Расчёт 2, …)
export interface Variant {
  id: string
  name: string
  items: LineItem[]
  discount: number // абсолютная скидка, ₽
  delivery: { enabled: boolean; amount: number } // доставка и установка
}

// Допсоглашение (блок изменений к договору)
export interface Allonge {
  types: string[] // выбранные типы изменений
  newAmount: number // новая итоговая сумма
  text: string // свободный текст
}

// Параметры для актов / уведомления
export interface ActParams {
  defects: string // недостатки
  compensation: number // сумма компенсации
  refund: number // сумма возврата
  additions: string // что добавить
}

export interface Deal {
  id: string
  number: string // № договора
  date: string // ISO
  status: DealStatus
  signed?: boolean // договор подписан (renameAndMoveTable)
  client: Client
  designer: string
  variants: Variant[] // варианты расчёта; основной = mainVariantId
  mainVariantId: string
  payMethod: 'cash' | 'transfer' // наличные / перевод
  payments: Payment[]
  pkoAmount?: number // сумма ПКО (если задана вручную)
  reminderEnabled: boolean
  reminderHour: number // час напоминания (0-23)
  productionDays: number
  allonge: Allonge
  actParams: ActParams
  createdAt: string
  archived?: boolean
}

// ──────────────────────────  Документы  ──────────────────────────

export type DocKind =
  | 'contract'
  | 'pko'
  | 'allonge'
  | 'notice'
  | 'act_product'
  | 'act_install'
  | 'act_unilateral'

export interface DocDef {
  kind: DocKind
  title: string
  short: string
}

// ──────────────────────────  Настройки (админка)  ──────────────────────────

export interface MaterialRow {
  id: string
  group: string // ЛДСП / Кромка / Фасады / Фурнитура / Столешница
  name: string
  unit: string
  price: number
}

// Категория-блок сметы (настраивается в админке)
export interface CategoryDef {
  id: string
  name: string // ЛДСП, Фасады, Столешница, Стеновая панель, Петли, Направляющие, Кромка
  detailLabel: string // подпись под-поля: «Материал / комплектующие», «Цвет», «Фирма», «Длина», «Толщина»
  unit: string // единица по умолчанию
  kind?: 'edge' // спец-рендер для кромки
}

export interface MessageTemplate {
  id: string
  title: string
  hint: string
  body: string
}

export interface Settings {
  brand: {
    name: string
    tagline: string
    accent: string
    manager: string // подпись менеджера в сообщениях
    city: string
  }
  company: {
    legalName: string
    inn: string
    ogrn: string
    legalAddress: string
    bankAccount: string
    bank: string
    bik: string
    corrAccount: string
  }
  reminders: {
    enabled: boolean
    clientDaysBefore: number
    designerDaysAfter: number
    hour: number
  }
  integrations: {
    vkEnabled: boolean
    vkToken: string
    emailEnabled: boolean
    emailFrom: string
  }
  commercial: {
    signPercent: number // % для заключения договора
    startPercent: number // % для запуска в работу
  }
  categories: CategoryDef[]
  allongeTypes: string[] // типы изменений для допсоглашения
  passportDepts: { code: string; name: string }[] // справочник: код подразделения → кем выдан
  holidays: string[] // нерабочие дни (ISO) для расчёта даты готовности
  materials: MaterialRow[]
  messages: MessageTemplate[]
}

export type Route =
  | { name: 'dashboard' }
  | { name: 'deals' }
  | { name: 'deal'; id: string }
  | { name: 'admin'; tab?: AdminTab }

export type AdminTab = 'brand' | 'company' | 'blocks' | 'materials' | 'messages' | 'reminders' | 'integrations'

export interface Toast {
  id: string
  kind: 'success' | 'info' | 'sent'
  title: string
  detail?: string
}
