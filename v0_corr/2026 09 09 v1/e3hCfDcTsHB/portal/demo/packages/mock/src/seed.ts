import type {
  AuditEvent,
  ChatMessage,
  DemoState,
  DossierDocument,
  LedgerLine,
  Mandate,
  RegistrationCase,
  RiskClass,
  RoadmapItem,
  StatusEntry,
} from '@demo/domain'

/**
 * Цифры взяты из research-пакета и не изобретаются заново:
 * пошлины по классам 72 / 104 / 136 / 184 тыс. руб. плюс 11 тыс. за выдачу РУ,
 * технические испытания стерильного изделия во ВНИИИМТ — порядка 478 тыс. руб.,
 * нормативные отрезки 5 / 2 / 31 / 50 рабочих дней.
 */
export const DATE_SLICE = '28.08.2026'

const cases: RegistrationCase[] = [
  {
    id: 'a12',
    code: 'A-12',
    product: {
      ru: 'Ортез коленный, семейство A-12',
      en: 'Knee orthosis, family A-12',
      zh: '膝关节矫形器 A-12 系列',
    },
    manufacturer: {
      ru: 'Shenzhen Kanghui Medical Co., Ltd.',
      en: 'Shenzhen Kanghui Medical Co., Ltd.',
      zh: '深圳康辉医疗器械有限公司',
    },
    kind: 'device',
    track: 'pp1684',
    riskClass: '1',
    currentStage: 'samples',
    nextActor: 'lab',
    waitingFor: {
      ru: 'протокол технических испытаний, ВНИИИМТ',
      en: 'technical test report, VNIIIMT',
      zh: 'ВНИИИМТ（俄医疗技术检测机构）技术检测报告',
    },
    dueWorkingDays: 12,
    startedOn: '2026-02-10',
    cycleMonths: [6, 10],
    mandateComplete: true,
    modelsLocked: true,
  },
  {
    id: 'b07',
    code: 'B-07',
    product: {
      ru: 'Аппарат ультразвуковой диагностики B-07',
      en: 'Ultrasound diagnostic system B-07',
      zh: '超声诊断仪 B-07',
    },
    manufacturer: {
      ru: 'Suzhou Yuanhe Imaging Technology Co., Ltd.',
      en: 'Suzhou Yuanhe Imaging Technology Co., Ltd.',
      zh: '苏州源和影像技术有限公司',
    },
    kind: 'device',
    track: 'pp1684',
    riskClass: '2a',
    currentStage: 'dossier',
    nextActor: 'hq',
    waitingFor: {
      ru: 'техническая документация на серийную конфигурацию 220 В / 50 Гц',
      en: 'technical file for the 220 V / 50 Hz series configuration',
      zh: '220 V / 50 Hz 量产配置的技术文件',
    },
    dueWorkingDays: 8,
    startedOn: '2026-04-06',
    cycleMonths: [9, 14],
    mandateComplete: true,
    modelsLocked: false,
  },
  {
    id: 'c03',
    code: 'C-03',
    product: {
      ru: 'Имплант тазобедренного сустава C-03',
      en: 'Hip joint implant C-03',
      zh: '髋关节植入物 C-03',
    },
    manufacturer: {
      ru: 'Changzhou Beitai Orthopedics Co., Ltd.',
      en: 'Changzhou Beitai Orthopedics Co., Ltd.',
      zh: '常州倍泰骨科有限公司',
    },
    kind: 'device',
    track: 'eaeu46',
    riskClass: '3',
    currentStage: 'qualification',
    nextActor: 'ru',
    waitingFor: {
      ru: 'вывод юриста по принадлежности и классу риска',
      en: 'legal opinion on classification and risk class',
      zh: '关于分类与风险等级的法律意见',
    },
    dueWorkingDays: 5,
    startedOn: '2026-07-28',
    cycleMonths: [12, 24],
    mandateComplete: false,
    modelsLocked: false,
  },
]

const expertiseDays = (riskClass: RiskClass): number => (riskClass === '2b' || riskClass === '3' ? 50 : 31)

