import type { Client, Deal, DealStatus, DocDef, LineItem, MaterialRow, MessageTemplate, Payment, Settings, Variant } from './types'

interface RawDeal {
  id: string
  number: string
  date: string
  status: DealStatus
  designer: string
  client: Client
  items: LineItem[]
  discount: number
  withInstall: boolean
  payments: Payment[]
  reminderEnabled: boolean
  reminderHour: number
  productionDays: number
  createdAt: string
  archived?: boolean
}

// ──────────────────  Конструктор документов: секции и стандартные тексты  ──────────────────

export interface DocSection {
  id: string
  title: string
  hint: string
  rows: number
}

export const DOC_SECTIONS: DocSection[] = [
  { id: 'contract_subject', title: 'Договор — предмет договора (п. 1)', hint: 'основной абзац', rows: 3 },
  { id: 'contract_rules', title: 'Договор — Приложение №2 «Правила эксплуатации»', hint: 'каждый пункт с новой строки', rows: 6 },
  { id: 'contract_care', title: 'Договор — Приложение №3 «Памятка по уходу»', hint: 'каждый пункт с новой строки', rows: 5 },
  { id: 'allonge_final', title: 'Допсоглашение — итоговый абзац', hint: 'после списка изменений', rows: 2 },
  { id: 'notice_body', title: 'Уведомление — текст', hint: '', rows: 2 },
  { id: 'act_product_body', title: 'Акт изделия — текст', hint: '', rows: 2 },
  { id: 'act_install_body', title: 'Акт монтажа — текст', hint: '', rows: 2 },
  { id: 'act_unilateral_body', title: 'Акт односторонний — текст', hint: '', rows: 3 },
]

export const DOC_TPL_DEFAULTS: Record<string, string> = {
  contract_subject:
    'Исполнитель обязуется изготовить корпусную мебель по индивидуальному заказу согласно Спецификации (Приложение №1){{delivery}}, а Заказчик — принять и оплатить изделие. Срок изготовления — {{days}} рабочих дней (ориентировочная готовность — {{readyDate}}).',
  contract_rules: [
    'Эксплуатировать изделие при влажности 45–70% и температуре +10…+30 °C, избегая прямого контакта с водой и паром.',
    'Не размещать нагревательные приборы ближе 30 см к фасадам и корпусу.',
    'Беречь поверхности от абразивов, растворителей и спиртосодержащих средств.',
    'Регулировку петель и направляющих производить не реже одного раза в год.',
    'Максимальная нагрузка на полку — 15 кг, на выдвижной ящик — 25 кг.',
  ].join('\n'),
  contract_care: [
    'Протирать поверхности мягкой влажной тканью, насухо вытирая после уборки.',
    'Для глянцевых и эмалевых фасадов использовать специальные неабразивные средства.',
    'Своевременно удалять пролитую жидкость с торцов и кромок.',
    'Гарантия — 18 месяцев при соблюдении правил эксплуатации.',
  ].join('\n'),
  allonge_final:
    'Новая итоговая стоимость составляет {{newTotal}} ({{newTotalWords}}). Остальные условия договора остаются неизменными.',
  notice_body:
    'Уведомляем, что изделие по договору № {{number}} готово {{readyMode}}. Просим согласовать дату {{readyAction}} по адресу: {{address}}.',
  act_product_body:
    'Исполнитель сдал, а Заказчик принял изделие по договору № {{number}} по адресу: {{address}}. Стоимость — {{total}}.',
  act_install_body:
    'Исполнитель сдал, а Заказчик принял монтажные работы по договору № {{number}} по адресу: {{address}}. Стоимость — {{total}}.',
  act_unilateral_body:
    'Исполнитель сдал изделие по договору № {{number}} по адресу: {{address}}. Стоимость — {{total}}. Акт составлен в одностороннем порядке в связи с уклонением Заказчика от приёмки.',
}

// Текст секции: правка пользователя из админки или стандартный
export const getDocTpl = (s: Settings, id: string): string => s.docTemplates?.[id] ?? DOC_TPL_DEFAULTS[id] ?? ''

