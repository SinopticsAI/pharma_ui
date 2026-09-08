import type {
  CaseDetail,
  CaseItem,
  ChatMessage,
  ClassificationVariant,
  FieldMask,
  L10n,
  LedgerLine,
  Mandate,
  NodeMapItem,
  Organization,
  OrganizationItem,
  Product,
  RegistrationCase,
  StatusEntry,
} from '@demo/domain'
import {
  DEMO_CASE_RU0417,
  DEMO_CONTRACTOR_TESTLAB,
  DEMO_ORG_MINGHU,
  DEMO_ORG_RUIKANG,
  DEMO_PRODUCT_MH200,
  DEMO_PRODUCT_RK30,
} from './ids'
import type { DemoUiState } from './state'

const zh = (zhText: string, en: string, ru: string): L10n => ({ zh: zhText, en, ru })

const MASK: FieldMask = {
  mandateCredentials: false,
  ledgerPay: false,
  statusWrite: false,
  audit: true,
  chat: true,
  roadmap: true,
}

const draft = (value: string, source: string, confidence = 0.96) => ({
  value,
  source,
  confidence,
  verified: true,
})

export const DEMO_USER = zh('王磊', 'Wang Lei', 'Ван Лэй')
export const DEMO_SPECIALIST = zh('李静', 'Li Jing', 'Ли Цзин')

export const minghuName = zh('深圳明湖医疗', 'Shenzhen Minghu Medical', 'Шэньчжэнь Минху Медикал')
export const ruikangName = zh('杭州瑞康', 'Hangzhou Ruikang', 'Ханчжоу Жуйкан')
export const mh200Name = zh('MH-200 血糖仪 + 试纸', 'MH-200 glucose meter + strips', 'Глюкометр MH-200 + полоски')
export const rk30Name = zh('RK-30 血压计', 'RK-30 blood pressure monitor', 'Тонометр RK-30')

export function demoMinghu(): Organization {
  return {
    id: DEMO_ORG_MINGHU,
    accountId: 'demo-account',
    kind: 'manufacturer',
    name: minghuName,
    status: 'profile_approved',
    draft: {
      legalName: draft('深圳明湖医疗科技有限公司', '营业执照 · OCR'),
      legalNameEn: draft('Shenzhen Minghu Medical Co., Ltd.', '营业执照 · OCR'),
      registrationNumber: draft('91440300MA5G7123X', '营业执照 · OCR'),
      legalRepresentative: draft('赵敏', '营业执照 · OCR'),
      address: draft('广东省深圳市南山区科技园', '营业执照 · OCR'),
      establishedOn: draft('2016-04-18', '国家企业信用信息公示系统'),
      businessScope: draft('第二类医疗器械（体外诊断）的研发与生产', '营业执照 · OCR'),
      capital: draft('人民币 5,000 万元', '国家企业信用信息公示系统'),
    },
    profile: {
      legalName: '深圳明湖医疗科技有限公司',
      legalNameEn: 'Shenzhen Minghu Medical Co., Ltd.',
      registrationNumber: '91440300MA5G7123X',
      legalRepresentative: '赵敏',
      address: '广东省深圳市南山区科技园',
      establishedOn: '2016-04-18',
      businessScope: '第二类医疗器械（体外诊断）的研发与生产',
      capital: '人民币 5,000 万元',
    },
    createdAt: '2026-03-02T08:00:00',
    updatedAt: '2026-08-20T10:00:00',
    completeness: {
      filled: 13,
      total: 13,
      percent: 100,
      ready: true,
      sections: [
        { key: 'identity', filled: 4, total: 4 },
        { key: 'documents', filled: 4, total: 4 },
        { key: 'authority', filled: 2, total: 2 },
        { key: 'banking', filled: 2, total: 2 },
        { key: 'risk', filled: 1, total: 1 },
      ],
    },
  }
}

export function demoRuikang(state: DemoUiState): Organization {
  const docs = 2 + (state.ruikangCharter ? 1 : 0)
  const bank = state.ruikangBankDone ? 1 : 0
  const filled = 4 + docs + 2 + bank
  const total = 13
  return {
    id: DEMO_ORG_RUIKANG,
    accountId: 'demo-account',
    kind: 'manufacturer',
    name: ruikangName,
    status: 'collecting',
    draft: {
      legalName: draft('杭州瑞康医疗器械有限公司', '营业执照 · OCR'),
      registrationNumber: draft('91330100MA2H8…', '营业执照 · OCR'),
      legalRepresentative: draft('周宁', '营业执照 · OCR'),
    },
    profile: {},
    createdAt: '2026-08-28T09:00:00',
    updatedAt: '2026-09-06T11:00:00',
    completeness: {
      filled,
      total,
      percent: Math.round((filled / total) * 100),
      ready: false,
      sections: [
        { key: 'identity', filled: 4, total: 4 },
        { key: 'documents', filled: docs, total: 4 },
        { key: 'authority', filled: 2, total: 2 },
        { key: 'banking', filled: bank, total: 2 },
        { key: 'risk', filled: 0, total: 1 },
      ],
    },
  }
}

