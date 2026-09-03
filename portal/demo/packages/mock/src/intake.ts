/**
 * Мок контура интейка: компании, продукты и сценарий агента.
 *
 * Демо должно кликаться без поднятого Mastra, поэтому здесь лежит
 * детерминированный сценарий диалога. Он повторяет ту же последовательность
 * карточек, что и настоящий агент: запросить документ, показать распознанное с
 * источником, дождаться одобрения, предложить варианты.
 *
 * Живая версия ничего из этого не использует: там ходы генерирует модель.
 */

export type IntakeScope = 'company' | 'product'

export interface DraftField {
  key: string
  label: { ru: string; en: string; zh: string }
  value: string
  /** Без источника карточку нельзя проверить, а она ровно для этого. */
  source: string
  confidence?: number
}

export interface ProgressSection {
  key: 'identity' | 'documents' | 'authority' | 'banking' | 'risk'
  filled: number
  total: number
}

export interface MockCompany {
  id: string
  name: string
  registrationNumber: string
  status: 'collecting' | 'draft' | 'profile_approved'
  draft: DraftField[]
  sections: ProgressSection[]
  riskLevel?: 'low' | 'medium' | 'high'
  productIds: string[]
}

export interface MockProduct {
  id: string
  companyId: string
  name: string
  status: 'collecting' | 'draft' | 'data_approved' | 'variants_pending' | 'variant_selected'
  completeness: number
  draft: DraftField[]
  caseId?: string
}

export type CardPayload =
  | { kind: 'ask'; itemType: string; question: string; acceptsText: boolean; why?: string }
  | { kind: 'processing'; what: string }
  | { kind: 'draft'; scope: IntakeScope; entityId: string; fields: DraftField[]; canApprove: boolean; missing: string[] }
  | { kind: 'approved'; text: string }
  | { kind: 'variants'; productId: string; variants: MockVariant[]; disclaimer: string }
  | { kind: 'case'; caseId: string; text: string }

export interface MockVariant {
  id: string
  variantType: 'recommended' | 'alternative' | 'forbidden'
  title: string
  summary: string
  pros: string[]
  cons: string[]
  reason?: string
  budget?: { currency: 'RMB'; baskets: { key: string; amount: number }[] }
  cycleMonths?: [number, number]
}

export interface MockTurn {
  text: string
  card?: CardPayload
}

const COMPANY_SEED: MockCompany = {
  id: 'org-demo',
  name: '深圳明湖医疗',
  registrationNumber: '91440300MA5G7XXXXX',
  status: 'collecting',
  draft: [],
  sections: [
    { key: 'identity', filled: 0, total: 2 },
    { key: 'documents', filled: 0, total: 2 },
    { key: 'authority', filled: 0, total: 2 },
    { key: 'banking', filled: 0, total: 1 },
    { key: 'risk', filled: 0, total: 1 },
  ],
  productIds: [],
}

const LICENCE_FIELDS: DraftField[] = [
  {
    key: 'legalName',
    label: { ru: 'Юридическое наименование', en: 'Legal name', zh: '法定名称' },
    value: '深圳明湖医疗科技有限公司',
    source: 'business-license · p.1',
    confidence: 0.94,
  },
  {
    key: 'registrationNumber',
    label: { ru: 'Единый код, USCC', en: 'Unified code, USCC', zh: '统一社会信用代码' },
    value: '91440300MA5G7XXXXX',
    source: 'business-license · p.1',
    confidence: 0.91,
  },
  {
    key: 'legalRepresentative',
    label: { ru: 'Законный представитель', en: 'Legal representative', zh: '法定代表人' },
    value: '赵明',
    source: 'business-license · p.1',
    confidence: 0.88,
  },
  {
    key: 'address',
    label: { ru: 'Адрес регистрации', en: 'Registered address', zh: '注册地址' },
    value: '深圳市南山区科技园南区',
    source: 'business-license · p.2',
    confidence: 0.83,
  },
]