export const DOCS: DocDef[] = [
  { kind: 'contract', title: 'Договор', short: 'Договор + спецификация, правила, памятка' },
  { kind: 'pko', title: 'ПКО', short: 'Приходный кассовый ордер' },
  { kind: 'allonge', title: 'Допсоглашение', short: 'Изменение условий договора' },
  { kind: 'notice', title: 'Уведомление', short: 'Уведомление заказчику' },
  { kind: 'act_product', title: 'Акт изделия', short: 'Передача готового изделия' },
  { kind: 'act_install', title: 'Акт монтажа', short: 'Выполнение монтажных работ' },
  { kind: 'act_unilateral', title: 'Акт односторонний', short: 'Односторонний акт приёмки' },
]

const MATERIALS: MaterialRow[] = [
  { id: 'm1', group: 'ЛДСП', name: 'Ламарти Белый влагостойкий 16 мм', unit: 'м²', price: 3800 },
  { id: 'm2', group: 'ЛДСП', name: 'Ламарти Графит 16 мм', unit: 'м²', price: 3400 },
  { id: 'm3', group: 'ЛДСП', name: 'Ламарти Дуб Сонома 16 мм', unit: 'м²', price: 3200 },
  { id: 'm4', group: 'ЛДСП', name: 'Ламарти Бетон пайн белый 16 мм', unit: 'м²', price: 3200 },
  { id: 'm5', group: 'Кромка', name: 'Кромка ПВХ в цвет 2 мм', unit: 'м', price: 95 },
  { id: 'm6', group: 'Кромка', name: 'Кромка ПВХ в цвет 0,4 мм', unit: 'м', price: 40 },
  { id: 'm7', group: 'Фасады', name: 'Фасад МДФ эмаль матовая', unit: 'м²', price: 9800 },
  { id: 'm8', group: 'Фасады', name: 'Фасад МДФ плёнка ПВХ', unit: 'м²', price: 5400 },
  { id: 'm9', group: 'Фасады', name: 'Фасад АГТ глянец', unit: 'м²', price: 7600 },
  { id: 'm10', group: 'Столешница', name: 'Столешница кварц 38 мм', unit: 'пог.м', price: 12500 },
  { id: 'm11', group: 'Столешница', name: 'Столешница ЛДСП постформинг 38 мм', unit: 'пог.м', price: 2900 },
  { id: 'm12', group: 'Петли', name: 'Петля Blum CLIP top с доводчиком', unit: 'шт', price: 420 },
  { id: 'm13', group: 'Петли', name: 'Подъёмник Blum Aventos HF', unit: 'компл.', price: 6800 },
  { id: 'm14', group: 'Направляющие', name: 'Направляющие Blum Tandembox', unit: 'компл.', price: 2300 },
  { id: 'm15', group: 'Направляющие', name: 'Ручка-профиль Gola алюминий', unit: 'пог.м', price: 760 },
  { id: 'm16', group: 'Столешница', name: 'Столешница массив дуба 40 мм', unit: 'пог.м', price: 9800 },
  { id: 'm17', group: 'Стеновая панель', name: 'Стеновая панель ХДФ под плитку', unit: 'пог.м', price: 1900 },
]

const MESSAGES: MessageTemplate[] = [
  {
    id: 'client_reminder',
    title: 'Напоминание клиенту об оплате',
    hint: 'Отправляется автоматически за N дней до даты платежа',
    body: 'Добрый день, {{client}}! Это {{manager}} из {{brand}}. Напоминаю, что необходимо внести платёж {{amount}} по договору №{{number}} до {{date}}. Если возникнут вопросы — свяжитесь со мной.',
  },
  {
    id: 'designer_reminder',
    title: 'Контроль платежа дизайнеру',
    hint: 'Отправляется дизайнеру через N дней после даты платежа',
    body: '{{designer}}, проверь платёж {{amount}} (оплата до {{date}}) по договору №{{number}}.',
  },
  {
    id: 'doc_contract',
    title: 'Сопровождение договора',
    hint: 'Текст письма при отправке договора',
    body: 'Добрый день, {{client}}! Это {{manager}} из {{brand}}. Направляю договор №{{number}}. Ознакомьтесь и в ответном сообщении напишите, что подтверждаете условия.',
  },
  {
    id: 'doc_generic',
    title: 'Сопровождение документа',
    hint: 'Текст при отправке акта / ПКО / уведомления',
    body: 'Добрый день, {{client}}! Это {{manager}} из {{brand}}. Направляю {{document}} по договору №{{number}}.',
  },
]