const roadmapFor = (registrationCase: RegistrationCase): RoadmapItem[] => {
  const { id, riskClass, cycleMonths } = registrationCase
  const withClinicalTrial = riskClass === '2b' || riskClass === '3'
  return [
    {
      id: `${id}-p1`,
      caseId: id,
      stage: 'qualification',
      kind: 'project',
      months: [1, 2],
      owner: 'ru',
      title: {
        ru: 'Квалификация продукта и мандат УПП',
        en: 'Product qualification and AR mandate',
        zh: '产品分类判定与授权代表委托',
      },
    },
    {
      id: `${id}-p2`,
      caseId: id,
      stage: 'dossier',
      kind: 'project',
      months: [2, 3],
      owner: 'hq',
      title: {
        ru: 'Досье, перевод и легализация',
        en: 'Dossier, translation and legalisation',
        zh: '注册资料、翻译与认证',
      },
    },
    {
      id: `${id}-p3`,
      caseId: id,
      stage: 'samples',
      kind: 'project',
      months: withClinicalTrial ? [6, 12] : [2, 4],
      owner: 'lab',
      title: {
        ru: withClinicalTrial
          ? 'Образцы, испытания и клинические испытания'
          : 'Образцы, ввоз по приказу № 201н, испытания',
        en: withClinicalTrial
          ? 'Samples, bench testing and clinical trials'
          : 'Samples, import notice under order 201n, testing',
        zh: withClinicalTrial ? '样品、检测与临床试验' : '样品、201н 号令进口通知与检测',
      },
    },
    {
      id: `${id}-p4`,
      caseId: id,
      stage: 'filing',
      kind: 'project',
      months: [2, 3],
      owner: 'ru',
      title: {
        ru: 'Подача пакета и сопровождение экспертизы',
        en: 'Filing and expertise support',
        zh: '递交材料与审评支持',
      },
    },
    {
      id: `${id}-p5`,
      caseId: id,
      stage: 'registry',
      kind: 'project',
      months: cycleMonths,
      owner: 'ru',
      title: {
        ru: 'Полный цикл проекта до реестровой записи',
        en: 'Full project cycle up to the registry record',
        zh: '至注册登记记录的完整项目周期',
      },
      note: {
        ru: 'Считается от старта проекта, а не от даты подачи',
        en: 'Counted from project start, not from the filing date',
        zh: '自项目启动起算，而非自递交日起算',
      },
    },
    {
      id: `${id}-n1`,
      caseId: id,
      stage: 'filing',
      kind: 'normative',
      workingDays: 5,
      owner: 'gov',
      title: {
        ru: 'Проверка полноты документов',
        en: 'Completeness check',
        zh: '材料完整性审查',
      },
    },
    {
      id: `${id}-n2`,
      caseId: id,
      stage: 'filing',
      kind: 'normative',
      workingDays: 2,
      owner: 'gov',
      title: {
        ru: 'Решение о начале экспертизы',
        en: 'Decision to start the expertise',
        zh: '启动审评的决定',
      },
    },
    {
      id: `${id}-n3`,
      caseId: id,
      stage: 'expertise',
      kind: 'normative',
      workingDays: expertiseDays(riskClass),
      owner: 'gov',
      title: {
        ru: withClinicalTrial
          ? 'Экспертиза с клиническими испытаниями'
          : 'Экспертиза без клинических испытаний',
        en: withClinicalTrial ? 'Expertise with clinical trials' : 'Expertise without clinical trials',
        zh: withClinicalTrial ? '含临床试验的审评' : '不含临床试验的审评',
      },
    },
    {
      id: `${id}-n4`,
      caseId: id,
      stage: 'expertise',
      kind: 'normative',
      workingDays: 50,
      owner: 'ru',
      title: {
        ru: 'Ответ на запрос экспертизы',
        en: 'Response to an expertise request',
        zh: '对审评补充要求的答复',
      },
      note: {
        ru: 'Просрочка означает решение по имеющимся материалам',
        en: 'A missed deadline means a decision on the available materials',
        zh: '逾期将按现有材料作出决定',
      },
    },
  ]
}