export function classificationVariants(productId: string): ClassificationVariant[] {
  return [
    {
      id: `${productId}-A`,
      productId,
      variantType: 'recommended',
      kind: 'device',
      track: 'pp1684',
      riskClass: '2b',
      title: zh(
        '体外诊断 · 自测 · 2б · 国家程序 1684',
        'IVD self-test · 2b · national 1684',
        'ИВД самотест · 2б · нац. 1684',
      ),
      summary: zh(
        '12–16 个月至销售；规费 147 000 卢布；注册证无限期；仅俄罗斯有效；2б 须按 ПП 135 接受生产检查。',
        '12–16 months to sales; state fee RUB 147,000; indefinite certificate; Russia only; class 2b needs a production inspection under Decree 135.',
        '12–16 мес. до продаж; пошлина 147 000 руб.; бессрочное РУ; только Россия; класс 2б — инспекция по ПП 135.',
      ),
      pros: [
        zh('申请窗口开放至 2027-12-31', 'Filings accepted until 31.12.2027', 'Приём заявок открыт до 31.12.2027'),
        zh(
          '卷宗按可转欧亚联盟结构准备',
          'Dossier prepared convertible to the EAEU',
          'Досье готовим конвертируемым в ЕАЭС',
        ),
        zh('注册证无限期（器械规则）', 'Indefinite certificate for devices', 'Бессрочное РУ по правилу для изделия'),
      ],
      cons: [
        zh('仅在俄罗斯有效', 'Valid in Russia only', 'Действует только в России'),
        zh('2б 必须生产检查', 'Class 2b requires a production inspection', 'Класс 2б требует инспекцию производства'),
      ],
      reason: null,
      budget: { currency: 'RMB', baskets: [{ key: 'fee', amount: 11878 }] },
      distribution: {},
      cycleMonths: [12, 16],
      selected: true,
    },
    {
      id: `${productId}-B`,
      productId,
      variantType: 'alternative',
      kind: 'device',
      track: 'eaeu46',
      riskClass: '2b',
      title: zh(
        '2б · 欧亚经济联盟程序（第 46 号决定）',
        '2b · EAEU procedure (Decision 46)',
        '2б · процедура ЕАЭС (Решение 46)',
      ),
      summary: zh(
        '一张注册证覆盖联盟五国；更长、更贵。在获得承认前仍只能在俄罗斯销售。2028 年起这是唯一路径。',
        'One certificate for five union states; longer and more expensive. Until recognition you still sell only in Russia. From 2028 this is the only path.',
        'Одно РУ на пять стран союза; дольше и дороже. До признания продаёте только в России. С 2028 это единственный путь.',
      ),
      pros: [zh('一张证覆盖五国', 'One certificate for five countries', 'Одно РУ на пять стран')],
      cons: [
        zh('周期约 14 个月且更贵', 'About 14 months and more expensive', 'Около 14 месяцев и дороже'),
        zh('承认前仍仅俄罗斯', 'Russia only until recognition', 'До признания — только Россия'),
      ],
      reason: null,
      budget: { currency: 'RMB', baskets: [{ key: 'fee', amount: 18600 }] },
      distribution: {},
      cycleMonths: [14, 18],
      selected: false,
    },
    {
      id: `${productId}-C`,
      productId,
      variantType: 'forbidden',
      kind: 'device',
      track: 'pp1684',
      riskClass: '2a',
      title: zh('申报 2а 以降低费用', 'File as class 2a to cut cost', 'Заявить класс 2а, чтобы сэкономить'),
      summary: zh(
        '规费更低且无生产检查，但 4н 号令将自测体外诊断列为 2б。审评会退回卷宗，损失 3–5 个月与规费。我们不会申报此项。',
        'A lower fee and no inspection, but order 4n places self-test IVD in class 2b. Expertise will return the dossier — 3–5 months and the fee lost. We will not file this.',
        'Пошлина ниже и нет инспекции, но приказ 4н относит ИВД для самотестирования к 2б. Экспертиза вернёт досье: потеря 3–5 месяцев и пошлины. Мы это не подаём.',
      ),
      pros: [],
      cons: [zh('卷宗将被退回', 'The dossier will be returned', 'Досье вернут')],
      reason: zh('我们不会申报此项。', 'We will not file this.', 'Мы это не подаём.'),
      budget: { currency: 'RMB', baskets: [] },
      distribution: {},
      cycleMonths: [12, 16],
      selected: false,
    },
  ]
}

export function demoMh200(state: DemoUiState): Product {
  const answered = Number(state.mh200Electro) + Number(state.mh200Accuracy) + Number(state.mh200Market !== null)
  const completeness = 78 + answered * 7
  return {
    id: DEMO_PRODUCT_MH200,
    accountId: 'demo-account',
    organizationId: DEMO_ORG_MINGHU,
    name: mh200Name,
    kind: 'device',
    status: 'ru_confirmed',
    draft: {
      name: draft('MH-200 血糖监测系统', 'NMPA / IFU §1.2'),
      intendedUse: draft('体外诊断，患者自测血糖', 'IFU §1.2'),
      manufacturer: draft('深圳明湖医疗科技有限公司', 'NMPA'),
      sterile: draft('非无菌', 'IFU'),
      nmpaNumber: draft('国械注准 2019…', 'NMPA'),
      measuring: draft('血糖；按 257н 号令现行清单，不属于计量器具', 'приказ 257н · 当日核对'),
    },
    completeness: Math.min(99, completeness),
    selectedVariantId: `${DEMO_PRODUCT_MH200}-A`,
    specialistApprovedBy: '李静',
    specialistApprovedAt: '2026-03-18T09:40:00',
    clientApprovedBy: '王磊',
    clientApprovedAt: '2026-03-18T11:05:00',
    caseId: DEMO_CASE_RU0417,
    updatedAt: '2026-09-07T16:00:00',
    documents: demoDocuments(),
    missing: mh200Missing(state),
    variants: classificationVariants(DEMO_PRODUCT_MH200),
  }
}

export function demoRk30(state: DemoUiState): Product {
  return {
    id: DEMO_PRODUCT_RK30,
    accountId: 'demo-account',
    organizationId: DEMO_ORG_RUIKANG,
    name: rk30Name,
    kind: 'device',
    status: state.rk30MapBuilt ? 'ru_confirmed' : 'variants_pending',
    draft: {
      name: draft('RK-30 上臂式电子血压计', '说明书'),
      intendedUse: draft('家庭血压测量', '说明书'),
    },
    completeness: 100,
    selectedVariantId: state.rk30Selected ? `${DEMO_PRODUCT_RK30}-${state.rk30Selected}` : '',
    specialistApprovedBy: state.rk30SpecialistApproved ? '李静' : '',
    specialistApprovedAt: state.rk30SpecialistApproved ? '2026-09-06T14:10:00' : '',
    clientApprovedBy: state.rk30ClientApproved ? '王磊' : '',
    clientApprovedAt: state.rk30ClientApproved ? '2026-09-08T09:00:00' : '',
    caseId: state.rk30MapBuilt ? DEMO_CASE_RU0417 : '',
    updatedAt: '2026-09-07T12:00:00',
    documents: [],
    missing: [],
    variants: classificationVariants(DEMO_PRODUCT_RK30).map((item) => ({
      ...item,
      selected: Boolean(state.rk30Selected && item.id.endsWith(`-${state.rk30Selected}`)),
    })),
  }
}

function mh200Missing(state: DemoUiState): string[] {
  const missing: string[] = []
  if (!state.mh200Electro) missing.push('电安全试验协议')
  if (!state.mh200Accuracy) missing.push('测量范围与准确度')
  if (!state.mh200Market) missing.push('市场：仅俄罗斯或整个欧亚经济联盟')
  return missing
}

export function demoDocuments(): OrganizationItem[] {
  const base = (
    id: string,
    level: 'company' | 'product',
    itemType: string,
    title: L10n,
    fileName: string,
  ): OrganizationItem => ({
    id,
    organizationId: DEMO_ORG_MINGHU,
    productId: level === 'product' ? DEMO_PRODUCT_MH200 : '',
    level,
    itemType,
    title,
    fileName,
    objectKey: `demo/${fileName}`,
    status: 'parsed',
    parcedData: { extracted: { note: 'demo' } },
    version: 1,
    promotedFrom: '',
    promotedAt: '',
    updatedAt: '2026-08-01T00:00:00',
  })
  return [
    base(
      'doc-license',
      'company',
      'business-license',
      zh('营业执照', 'Business licence', 'Бизнес-лицензия'),
      'yingye-zhizhao-v3.pdf',
    ),
    base('doc-iso', 'company', 'iso-13485', zh('ISO 13485 v4', 'ISO 13485 v4', 'ISO 13485 v4'), 'iso-13485-v4.pdf'),
    base(
      'doc-poa',
      'company',
      'poa-upp',
      zh('授权代表委托书草稿', 'AR POA draft', 'Черновик POA'),
      'poa-upp-v1-draft.pdf',
    ),
    base(
      'doc-nmpa',
      'product',
      'nmpa-certificate',
      zh('NMPA 注册证', 'NMPA certificate', 'Удостоверение NMPA'),
      'nmpa-mh200.pdf',
    ),
    base('doc-ifu', 'product', 'instruction-cn', zh('中文说明书', 'IFU CN', 'Инструкция CN'), 'ifu-mh200-cn.pdf'),
    base(
      'doc-lab',
      'product',
      'lab-protocol',
      zh('NMPA/CE 检测（不替代俄方 ГОСТ）', 'NMPA/CE tests (do not replace GOST)', 'NMPA/CE, не заменяют ГОСТ'),
      'nmpa-bench.pdf',
    ),
  ]
}

