import type { Application, Certificate, Message, NotificationItem, ProcedureType } from './types'
import { DEFAULT_PROCEDURE } from './types'
import type { ProductKind, RegistryCheck, WorkStatus } from './work'
import { advanceTo, buildWorkPlan } from './work-plans'

interface SeedCase {
  id: string
  number: string
  product: string
  form: string
  kind: ProductKind
  country: string
  manufacturer: string
  sites: string
  procedure?: ProcedureType
  /** До какой работы кейс дошёл и в каком она статусе. */
  at: string
  atStatus: WorkStatus
  registryFound?: boolean
  nextDue: string
  expert: string
  updatedAt: string
  createdAt: string
}

const CASES: SeedCase[] = [
  {
    id: 'a148',
    number: 'CERT-2026-0148',
    product: 'Амоксициллин 500 мг',
    form: 'капсулы',
    kind: 'drug',
    country: 'Китай',
    manufacturer: 'Zhejiang Huikang Pharmaceutical Co., Ltd.',
    sites: 'Тайчжоу — синтез и фасовка; Ханчжоу — упаковка',
    at: '5',
    atStatus: 'in_review',
    nextDue: '2026-09-12',
    expert: 'К. В. Лебедева, НЦЭСМП',
    updatedAt: '2026-08-28T11:20:00',
    createdAt: '2026-03-04T09:00:00',
  },
  {
    id: 'a131',
    number: 'CERT-2026-0131',
    product: 'Ибупрофен 200 мг',
    form: 'таблетки, покрытые оболочкой',
    kind: 'drug',
    country: 'Китай',
    manufacturer: 'Shandong Ruikang Pharma Co., Ltd.',
    sites: 'Цзинань — производство и упаковка',
    procedure: 'drug-variation',
    at: '0.5',
    atStatus: 'waiting_client',
    nextDue: '2026-09-03',
    expert: 'Е. Смирнова, УПП',
    updatedAt: '2026-08-27T16:40:00',
    createdAt: '2026-04-11T10:15:00',
  },
  {
    id: 'a124',
    number: 'CERT-2026-0124',
    product: 'Цефтриаксон 1 г',
    form: 'порошок для приготовления раствора',
    kind: 'drug',
    country: 'Китай',
    manufacturer: 'Harbin Beitai Pharmaceutical Co., Ltd.',
    sites: 'Харбин — стерильное производство',
    at: '5',
    atStatus: 'remarks',
    nextDue: '2026-09-08',
    expert: 'М. А. Гордеев, НЦЭСМП',
    updatedAt: '2026-08-26T09:10:00',
    createdAt: '2026-02-18T08:30:00',
  },
  {
    id: 'a118',
    number: 'CERT-2026-0118',
    product: 'Ортез коленный, семейство A-12',
    form: 'изделие класса 1',
    kind: 'prosthesis',
    country: 'Китай',
    manufacturer: 'Shenzhen Kanghui Medical Co., Ltd.',
    sites: 'Шэньчжэнь — сборка; Дунгуань — литьё деталей',
    at: '3',
    atStatus: 'with_agent',
    nextDue: '2026-09-18',
    expert: 'А. Ветров, координатор испытаний',
    updatedAt: '2026-08-25T14:05:00',
    createdAt: '2026-02-10T09:00:00',
  },
  {
    id: 'a094',
    number: 'CERT-2026-0094',
    product: 'Тонометр автоматический BP-90A',
    form: 'изделие класса 2а, средство измерений',
    kind: 'equipment',
    country: 'Китай',
    manufacturer: 'Suzhou Yuanhe Medical Technology Co., Ltd.',
    sites: 'Сучжоу — сборка; Шэньчжэнь — прошивка платы',
    at: '1',
    atStatus: 'waiting_client',
    nextDue: '2026-09-10',
    expert: 'Е. Смирнова, УПП',
    updatedAt: '2026-08-29T08:45:00',
    createdAt: '2026-05-20T11:20:00',
  },
  {
    id: 'a107',
    number: 'CERT-2026-0107',
    product: 'Аппарат ультразвуковой диагностики B-07',
    form: 'изделие класса 2а',
    kind: 'equipment',
    country: 'Китай',
    manufacturer: 'Suzhou Yuanhe Imaging Technology Co., Ltd.',
    sites: 'Сучжоу — сборка и контроль',
    at: '0.3',
    atStatus: 'waiting_client',
    nextDue: '2026-09-15',
    expert: 'не назначен',
    updatedAt: '2026-08-20T08:45:00',
    createdAt: '2026-08-04T11:20:00',
  },
  {
    id: 'a102',
    number: 'CERT-2026-0102',
    product: 'Натрия хлорид 0,9 %',
    form: 'раствор для инфузий',
    kind: 'drug',
    country: 'Китай',
    manufacturer: 'Sichuan Kelun Pharmaceutical Co., Ltd.',
    sites: 'Чэнду — производство инфузионных растворов',
    procedure: 'drug-confirmation',
    at: '6',
    atStatus: 'done',
    nextDue: '2027-02-01',
    expert: 'Е. Смирнова, УПП',
    updatedAt: '2026-07-14T12:00:00',
    createdAt: '2025-11-02T09:00:00',
  },
]