const documents: DossierDocument[] = [
  {
    id: 'a12-d1',
    caseId: 'a12',
    title: {
      ru: 'Регистрационное досье NMPA',
      en: 'NMPA registration dossier',
      zh: 'NMPA 注册资料',
    },
    preparedBy: 'hq',
    needsTranslation: true,
    needsApostille: false,
    versions: [
      { version: 1, author: 'Li Wei, RA HQ', date: '2026-04-02', fileName: 'nmpa-dossier-v1.pdf', submitted: false },
      { version: 2, author: 'Li Wei, RA HQ', date: '2026-05-20', fileName: 'nmpa-dossier-v2.pdf', submitted: false },
    ],
  },
  {
    id: 'a12-d2',
    caseId: 'a12',
    title: {
      ru: 'Доверенность на уполномоченного представителя',
      en: 'Power of attorney for the authorized representative',
      zh: '授权代表委托书',
    },
    preparedBy: 'hq',
    needsTranslation: true,
    needsApostille: true,
    versions: [
      { version: 1, author: 'Li Wei, RA HQ', date: '2026-03-04', fileName: 'poa-v1.pdf', submitted: false },
      { version: 2, author: 'Е. Смирнова, УПП', date: '2026-04-01', fileName: 'poa-v2-apostille.pdf', submitted: true },
    ],
  },
  {
    id: 'a12-d3',
    caseId: 'a12',
    title: {
      ru: 'Инструкция по применению',
      en: 'Instructions for use',
      zh: '使用说明书',
    },
    preparedBy: 'hq',
    needsTranslation: true,
    needsApostille: false,
    versions: [
      { version: 1, author: 'Li Wei, RA HQ', date: '2026-04-11', fileName: 'ifu-v1.docx', submitted: false },
      { version: 2, author: 'М. Кириллов, редактор', date: '2026-05-06', fileName: 'ifu-v2-ru.docx', submitted: false },
      { version: 3, author: 'М. Кириллов, редактор', date: '2026-06-24', fileName: 'ifu-v3-ru.docx', submitted: false },
    ],
  },
  {
    id: 'a12-d4',
    caseId: 'a12',
    title: {
      ru: 'Протокол технических испытаний',
      en: 'Technical test report',
      zh: '技术检测报告',
    },
    preparedBy: 'lab',
    needsTranslation: false,
    needsApostille: false,
    versions: [],
    awaitingFrom: {
      ru: 'ВНИИИМТ, программа испытаний согласована 14.07.2026',
      en: 'VNIIIMT, test programme agreed on 14.07.2026',
      zh: 'ВНИИИМТ，检测方案于 2026-07-14 确认',
    },
  },
  {
    id: 'a12-d5',
    caseId: 'a12',
    title: {
      ru: 'Сертификат ISO 13485',
      en: 'ISO 13485 certificate',
      zh: 'ISO 13485 证书',
    },
    preparedBy: 'hq',
    needsTranslation: true,
    needsApostille: false,
    versions: [
      { version: 1, author: 'Li Wei, RA HQ', date: '2026-02-18', fileName: 'iso-13485.pdf', submitted: false },
    ],
  },
  {
    id: 'b07-d1',
    caseId: 'b07',
    title: {
      ru: 'Техническая документация на изделие',
      en: 'Device technical file',
      zh: '产品技术文件',
    },
    preparedBy: 'hq',
    needsTranslation: true,
    needsApostille: false,
    versions: [
      { version: 1, author: 'Chen Hao, RA HQ', date: '2026-06-15', fileName: 'tech-file-v1.pdf', submitted: false },
    ],
  },
  {
    id: 'b07-d2',
    caseId: 'b07',
    title: {
      ru: 'Протокол испытаний на электромагнитную совместимость',
      en: 'Electromagnetic compatibility test report',
      zh: '电磁兼容性检测报告',
    },
    preparedBy: 'lab',
    needsTranslation: false,
    needsApostille: false,
    versions: [],
    awaitingFrom: {
      ru: 'лаборатория подбирается по области аккредитации в реестре ФСА',
      en: 'laboratory is being selected by accreditation scope in the FSA register',
      zh: '正在依据 ФСА（俄联邦认可局）注册簿的认可范围选择实验室',
    },
  },
  {
    id: 'c03-d1',
    caseId: 'c03',
    title: {
      ru: 'Исходное досье NMPA и клинические данные',
      en: 'Source NMPA dossier and clinical data',
      zh: 'NMPA 原始注册资料与临床数据',
    },
    preparedBy: 'hq',
    needsTranslation: true,
    needsApostille: false,
    versions: [
      { version: 1, author: 'Zhao Min, RA HQ', date: '2026-08-04', fileName: 'nmpa-source-v1.pdf', submitted: false },
    ],
  },
]