export function demoCaseCard(): RegistrationCase {
  return {
    id: DEMO_CASE_RU0417,
    code: 'RU-0417',
    product: mh200Name,
    manufacturer: minghuName,
    kind: 'device',
    track: 'pp1684',
    riskClass: '2b',
    currentStage: 'samples',
    nextActor: 'hq',
    waitingFor: zh(
      '上传电安全试验协议；实验室档期保留至 18.09',
      'Upload electrical-safety protocols; the lab slot is held until 18.09',
      'Загрузить протоколы электробезопасности; слот лаборатории до 18.09',
    ),
    dueWorkingDays: 8,
    startedOn: '2025-07-01',
    cycleMonths: [12, 16],
    mandateComplete: true,
    modelsLocked: true,
    accountId: 'demo-account',
    organizationId: DEMO_ORG_MINGHU,
    productId: DEMO_PRODUCT_MH200,
    intakeSessionId: '',
    trackConfirmed: true,
  }
}

const node = (
  code: string,
  position: number,
  title: L10n,
  status: NodeMapItem['status'],
  owner: NodeMapItem['owner'],
  blockedBy: string[],
  dueHint: L10n,
  note: L10n,
  critical = false,
): NodeMapItem => ({ code, position, title, status, owner, blockedBy, dueHint, note, critical })

export function demoNodes(): NodeMapItem[] {
  return [
    node(
      'M0',
      0,
      zh('分类与程序', 'Classification and procedure', 'Классификация и процедура'),
      'done',
      'us',
      [],
      zh('第 1 周', 'Week 1', 'нед. 1'),
      zh(
        '2б 体外诊断，国家程序 1684，专家已确认',
        'Class 2b IVD, national 1684, specialist confirmed',
        'Класс 2б ИВД, нац. 1684, утверждено специалистом',
      ),
    ),
    node(
      'M1',
      1,
      zh('合同与授权代表', 'Contract and AR', 'Договор и УПП'),
      'done',
      'us',
      ['M0'],
      zh('第 2–6 周', 'Weeks 2–6', 'нед. 2–6'),
      zh(
        '委托书绑定于您；更换授权代表按您的要求',
        'POA is tied to you; AR change on your request',
        'Доверенность закреплена; смена УПП по требованию',
      ),
    ),
    node(
      'M2',
      2,
      zh('卷宗已齐', 'Dossier assembled', 'Досье собрано'),
      'done',
      'us',
      ['M1'],
      zh('第 2–4 月', 'Months 2–4', 'мес. 2–4'),
      zh(
        '按 ПП 1684 第 65 条结构，版本受控',
        'Structure per p. 65 of Decree 1684, versions controlled',
        'Структура по п. 65 ПП 1684',
      ),
    ),
    node(
      'M3',
      3,
      zh('翻译与海牙认证', 'Translation and apostille', 'Перевод и апостиль'),
      'done',
      'us',
      ['M2'],
      zh('第 2–3 月', 'Months 2–3', 'мес. 2–3'),
      zh(
        '公司文件组：翻译 → 公证 → 海牙认证',
        'Company set: translation → notary → apostille',
        'Группа задач компании',
      ),
    ),
    node(
      'M4',
      4,
      zh('样品运抵俄罗斯', 'Samples to Russia', 'Образцы в Россию'),
      'done',
      'us',
      ['M2'],
      zh('第 3 月', 'Month 3', 'мес. 3'),
      zh(
        '201н 通知 + 海关；物流由智能体起草',
        'Notice 201n + customs; logistics drafted by the agent',
        'Уведомление 201н + таможня',
      ),
    ),
    node(
      'M5',
      5,
      zh('检测（ГОСТ）', 'Testing (GOST)', 'Испытания (ГОСТ)'),
      'in_progress',
      'contractor',
      ['M4'],
      zh('至 18.09', 'Until 18.09', 'до 18.09'),
      zh(
        '等待您的 1 份文件：电安全试验协议。实验室档期保留至 18.09。NMPA/CE 报告不能替代。',
        'Waiting for 1 file from you: electrical-safety protocols. Lab slot held until 18.09. NMPA/CE reports do not replace this.',
        'Ждём 1 документ — протоколы электробезопасности. Слот до 18.09.',
      ),
      true,
    ),
    node(
      'M6',
      6,
      zh('临床评价', 'Clinical evaluation', 'Клиническая оценка'),
      'in_progress',
      'contractor',
      ['M5'],
      zh('第 5–8 月', 'Months 5–8', 'мес. 5–8'),
      zh(
        '体外诊断无需临床试验许可，准备评价卷宗',
        'IVD: no clinical-trial permit; evaluation dossier',
        'Для ИВД — без разрешения на КИ',
      ),
    ),
    node(
      'M7',
      7,
      zh('生产检查', 'Production inspection', 'Инспекция производства'),
      'planned',
      'gov',
      ['M2'],
      zh('第 8 月', 'Month 8', 'мес. 8'),
      zh('ПП 135，赴深圳现场', 'Decree 135, visit to Shenzhen', 'ПП 135, выезд в Шэньчжэнь'),
    ),
    node(
      'M8',
      8,
      zh('递交与审评（РЗН）', 'Filing and expertise (RZN)', 'Подача и экспертиза (РЗН)'),
      'later',
      'gov',
      ['M5', 'M6', 'M7'],
      zh('第 9–13 月', 'Months 9–13', 'мес. 9–13'),
      zh(
        '前置节点完成后才打开；补充要求会暂停计时',
        'Opens after predecessors; an expertise request pauses the clock',
        'Откроется, когда пройдены предшественники',
      ),
    ),
    node(
      'M9',
      9,
      zh('俄文标识', 'Russian labelling', 'Русская маркировка'),
      'later',
      'us',
      ['M8'],
      zh('2 周', '2 weeks', '2 нед.'),
      zh('俄文说明书 + 进口标签', 'Russian IFU + import label', 'Инструкция на русском + этикетка'),
    ),
    node(
      'M10',
      10,
      zh('Честный ЗНАК', 'Chestny ZNAK', 'Честный ЗНАК'),
      'later',
      'us',
      ['M9'],
      zh('1 周', '1 week', '1 нед.'),
      zh(
        '按当日清单核验，不写死在代码里',
        'Checked against the list in force on the date, not hard-coded',
        'Сверка по актуальной редакции перечня',
      ),
    ),
    node(
      'M11',
      11,
      zh('安全监测', 'Safety monitoring', 'Мониторинг безопасности'),
      'later',
      'us',
      ['M8'],
      zh('2 周', '2 weeks', '2 нед.'),
      zh('1113н 号令 — 授权代表义务', 'Order 1113n — AR duty', 'Приказ 1113н — обязанность УПП'),
    ),
    node(
      'M12',
      12,
      zh('首次合法销售', 'First legal sale', 'Первая легальная продажа'),
      'goal',
      'you',
      ['M9', 'M10', 'M11'],
      zh('第 13–14 月', 'Months 13–14', 'мес. 13–14'),
      zh(
        '商业进口 + 批次通知。成功标准。',
        'Commercial import + batch notice. Success metric.',
        'Коммерческий импорт + уведомление о партии',
      ),
    ),
  ]
}

