import { X, PaperPlaneTilt, DownloadSimple, ChatCircleDots, EnvelopeSimple } from '@phosphor-icons/react'
import { useApp } from '../lib/store'
import { DOCS } from '../lib/seed'
import type { Deal, DocKind, Settings } from '../lib/types'
import { dealRevenue, mainVariant, fmtRub2, fmtDate, itemSum, summaPropisyu } from '../lib/money'

function nextPayment(d: Deal) {
  return d.payments.find((p) => !p.paid) ?? d.payments[d.payments.length - 1]
}

function mergeMessage(tpl: string, d: Deal, s: Settings, docTitle: string) {
  const np = nextPayment(d)
  return tpl
    .replaceAll('{{client}}', d.client.name || 'Заказчик')
    .replaceAll('{{manager}}', s.brand.manager)
    .replaceAll('{{brand}}', s.brand.name)
    .replaceAll('{{number}}', d.number)
    .replaceAll('{{designer}}', d.designer)
    .replaceAll('{{amount}}', np ? fmtRub2(np.amount) : '—')
    .replaceAll('{{date}}', np ? fmtDate(np.date) : '—')
    .replaceAll('{{document}}', docTitle.toLowerCase())
}

function pickMessage(kind: DocKind, s: Settings) {
  if (kind === 'contract') return s.messages.find((m) => m.id === 'doc_contract')
  return s.messages.find((m) => m.id === 'doc_generic')
}

// ─────────────────────────  Document body renderers  ─────────────────────────

function Row2({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between gap-6 py-1">
      <span className="text-[13px] text-black/55">{left}</span>
      <span className="text-right text-[13px] font-medium text-black/80">{right}</span>
    </div>
  )
}

function PartyBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-black/40">{title}</p>
      {lines.filter(Boolean).map((l, i) => (
        <p key={i} className="text-[12.5px] leading-relaxed text-black/75">
          {l}
        </p>
      ))}
    </div>
  )
}

function clientLines(d: Deal): string[] {
  const c = d.client
  if (c.type === 'company') {
    return [c.name, c.legalAddress || c.installAddress, c.inn ? `ИНН ${c.inn}` : '', c.ogrn ? `ОГРН ${c.ogrn}` : '', c.director || '', c.bankAccount ? `р/с ${c.bankAccount}` : '', c.bank ? `${c.bank}, БИК ${c.bik || ''}` : '']
  }
  if (c.type === 'entrepreneur') {
    return [c.name, c.legalAddress || c.installAddress, c.inn ? `ИНН ${c.inn}` : '', c.ogrn ? `ОГРНИП ${c.ogrn}` : '', c.bankAccount ? `р/с ${c.bankAccount}` : '', c.bank ? `${c.bank}, БИК ${c.bik || ''}` : '']
  }
  return [
    c.name,
    c.passport ? `Паспорт ${c.passport}` : '',
    c.issuedBy ? `выдан ${c.issuedBy}${c.deptCode ? `, к/п ${c.deptCode}` : ''}` : '',
    c.installAddress,
    c.phone,
  ]
}

function companyLines(s: Settings): string[] {
  const co = s.company
  return [co.legalName, co.legalAddress, `ИНН ${co.inn}`, `ОГРН ${co.ogrn}`, `р/с ${co.bankAccount}`, `${co.bank}, БИК ${co.bik}`]
}