const ledger: LedgerLine[] = [
  {
    id: 'a12-l1',
    caseId: 'a12',
    date: '2026-05-18',
    supplier: {
      ru: 'Росздравнадзор',
      en: 'Roszdravnadzor',
      zh: 'Росздравнадзор（俄联邦卫生监督局）',
    },
    purpose: {
      ru: 'Государственная пошлина за экспертизу, класс 1',
      en: 'State fee for the expertise, class 1',
      zh: '审评国家规费，第 1 类',
    },
    amount: 72000,
    currency: 'RUB',
    type: 'pass-through',
    status: 'closed',
    original: {
      ru: 'Квитанция об уплате № 4417',
      en: 'Payment receipt no. 4417',
      zh: '缴费凭证第 4417 号',
    },
  },
  {
    id: 'a12-l2',
    caseId: 'a12',
    date: '2026-06-02',
    supplier: {
      ru: 'Бюро переводов «Синолингва»',
      en: 'Sinolingva translation agency',
      zh: '西诺琳瓦翻译公司',
    },
    purpose: {
      ru: 'Нотариальный перевод и апостиль комплекта',
      en: 'Notarised translation and apostille of the set',
      zh: '整套材料的公证翻译与海牙认证',
    },
    amount: 96000,
    currency: 'RUB',
    type: 'pass-through',
    status: 'closed',
    original: {
      ru: 'Счёт № 118 от 02.06.2026',
      en: 'Invoice no. 118 dated 02.06.2026',
      zh: '2026-06-02 第 118 号发票',
    },
  },
  {
    id: 'a12-l3',
    caseId: 'a12',
    date: '2026-07-14',
    supplier: {
      ru: 'ВНИИИМТ',
      en: 'VNIIIMT',
      zh: 'ВНИИИМТ（俄医疗技术检测机构）',
    },
    purpose: {
      ru: 'Технические испытания для целей государственной регистрации',
      en: 'Technical testing for the purposes of state registration',
      zh: '用于国家注册的技术检测',
    },
    amount: 478000,
    currency: 'RUB',
    type: 'pass-through',
    status: 'accepted',
    original: {
      ru: 'Оригинал счёта № 2026/1184',
      en: 'Original invoice no. 2026/1184',
      zh: '原始发票第 2026/1184 号',
    },
    paymentDeadline: {
      ru: 'Оплата до 05.09.2026',
      en: 'Payment due by 05.09.2026',
      zh: '付款期限 2026-09-05',
    },
  },
  {
    id: 'a12-l4',
    caseId: 'a12',
    date: '2026-07-20',
    supplier: {
      ru: 'Таможенный представитель «Востокброкер»',
      en: 'Vostokbroker customs representative',
      zh: '沃斯托克报关代理',
    },
    purpose: {
      ru: 'Ввоз образцов в целях государственной регистрации',
      en: 'Import of samples for state registration purposes',
      zh: '以国家注册为目的的样品进口',
    },
    amount: 84000,
    currency: 'RUB',
    type: 'pass-through',
    status: 'funded',
    original: {
      ru: 'Счёт № 771 от 20.07.2026',
      en: 'Invoice no. 771 dated 20.07.2026',
      zh: '2026-07-20 第 771 号发票',
    },
  },
  {
    id: 'a12-l5',
    caseId: 'a12',
    date: '2026-08-01',
    supplier: {
      ru: 'Платформа',
      en: 'Platform',
      zh: '平台',
    },
    purpose: {
      ru: 'Комиссия за оркестрацию, 12 % от pass-through',
      en: 'Orchestration commission, 12 % of pass-through',
      zh: '统筹服务佣金，按原价代付金额的 12 %',
    },
    amount: 89000,
    currency: 'RUB',
    type: 'commission',
    status: 'accepted',
    original: {
      ru: 'Счёт платформы № C-2026-31',
      en: 'Platform invoice no. C-2026-31',
      zh: '平台发票第 C-2026-31 号',
    },
  },
  {
    id: 'b07-l1',
    caseId: 'b07',
    date: '2026-06-09',
    supplier: {
      ru: 'Росздравнадзор',
      en: 'Roszdravnadzor',
      zh: 'Росздравнадзор（俄联邦卫生监督局）',
    },
    purpose: {
      ru: 'Государственная пошлина за экспертизу, класс 2а',
      en: 'State fee for the expertise, class 2a',
      zh: '审评国家规费，第 2a 类',
    },
    amount: 104000,
    currency: 'RUB',
    type: 'pass-through',
    status: 'paid',
    original: {
      ru: 'Квитанция об уплате № 5120',
      en: 'Payment receipt no. 5120',
      zh: '缴费凭证第 5120 号',
    },
  },
  {
    id: 'b07-l2',
    caseId: 'b07',
    date: '2026-07-30',
    supplier: {
      ru: 'Испытательная лаборатория «Медтест»',
      en: 'Medtest testing laboratory',
      zh: '梅德泰斯特检测实验室',
    },
    purpose: {
      ru: 'Испытания на электромагнитную совместимость',
      en: 'Electromagnetic compatibility testing',
      zh: '电磁兼容性检测',
    },
    amount: 610000,
    currency: 'RUB',
    type: 'pass-through',
    status: 'received',
    original: {
      ru: 'Счёт № 2026/430',
      en: 'Invoice no. 2026/430',
      zh: '第 2026/430 号发票',
    },
  },
  {
    id: 'b07-l3',
    caseId: 'b07',
    date: '2026-08-05',
    supplier: { ru: 'Платформа', en: 'Platform', zh: '平台' },
    purpose: {
      ru: 'Комиссия за оркестрацию, 12 % от pass-through',
      en: 'Orchestration commission, 12 % of pass-through',
      zh: '统筹服务佣金，按原价代付金额的 12 %',
    },
    amount: 86000,
    currency: 'RUB',
    type: 'commission',
    status: 'accepted',
    original: {
      ru: 'Счёт платформы № C-2026-34',
      en: 'Platform invoice no. C-2026-34',
      zh: '平台发票第 C-2026-34 号',
    },
  },
  {
    id: 'c03-l1',
    caseId: 'c03',
    date: '2026-08-12',
    supplier: { ru: 'Платформа', en: 'Platform', zh: '平台' },
    purpose: {
      ru: 'Комиссия: правовая квалификация продукта',
      en: 'Commission: legal qualification of the product',
      zh: '佣金：产品法律分类判定',
    },
    amount: 120000,
    currency: 'RUB',
    type: 'commission',
    status: 'paid',
    original: {
      ru: 'Счёт платформы № C-2026-39',
      en: 'Platform invoice no. C-2026-39',
      zh: '平台发票第 C-2026-39 号',
    },
  },
]