export function demoMandate(): Mandate {
  return {
    caseId: DEMO_CASE_RU0417,
    operator: 'ООО «МедМост РУ»',
    role: 'upp',
    complete: true,
    steps: [
      { key: 'service-contract', status: 'done', date: '2026-03-04' },
      { key: 'power-of-attorney', status: 'done', date: '2026-03-20' },
      { key: 'apostille', status: 'done', date: '2026-04-08' },
      { key: 'notarized-translation', status: 'done', date: '2026-04-15' },
      { key: 'representative-registered', status: 'done', date: '2026-04-22' },
    ],
  }
}

export function demoCaseDetail(): CaseDetail {
  const nodes = demoNodes()
  return {
    case: demoCaseCard(),
    fieldMask: MASK,
    nodeMap: nodes,
    criticalNode: nodes.find((item) => item.critical) ?? null,
    mandate: demoMandate(),
  }
}

export function demoCaseItems(): CaseItem[] {
  return demoDocuments().map((item) => ({
    id: item.id,
    caseId: DEMO_CASE_RU0417,
    itemType: item.itemType,
    title: item.title,
    fileName: item.fileName,
    objectKey: item.objectKey,
    status: item.status,
    parcedData: item.parcedData,
  }))
}

export function demoStatuses(): StatusEntry[] {
  return officialEvents().map((event, index) => ({
    id: `st-${index}`,
    caseId: DEMO_CASE_RU0417,
    stage: event.stage,
    text: event.title,
    artifact: event.number,
    enteredBy: 'УПП · зеркало госканала',
    enteredAt: event.at,
  }))
}

export function demoChat(): ChatMessage[] {
  return [
    {
      id: 'c1',
      caseId: DEMO_CASE_RU0417,
      side: 'ru',
      author: 'Е. Смирнова, УПП',
      text: zh(
        '实验室档期保留至 18.09。请上传电安全试验协议。',
        'The lab slot is held until 18.09. Please upload the electrical-safety protocols.',
        'Слот лаборатории держим до 18.09. Нужны протоколы электробезопасности.',
      ),
      at: '2026-09-05T10:15:00',
    },
    {
      id: 'c2',
      caseId: DEMO_CASE_RU0417,
      side: 'cn',
      author: '王磊',
      text: zh(
        '工厂正在整理 2025 年电安全报告，明日上传。',
        'The factory is gathering the 2025 electrical-safety report and will upload it tomorrow.',
        'Завод собирает протокол 2025 года, загрузим завтра.',
      ),
      at: '2026-09-05T11:02:00',
    },
  ]
}

export function demoLedger(): LedgerLine[] {
  return [
    {
      id: 'pay-a',
      caseId: DEMO_CASE_RU0417,
      date: '2026-09-01',
      supplier: zh('MedMost 平台', 'MedMost platform', 'Платформа MedMost'),
      purpose: zh(
        '年度订阅（本月份额，含 2 个在办产品）',
        'Annual subscription, this month, 2 active products',
        'Годовая подписка, доля за месяц',
      ),
      amount: 4150,
      currency: 'CNY',
      type: 'commission',
      status: 'paid',
      original: zh('INV-2026-0917 / A', 'INV-2026-0917 / A', 'INV-2026-0917 / A'),
    },
    {
      id: 'pay-b',
      caseId: DEMO_CASE_RU0417,
      date: '2026-09-01',
      supplier: zh('MedMost 办理', 'MedMost case management', 'Ведение кейса MedMost'),
      purpose: zh(
        '公开办理费：翻译、海牙认证协调、质控、路径与期限',
        'Public case-management fee: translation, apostille coordination, QC, routing',
        'Публичный тариф ведения',
      ),
      amount: 12800,
      currency: 'CNY',
      type: 'commission',
      status: 'accepted',
      original: zh('INV-2026-0917 / B', 'INV-2026-0917 / B', 'INV-2026-0917 / B'),
    },
    {
      id: 'pay-c1',
      caseId: DEMO_CASE_RU0417,
      date: '2026-09-01',
      supplier: zh('ООО «МедМост РУ» · 授权代表', 'MedMost RU · AR', 'ООО «МедМост РУ» · УПП'),
      purpose: zh(
        '授权代表公开费率 1/3（委托书生效且柜面已绑定）',
        'AR public tariff 1/3 (POA in force and cabinet bound)',
        'УПП 1/3, POA в силе',
      ),
      amount: 18315,
      currency: 'CNY',
      type: 'pass-through',
      status: 'paid',
      original: zh(
        '合同 ¥ 226 667 · 中国银行中间价 0.0808',
        'Contract ¥226,667 · PBoC mid 0.0808',
        'Контракт ¥ 226 667 · курс 0.0808',
      ),
    },
    {
      id: 'pay-c2',
      caseId: DEMO_CASE_RU0417,
      date: '2026-09-03',
      supplier: zh('Росздравнадзор', 'Roszdravnadzor', 'Росздравнадзор'),
      purpose: zh(
        '国家规费，НК РФ 333.32.2，2б 类 147 000 卢布',
        'State fee, Tax Code 333.32.2, class 2b RUB 147,000',
        'Госпошлина, ст. 333.32.2, класс 2б',
      ),
      amount: 11878,
      currency: 'CNY',
      type: 'pass-through',
      status: 'paid',
      original: zh('缴费凭证已附 · 当日汇率', 'Receipt attached · rate of the day', 'Платёжка приложена'),
    },
    {
      id: 'pay-c3',
      caseId: DEMO_CASE_RU0417,
      date: '2026-09-04',
      supplier: zh('公证处', 'Notary', 'Нотариус'),
      purpose: zh('公证 — 成本价，无加价', 'Notary — at cost, no mark-up', 'Нотариус по себестоимости'),
      amount: 2240,
      currency: 'CNY',
      type: 'pass-through',
      status: 'funded',
      original: zh('收据 N-441', 'Receipt N-441', 'Квитанция N-441'),
    },
  ]
}

export interface RiskCheckRow {
  key: string
  name: L10n
  result: L10n
  source: L10n
  updated: string
  detail: L10n
  tone: 'ok' | 'warm' | 'quiet'
}