const PRODUCT_FIELDS: DraftField[] = [
  {
    key: 'name',
    label: { ru: 'Наименование', en: 'Name', zh: '名称' },
    value: '血糖仪 MH-200',
    source: 'instruction-cn · § 1.1',
    confidence: 0.95,
  },
  {
    key: 'intendedUse',
    label: { ru: 'Назначение', en: 'Intended use', zh: '预期用途' },
    value: 'ИВД для самотестирования',
    source: 'instruction-cn · § 1.2',
    confidence: 0.9,
  },
  {
    key: 'models',
    label: { ru: 'Модели и принадлежности', en: 'Models and accessories', zh: '型号与附件' },
    value: 'MH-200, тест-полоски MH-200S',
    source: 'tech-spec · § 3',
    confidence: 0.86,
  },
  {
    key: 'sterile',
    label: { ru: 'Стерильность', en: 'Sterility', zh: '无菌' },
    value: 'нестерильное',
    source: 'tech-spec · § 5',
    confidence: 0.92,
  },
]

const VARIANTS: MockVariant[] = [
  {
    id: 'var-a',
    variantType: 'recommended',
    title: 'МИ · ИВД самотестирование · класс 2б · ПП 1684',
    summary: 'Национальная процедура: испытания, клиническая оценка, инспекция производства, заявление 630782.',
    pros: ['12–16 месяцев до продаж', 'Удостоверение бессрочное', 'Досье конвертируемо в ЕАЭС'],
    cons: ['Действует только в России', 'Класс 2б требует инспекции по ПП 135'],
    budget: {
      currency: 'RMB',
      baskets: [
        { key: 'subscription', amount: 4150 },
        { key: 'handling', amount: 12800 },
        { key: 'pass-through', amount: 32433 },
      ],
    },
    cycleMonths: [12, 16],
  },
  {
    id: 'var-b',
    variantType: 'alternative',
    title: 'МИ · класс 2б · ЕАЭС, Решение № 46',
    summary: 'Одно удостоверение на государства союза, отдельная услуга 613264.',
    pros: ['Признание в пяти государствах', 'С 2028 года это единственный путь'],
    cons: ['Дольше, ориентировочно 14 месяцев', 'Дороже из-за экспертиз государств признания'],
    budget: {
      currency: 'RMB',
      baskets: [
        { key: 'subscription', amount: 4150 },
        { key: 'handling', amount: 16400 },
        { key: 'pass-through', amount: 41200 },
      ],
    },
    cycleMonths: [14, 20],
  },
  {
    id: 'var-c',
    variantType: 'forbidden',
    title: 'Заявить класс 2а, чтобы сэкономить',
    summary: 'Пошлина ниже и инспекция не нужна.',
    pros: [],
    cons: [],
    reason:
      'Приказ № 4н относит ИВД для самотестирования к классу 2б. Экспертиза вернёт досье: потеря трёх–пяти месяцев и пошлины. Мы это не подаём.',
  },
]

const DISCLAIMER = 'Рамка планирования, не оферта. Решение о регистрации принимает регулятор.'

interface SessionState {
  scope: IntakeScope
  step: number
  entityId: string
}

const sessions = new Map<string, SessionState>()

export function openIntakeSession(scope: IntakeScope, entityId: string): string {
  const id = `ses-${Math.random().toString(36).slice(2, 8)}`
  sessions.set(id, { scope, step: 0, entityId })
  return id
}

export function sessionScope(sessionId: string): IntakeScope {
  return sessions.get(sessionId)?.scope ?? 'company'
}

function companyTurn(step: number): MockTurn {
  switch (step) {
    case 0:
      return {
        text: '请上传营业执照。我会识别公司信息并交给您核对。',
        card: {
          kind: 'ask',
          itemType: 'business-license',
          question: 'Загрузите 营业执照 — свидетельство о регистрации юридического лица.',
          acceptsText: false,
          why: 'По нему заполняются реквизиты и сверяется государственный реестр КНР.',
        },
      }
    case 1:
      return { text: 'Читаю документ.', card: { kind: 'processing', what: 'business-license' } }
    case 2:
      return {
        text: 'Вот что я прочитал. Проверьте и одобрите — или скажите, что исправить.',
        card: {
          kind: 'draft',
          scope: 'company',
          entityId: COMPANY_SEED.id,
          fields: LICENCE_FIELDS,
          canApprove: true,
          missing: [],
        },
      }
    default:
      return {
        text: 'Данные компании сохранены. Можно заводить продукт — параллельно я соберу апостиль, нотариальный перевод и документы на площадку.',
        card: { kind: 'approved', text: 'Профиль компании одобрен' },
      }
  }
}