export const defaultSettings: Settings = {
  brand: {
    name: 'КОРПУС',
    tagline: 'Мебельное производство',
    accent: '#a8612f',
    manager: 'Алексей Корнев',
    city: 'Москва',
  },
  company: {
    legalName: 'ООО «Корпус-Мебель»',
    inn: '7701234567',
    ogrn: '1187746000000',
    legalAddress: '125009, г. Москва, ул. Тверская, д. 12, оф. 5',
    bankAccount: '40702810400000012345',
    bank: 'ПАО Сбербанк',
    bik: '044525225',
    corrAccount: '30101810400000000225',
  },
  reminders: { enabled: true, clientDaysBefore: 3, designerDaysAfter: 3, hour: 13 },
  integrations: {
    vkEnabled: true,
    vkToken: 'vk1.a.•••••••••••••••• (скрыт)',
    emailEnabled: true,
    emailFrom: 'zakaz@korpus-mebel.ru',
  },
  commercial: { signPercent: 30, startPercent: 60 },
  categories: [
    { id: 'c1', name: 'ЛДСП', detailLabel: 'Материал / комплектующие', unit: 'м²' },
    { id: 'c2', name: 'Фасады', detailLabel: 'Материал / комплектующие', unit: 'м²' },
    { id: 'c3', name: 'Столешница', detailLabel: 'Цвет', unit: 'пог.м' },
    { id: 'c4', name: 'Стеновая панель', detailLabel: 'Цвет', unit: 'пог.м' },
    { id: 'c5', name: 'Петли', detailLabel: 'Фирма', unit: 'шт' },
    { id: 'c6', name: 'Направляющие', detailLabel: 'Длина', unit: 'компл.' },
    { id: 'c7', name: 'Кромка', detailLabel: 'Толщина', unit: 'м', kind: 'edge' },
  ],
  allongeTypes: [
    'Увеличение стоимости',
    'Уменьшение стоимости',
    'Изменение комплектации',
    'Изменение сроков оплаты',
    'Скидка без устранения недостатков',
    'Расторжение договора',
    'Свободная форма',
  ],
  passportDepts: [
    { code: '770-001', name: 'ОВД района Хамовники г. Москвы' },
    { code: '770-002', name: 'ОВД района Арбат г. Москвы' },
    { code: '770-053', name: 'Отделом УФМС России по гор. Москве по району Северное Бутово' },
    { code: '500-008', name: 'ГУ МВД России по Московской области' },
    { code: '500-112', name: 'ТП в гор. Химки ОУФМС России по Московской области' },
    { code: '110-001', name: 'Отдел УФМС России по Республике Коми в г. Сыктывкаре' },
  ],
  holidays: ['2026-01-01', '2026-01-02', '2026-01-07', '2026-02-23', '2026-03-09', '2026-05-01', '2026-05-11', '2026-06-12', '2026-11-04'],
  materials: MATERIALS,
  messages: MESSAGES,
}

const emptyAllonge = () => ({ types: [] as string[], newAmount: 0, text: '' })
const emptyActParams = () => ({ defects: '', compensation: 0, refund: 0, additions: '' })