export function riskChecks(): RiskCheckRow[] {
  return [
    {
      key: 'status',
      name: zh('公司状态 / 注册资本 / 股东', 'Legal status / capital / founders', 'Статус / капитал / учредители'),
      result: zh(
        '存续 · 人民币 5,000 万 · 股东已披露',
        'Active · CNY 50m · founders disclosed',
        'Действует · 50 млн юаней · учредители раскрыты',
      ),
      source: zh('国家企业信用信息公示系统', 'National enterprise credit system', 'Нац. система раскрытия'),
      updated: '2026-09-07',
      detail: zh('与营业执照一致。', 'Matches the business licence.', 'Совпадает с лицензией.'),
      tone: 'ok',
    },
    {
      key: 'courts',
      name: zh('诉讼 / 执行', 'Litigation / enforcement', 'Судебные дела / исполнительные производства'),
      result: zh('0 / 0', '0 / 0', '0 / 0'),
      source: zh('中国裁判文书网 / 执行信息公开', 'Judgement / enforcement registers', 'Реестры судов и исполнений'),
      updated: '2026-09-07',
      detail: zh('未见未结诉讼或执行。', 'No open cases or enforcement.', 'Открытых дел нет.'),
      tone: 'ok',
    },
    {
      key: 'dishonest',
      name: zh('失信被执行人', 'Dishonest judgement debtor list', 'Список 失信'),
      result: zh('未列入', 'Not listed', 'Не числится'),
      source: zh('最高人民法院失信名单', 'SPC dishonest-debtor list', 'Список ВС КНР'),
      updated: '2026-09-07',
      detail: zh('未出现在失信名单。', 'Not on the list.', 'В списке нет.'),
      tone: 'ok',
    },
    {
      key: 'admin',
      name: zh('行政处罚', 'Administrative fines', 'Административные штрафы'),
      result: zh('1 笔（2019，标识，已纠正）', '1 (2019, labelling, remediated)', '1 (2019, маркировка — устранён)'),
      source: zh('国家企业信用信息公示系统', 'National enterprise credit system', 'Нац. система раскрытия'),
      updated: '2026-09-07',
      detail: zh(
        '历史罚款已披露并关闭，不影响本次接案。',
        'Historical fine disclosed and closed; it does not block this engagement.',
        'Старый штраф раскрыт, на допуск не влияет.',
      ),
      tone: 'warm',
    },
    {
      key: 'sanctions',
      name: zh(
        '股东与受益人 — 美 / 欧 / 俄制裁',
        'Founders and UBO — US / EU / RU sanctions',
        'Учредители — санкции США / ЕС / РФ',
      ),
      result: zh('无命中', 'No hits', 'Совпадений нет'),
      source: zh('OFAC / EU / РФ 公开名单', 'OFAC / EU / RU public lists', 'OFAC / ЕС / РФ'),
      updated: '2026-09-07',
      detail: zh('未见制裁命中。', 'No sanctions hits.', 'Совпадений нет.'),
      tone: 'ok',
    },
    {
      key: 'profile',
      name: zh('经营范围与医疗器械相符', 'Activity matches medical devices', 'Профиль соответствует медизделиям'),
      result: zh('第二类体外诊断', 'Class II IVD', 'ИВД II класса'),
      source: zh('营业执照经营范围', 'Licence business scope', 'Вид деятельности в лицензии'),
      updated: '2026-09-07',
      detail: zh(
        '范围覆盖拟注册产品。',
        'Scope covers the product to be registered.',
        'Профиль соответствует изделию.',
      ),
      tone: 'ok',
    },
  ]
}

export interface NodeDocument {
  id: string
  title: L10n
  version: string
  origin: L10n
  translate: 'done' | 'progress' | 'pending'
  notary: 'done' | 'progress' | 'pending'
  apostille: 'done' | 'progress' | 'pending'
  risk: 'low' | 'medium' | 'high'
  riskReason: L10n
  action: 'done' | 'we' | 'fix'
}

export function m3Documents(): NodeDocument[] {
  return [
    {
      id: 'lic',
      title: zh('营业执照', 'Business licence', 'Бизнес-лицензия'),
      version: 'v3',
      origin: zh('原件 · 公司档案', 'Original · company profile', 'Оригинал · профиль компании'),
      translate: 'done',
      notary: 'done',
      apostille: 'done',
      risk: 'low',
      riskReason: zh('实务中未见该类意见。', 'No remarks in practice.', 'Замечаний в практике нет.'),
      action: 'done',
    },
    {
      id: 'charter',
      title: zh('公司章程', 'Articles of association', 'Устав компании'),
      version: 'v2',
      origin: zh('原件 · 公司档案', 'Original · company profile', 'Оригинал · профиль компании'),
      translate: 'done',
      notary: 'done',
      apostille: 'progress',
      risk: 'low',
      riskReason: zh(
        '标准格式，海牙认证预计 10-12 完成。',
        'Standard form; apostille expected by 12.10.',
        'Стандартная форма, апостиль до 12.10.',
      ),
      action: 'we',
    },
    {
      id: 'poa',
      title: zh('授权代表委托书（POA）', 'AR power of attorney (POA)', 'Доверенность на УПП'),
      version: 'v1 草稿',
      origin: zh('智能体草稿', 'Agent draft', 'Черновик агента'),
      translate: 'progress',
      notary: 'pending',
      apostille: 'pending',
      risk: 'high',
      riskReason: zh(
        '第 4 条「无限制代表」在 РЗН 实务中已两次引发意见。须列出具体权限。智能体已备好修订稿，须由人确认。',
        'Clause 4 (“representation without limits”) has already drawn RZN remarks twice. A list of specific powers is required. The agent has a corrected draft; a person must confirm it.',
        'П. 4 о представительстве без ограничений уже дважды давал замечания РЗН. Нужен перечень полномочий. Агент подготовил правку — человек подтверждает.',
      ),
      action: 'fix',
    },
    {
      id: 'iso',
      title: zh('ISO 13485', 'ISO 13485', 'ISO 13485'),
      version: 'v4',
      origin: zh('来自公司档案', 'From the company profile', 'Из профиля компании'),
      translate: 'done',
      notary: 'progress',
      apostille: 'pending',
      risk: 'low',
      riskReason: zh(
        '有效期覆盖案件周期。公证预约 10-05。',
        'Validity covers the case. Notary booked for 05.10.',
        'Срок действия достаточен. Нотариус 05.10.',
      ),
      action: 'we',
    },
  ]
}

export interface ContractorCard {
  id: string
  name: L10n
  role: L10n
  orders: number
  median: L10n
  accepted: string
  remarks: number
  slips: L10n
  incidents: number
  checks: { source: L10n; result: L10n }[]
  timeline: { at: L10n; text: L10n }[]
}