const mandates: Mandate[] = [
  {
    caseId: 'a12',
    operator: 'ООО «Синоптикс РУ»',
    role: 'upp',
    steps: [
      {
        key: 'service-contract',
        status: 'done',
        date: '2026-02-18',
        note: { ru: 'Сервисный договор с компанией КНР', en: 'Service contract with the CN company', zh: '与中国公司的服务合同' },
      },
      { key: 'power-of-attorney', status: 'done', date: '2026-03-04' },
      { key: 'apostille', status: 'done', date: '2026-03-19' },
      { key: 'notarized-translation', status: 'done', date: '2026-04-01' },
      { key: 'representative-registered', status: 'done', date: '2026-04-08' },
    ],
  },
  {
    caseId: 'b07',
    operator: 'ООО «Синоптикс РУ»',
    role: 'upp',
    steps: [
      { key: 'service-contract', status: 'done', date: '2026-04-06' },
      { key: 'power-of-attorney', status: 'done', date: '2026-04-22' },
      { key: 'apostille', status: 'done', date: '2026-05-13' },
      { key: 'notarized-translation', status: 'done', date: '2026-05-27' },
      { key: 'representative-registered', status: 'done', date: '2026-06-03' },
    ],
  },
  {
    caseId: 'c03',
    operator: 'ООО «Синоптикс РУ»',
    role: 'upp',
    steps: [
      { key: 'service-contract', status: 'done', date: '2026-07-28' },
      { key: 'power-of-attorney', status: 'in-progress', note: { ru: 'Подписан скан, ждём оригинал', en: 'Scan signed, original pending', zh: '已签署扫描件，等待原件' } },
      { key: 'apostille', status: 'pending' },
      { key: 'notarized-translation', status: 'pending' },
      { key: 'representative-registered', status: 'pending' },
    ],
  },
]

