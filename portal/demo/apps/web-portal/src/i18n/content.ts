import type { L10n, Locale } from './types'
import { pickL10n } from './types'

const L = (ru: string, en: string, zh: string): L10n => ({ ru, en, zh })

const TEXT: Record<string, L10n> = {
  'Амоксициллин 500 мг': L('Амоксициллин 500 мг', 'Amoxicillin 500 mg', '阿莫西林 500 mg'),
  'Амоксициллин 500 мг, капсулы': L(
    'Амоксициллин 500 мг, капсулы',
    'Amoxicillin 500 mg, capsules',
    '阿莫西林 500 mg，胶囊',
  ),
  'Ибупрофен 200 мг': L('Ибупрофен 200 мг', 'Ibuprofen 200 mg', '布洛芬 200 mg'),
  'Цефтриаксон 1 г': L('Цефтриаксон 1 г', 'Ceftriaxone 1 g', '头孢曲松 1 g'),
  'Ортез коленный, семейство A-12': L(
    'Ортез коленный, семейство A-12',
    'Knee orthosis, A-12 family',
    '膝关节矫形器，A-12 系列',
  ),
  'Тонометр автоматический BP-90A': L(
    'Тонометр автоматический BP-90A',
    'Automatic blood pressure monitor BP-90A',
    '全自动血压计 BP-90A',
  ),
  'Аппарат ультразвуковой диагностики B-07': L(
    'Аппарат ультразвуковой диагностики B-07',
    'Ultrasound diagnostic device B-07',
    '超声诊断仪 B-07',
  ),
  'Натрия хлорид 0,9 %': L('Натрия хлорид 0,9 %', 'Sodium chloride 0.9%', '氯化钠 0.9%'),
  'Натрия хлорид 0,9 %, раствор для инфузий': L(
    'Натрия хлорид 0,9 %, раствор для инфузий',
    'Sodium chloride 0.9%, solution for infusion',
    '氯化钠 0.9%，输液用溶液',
  ),
  'Парацетамол 500 мг, таблетки': L('Парацетамол 500 мг, таблетки', 'Paracetamol 500 mg, tablets', '对乙酰氨基酚 500 mg，片剂'),

  капсулы: L('капсулы', 'capsules', '胶囊'),
  'таблетки, покрытые оболочкой': L('таблетки, покрытые оболочкой', 'film-coated tablets', '薄膜衣片'),
  'порошок для приготовления раствора': L(
    'порошок для приготовления раствора',
    'powder for solution',
    '溶液用粉末',
  ),
  'изделие класса 1': L('изделие класса 1', 'class 1 device', '1 类器械'),
  'изделие класса 2а, средство измерений': L(
    'изделие класса 2а, средство измерений',
    'class 2a device, measuring instrument',
    '2a 类器械，计量器具',
  ),
  'изделие класса 2а': L('изделие класса 2а', 'class 2a device', '2a 类器械'),
  'раствор для инфузий': L('раствор для инфузий', 'solution for infusion', '输液用溶液'),

  Китай: L('Китай', 'China', '中国'),

  'Тайчжоу — синтез и фасовка; Ханчжоу — упаковка': L(
    'Тайчжоу — синтез и фасовка; Ханчжоу — упаковка',
    'Taizhou — synthesis and filling; Hangzhou — packaging',
    '台州 — 合成与分装；杭州 — 包装',
  ),
  'Цзинань — производство и упаковка': L(
    'Цзинань — производство и упаковка',
    'Jinan — manufacture and packaging',
    '济南 — 生产与包装',
  ),
  'Харбин — стерильное производство': L(
    'Харбин — стерильное производство',
    'Harbin — sterile manufacture',
    '哈尔滨 — 无菌生产',
  ),
  'Шэньчжэнь — сборка; Дунгуань — литьё деталей': L(
    'Шэньчжэнь — сборка; Дунгуань — литьё деталей',
    'Shenzhen — assembly; Dongguan — moulded parts',
    '深圳 — 组装；东莞 — 零件注塑',
  ),
  'Сучжоу — сборка; Шэньчжэнь — прошивка платы': L(
    'Сучжоу — сборка; Шэньчжэнь — прошивка платы',
    'Suzhou — assembly; Shenzhen — board firmware',
    '苏州 — 组装；深圳 — 板卡烧录',
  ),
  'Сучжоу — сборка и контроль': L(
    'Сучжоу — сборка и контроль',
    'Suzhou — assembly and inspection',
    '苏州 — 组装与检验',
  ),
  'Чэнду — производство инфузионных растворов': L(
    'Чэнду — производство инфузионных растворов',
    'Chengdu — manufacture of infusion solutions',
    '成都 — 输液生产',
  ),

  'К. В. Лебедева, НЦЭСМП': L('К. В. Лебедева, НЦЭСМП', 'K. V. Lebedeva, NCESMP', 'K. V. Lebedeva，НЦЭСМП'),
  'Е. Смирнова, УПП': L('Е. Смирнова, УПП', 'E. Smirnova, УПП', 'E. Smirnova，授权代表'),
  'М. А. Гордеев, НЦЭСМП': L('М. А. Гордеев, НЦЭСМП', 'M. A. Gordeev, NCESMP', 'M. A. Gordeev，НЦЭСМП'),
  'А. Ветров, координатор испытаний': L(
    'А. Ветров, координатор испытаний',
    'A. Vetrov, testing coordinator',
    'A. Vetrov，检测协调人',
  ),
  'не назначен': L('не назначен', 'not assigned', '未指定'),
  'не указана': L('не указана', 'not specified', '未填写'),
  'Е. Смирнова, офицер УПП': L('Е. Смирнова, офицер УПП', 'E. Smirnova, УПП officer', 'E. Smirnova，授权代表官员'),
  'М. Кириллов, редактор переводов': L(
    'М. Кириллов, редактор переводов',
    'M. Kirillov, translation editor',
    'M. Kirillov，翻译审校',
  ),
  'Li Wei, RA HQ': L('Li Wei, RA HQ', 'Li Wei, RA HQ', '李伟，总部注册'),
  'эксперт НЦЭСМП': L('эксперт НЦЭСМП', 'NCESMP expert', 'НЦЭСМП 专家'),
  'офицер УПП': L('офицер УПП', 'УПП officer', '授权代表官员'),
  'координатор испытаний': L('координатор испытаний', 'testing coordinator', '检测协调人'),

  'Экспертиза запросила уточнение спецификации примесей и хроматограммы трёх серий.': L(
    'Экспертиза запросила уточнение спецификации примесей и хроматограммы трёх серий.',
    'Review asked for a clarification of the impurity specification and chromatograms of three batches.',
    '审评要求澄清杂质规格并提供三个批次的色谱图。',
  ),

  'Реестр медицинских изделий': L('Реестр медицинских изделий', 'Medical device registry', '医疗器械登记簿'),
  ГРЛС: L('ГРЛС', 'ГРЛС', 'ГРЛС'),
}