export function demoContractor(): ContractorCard {
  return {
    id: DEMO_CONTRACTOR_TESTLAB,
    name: zh('ООО «ТестЛаб Москва»', 'TestLab Moscow LLC', 'ООО «ТестЛаб Москва»'),
    role: zh('获认可检测实验室', 'Accredited testing laboratory', 'Аккредитованная лаборатория'),
    orders: 14,
    median: zh('9.2 周（较市场 −12%）', '9.2 weeks (−12% vs market)', '9,2 нед. (−12% к рынку)'),
    accepted: '100%',
    remarks: 0,
    slips: zh('1 次（+9 天，已提前告知）', '1 (+9 days, warned in advance)', '1 (+9 дней, предупредили заранее)'),
    incidents: 0,
    checks: [
      {
        source: zh('ЕГРЮЛ — 法人状态', 'EGRUL — legal status', 'ЕГРЮЛ — статус'),
        result: zh('存续', 'Active', 'Действующее'),
      },
      {
        source: zh('Росаккредитация 认可', 'RusAccreditation', 'Росаккредитация'),
        result: zh('有效至 2028', 'Valid through 2028', 'Действует до 2028'),
      },
      {
        source: zh('仲裁案件', 'Arbitration', 'Арбитраж'),
        result: zh('1 件（原告，已结）', '1 (claimant, closed)', '1 (истец, завершено)'),
      },
      {
        source: zh('制裁 / 破产 / 欠税', 'Sanctions / bankruptcy / arrears', 'Санкции / банкротство / недоимки'),
        result: zh('未发现', 'None found', 'Не найдено'),
      },
    ],
    timeline: [
      {
        at: zh('已预约档期', 'Slot booked', 'Слот забронирован'),
        text: zh('ГОСТ 检测窗口至 18.09', 'GOST window until 18.09', 'Окно ГОСТ до 18.09'),
      },
      {
        at: zh('质控后已交包', 'Pack handed over after QC', 'Пакет передан после QC'),
        text: zh('12 个文件', '12 files', '12 файлов'),
      },
      {
        at: zh('检测待文件', 'Testing waits for a file', 'Испытания ждут документ'),
        text: zh('电安全试验协议', 'Electrical-safety protocol', 'Протокол электробезопасности'),
      },
      {
        at: zh('报告（计划）', 'Protocols (planned)', 'Протоколы (план)'),
        text: zh('收到缺件后 3 周', '3 weeks after the missing file', 'Через 3 недели после документа'),
      },
    ],
  }
}

export interface AutomationRow {
  id: string
  action: L10n
  result: L10n
  status: 'draft' | 'waiting' | 'done' | 'active'
  at: string
  confirmBy: L10n
  audit: string
  model: string
  confirmKey?: 'logistics' | 'lab' | 'rzn'
}

export function automationRows(): AutomationRow[] {
  return [
    {
      id: 'logistics',
      action: zh('样品物流', 'Sample logistics', 'Логистика образцов'),
      result: zh(
        '工厂揽收 → 空运 → 保税仓 → 实验室；201н 通知草稿；承运发票转付',
        'Pickup → air → bonded warehouse → lab; 201n draft; carrier invoice pass-through',
        'Забор → авиа → ВХ → лаборатория; черновик 201н',
      ),
      status: 'draft',
      at: '2026-09-07T07:12:00',
      confirmBy: zh('您 · 确认订单', 'You · confirm the order', 'Вы · подтвердить заказ'),
      audit: 'A-8812',
      model: 'medmost-ops/2026.08',
      confirmKey: 'logistics',
    },
    {
      id: 'lab',
      action: zh('致实验室函', 'Letter to the laboratory', 'Письмо в лабораторию'),
      result: zh(
        '质控后 12 个文件的送检包 + 合同要点与日程',
        'Cover letter + 12-file pack after QC, contract points and schedule',
        'Сопроводительное + пакет 12 файлов',
      ),
      status: 'waiting',
      at: '2026-09-07T07:40:00',
      confirmBy: zh('经办人', 'Operator', 'Оператор'),
      audit: 'A-8813',
      model: 'medmost-ops/2026.08',
      confirmKey: 'lab',
    },
    {
      id: 'news',
      action: zh('监管动态监测', 'Regulatory news watch', 'Мониторинг регуляторных новостей'),
      result: zh(
        '体外诊断无变更；Честный ЗНАК 清单已更新 → M10 已自动重算，MH-200 仍不强制标识',
        'No IVD change; Chestny ZNAK list updated → M10 recalculated, marking still not required for MH-200',
        'По ИВД без изменений; перечень ЧЗ обновлён, M10 пересчитан',
      ),
      status: 'done',
      at: '2026-09-07T07:00:00',
      confirmBy: zh('无需（仅重算地图）', 'Not required (map recalculation only)', 'Не требуется'),
      audit: 'A-8801',
      model: 'medmost-reg/2026.08',
    },
    {
      id: 'clocks',
      action: zh('时限与提醒', 'Clocks and reminders', 'Часы и дедлайны'),
      result: zh(
        '电安全协议（您）、公证预约（我方）、实验室档期（合作方）',
        'Protocols (you), notary booking (us), lab slot (contractor)',
        'Протоколы / нотариус / слот лаборатории',
      ),
      status: 'active',
      at: '2026-09-08T08:00:00',
      confirmBy: zh('—', '—', '—'),
      audit: 'A-8820',
      model: 'medmost-ops/2026.08',
    },
    {
      id: 'rzn',
      action: zh('РЗН 补充要求答复草稿', 'Draft response to an RZN request', 'Черновик ответа на запрос РЗН'),
      result: zh(
        '技术答复 + 仓储附件；仅能由授权代表人递交',
        'Technical reply + vault attachments; filing only by a person via the AR',
        'Технический ответ; подача только человеком через УПП',
      ),
      status: 'waiting',
      at: '2026-09-06T16:20:00',
      confirmBy: zh('法规专家 · 然后授权代表递交', 'Specialist · then AR files', 'Специалист, затем УПП'),
      audit: 'A-8790',
      model: 'medmost-draft/2026.08',
      confirmKey: 'rzn',
    },
    {
      id: 'pack',
      action: zh('齐套检查', 'Completeness check', 'Проверка комплектности'),
      result: zh(
        '交合作方 / 监管前核对缺失项',
        'Missing items before handover to a contractor or the regulator',
        'До передачи подрядчику / регулятору',
      ),
      status: 'active',
      at: '2026-09-07T09:00:00',
      confirmBy: zh('—', '—', '—'),
      audit: 'A-8821',
      model: 'medmost-ops/2026.08',
    },
    {
      id: 'tr',
      action: zh('翻译草稿', 'Translation drafts', 'Черновики переводов'),
      result: zh(
        '法律文本仍须人工审校',
        'Legal texts still need a human editor',
        'Юридические тексты проверяет человек',
      ),
      status: 'done',
      at: '2026-08-12T11:00:00',
      confirmBy: zh('医 / 法律审校', 'Medical / legal edit', 'Мед-/юрредактура'),
      audit: 'A-7701',
      model: 'medmost-draft/2026.07',
    },
    {
      id: 'iso',
      action: zh('证书有效期', 'Certificate expiry watch', 'Контроль сроков сертификатов'),
      result: zh(
        'ISO 将在案件中期到期 — 提前 6 个月提醒',
        'ISO expires mid-case — remind 6 months ahead',
        'ISO истекает в середине кейса, узнать за 6 месяцев',
      ),
      status: 'active',
      at: '2026-09-01T07:00:00',
      confirmBy: zh('您', 'You', 'Вы'),
      audit: 'A-8600',
      model: 'medmost-ops/2026.08',
    },
    {
      id: 'mapdoc',
      action: zh('公司 ↔ 产品文件映射', 'Company ↔ product document mapping', 'Маппинг компания ↔ продукт'),
      result: zh(
        'MH-200 对话中的更新 ISO 已写入公司档案并带入全部产品',
        'Updated ISO from the MH-200 dialog written to the company profile and reused',
        'Обновлённый ISO из диалога MH-200 добавлен в профиль',
      ),
      status: 'done',
      at: '2026-08-20T15:10:00',
      confirmBy: zh('无需', 'Not required', 'Не требуется'),
      audit: 'A-8511',
      model: 'medmost-ops/2026.08',
    },
    {
      id: 'report',
      action: zh('监管报告草稿', 'Draft regulator report', 'Черновик отчёта для регулятора'),
      result: zh('仅草稿；须由人签署', 'Draft only; a person signs', 'Черновик; человек подписывает'),
      status: 'draft',
      at: '2026-09-04T18:00:00',
      confirmBy: zh('授权代表签署人', 'AR signatory', 'Подписант УПП'),
      audit: 'A-8788',
      model: 'medmost-draft/2026.08',
    },
  ]
}