const statuses: StatusEntry[] = [
  {
    id: 'a12-s1',
    caseId: 'a12',
    stage: 'dossier',
    text: {
      ru: 'Комплект досье собран, расхождений по площадкам не выявлено',
      en: 'Dossier set assembled, no discrepancies in manufacturing sites',
      zh: '注册资料已齐备，生产场地无差异',
    },
    artifact: 'dossier-checklist-2026-06-28.pdf',
    enteredBy: 'Е. Смирнова, офицер УПП',
    enteredAt: '2026-06-28T09:20:00',
  },
  {
    id: 'a12-s2',
    caseId: 'a12',
    stage: 'samples',
    text: {
      ru: 'Уведомление о ввозе образцов подано до отгрузки, приказ № 201н',
      en: 'Import notice for samples filed before shipment, order 201n',
      zh: '已在发货前提交样品进口通知，依据 201н 号令',
    },
    artifact: 'epgu-notice-201n.pdf',
    enteredBy: 'Е. Смирнова, офицер УПП',
    enteredAt: '2026-07-08T14:05:00',
  },
  {
    id: 'a12-s3',
    caseId: 'a12',
    stage: 'samples',
    text: {
      ru: 'Образцы приняты лабораторией, программа испытаний согласована',
      en: 'Samples accepted by the laboratory, test programme agreed',
      zh: '实验室已接收样品，检测方案已确认',
    },
    artifact: 'vniiimt-acceptance-act.pdf',
    enteredBy: 'А. Ветров, координатор испытаний',
    enteredAt: '2026-07-14T11:40:00',
  },
  {
    id: 'b07-s1',
    caseId: 'b07',
    stage: 'dossier',
    text: {
      ru: 'Запрошена серийная конфигурация 220 В / 50 Гц вместо выставочного образца',
      en: 'Requested the 220 V / 50 Hz series configuration instead of the show sample',
      zh: '已要求提供 220 V / 50 Hz 量产配置，而非展会样机',
    },
    artifact: 'config-request.pdf',
    enteredBy: 'А. Ветров, координатор испытаний',
    enteredAt: '2026-08-11T10:15:00',
  },
]