const MESSAGES: Record<string, { role: L10n; preview: L10n }> = {
  m1: {
    role: L('эксперт НЦЭСМП', 'NCESMP expert', 'НЦЭСМП 专家'),
    preview: L(
      'Просим уточнить пределы примесей в спецификации готовой формы и приложить хроматограммы трёх серий.',
      'Please clarify the impurity limits in the finished-product specification and attach chromatograms of three batches.',
      '请澄清成品规格中的杂质限度，并附上三个批次的色谱图。',
    ),
  },
  m2: {
    role: L('офицер УПП', 'УПП officer', '授权代表官员'),
    preview: L(
      'Скан доверенности есть, оригинал с апостилем ещё в пути. Перевод лучше запустить параллельно.',
      'We have a scan of the power of attorney; the apostilled original is still in transit. Translation should start in parallel.',
      '委托书扫描件已有，带附加证明书的原件仍在途中。翻译最好并行启动。',
    ),
  },
  m3: {
    role: L('координатор испытаний', 'testing coordinator', '检测协调人'),
    preview: L(
      'Лаборатория подтвердила слот. Протокол ожидаем до 18 сентября, если не будет замечаний к образцам.',
      'The laboratory confirmed the slot. We expect the protocol by 18 September unless there are remarks on the samples.',
      '实验室已确认档期。若样品无意见，报告预计 9 月 18 日前出具。',
    ),
  },
  m4: {
    role: L('офицер УПП', 'УПП officer', '授权代表官员'),
    preview: L(
      'По тонометру уведомление о ввозе образцов нужно подать до отгрузки, иначе таможня развернёт партию.',
      'For the blood pressure monitor the sample-import notification must be filed before shipment, or customs will turn the consignment back.',
      '血压计的样品进口通知须在发运前申报，否则海关会退运。',
    ),
  },
}

const NOTIFICATIONS: Record<string, { title: L10n; body: L10n }> = {
  n1: {
    title: L(
      'Запрос экспертизы по CERT-2026-0148',
      'Review query on CERT-2026-0148',
      'CERT-2026-0148 的审评问询',
    ),
    body: L(
      'Поступило уточнение по разделу качества. Срок ответа — 12 сентября 2026.',
      'A clarification on the quality section has arrived. Reply deadline — 12 September 2026.',
      '质量部分收到澄清要求。答复期限为 2026 年 9 月 12 日。',
    ),
  },
  n2: {
    title: L(
      'Не подано уведомление о ввозе образцов',
      'Sample-import notification not filed',
      '尚未提交样品进口通知',
    ),
    body: L(
      'По кейсу CERT-2026-0094 работа 1 открыта: без неё нельзя отгружать тонометры с завода.',
      'On case CERT-2026-0094 work item 1 is open: without it the monitors cannot be shipped from the factory.',
      '案件 CERT-2026-0094 的工作 1 已打开：没有它不能从工厂发运血压计。',
    ),
  },
  n3: {
    title: L(
      'Истекает срок легализации доверенности',
      'Power-of-attorney legalization deadline is approaching',
      '委托书合法化期限将至',
    ),
    body: L(
      'По кейсу CERT-2026-0131 работа 0.5 ждёт нотариальный перевод до 3 сентября.',
      'On case CERT-2026-0131 work item 0.5 is waiting for a notarized translation by 3 September.',
      '案件 CERT-2026-0131 的工作 0.5 等待公证翻译，截止日期 9 月 3 日。',
    ),
  },
  n4: {
    title: L('Запись в ГРЛС подтверждена', 'ГРЛС entry confirmed', 'ГРЛС 记录已确认'),
    body: L(
      'По натрия хлориду 0,9 % внесена реестровая запись ЛП-№006421.',
      'Registry entry ЛП-№006421 has been made for sodium chloride 0.9%.',
      '氯化钠 0.9% 已写入登记记录 ЛП-№006421。',
    ),
  },
}

export function contentText(value: string, locale: Locale): string {
  return pickL10n(TEXT[value], locale, value)
}

export function messageCopy(id: string, locale: Locale): { role?: string; preview?: string } {
  const item = MESSAGES[id]
  if (!item) return {}
  return { role: pickL10n(item.role, locale, ''), preview: pickL10n(item.preview, locale, '') }
}

export function notificationCopy(id: string, locale: Locale): { title?: string; body?: string } {
  const item = NOTIFICATIONS[id]
  if (!item) return {}
  return { title: pickL10n(item.title, locale, ''), body: pickL10n(item.body, locale, '') }
}