function ContractDoc({ d, s }: { d: Deal; s: Settings }) {
  const total = dealRevenue(d)
  const v = mainVariant(d)
  const withInstall = !!v.delivery?.enabled
  return (
    <>
      <p className="text-center text-[12px] uppercase tracking-[0.3em] text-black/40">{s.company.legalName}</p>
      <h2 className="mt-2 text-center text-[26px] text-black" style={{ fontFamily: 'var(--font-display)' }}>
        Договор № {d.number}
      </h2>
      <p className="text-center text-[13px] text-black/50">
        на изготовление мебели по индивидуальному заказу · {s.brand.city}, {fmtDate(d.date)}
      </p>

      <div className="mt-6 flex gap-8 border-y border-black/10 py-4">
        <PartyBlock title="Исполнитель" lines={companyLines(s)} />
        <PartyBlock title="Заказчик" lines={clientLines(d)} />
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-black/70">
        <b>1. Предмет договора.</b> Исполнитель обязуется изготовить корпусную мебель по индивидуальному заказу
        согласно Спецификации (Приложение №1){withInstall ? ', выполнить доставку и монтаж' : ''}, а Заказчик —
        принять и оплатить изделие. Срок изготовления — {d.productionDays} рабочих дней.
      </p>

      <p className="mt-4 mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-black/45">
        Спецификация (Приложение №1)
      </p>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-y border-black/15 text-left text-[11px] uppercase tracking-wider text-black/45">
            <th className="py-1.5 font-medium">Наименование</th>
            <th className="py-1.5 text-right font-medium">Кол-во</th>
            <th className="py-1.5 text-right font-medium">Цена</th>
            <th className="py-1.5 text-right font-medium">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {v.items.map((i) => (
            <tr key={i.id} className="border-b border-black/[0.06]">
              <td className="py-1.5 pr-3 text-black/75">
                {i.name}
                {i.detail ? <span className="text-black/45"> · {i.detail}</span> : ''}
              </td>
              <td className="py-1.5 text-right text-black/60 nums">
                {i.qty} {i.unit}
              </td>
              <td className="py-1.5 text-right text-black/60 nums">{fmtRub2(i.price)}</td>
              <td className="py-1.5 text-right font-medium text-black/80 nums">{fmtRub2(itemSum(i))}</td>
            </tr>
          ))}
          {v.delivery?.enabled && v.delivery.amount > 0 && (
            <tr className="border-b border-black/[0.06]">
              <td className="py-1.5 text-black/60" colSpan={3}>
                Доставка и установка
              </td>
              <td className="py-1.5 text-right text-black/70 nums">{fmtRub2(v.delivery.amount)}</td>
            </tr>
          )}
          {v.discount > 0 && (
            <tr className="border-b border-black/[0.06]">
              <td className="py-1.5 text-black/60" colSpan={3}>
                Скидка
              </td>
              <td className="py-1.5 text-right text-black/70 nums">−{fmtRub2(v.discount)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 rounded-xl bg-black/[0.03] px-4 py-3">
        <Row2 left="Итого к оплате" right={fmtRub2(total)} />
        <p className="mt-1 text-[12px] italic text-black/55">{summaPropisyu(total)}</p>
      </div>

      <p className="mt-5 mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-black/45">График платежей</p>
      <table className="w-full border-collapse text-[12.5px]">
        <tbody>
          {d.payments.map((p) => (
            <tr key={p.id} className="border-b border-black/[0.06]">
              <td className="py-1.5 text-black/75">{p.label}</td>
              <td className="py-1.5 text-right text-black/55 nums">до {fmtDate(p.date)}</td>
              <td className="py-1.5 text-right font-medium text-black/80 nums">{fmtRub2(p.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-10 flex justify-between gap-8 text-[12.5px]">
        <div className="flex-1">
          <p className="text-black/45">Исполнитель</p>
          <div className="mt-7 border-t border-black/30 pt-1 text-black/60">{s.brand.manager}</div>
        </div>
        <div className="flex-1">
          <p className="text-black/45">Заказчик</p>
          <div className="mt-7 border-t border-black/30 pt-1 text-black/60">{d.client.name}</div>
        </div>
      </div>
      {/* Приложение №2 — Правила эксплуатации */}
      <div className="mt-10 border-t border-black/10 pt-6" style={{ breakBefore: 'page' }}>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45">Приложение №2 · Правила эксплуатации</p>
        <ol className="mt-2 ml-4 list-decimal space-y-1 text-[12.5px] leading-relaxed text-black/70">
          <li>Эксплуатировать изделие при влажности 45–70% и температуре +10…+30 °C, избегая прямого контакта с водой и паром.</li>
          <li>Не размещать нагревательные приборы ближе 30 см к фасадам и корпусу.</li>
          <li>Беречь поверхности от абразивов, растворителей и спиртосодержащих средств.</li>
          <li>Регулировку петель и направляющих производить не реже одного раза в год.</li>
          <li>Максимальная нагрузка на полку — 15 кг, на выдвижной ящик — 25 кг.</li>
        </ol>
      </div>

      {/* Приложение №3 — Памятка по уходу */}
      <div className="mt-8 border-t border-black/10 pt-6" style={{ breakBefore: 'page' }}>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45">Приложение №3 · Памятка по уходу</p>
        <ul className="mt-2 ml-4 list-disc space-y-1 text-[12.5px] leading-relaxed text-black/70">
          <li>Протирать поверхности мягкой влажной тканью, насухо вытирая после уборки.</li>
          <li>Для глянцевых и эмалевых фасадов использовать специальные неабразивные средства.</li>
          <li>Своевременно удалять пролитую жидкость с торцов и кромок.</li>
          <li>Гарантия — 18 месяцев при соблюдении правил эксплуатации.</li>
        </ul>
        <p className="mt-4 text-[12px] text-black/45">С правилами эксплуатации и памяткой ознакомлен:</p>
        <div className="mt-6 border-t border-black/30 pt-1 text-[12.5px] text-black/60">{d.client.name}</div>
      </div>
    </>
  )
}

function PkoDoc({ d, s }: { d: Deal; s: Settings }) {
  const np = nextPayment(d)
  const amount = d.pkoAmount && d.pkoAmount > 0 ? d.pkoAmount : np?.amount ?? 0
  return (
    <>
      <div className="flex items-start justify-between border-b border-black/10 pb-3">
        <div>
          <p className="text-[12px] text-black/50">{s.company.legalName}</p>
          <p className="text-[11px] text-black/40">ИНН {s.company.inn}</p>
        </div>
        <p className="text-[11px] text-black/40">Унифицированная форма № КО-1</p>
      </div>
      <h2 className="mt-5 text-center text-[22px] text-black" style={{ fontFamily: 'var(--font-display)' }}>
        Приходный кассовый ордер № {d.number}
      </h2>
      <p className="text-center text-[13px] text-black/50">от {fmtDate(np?.date || d.date)}</p>

      <div className="mt-6 space-y-1">
        <Row2 left="Принято от" right={d.client.name} />
        <Row2 left="Основание" right={`${np?.label || 'Оплата'} по договору № ${d.number}`} />
        <Row2 left="Сумма" right={fmtRub2(amount)} />
      </div>
      <div className="mt-3 rounded-xl bg-black/[0.03] px-4 py-3">
        <p className="text-[12px] text-black/45">Сумма прописью</p>
        <p className="text-[13.5px] italic text-black/70">{summaPropisyu(amount)}</p>
      </div>

      <div className="mt-12 flex justify-between gap-8 text-[12.5px]">
        <div className="flex-1">
          <p className="text-black/45">Главный бухгалтер</p>
          <div className="mt-7 border-t border-black/30 pt-1" />
        </div>
        <div className="flex-1">
          <p className="text-black/45">Кассир</p>
          <div className="mt-7 border-t border-black/30 pt-1 text-black/60">{s.brand.manager}</div>
        </div>
      </div>
    </>
  )
}

const ACT_TITLES: Partial<Record<DocKind, string>> = {
  act_product: 'Акт приёма-передачи изделия',
  act_install: 'Акт выполненных монтажных работ',
  act_unilateral: 'Акт приёма-передачи (односторонний)',
  notice: 'Уведомление',
  allonge: 'Дополнительное соглашение',
}

function ActDoc({ d, s, kind }: { d: Deal; s: Settings; kind: DocKind }) {
  const total = dealRevenue(d)
  const title = ACT_TITLES[kind] || 'Документ'
  const withInstall = !!mainVariant(d).delivery?.enabled
  return (
    <>
      <p className="text-center text-[12px] uppercase tracking-[0.3em] text-black/40">{s.company.legalName}</p>
      <h2 className="mt-2 text-center text-[24px] text-black" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h2>
      <p className="text-center text-[13px] text-black/50">
        к договору № {d.number} · {s.brand.city}, {fmtDate(d.date)}
      </p>

      <div className="mt-6 flex gap-8 border-y border-black/10 py-4">
        <PartyBlock title="Исполнитель" lines={companyLines(s).slice(0, 3)} />
        <PartyBlock title="Заказчик" lines={clientLines(d).slice(0, 3)} />
      </div>

      {kind === 'allonge' ? (
        <div className="mt-5 text-[13px] leading-relaxed text-black/70">
          <p>Стороны пришли к соглашению изменить условия договора № {d.number}{d.allonge?.types?.length ? ' по следующим пунктам:' : '.'}</p>
          {d.allonge?.types?.length ? (
            <ul className="mt-2 ml-5 list-disc space-y-0.5">
              {d.allonge.types.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
          {d.allonge?.text ? <p className="mt-2">{d.allonge.text}</p> : null}
          <p className="mt-2">
            Новая итоговая стоимость составляет <b>{fmtRub2(d.allonge?.newAmount || total)}</b> (
            {summaPropisyu(d.allonge?.newAmount || total).toLowerCase()}). Остальные условия договора остаются неизменными.
          </p>
        </div>
      ) : kind === 'notice' ? (
        <div className="mt-5 text-[13px] leading-relaxed text-black/70">
          <p>
            Уведомляем, что изделие по договору № {d.number} готово{withInstall ? ' к монтажу' : ' к выдаче'}. Просим согласовать
            дату {withInstall ? 'монтажа' : 'получения'} по адресу: {d.client.installAddress}.
          </p>
          {d.actParams?.additions ? <p className="mt-2">Дополнительно требуется: {d.actParams.additions}.</p> : null}
        </div>
      ) : (
        <div className="mt-5 text-[13px] leading-relaxed text-black/70">
          <p>
            Исполнитель сдал, а Заказчик принял {kind === 'act_install' ? 'монтажные работы' : 'изделие'} по договору № {d.number} по
            адресу: {d.client.installAddress}. Стоимость — <b>{fmtRub2(total)}</b>.
          </p>
          {d.actParams?.defects ? (
            <p className="mt-2">
              Выявленные недостатки: {d.actParams.defects}.
              {d.actParams.compensation > 0 ? ` Сумма компенсации — ${fmtRub2(d.actParams.compensation)}.` : ''}
              {d.actParams.refund > 0 ? ` Сумма возврата — ${fmtRub2(d.actParams.refund)}.` : ''}
            </p>
          ) : (
            <p className="mt-2">
              Претензий по качеству и срокам стороны не имеют
              {kind === 'act_unilateral' ? '. Акт составлен в одностороннем порядке в связи с уклонением Заказчика от приёмки.' : '.'}
            </p>
          )}
        </div>
      )}

      <div className="mt-12 flex justify-between gap-8 text-[12.5px]">
        <div className="flex-1">
          <p className="text-black/45">Исполнитель</p>
          <div className="mt-7 border-t border-black/30 pt-1 text-black/60">{s.brand.manager}</div>
        </div>
        <div className="flex-1">
          <p className="text-black/45">Заказчик</p>
          <div className="mt-7 border-t border-black/30 pt-1 text-black/60">
            {kind === 'act_unilateral' ? '— (не явился)' : d.client.name}
          </div>
        </div>
      </div>
    </>
  )
}

export function DocumentModal() {
  const { doc, deals, settings, closeDoc, sendDoc } = useApp()
  if (!doc) return null
  const deal = deals.find((d) => d.id === doc.dealId)
  if (!deal) return null
  const meta = DOCS.find((x) => x.kind === doc.kind)!
  const channel = deal.client.contact.includes('@') ? 'email' : 'vk'
  const msgTpl = pickMessage(doc.kind, settings)
  const merged = msgTpl ? mergeMessage(msgTpl.body, deal, settings, meta.title) : ''

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-md sm:p-8"
      style={{ animation: 'overlay-in 0.3s ease both' }}
      onClick={closeDoc}
    >
      <div
        className="my-2 w-full max-w-[860px]"
        style={{ animation: 'sheet-in 0.5s cubic-bezier(0.32,0.72,0,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="no-print sticky top-0 z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface/85 p-2.5 pl-4 ring-1 ring-line backdrop-blur-xl lift">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-medium text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              {meta.title}
            </span>
            <span className="hidden text-[12px] text-muted sm:inline">· договор №{deal.number}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium text-ink-soft transition-all duration-300 ease-spring hover:bg-tray active:scale-95"
            >
              <DownloadSimple size={16} /> Скачать PDF
            </button>
            <button
              onClick={() => sendDoc(channel)}
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink lift transition-all duration-300 ease-spring active:scale-95"
            >
              {channel === 'email' ? <EnvelopeSimple size={16} /> : <ChatCircleDots size={16} />}
              Отправить {channel === 'email' ? 'на e-mail' : 'в VK'}
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-spring group-hover:translate-x-0.5">
                <PaperPlaneTilt size={12} weight="fill" />
              </span>
            </button>
            <button onClick={closeDoc} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-all hover:bg-tray active:scale-90">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cover message preview (template → merged) */}
        {merged && (
          <div className="no-print mb-3 flex items-start gap-3 rounded-2xl bg-accent-soft/60 px-4 py-3 ring-1 ring-line">
            <ChatCircleDots size={18} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Сопроводительное сообщение</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{merged}</p>
            </div>
          </div>
        )}

        {/* A4 sheet */}
        <div id="print-area" className="rounded-2xl bg-white px-9 py-10 ring-1 ring-line lift-lg sm:px-14 sm:py-14" style={{ fontFamily: 'Georgia, "PT Serif", serif' }}>
          {doc.kind === 'contract' && <ContractDoc d={deal} s={settings} />}
          {doc.kind === 'pko' && <PkoDoc d={deal} s={settings} />}
          {doc.kind !== 'contract' && doc.kind !== 'pko' && <ActDoc d={deal} s={settings} kind={doc.kind} />}
        </div>
        <div className="h-6" />
      </div>
    </div>
  )
}