function productTurn(step: number, productId: string): MockTurn {
  switch (step) {
    case 0:
      return {
        text: 'Расскажите о продукте и приложите, что есть: инструкцию, техническое описание, регистрацию NMPA.',
        card: {
          kind: 'ask',
          itemType: 'instruction-cn',
          question: 'Инструкция по применению и техническое описание',
          acceptsText: false,
          why: 'Документы компании уже подтянуты, повторно загружать их не нужно.',
        },
      }
    case 1:
      return { text: 'Читаю документы.', card: { kind: 'processing', what: 'instruction-cn' } }
    case 2:
      return {
        text: 'Не хватает одного: диапазон и точность измерений. Достаточно одной строки текста.',
        card: {
          kind: 'ask',
          itemType: 'tech-spec',
          question: 'Диапазон и точность измерений',
          acceptsText: true,
          why: 'Нужно для проверки по приказу № 257н: входит ли прибор в перечень средств измерений.',
        },
      }
    case 3:
      return {
        text: 'Карточка продукта собрана. Проверьте и одобрите.',
        card: {
          kind: 'draft',
          scope: 'product',
          entityId: productId,
          fields: PRODUCT_FIELDS,
          canApprove: true,
          missing: [],
        },
      }
    case 4:
      return {
        text: 'Готовлю варианты классификации.',
        card: { kind: 'processing', what: 'classification' },
      }
    case 5:
      return {
        text: 'Вот варианты. Выберите один — специалист подтвердит его, и по нему построится карта процесса.',
        card: { kind: 'variants', productId, variants: VARIANTS, disclaimer: DISCLAIMER },
      }
    default:
      return {
        text: 'Вариант выбран. Кейс заведён и ждёт подтверждения специалистом.',
        card: { kind: 'case', caseId: 'a12', text: 'Ждёт подтверждения специалистом' },
      }
  }
}

/** Один ход сценарного агента. Живой агент отвечает моделью, не таблицей. */
export async function mockAgentTurn(sessionId: string): Promise<MockTurn> {
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 700))
  const session = sessions.get(sessionId)
  if (!session) return { text: 'Сессия не найдена.' }
  const turn =
    session.scope === 'company'
      ? companyTurn(session.step)
      : productTurn(session.step, session.entityId)
  session.step += 1
  return turn
}

export function mockCompanies(): MockCompany[] {
  return [
    {
      ...COMPANY_SEED,
      status: 'profile_approved',
      draft: LICENCE_FIELDS,
      riskLevel: 'low',
      sections: [
        { key: 'identity', filled: 2, total: 2 },
        { key: 'documents', filled: 1, total: 2 },
        { key: 'authority', filled: 2, total: 2 },
        { key: 'banking', filled: 0, total: 1 },
        { key: 'risk', filled: 1, total: 1 },
      ],
      productIds: ['prd-mh200'],
    },
  ]
}

export function mockProducts(): MockProduct[] {
  return [
    {
      id: 'prd-mh200',
      companyId: 'org-demo',
      name: '血糖仪 MH-200',
      status: 'variant_selected',
      completeness: 100,
      draft: PRODUCT_FIELDS,
      caseId: 'a12',
    },
  ]
}

export function progressPercent(sections: ProgressSection[]): number {
  const total = sections.reduce((sum, item) => sum + item.total, 0)
  const filled = sections.reduce((sum, item) => sum + item.filled, 0)
  return total === 0 ? 0 : Math.round((filled * 100) / total)
}