function buildRegistry(item: SeedCase): RegistryCheck {
  if (item.at === '0.1' || item.at === '0.2') return { status: 'pending', sources: [] }
  return {
    status: item.registryFound ? 'found' : 'not_found',
    sources: item.kind === 'drug' ? ['ГРЛС'] : ['Реестр медицинских изделий', 'ГРЛС'],
    checkedAt: item.createdAt,
    checkedBy: 'Е. Смирнова, офицер УПП',
  }
}

export const APPLICATIONS: Application[] = CASES.map((item) => {
  const works = advanceTo(buildWorkPlan(item.kind), item.at, item.atStatus)
  const current = works.find((work) => work.code === item.at)
  return {
    id: item.id,
    number: item.number,
    product: item.product,
    form: item.form,
    kind: item.kind,
    country: item.country,
    manufacturer: item.manufacturer,
    sites: item.sites,
    procedure: item.procedure ?? DEFAULT_PROCEDURE[item.kind],
    registry: buildRegistry(item),
    works: works.map((work) =>
      work.code === item.at && item.atStatus === 'remarks'
        ? { ...work, remark: 'Экспертиза запросила уточнение спецификации примесей и хроматограммы трёх серий.' }
        : work,
    ),
    journal: [
      {
        id: `${item.id}-j2`,
        at: item.updatedAt,
        actor: 'Е. Смирнова, офицер УПП',
        action: current ? `journal.workMoved|${item.at}|${item.atStatus}` : 'journal.caseUpdated',
        workCode: item.at,
      },
      {
        id: `${item.id}-j1`,
        at: item.createdAt,
        actor: 'Ирина Волкова',
        action: 'journal.caseCreated',
        workCode: '0.1',
      },
    ],
    nextDue: item.nextDue,
    expert: item.expert,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
    owner: 'Ирина Волкова',
  }
})

export const CERTIFICATES: Certificate[] = [
  {
    id: 'c1',
    number: 'ЛП-№006421',
    product: 'Натрия хлорид 0,9 %, раствор для инфузий',
    registry: 'ГРЛС',
    issuedOn: '2026-07-14',
    validUntil: '2031-07-14',
    status: 'действует',
  },
  {
    id: 'c2',
    number: 'ЛП-№006188',
    product: 'Парацетамол 500 мг, таблетки',
    registry: 'ГРЛС',
    issuedOn: '2026-06-30',
    validUntil: '2031-06-30',
    status: 'действует',
  },
  {
    id: 'c3',
    number: 'ожидает записи',
    product: 'Амоксициллин 500 мг, капсулы',
    registry: 'ГРЛС',
    issuedOn: '—',
    validUntil: '—',
    status: 'ожидает записи',
  },
]

export const MESSAGES: Message[] = [
  {
    id: 'm1',
    from: 'К. В. Лебедева',
    role: 'эксперт НЦЭСМП',
    applicationId: 'a148',
    preview: 'Просим уточнить пределы примесей в спецификации готовой формы и приложить хроматограммы трёх серий.',
    at: '2026-08-28T10:05:00',
    unread: true,
  },
  {
    id: 'm2',
    from: 'Е. Смирнова',
    role: 'офицер УПП',
    applicationId: 'a131',
    preview: 'Скан доверенности есть, оригинал с апостилем ещё в пути. Перевод лучше запустить параллельно.',
    at: '2026-08-27T16:12:00',
    unread: true,
  },
  {
    id: 'm3',
    from: 'А. Ветров',
    role: 'координатор испытаний',
    applicationId: 'a118',
    preview: 'Лаборатория подтвердила слот. Протокол ожидаем до 18 сентября, если не будет замечаний к образцам.',
    at: '2026-08-25T13:40:00',
    unread: false,
  },
  {
    id: 'm4',
    from: 'Е. Смирнова',
    role: 'офицер УПП',
    applicationId: 'a094',
    preview: 'По тонометру уведомление о ввозе образцов нужно подать до отгрузки, иначе таможня развернёт партию.',
    at: '2026-08-29T09:15:00',
    unread: true,
  },
]

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Запрос экспертизы по CERT-2026-0148',
    body: 'Поступило уточнение по разделу качества. Срок ответа — 12 сентября 2026.',
    at: '2026-08-28T10:06:00',
    unread: true,
    applicationId: 'a148',
  },
  {
    id: 'n2',
    title: 'Не подано уведомление о ввозе образцов',
    body: 'По кейсу CERT-2026-0094 работа 1 открыта: без неё нельзя отгружать тонометры с завода.',
    at: '2026-08-29T08:45:00',
    unread: true,
    applicationId: 'a094',
  },
  {
    id: 'n3',
    title: 'Истекает срок легализации доверенности',
    body: 'По кейсу CERT-2026-0131 работа 0.5 ждёт нотариальный перевод до 3 сентября.',
    at: '2026-08-27T16:40:00',
    unread: true,
    applicationId: 'a131',
  },
  {
    id: 'n4',
    title: 'Запись в ГРЛС подтверждена',
    body: 'По натрия хлориду 0,9 % внесена реестровая запись ЛП-№006421.',
    at: '2026-07-14T12:01:00',
    unread: false,
    applicationId: 'a102',
  },
]

export const FEATURED_ID = 'a094'