const chat: ChatMessage[] = [
  {
    id: 'a12-c1',
    caseId: 'a12',
    side: 'ru',
    author: 'Е. Смирнова, офицер УПП',
    text: {
      ru: 'Программа испытаний согласована. Нужны два дублирующих образца в стерильной упаковке.',
      en: 'The test programme is agreed. We need two spare samples in sterile packaging.',
      zh: '检测方案已确认。需要两件无菌包装的备用样品。',
    },
    at: '2026-07-14T12:10:00',
  },
  {
    id: 'a12-c2',
    caseId: 'a12',
    side: 'cn',
    author: 'Li Wei, RA HQ',
    text: {
      ru: 'Дубли отгрузим 16 июля вместе с принадлежностями из закрытого списка моделей.',
      en: 'We will ship the spares on 16 July together with the accessories from the locked model list.',
      zh: '备用样品将于 7 月 16 日与已锁定型号清单中的附件一并发出。',
    },
    at: '2026-07-14T13:02:00',
  },
  {
    id: 'a12-c3',
    caseId: 'a12',
    side: 'ru',
    author: 'М. Кириллов, редактор',
    text: {
      ru: 'В инструкции и на маркировке разошлись обозначения размеров. Исправляем до подачи.',
      en: 'Size designations differ between the instructions and the labelling. Fixing before filing.',
      zh: '说明书与标签的尺寸标识不一致，将在递交前修正。',
    },
    at: '2026-07-21T09:45:00',
  },
  {
    id: 'a12-c4',
    caseId: 'a12',
    side: 'cn',
    author: 'Li Wei, RA HQ',
    text: {
      ru: 'Подтверждаем таблицу размеров из версии 3. Прошу использовать её как основную.',
      en: 'We confirm the size table from version 3. Please use it as the primary one.',
      zh: '确认采用第 3 版的尺寸表，请以其为准。',
    },
    at: '2026-07-21T11:30:00',
  },
  {
    id: 'a12-c5',
    caseId: 'a12',
    side: 'ru',
    author: 'Е. Смирнова, офицер УПП',
    text: {
      ru: 'Счёт ВНИИИМТ на 478 000 руб. загружен в реестр как оригинал, без наценки.',
      en: 'The VNIIIMT invoice for RUB 478,000 is in the ledger as an original, with no mark-up.',
      zh: 'ВНИИИМТ 的 478 000 卢布发票已作为原件录入账本，未加价。',
    },
    at: '2026-07-14T16:20:00',
  },
]

const audit: AuditEvent[] = [
  {
    id: 'a12-a1',
    caseId: 'a12',
    at: '2026-04-08T10:00:00',
    actor: 'Е. Смирнова, офицер УПП',
    action: {
      ru: 'Мандат уполномоченного представителя завершён',
      en: 'Authorized representative mandate completed',
      zh: '授权代表委托流程完成',
    },
  },
  {
    id: 'a12-a2',
    caseId: 'a12',
    at: '2026-06-28T09:20:00',
    actor: 'Е. Смирнова, офицер УПП',
    action: {
      ru: 'Версия доверенности зафиксирована как ушедшая в подачу',
      en: 'The power of attorney version was locked as submitted',
      zh: '委托书版本已锁定为已递交版本',
    },
  },
  {
    id: 'a12-a3',
    caseId: 'a12',
    at: '2026-07-14T16:20:00',
    actor: 'Финансы, ООО «Синоптикс РУ»',
    action: {
      ru: 'Счёт ВНИИИМТ акцептован и зеркалирован в кабинет клиента',
      en: 'The VNIIIMT invoice was accepted and mirrored to the client workspace',
      zh: 'ВНИИИМТ 发票已受理并同步至客户工作台',
    },
  },
  {
    id: 'a12-a4',
    caseId: 'a12',
    at: '2026-07-16T08:05:00',
    actor: 'Li Wei, RA HQ',
    action: {
      ru: 'Загружена версия 3 инструкции по применению',
      en: 'Version 3 of the instructions for use was uploaded',
      zh: '上传了使用说明书第 3 版',
    },
  },
]

export function createSeedState(): DemoState {
  return {
    cases,
    roadmap: cases.flatMap(roadmapFor),
    documents,
    ledger,
    mandates,
    statuses,
    chat,
    audit,
  }
}