export function makeSeedDeals(): Deal[] {
  const raw: RawDeal[] = [
    {
      id: 'd-2041',
      number: '2041',
      date: '2026-05-28',
      status: 'production',
      designer: 'Александр Кривчиков',
      withInstall: true,
      reminderEnabled: true,
      reminderHour: 13,
      productionDays: 45,
      createdAt: '2026-05-28',
      client: {
        type: 'individual',
        name: 'Соколова Мария Андреевна',
        phone: '+7 916 482-11-09',
        contact: 'https://vk.com/m.sokolova',
        installAddress: 'г. Москва, ул. Профсоюзная, д. 44, кв. 117',
        regAddress: 'г. Москва, ул. Профсоюзная, д. 44, кв. 117',
        passport: '4519 882104',
        birthDate: '1989-03-14',
        deptCode: '770-001',
        issuedBy: 'ОВД района Хамовники г. Москвы',
      },
      items: [
        { id: 'i1', group: 'ЛДСП', name: 'Корпуса нижние/верхние', detail: 'Ламарти Белый влагостойкий', qty: 14.5, unit: 'м²', price: 3800, cost: 1980 },
        { id: 'i2', group: 'Фасады', name: 'Фасады кухни', detail: 'МДФ эмаль матовая, RAL 7044', qty: 9.2, unit: 'м²', price: 9800, cost: 5200 },
        { id: 'i3', group: 'Столешница', name: 'Столешница рабочая зона', detail: 'Кварц, 38 мм', qty: 4.4, unit: 'пог.м', price: 12500, cost: 7400 },
        { id: 'i4', group: 'Петли', name: 'Петли с доводчиком', detail: 'Blum CLIP top', qty: 28, unit: 'шт', price: 420, cost: 250 },
        { id: 'i5', group: 'Направляющие', name: 'Ящики Tandembox', detail: '450 мм', qty: 8, unit: 'компл.', price: 2300, cost: 1450 },
        { id: 'i6', group: 'Кромка', name: 'Кромка в цвет', detail: '2 мм', qty: 46, unit: 'м', price: 95, cost: 40 },
      ],
      discount: 12000,
      payments: [
        { id: 'p1', label: 'Аванс 50%', date: '2026-05-28', amount: 165000, paid: true, clientReminded: true, designerChecked: true },
        { id: 'p2', label: 'Запуск в работу', date: '2026-06-18', amount: 99000, paid: false, clientReminded: false, designerChecked: false },
        { id: 'p3', label: 'Перед монтажом', date: '2026-07-10', amount: 66165, paid: false, clientReminded: false, designerChecked: false },
      ],
    },
    {
      id: 'd-2038',
      number: '2038',
      date: '2026-05-12',
      status: 'installation',
      designer: 'Ирина Власова',
      withInstall: true,
      reminderEnabled: true,
      reminderHour: 11,
      productionDays: 40,
      createdAt: '2026-05-12',
      client: {
        type: 'company',
        name: 'ООО «Гранд Отель»',
        phone: '+7 495 120-44-80',
        contact: 'snab@grandhotel.ru',
        installAddress: 'г. Москва, Кутузовский пр-т, д. 2/1',
        inn: '7704123456',
        ogrn: '1157746000000',
        legalAddress: 'г. Москва, Кутузовский пр-т, д. 2/1, оф. 300',
        director: 'Генеральный директор Петров И.С.',
        bankAccount: '40702810900000099887',
        bank: 'АО «Альфа-Банк»',
        bik: '044525593',
      },
      items: [
        { id: 'i1', group: 'ЛДСП', name: 'Стойки ресепшн', detail: 'Ламарти Графит', qty: 22, unit: 'м²', price: 3400, cost: 1820 },
        { id: 'i2', group: 'Фасады', name: 'Фасады декоративные', detail: 'АГТ глянец', qty: 16, unit: 'м²', price: 7600, cost: 4100 },
        { id: 'i3', group: 'Фурнитура', name: 'Подъёмники', detail: 'Blum Aventos HF', qty: 6, unit: 'компл.', price: 6800, cost: 4300 },
      ],
      discount: 0,
      payments: [
        { id: 'p1', label: 'Аванс 60%', date: '2026-05-12', amount: 276000, paid: true, clientReminded: true, designerChecked: true },
        { id: 'p2', label: 'Окончательный', date: '2026-06-14', amount: 184000, paid: false, clientReminded: true, designerChecked: false },
      ],
    },
    {
      id: 'd-2045',
      number: '2045',
      date: '2026-06-05',
      status: 'contract',
      designer: 'Александр Кривчиков',
      withInstall: false,
      reminderEnabled: true,
      reminderHour: 13,
      productionDays: 35,
      createdAt: '2026-06-05',
      client: {
        type: 'entrepreneur',
        name: 'ИП Жуков Денис Олегович',
        phone: '+7 903 771-25-63',
        contact: 'd.zhukov@mail.ru',
        installAddress: 'г. Химки, ул. Молодёжная, д. 7',
        inn: '503812345678',
        ogrn: '320500000012345',
        legalAddress: 'г. Химки, ул. Молодёжная, д. 7',
        bankAccount: '40802810500000054321',
        bank: 'ПАО Сбербанк',
        bik: '044525225',
      },
      items: [
        { id: 'i1', group: 'ЛДСП', name: 'Корпус шкафов', detail: 'Ламарти Дуб Сонома', qty: 19, unit: 'м²', price: 3200, cost: 1700 },
        { id: 'i2', group: 'Фасады', name: 'Фасады', detail: 'МДФ плёнка ПВХ', qty: 11, unit: 'м²', price: 5400, cost: 2900 },
        { id: 'i3', group: 'Фурнитура', name: 'Ручки-профиль Gola', detail: 'Алюминий', qty: 14, unit: 'пог.м', price: 760, cost: 410 },
      ],
      discount: 5000,
      payments: [
        { id: 'p1', label: 'Аванс 50%', date: '2026-06-08', amount: 62000, paid: false, clientReminded: false, designerChecked: false },
        { id: 'p2', label: 'Перед отгрузкой', date: '2026-07-01', amount: 57080, paid: false, clientReminded: false, designerChecked: false },
      ],
    },
    {
      id: 'd-2049',
      number: '2049',
      date: '2026-06-08',
      status: 'calc',
      designer: 'Ирина Власова',
      withInstall: true,
      reminderEnabled: false,
      reminderHour: 13,
      productionDays: 45,
      createdAt: '2026-06-08',
      client: {
        type: 'individual',
        name: 'Тихонов Артём Владимирович',
        phone: '+7 921 004-58-12',
        contact: 'https://vk.com/a.tikhonov',
        installAddress: 'г. Мытищи, ул. Лётная, д. 21, кв. 64',
      },
      items: [
        { id: 'i1', group: 'ЛДСП', name: 'Гардеробная', detail: 'Ламарти Бетон пайн белый', qty: 26, unit: 'м²', price: 3200, cost: 1680 },
        { id: 'i2', group: 'Фурнитура', name: 'Ящики', detail: 'Blum Tandembox', qty: 12, unit: 'компл.', price: 2300, cost: 1450 },
      ],
      discount: 0,
      payments: [
        { id: 'p1', label: 'Аванс 50%', date: '2026-06-16', amount: 60000, paid: false, clientReminded: false, designerChecked: false },
        { id: 'p2', label: 'Перед монтажом', date: '2026-07-12', amount: 56300, paid: false, clientReminded: false, designerChecked: false },
      ],
    },
    {
      id: 'd-2031',
      number: '2031',
      date: '2026-04-20',
      status: 'closed',
      designer: 'Александр Кривчиков',
      withInstall: true,
      reminderEnabled: false,
      reminderHour: 13,
      productionDays: 40,
      createdAt: '2026-04-20',
      archived: true,
      client: {
        type: 'individual',
        name: 'Беляева Ольга Сергеевна',
        phone: '+7 905 332-90-44',
        contact: 'o.belyaeva@yandex.ru',
        installAddress: 'г. Москва, ул. Авиамоторная, д. 50, кв. 88',
      },
      items: [
        { id: 'i1', group: 'ЛДСП', name: 'Кухня корпус', detail: 'Ламарти Белый влагостойкий', qty: 12, unit: 'м²', price: 3800, cost: 1980 },
        { id: 'i2', group: 'Фасады', name: 'Фасады', detail: 'МДФ эмаль матовая', qty: 7.5, unit: 'м²', price: 9800, cost: 5200 },
        { id: 'i3', group: 'Столешница', name: 'Столешница', detail: 'ЛДСП постформинг', qty: 3.8, unit: 'пог.м', price: 2900, cost: 1500 },
      ],
      discount: 8000,
      payments: [
        { id: 'p1', label: 'Аванс 50%', date: '2026-04-20', amount: 92000, paid: true, clientReminded: true, designerChecked: true },
        { id: 'p2', label: 'Окончательный', date: '2026-05-25', amount: 83100, paid: true, clientReminded: true, designerChecked: true },
      ],
    },
  ]
  const deals: Deal[] = raw.map((r) => ({
    id: r.id,
    number: r.number,
    date: r.date,
    status: r.status,
    client: r.client,
    designer: r.designer,
    variants: [
      { id: 'v1', name: 'Расчёт', items: r.items, discount: r.discount, delivery: { enabled: r.withInstall, amount: r.withInstall ? 9000 : 0 } },
    ],
    mainVariantId: 'v1',
    payMethod: 'transfer',
    payments: r.payments,
    reminderEnabled: r.reminderEnabled,
    reminderHour: r.reminderHour,
    productionDays: r.productionDays,
    allonge: emptyAllonge(),
    actParams: emptyActParams(),
    createdAt: r.createdAt,
    archived: r.archived,
  }))

  // демо: второй вариант расчёта (эконом) у сделки 2049
  const d49 = deals.find((d) => d.number === '2049')
  if (d49) {
    const v2: Variant = {
      id: 'v2',
      name: 'Расчёт 2 · эконом',
      items: d49.variants[0].items.map((i, idx) => ({ ...i, id: 'v2i' + idx, price: Math.round(i.price * 0.9) })),
      discount: 0,
      delivery: { enabled: false, amount: 0 },
    }
    d49.variants.push(v2)
  }
  return deals
}