export interface OfficialEvent {
  at: string
  title: L10n
  number: string
  source: L10n
  stage: RegistrationCase['currentStage']
}

export function officialEvents(): OfficialEvent[] {
  return [
    {
      at: '2025-12-03T10:00:00',
      title: zh(
        '卷宗已受理 · 政务服务 630782',
        'Dossier accepted · Gosuslugi service 630782',
        'Досье принято · услуга 630782',
      ),
      number: '630782-0417',
      source: zh('Госуслуги / ЕПГУ', 'Gosuslugi / EPGU', 'Госуслуги / ЕПГУ'),
      stage: 'filing',
    },
    {
      at: '2026-04-08T10:00:00',
      title: zh(
        '形式齐套审查通过（5+2 个工作日）',
        'Completeness check passed (5+2 working days)',
        'Проверка комплектности пройдена',
      ),
      number: 'QC-0417',
      source: zh('РЗН 镜像', 'RZN mirror', 'Зеркало РЗН'),
      stage: 'filing',
    },
    {
      at: '2026-05-20T10:00:00',
      title: zh(
        '审评补充要求 #Q-0417-02 — 已答复，时限恢复',
        'Expertise request #Q-0417-02 — answered, clock resumed',
        'Запрос экспертизы #Q-0417-02 — ответ направлен',
      ),
      number: 'Q-0417-02',
      source: zh('РЗН 镜像', 'RZN mirror', 'Зеркало РЗН'),
      stage: 'expertise',
    },
    {
      at: '2026-07-15T10:00:00',
      title: zh(
        '签发 РЗН 注册证 2027/00xx — 无限期',
        'RZN certificate 2027/00xx issued — indefinite',
        'Выдано РУ РЗН 2027/00xx — бессрочно',
      ),
      number: '2027/00xx',
      source: zh('医疗器械登记簿镜像', 'Device registry mirror', 'Зеркало реестра МИ'),
      stage: 'registry',
    },
    {
      at: '2026-07-28T10:00:00',
      title: zh(
        '俄文标识获准 + 进口贴标计划',
        'Russian labelling approved + import marking plan',
        'Русская маркировка утверждена',
      ),
      number: 'LBL-0417',
      source: zh('УПП 记录', 'AR record', 'Запись УПП'),
      stage: 'postreg',
    },
    {
      at: '2026-08-10T10:00:00',
      title: zh(
        'Честный ЗНАК：血糖仪当日不在强制清单',
        'Chestny ZNAK: glucometers not on the mandatory list on this date',
        'Честный ЗНАК: глюкометры пока не в перечне',
      ),
      number: 'Постановление · 2026-08-10',
      source: zh('当日清单核验', 'List check on the date', 'Сверка перечня на дату'),
      stage: 'postreg',
    },
    {
      at: '2026-08-26T10:00:00',
      title: zh(
        '首次商业进口 + 首次合法销售 · on_market',
        'First commercial import + first legal sale · on_market',
        'Первый коммерческий импорт + первая легальная продажа',
      ),
      number: 'РЗН 11020 · партия',
      source: zh('批次通知镜像', 'Batch notice mirror', 'Уведомление о партии'),
      stage: 'postreg',
    },
  ]
}

export interface PaymentMeta {
  invoice: string
  fx: string
  fxSource: L10n
  fxDate: string
  oursPercent: number
  transitPercent: number
  totalRmb: number
}

export function paymentMeta(): PaymentMeta {
  return {
    invoice: 'INV-2026-0917',
    fx: '0.0808',
    fxSource: zh('中国银行中间价', 'PBoC mid rate', 'Средний курс Банка Китая'),
    fxDate: '2026-09-01',
    oursPercent: 31,
    transitPercent: 69,
    totalRmb: 49383,
  }
}

export interface UppStage {
  key: string
  title: L10n
  condition: L10n
  status: 'paid' | 'waiting'
}

export function uppStages(): UppStage[] {
  return [
    {
      key: '1',
      title: zh(
        '1/3 委托书生效且柜面绑定',
        '1/3 POA in force and cabinet bound',
        '1/3 доверенность в силе и доступ закреплён',
      ),
      condition: zh(
        '仅确认结果，口头「完成」不解锁付款',
        'Only a confirmed result unlocks payment',
        'Только подтверждённый результат',
      ),
      status: 'paid',
    },
    {
      key: '2',
      title: zh(
        '2/3 卷宗被受理（不是承包方说「齐了」）',
        '2/3 dossier accepted for review',
        '2/3 досье принято к рассмотрению',
      ),
      condition: zh('须有政务服务受理号', 'Requires a government acceptance id', 'Нужен ID принятия'),
      status: 'waiting',
    },
    {
      key: '3',
      title: zh('3/3 注册证签发', '3/3 certificate issued', '3/3 выдано регистрационное удостоверение'),
      condition: zh('登记簿记录', 'Registry record', 'Запись в реестре'),
      status: 'waiting',
    },
  ]
}

export interface ProductFact {
  fact: L10n
  source: L10n
}

export function mh200Facts(): ProductFact[] {
  return [
    {
      fact: zh('体外诊断，患者自测', 'IVD, self-testing', 'ИВД для самотестирования'),
      source: zh('IFU § 1.2', 'IFU § 1.2', 'IFU § 1.2'),
    },
    { fact: zh('非无菌', 'Non-sterile', 'Нестерильный'), source: zh('IFU', 'IFU', 'IFU') },
    {
      fact: zh('NMPA 注册证号已提取', 'NMPA number extracted', 'Номер NMPA извлечён'),
      source: zh('NMPA 扫描件', 'NMPA scan', 'Скан NMPA'),
    },
    {
      fact: zh(
        '按 257н 号令当日清单，不属于计量器具',
        'Not a measuring instrument under order 257n as of today',
        'В перечень СИ по 257н на сегодня не входит',
      ),
      source: zh('257н · 当日核验', '257n · check of the day', 'приказ 257н'),
    },
  ]
}

