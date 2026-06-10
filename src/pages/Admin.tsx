import { useState } from 'react'
import {
  Palette,
  Buildings,
  Stack,
  Rows,
  ChatCircleDots,
  BellRinging,
  PlugsConnected,
  BookOpen,
  CalendarBlank,
  IdentificationCard,
  FileText,
  Plus,
  Trash,
  Check,
  X,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { useApp } from '../lib/store'
import { Btn, Card, Eyebrow, Field, Input, NumField, Textarea, Toggle, Badge, IconBtn, Divider } from '../components/ui'
import { DOC_SECTIONS, DOC_TPL_DEFAULTS, getDocTpl } from '../lib/seed'
import type { AdminTab, Settings } from '../lib/types'

const uid = () => Math.random().toString(36).slice(2, 9)
const GROUPS = ['ЛДСП', 'Кромка', 'Фасады', 'Столешница', 'Стеновая панель', 'Петли', 'Направляющие', 'Прочее']
const ACCENTS = ['#a8612f', '#b9543b', '#6b7152', '#3f6b54', '#2f6b6b', '#46508c', '#7a4a6b', '#9a7b2e', '#444444']
const VARS = ['{{client}}', '{{manager}}', '{{brand}}', '{{number}}', '{{amount}}', '{{date}}', '{{designer}}', '{{document}}']

type Edit = (m: (s: Settings) => void) => void
interface TabProps {
  settings: Settings
  edit: Edit
}

const TABS: { key: AdminTab; label: string; icon: typeof Palette }[] = [
  { key: 'brand', label: 'Бренд / White-label', icon: Palette },
  { key: 'company', label: 'Реквизиты', icon: Buildings },
  { key: 'blocks', label: 'Блоки сметы', icon: Rows },
  { key: 'materials', label: 'Каталог материалов', icon: Stack },
  { key: 'messages', label: 'Шаблоны сообщений', icon: ChatCircleDots },
  { key: 'docs', label: 'Конструктор документов', icon: FileText },
  { key: 'reminders', label: 'Напоминания', icon: BellRinging },
  { key: 'refs', label: 'Справочники', icon: BookOpen },
  { key: 'integrations', label: 'Интеграции', icon: PlugsConnected },
]

export function Admin() {
  const { route, navigate, settings, editSettings, resetDemo } = useApp()
  const tab: AdminTab = (route.name === 'admin' && route.tab) || 'brand'
  const setTab = (t: AdminTab) => navigate({ name: 'admin', tab: t })
  const props: TabProps = { settings, edit: editSettings }

  return (
    <div className="rise mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="-ml-3">Настройки системы</Eyebrow>
          <h1 className="mt-1 text-[34px] leading-tight text-ink sm:text-[40px]">Админка</h1>
          <p className="mt-1 text-[14px] text-muted">Гибкая настройка под вашу компанию — без программиста</p>
        </div>
        <Btn variant="ghost" size="sm" leading={<ArrowCounterClockwise size={15} />} onClick={resetDemo}>
          Сбросить демо
        </Btn>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[248px_1fr]">
        <nav className="flex flex-row flex-wrap gap-1.5 lg:flex-col">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-all duration-300 ease-spring ${
                  active ? 'bg-surface text-ink lift ring-1 ring-line' : 'text-ink-soft hover:bg-surface/60'
                }`}
              >
                <Icon size={18} className={active ? 'text-accent' : 'text-muted'} />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div>
          {tab === 'brand' && <BrandTab {...props} />}
          {tab === 'company' && <CompanyTab {...props} />}
          {tab === 'blocks' && <BlocksTab {...props} />}
          {tab === 'materials' && <MaterialsTab {...props} />}
          {tab === 'messages' && <MessagesTab {...props} />}
          {tab === 'docs' && <DocTemplatesTab {...props} />}
          {tab === 'reminders' && <RemindersTab {...props} />}
          {tab === 'refs' && <RefsTab {...props} />}
          {tab === 'integrations' && <IntegrationsTab {...props} />}
        </div>
      </div>
    </div>
  )
}

// ─────────── Brand / white-label ───────────
function BrandTab({ settings, edit }: TabProps) {
  const b = settings.brand
  return (
    <Card className="p-6">
      <h3 className="text-[18px] text-ink">Бренд и оформление</h3>
      <p className="mt-1 text-[13px] text-muted">Эти данные подставляются в интерфейс, документы и сообщения клиентам.</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Название компании">
          <Input value={b.name} onChange={(e) => edit((s) => { s.brand.name = e.target.value })} />
        </Field>
        <Field label="Подзаголовок">
          <Input value={b.tagline} onChange={(e) => edit((s) => { s.brand.tagline = e.target.value })} />
        </Field>
        <Field label="Менеджер (подпись)">
          <Input value={b.manager} onChange={(e) => edit((s) => { s.brand.manager = e.target.value })} />
        </Field>
        <Field label="Город">
          <Input value={b.city} onChange={(e) => edit((s) => { s.brand.city = e.target.value })} />
        </Field>
      </div>

      <Divider className="my-6" />
      <p className="text-[14px] font-medium text-ink">Акцентный цвет</p>
      <p className="mt-1 text-[12.5px] text-muted">Меняется мгновенно во всём интерфейсе — посмотрите на сайдбар и кнопки.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {ACCENTS.map((c) => (
          <button
            key={c}
            onClick={() => edit((s) => { s.brand.accent = c })}
            className="relative h-9 w-9 rounded-full ring-1 ring-line transition-transform duration-300 ease-spring hover:scale-110 active:scale-95"
            style={{ background: c }}
          >
            {b.accent.toLowerCase() === c && <Check size={16} weight="bold" className="absolute inset-0 m-auto text-white" />}
          </button>
        ))}
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-tray/60 px-3 text-[12px] text-ink-soft ring-1 ring-line">
          свой
          <input type="color" value={b.accent} onChange={(e) => edit((s) => { s.brand.accent = e.target.value })} className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" />
        </label>
      </div>
    </Card>
  )
}

// ─────────── Company requisites ───────────
function CompanyTab({ settings, edit }: TabProps) {
  const co = settings.company
  const f = (k: keyof typeof co, label: string, span?: boolean) => (
    <Field label={label} className={span ? 'sm:col-span-2' : ''}>
      <Input value={co[k]} onChange={(e) => edit((s) => { (s.company as Record<string, string>)[k] = e.target.value })} />
    </Field>
  )
  return (
    <Card className="p-6">
      <h3 className="text-[18px] text-ink">Реквизиты исполнителя</h3>
      <p className="mt-1 text-[13px] text-muted">Подставляются в договоры, акты, ПКО как «Исполнитель».</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {f('legalName', 'Юридическое название', true)}
        {f('inn', 'ИНН')}
        {f('ogrn', 'ОГРН')}
        {f('legalAddress', 'Юридический адрес', true)}
        {f('bankAccount', 'Расчётный счёт')}
        {f('corrAccount', 'Корр. счёт')}
        {f('bank', 'Банк')}
        {f('bik', 'БИК')}
      </div>
    </Card>
  )
}

// ─────────── Блоки сметы (категории + пороги + типы допов) ───────────
function BlocksTab({ settings, edit }: TabProps) {
  const [newType, setNewType] = useState('')
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h3 className="text-[18px] text-ink">Категории сметы</h3>
            <p className="mt-1 text-[13px] text-muted">Блоки, на которые разбита смета. Под-поле — это подпись строки (Цвет, Фирма, Длина…).</p>
          </div>
          <Badge tone="neutral">{settings.categories.length}</Badge>
        </div>
        <div className="mt-4 hidden grid-cols-[1.1fr_1.3fr_70px_84px_auto] gap-2 px-6 text-[11px] font-semibold uppercase tracking-wider text-muted sm:grid">
          <span>Категория</span>
          <span>Под-поле</span>
          <span>Ед.</span>
          <span>Кромка</span>
          <span />
        </div>
        <div className="mt-1 px-3">
          {settings.categories.map((c) => (
            <div key={c.id} className="grid grid-cols-1 items-center gap-2 rounded-2xl px-3 py-2 transition-colors hover:bg-tray/40 sm:grid-cols-[1.1fr_1.3fr_70px_84px_auto]">
              <input value={c.name} onChange={(e) => edit((s) => { s.categories.find((x) => x.id === c.id)!.name = e.target.value })} className="rounded-lg bg-tray/40 px-2.5 py-1.5 text-[13.5px] font-medium text-ink outline-none" />
              <input value={c.detailLabel} onChange={(e) => edit((s) => { s.categories.find((x) => x.id === c.id)!.detailLabel = e.target.value })} className="rounded-lg bg-tray/40 px-2.5 py-1.5 text-[13px] text-ink-soft outline-none" />
              <input value={c.unit} onChange={(e) => edit((s) => { s.categories.find((x) => x.id === c.id)!.unit = e.target.value })} className="w-16 rounded-lg bg-tray/40 px-2 py-1.5 text-center text-[12px] text-ink-soft outline-none" />
              <div className="flex justify-center">
                <Toggle checked={c.kind === 'edge'} onChange={(v) => edit((s) => { s.categories.find((x) => x.id === c.id)!.kind = v ? 'edge' : undefined })} />
              </div>
              <IconBtn className="h-8 w-8 justify-self-end" title="Удалить" onClick={() => edit((s) => { s.categories = s.categories.filter((x) => x.id !== c.id) })}>
                <Trash size={15} />
              </IconBtn>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 pt-2">
          <Btn size="sm" variant="soft" leading={<Plus size={15} weight="bold" />} onClick={() => edit((s) => { s.categories.push({ id: uid(), name: 'Новая категория', detailLabel: 'Описание', unit: 'шт' }) })}>
            Добавить категорию
          </Btn>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[18px] text-ink">Пороги оплаты</h3>
        <p className="mt-1 text-[13px] text-muted">Сколько % суммы нужно внести. Считается автоматически в карточке сделки.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Для заключения договора">
            <NumField value={settings.commercial.signPercent} onChange={(n) => edit((s) => { s.commercial.signPercent = Math.max(0, Math.min(100, n)) })} suffix="%" align="right" />
          </Field>
          <Field label="Для запуска в работу">
            <NumField value={settings.commercial.startPercent} onChange={(n) => edit((s) => { s.commercial.startPercent = Math.max(0, Math.min(100, n)) })} suffix="%" align="right" />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[18px] text-ink">Типы изменений для допсоглашения</h3>
        <p className="mt-1 text-[13px] text-muted">Чекбоксы, доступные в карточке сделки на вкладке «Документы».</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {settings.allongeTypes.map((t, i) => (
            <span key={t + i} className="flex items-center gap-1.5 rounded-full bg-tray/60 py-1.5 pl-3 pr-1.5 text-[12.5px] text-ink-soft">
              {t}
              <button onClick={() => edit((s) => { s.allongeTypes.splice(i, 1) })} className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger">
                <X size={12} weight="bold" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newType.trim()) { edit((s) => { s.allongeTypes.push(newType.trim()) }); setNewType('') } }}
            placeholder="Новый тип изменения"
            className="max-w-xs"
          />
          <Btn size="sm" variant="soft" leading={<Plus size={15} weight="bold" />} onClick={() => { if (newType.trim()) { edit((s) => { s.allongeTypes.push(newType.trim()) }); setNewType('') } }}>
            Добавить
          </Btn>
        </div>
      </Card>
    </div>
  )
}

// ─────────── Materials catalog ───────────
function MaterialsTab({ settings, edit }: TabProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h3 className="text-[18px] text-ink">Каталог материалов</h3>
          <p className="mt-1 text-[13px] text-muted">Используется в смете при добавлении позиций «из каталога».</p>
        </div>
        <Badge tone="neutral">{settings.materials.length} позиций</Badge>
      </div>
      <div className="mt-4 px-3">
        {settings.materials.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 transition-colors hover:bg-tray/40 sm:flex-nowrap">
            <select value={m.group} onChange={(e) => edit((s) => { s.materials.find((x) => x.id === m.id)!.group = e.target.value })} className="rounded-lg bg-tray/60 px-2 py-1.5 text-[12px] text-ink-soft outline-none">
              {GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <input value={m.name} onChange={(e) => edit((s) => { s.materials.find((x) => x.id === m.id)!.name = e.target.value })} className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none" />
            <input value={m.unit} onChange={(e) => edit((s) => { s.materials.find((x) => x.id === m.id)!.unit = e.target.value })} className="w-16 rounded-lg bg-tray/50 px-2 py-1.5 text-center text-[12px] text-ink-soft outline-none" />
            <NumField className="w-28" value={m.price} suffix="₽" align="right" onChange={(n) => edit((s) => { s.materials.find((x) => x.id === m.id)!.price = n })} />
            <IconBtn className="h-8 w-8" title="Удалить" onClick={() => edit((s) => { s.materials = s.materials.filter((x) => x.id !== m.id) })}>
              <Trash size={15} />
            </IconBtn>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6 pt-2">
        <Btn size="sm" variant="soft" leading={<Plus size={15} weight="bold" />} onClick={() => edit((s) => { s.materials.push({ id: uid(), group: 'ЛДСП', name: 'Новый материал', unit: 'м²', price: 0 }) })}>
          Добавить материал
        </Btn>
      </div>
    </Card>
  )
}

// ─────────── Message templates ───────────
function MessagesTab({ settings, edit }: TabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-[13px] font-medium text-ink">Доступные переменные</p>
        <p className="mt-1 text-[12px] text-muted">Подставляются автоматически при отправке. Можно использовать в любом шаблоне.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VARS.map((v) => (
            <span key={v} className="rounded-lg bg-accent-soft/70 px-2 py-1 font-mono text-[11.5px] text-accent">
              {v}
            </span>
          ))}
        </div>
      </Card>
      {settings.messages.map((m) => (
        <Card key={m.id} className="p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-medium text-ink">{m.title}</h4>
            <Badge tone="neutral">{m.hint}</Badge>
          </div>
          <Textarea className="mt-3" rows={3} value={m.body} onChange={(e) => edit((s) => { s.messages.find((x) => x.id === m.id)!.body = e.target.value })} />
        </Card>
      ))}
    </div>
  )
}

// ─────────── Reminders ───────────
function RemindersTab({ settings, edit }: TabProps) {
  const r = settings.reminders
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[18px] text-ink">Авто-напоминания об оплате</h3>
          <p className="mt-1 text-[13px] text-muted">Система сама пишет клиенту и контролирует платёж у дизайнера.</p>
        </div>
        <Toggle checked={r.enabled} onChange={(v) => edit((s) => { s.reminders.enabled = v })} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Клиенту — за (дней до платежа)">
          <NumField value={r.clientDaysBefore} onChange={(n) => edit((s) => { s.reminders.clientDaysBefore = n })} align="right" />
        </Field>
        <Field label="Дизайнеру — через (дней после)">
          <NumField value={r.designerDaysAfter} onChange={(n) => edit((s) => { s.reminders.designerDaysAfter = n })} align="right" />
        </Field>
        <Field label="Час отправки">
          <NumField value={r.hour} onChange={(n) => edit((s) => { s.reminders.hour = Math.max(0, Math.min(23, n)) })} suffix=":00" align="right" />
        </Field>
      </div>
      <div className="mt-5 rounded-2xl bg-tray/40 px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft ring-1 ring-line">
        <b>Как это работает:</b> ежедневно в {r.hour}:00 система проверяет график платежей всех сделок. Если до платежа осталось{' '}
        {r.clientDaysBefore} дн. — клиенту уходит напоминание в VK или на e-mail. Через {r.designerDaysAfter} дн. после даты —
        дизайнеру приходит контрольное сообщение.
      </div>
    </Card>
  )
}

// ─────────── Конструктор документов ───────────
const DOC_MASKS = [
  '{{number}}', '{{date}}', '{{client}}', '{{address}}', '{{total}}', '{{totalWords}}',
  '{{days}}', '{{readyDate}}', '{{delivery}}', '{{readyMode}}', '{{readyAction}}',
  '{{defects}}', '{{compensation}}', '{{refund}}', '{{additions}}', '{{newTotal}}', '{{newTotalWords}}',
  '{{designer}}', '{{manager}}', '{{brand}}', '{{company}}', '{{city}}',
]

function DocTemplatesTab({ settings, edit }: TabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-[13px] font-medium text-ink">Маски из функционала расчёта</p>
        <p className="mt-1 text-[12px] text-muted">
          Вставляйте в любой текст ниже — при формировании документа подставятся данные сделки: суммы, даты, недостатки, реквизиты.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {DOC_MASKS.map((m) => (
            <span key={m} className="rounded-lg bg-accent-soft/70 px-2 py-1 font-mono text-[11.5px] text-accent">
              {m}
            </span>
          ))}
        </div>
      </Card>

      {DOC_SECTIONS.map((sec) => {
        const value = getDocTpl(settings, sec.id)
        const isCustom = settings.docTemplates?.[sec.id] !== undefined && settings.docTemplates[sec.id] !== DOC_TPL_DEFAULTS[sec.id]
        return (
          <Card key={sec.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-[15px] font-medium text-ink">{sec.title}</h4>
              <div className="flex items-center gap-2">
                {sec.hint && <Badge tone="neutral">{sec.hint}</Badge>}
                {isCustom && (
                  <button
                    onClick={() => edit((s) => { if (s.docTemplates) delete s.docTemplates[sec.id] })}
                    className="rounded-full px-2.5 py-1 text-[11.5px] font-medium text-muted transition-colors hover:bg-tray hover:text-ink"
                  >
                    ↺ стандартный текст
                  </button>
                )}
              </div>
            </div>
            <Textarea
              className="mt-3 font-mono !text-[12.5px]"
              rows={sec.rows}
              value={value}
              onChange={(e) =>
                edit((s) => {
                  if (!s.docTemplates) s.docTemplates = {}
                  s.docTemplates[sec.id] = e.target.value
                })
              }
            />
          </Card>
        )
      })}
    </div>
  )
}

// ─────────── Справочники: праздники + коды подразделений ───────────
function RefsTab({ settings, edit }: TabProps) {
  const [newHoliday, setNewHoliday] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newDept, setNewDept] = useState('')

  const addHoliday = () => {
    const v = newHoliday.trim()
    if (!v || settings.holidays.includes(v)) return
    edit((s) => { s.holidays = [...s.holidays, v].sort() })
    setNewHoliday('')
  }
  const addDept = () => {
    if (!newCode.trim() || !newDept.trim()) return
    edit((s) => { s.passportDepts.push({ code: newCode.trim(), name: newDept.trim() }) })
    setNewCode('')
    setNewDept('')
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-2.5">
          <CalendarBlank size={20} className="text-accent" />
          <h3 className="text-[18px] text-ink">Праздники и нерабочие дни</h3>
        </div>
        <p className="mt-1 text-[13px] text-muted">Учитываются при расчёте даты готовности (срок изготовления — в рабочих днях).</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {settings.holidays.map((h, i) => (
            <span key={h + i} className="flex items-center gap-1.5 rounded-full bg-tray/60 py-1.5 pl-3 pr-1.5 text-[12.5px] text-ink-soft nums">
              {new Date(h).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              <button
                onClick={() => edit((s) => { s.holidays = s.holidays.filter((x) => x !== h) })}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <X size={12} weight="bold" />
              </button>
            </span>
          ))}
          {settings.holidays.length === 0 && <span className="text-[13px] text-muted">Список пуст</span>}
        </div>
        <div className="mt-4 flex gap-2">
          <Input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} className="max-w-[190px]" />
          <Btn size="sm" variant="soft" leading={<Plus size={15} weight="bold" />} onClick={addHoliday}>
            Добавить
          </Btn>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2.5">
          <IdentificationCard size={20} className="text-accent" />
          <h3 className="text-[18px] text-ink">Коды подразделений (паспорт)</h3>
        </div>
        <p className="mt-1 text-[13px] text-muted">«Кем выдан» подставляется автоматически по коду в карточке заказчика-физлица.</p>
        <div className="mt-4 space-y-1.5">
          {settings.passportDepts.map((p, i) => (
            <div key={p.code + i} className="flex items-center gap-2 rounded-xl px-1 py-0.5 transition-colors hover:bg-tray/40">
              <input
                value={p.code}
                onChange={(e) => edit((s) => { s.passportDepts[i].code = e.target.value })}
                className="w-24 rounded-lg bg-tray/50 px-2.5 py-1.5 text-center text-[12.5px] font-medium text-ink outline-none nums"
              />
              <input
                value={p.name}
                onChange={(e) => edit((s) => { s.passportDepts[i].name = e.target.value })}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-[13px] text-ink-soft outline-none"
              />
              <IconBtn className="h-8 w-8" title="Удалить" onClick={() => edit((s) => { s.passportDepts = s.passportDepts.filter((_, j) => j !== i) })}>
                <Trash size={15} />
              </IconBtn>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="w-28 shrink-0">
            <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="770-001" className="text-center nums" />
          </div>
          <div className="min-w-[180px] flex-1">
            <Input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Кем выдан" />
          </div>
          <Btn size="sm" variant="soft" leading={<Plus size={15} weight="bold" />} onClick={addDept}>
            Добавить
          </Btn>
        </div>
      </Card>
    </div>
  )
}

// ─────────── Integrations ───────────
function IntegrationsTab({ settings, edit }: TabProps) {
  const ig = settings.integrations
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] text-ink">ВКонтакте</h3>
            <p className="mt-1 text-[13px] text-muted">Отправка документов и напоминаний в личные сообщения VK.</p>
          </div>
          <Toggle checked={ig.vkEnabled} onChange={(v) => edit((s) => { s.integrations.vkEnabled = v })} />
        </div>
        <Field label="Токен сообщества" className="mt-4">
          <Input value={ig.vkToken} onChange={(e) => edit((s) => { s.integrations.vkToken = e.target.value })} />
        </Field>
        <p className="mt-2 text-[12px] text-warning">⚠ В демо токен скрыт. В проде хранится в защищённом хранилище, а не в коде.</p>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] text-ink">E-mail</h3>
            <p className="mt-1 text-[13px] text-muted">Если у клиента указана почта — документы уходят письмом с вложением.</p>
          </div>
          <Toggle checked={ig.emailEnabled} onChange={(v) => edit((s) => { s.integrations.emailEnabled = v })} />
        </div>
        <Field label="Адрес отправителя" className="mt-4">
          <Input value={ig.emailFrom} onChange={(e) => edit((s) => { s.integrations.emailFrom = e.target.value })} />
        </Field>
      </Card>
    </div>
  )
}