export interface CompanyCardView {
  organization: Organization
  uscc: string
  verified: boolean
  riskLevel: 'low' | 'medium'
  riskExplain: L10n
  docsDone: number
  docsTotal: number
  apostilleDone: number
  apostilleTotal: number
  productCount: number
  nextStep: L10n
}

export interface ProductCardView {
  product: Product
  companyName: L10n
  classLabel: L10n
  nodeLabel: L10n
  progress: number
  nextAction: L10n
  owner: L10n
  deadline: L10n
  caseStatus: L10n
  events: L10n[]
}

export function companyCards(state: DemoUiState): CompanyCardView[] {
  const ruikang = demoRuikang(state)
  return [
    {
      organization: demoMinghu(),
      uscc: '91440300MA5G7…',
      verified: true,
      riskLevel: 'low',
      riskExplain: zh(
        '低风险 — 可以合作。历史罚款已披露。',
        'Low risk — we take this company on. Historical fine disclosed.',
        'Низкий риск — берём в работу.',
      ),
      docsDone: 6,
      docsTotal: 6,
      apostilleDone: 3,
      apostilleTotal: 4,
      productCount: 1,
      nextStep: zh(
        'MH-200：上传电安全试验协议',
        'MH-200: upload electrical-safety protocols',
        'MH-200: загрузить протоколы электробезопасности',
      ),
    },
    {
      organization: ruikang,
      uscc: '91330100MA2H8…',
      verified: false,
      riskLevel: 'medium',
      riskExplain: zh(
        '档案未完成，风险核查将在必填项齐套后自动启动。',
        'Profile incomplete; the risk check starts when required slots are closed.',
        'Профиль не закрыт, проверка рисков запустится автоматически.',
      ),
      docsDone: 2 + Number(state.ruikangCharter),
      docsTotal: 4,
      apostilleDone: 0,
      apostilleTotal: 3,
      productCount: 1,
      nextStep: zh(
        '补传章程，并确认银行账户。',
        'Upload the articles and confirm the bank account.',
        'Загрузить устав и подтвердить счёт.',
      ),
    },
  ]
}

export function productCards(state: DemoUiState): ProductCardView[] {
  const mh = demoMh200(state)
  const rk = demoRk30(state)
  return [
    {
      product: mh,
      companyName: minghuName,
      classLabel: zh(
        '2б 体外诊断 · 国家程序 ПП 1684',
        'Class 2b IVD · national Decree 1684',
        'Класс 2б ИВД · нац. ПП 1684',
      ),
      nodeLabel: zh('M5 · 检测', 'M5 · testing', 'M5 · испытания'),
      progress: 62,
      nextAction: zh(
        '上传电安全试验协议 — 实验室 18.09 开始',
        'Upload electrical-safety protocols — lab starts 18.09',
        'Загрузить протоколы электробезопасности — лаборатория 18.09',
      ),
      owner: zh('您', 'You', 'Вы'),
      deadline: zh('18.09', '18.09', '18.09'),
      caseStatus: zh('办理中 · #RU-0417', 'In progress · #RU-0417', 'В работе · #RU-0417'),
      events: [
        zh(
          'MH-200 对话中的更新 ISO 13485 已写入公司档案并带入全部产品',
          'Updated ISO 13485 from the MH-200 dialog added to the company profile and reused',
          'Обновлённый ISO 13485 из диалога MH-200 добавлен в профиль компании',
        ),
      ],
    },
    {
      product: rk,
      companyName: ruikangName,
      classLabel: zh(
        '分类待双确认',
        'Classification awaits dual confirmation',
        'Классификация ждёт двойного подтверждения',
      ),
      nodeLabel: zh('分类', 'Classification', 'Классификация'),
      progress: state.rk30MapBuilt ? 8 : 0,
      nextAction: state.rk30ClientApproved
        ? zh('打开已生成的流程地图', 'Open the built process map', 'Открыть построенную карту')
        : zh('客户确认分类方案 A', 'Client confirms classification option A', 'Клиент утверждает вариант A'),
      owner: zh('您', 'You', 'Вы'),
      deadline: zh('本周', 'This week', 'на этой неделе'),
      caseStatus: zh('尚未建案', 'No case yet', 'Кейс не создан'),
      events: [],
    },
  ]
}

export function saleProgressPercent(): number {
  return 62
}

export function filingProgressPercent(): number {
  return 62
}

export function nodesDoneCount(): number {
  return demoNodes().filter((item) => item.status === 'done').length
}

export function listDemoOrganizations(state: DemoUiState): Organization[] {
  return [demoMinghu(), demoRuikang(state)]
}

export function listDemoProducts(state: DemoUiState): Product[] {
  return [demoMh200(state), demoRk30(state)]
}

export function getDemoOrganization(id: string, state: DemoUiState): Organization | undefined {
  if (id === DEMO_ORG_MINGHU) return demoMinghu()
  if (id === DEMO_ORG_RUIKANG) return demoRuikang(state)
  return undefined
}

export function getDemoProduct(id: string, state: DemoUiState): Product | undefined {
  if (id === DEMO_PRODUCT_MH200) return demoMh200(state)
  if (id === DEMO_PRODUCT_RK30) return demoRk30(state)
  return undefined
}

export interface DemoNotification {
  id: string
  title: L10n
  href: string
}

export function demoNotifications(state: DemoUiState): DemoNotification[] {
  const items: DemoNotification[] = []
  if (!state.mh200Electro) {
    items.push({
      id: 'electro',
      title: zh(
        'MH-200：上传电安全试验协议，档期至 18.09',
        'MH-200: upload electrical-safety protocols, slot until 18.09',
        'MH-200: протоколы электробезопасности до 18.09',
      ),
      href: `/intake/product/${DEMO_PRODUCT_MH200}`,
    })
  }
  if (!state.poaDraftAccepted) {
    items.push({
      id: 'poa',
      title: zh(
        '委托书高风险条款 — 请确认修订草稿',
        'High-risk POA clause — confirm the corrected draft',
        'Высокий риск POA — подтвердите правку',
      ),
      href: `/case/${DEMO_CASE_RU0417}/nodes/M3`,
    })
  }
  if (!state.logisticsConfirmed) {
    items.push({
      id: 'log',
      title: zh(
        '样品物流订单待确认',
        'Sample logistics order awaits confirmation',
        'Заказ логистики ждёт подтверждения',
      ),
      href: '/automation',
    })
  }
  if (state.rk30SpecialistApproved && !state.rk30ClientApproved) {
    items.push({
      id: 'rk',
      title: zh('RK-30：请确认分类方案', 'RK-30: confirm the classification option', 'RK-30: утвердите классификацию'),
      href: `/products/${DEMO_PRODUCT_RK30}/classify`,
    })
  }
  return items
}
