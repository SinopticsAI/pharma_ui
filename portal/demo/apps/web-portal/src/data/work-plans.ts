import type { DocumentSlot, PortalRef, ProductKind, WorkField, WorkItem, WorkOwner } from './work'

/**
 * Порядок работ строится от типа продукта. Последовательность и блокировки
 * повторяют право, а не удобство интерфейса: уведомление о ввозе образцов идёт
 * до отгрузки, заявление на регистрацию — только после протоколов и инспекции.
 */

interface WorkInput {
  code: string
  title: string
  summary: string
  owner: WorkOwner
  blockedBy?: string[]
  parallelWith?: string[]
  needsAgentConfirmation?: boolean
  portals?: PortalRef[]
  slots?: DocumentSlot[]
  fields?: WorkField[]
  note?: string
}

const work = (input: WorkInput): WorkItem => ({
  id: input.code,
  code: input.code,
  title: input.title,
  summary: input.summary,
  status: 'not_started',
  owner: input.owner,
  blockedBy: input.blockedBy ?? [],
  parallelWith: input.parallelWith,
  needsAgentConfirmation: input.needsAgentConfirmation ?? false,
  portals: input.portals,
  slots: input.slots ?? [],
  fields: input.fields ?? [],
  note: input.note,
})

const slot = (
  id: string,
  title: string,
  preparedBy: WorkOwner,
  extra: Partial<Omit<DocumentSlot, 'id' | 'title' | 'preparedBy' | 'files'>> = {},
): DocumentSlot => ({ id, title, preparedBy, files: [], ...extra })

const field = (id: string, label: string, value = '', extra: Partial<WorkField> = {}): WorkField => ({
  id,
  label,
  value,
  ...extra,
})

const PORTALS = {
  elkWidget: {
    name: 'Реестр медицинских изделий, виджет Росздравнадзора',
    url: 'https://elk.roszdravnadzor.gov.ru/widget/',
    when: 'до начала любых работ по продукту',
  },
  grls: {
    name: 'ГРЛС, государственный реестр лекарственных средств',
    url: 'https://grls.rosminzdrav.ru',
    when: 'до начала любых работ по продукту',
  },
  fsa: {
    name: 'Реестр аккредитованных лиц, области аккредитации',
    url: 'https://pub.fsa.gov.ru',
    when: 'до подписания договора с лабораторией',
  },
  import610095: {
    name: 'ЕПГУ, услуга 610095 — уведомление о ввозе образцов',
    url: 'https://www.gosuslugi.ru/610095/1/form',
    when: 'до отгрузки с завода',
    fee: 'пошлины нет',
    notThis: [
      'не форма 630782 и не начало регистрации',
      'не право продавать',
      'не коммерческий ввоз уже зарегистрированного изделия',
    ],
  },
  rznImport: {
    name: 'Росздравнадзор, страница ввоза медицинских изделий',
    url: 'https://roszdravnadzor.gov.ru/medproducts/import',
  },
  customs: {
    name: 'ЛК участника ВЭД ФТС или таможенный представитель',
    url: 'https://edata.customs.ru',
    when: 'после уведомления 610095',
    notThis: ['не коммерческая партия: цель ввоза — государственная регистрация'],
  },
  arshin: {
    name: 'ФГИС «Аршин», утверждение типа средства измерений',
    url: 'https://fgis.gost.ru/fundmetrology',
    when: 'параллельно техническим испытаниям',
    notThis: ['не форма 630782: это отдельный метрологический контур Росстандарта'],
  },
  register630782: {
    name: 'ЕПГУ, услуга 630782 — государственная регистрация медицинского изделия',
    url: 'https://www.gosuslugi.ru/630782/1/form',
    when: 'протоколы, инспекция, досье, пошлина и документы УПП готовы',
    notThis: [
      'нельзя «добавить строку» в поданное заявление: следующий аппарат — новое заявление',
      'союзный трек ЕАЭС подаётся отдельной услугой 613264',
    ],
  },
  rznRegistration: {
    name: 'Росздравнадзор, страница регистрации медицинских изделий',
    url: 'https://roszdravnadzor.gov.ru/medproducts/registration',
  },
  elkApplicant: {
    name: 'ЕЛК Росздравнадзора, кабинет заявителя',
    url: 'https://elk.roszdravnadzor.gov.ru/rzn-applicant/main',
    when: 'после подачи 630782',
  },
  markirovka: {
    name: 'Честный знак',
    url: 'https://markirovka.ru',
    when: 'если вид изделия попал в обязательную маркировку',
  },
  regmed: {
    name: 'Личный кабинет Минздрава, lk.regmed.ru',
    url: 'https://lk.regmed.ru',
    when: 'досье собрано, пошлина уплачена',
  },
} satisfies Record<string, PortalRef>

/** Легализация по п. 87 Правил № 1684: каждый документ — отдельный слот. */
const deviceLegalSlots = (): DocumentSlot[] => [
  slot('poa', 'Доверенность или акт назначения уполномоченного представителя', 'hq', {
    requirement: 'п. 87(а) и 65(а): полномочия представлять завод, отвечать за обращение в РФ, заверять документы, вести регистрацию. Частный документ: сначала нотариус 公证处, затем апостиль.',
    needsNotary: true,
    needsApostille: true,
    needsTranslation: true,
  }),
  slot('signatory', 'Доказательства полномочий подписанта', 'hq', {
    requirement: 'Кто является 法定代表人 и есть ли у него право подписи. Решение совета, приказ о назначении или выписка о представителе.',
    needsApostille: true,
    needsTranslation: true,
  }),
  slot('license', 'Свидетельство о регистрации юридического лица, 营业执照', 'hq', {
    requirement: 'п. 87(н). Официальный документ: апостиль на оригинал или на нотариальную копию.',
    needsApostille: true,
    needsTranslation: true,
  }),
  slot('site', 'Документы на производственную площадку', 'hq', {
    requirement: 'п. 87(к): право производить по заявленному адресу — аренда, собственность, китайская производственная лицензия.',
    needsNotary: true,
    needsApostille: true,
    needsTranslation: true,
  }),
  slot('trademark', 'Право на товарный знак', 'hq', {
    requirement: 'п. 87(л), если бренд вынесен на упаковку и нет записи в Роспатенте. Китайское свидетельство на знак.',
    needsApostille: true,
    needsTranslation: true,
    optional: true,
  }),
  slot('iso', 'ISO 13485 и отчёт инспекции к нему', 'hq', {
    requirement: 'п. 87(к). Нотариальная копия и апостиль: сам по себе сертификат рынок не открывает, но без легализации копию часто не принимают.',
    needsNotary: true,
    needsApostille: true,
    needsTranslation: true,
  }),
  slot('other-certs', 'NMPA, Free Sale, CE — по желанию', 'hq', {
    requirement: 'Доказательная база для экспертизы, не замена регистрационного удостоверения.',
    needsApostille: true,
    optional: true,
  }),
]

const intakeWorks = (kind: ProductKind): WorkItem[] => [
  work({
    code: '0.1',
    title: 'Карточка продукта',
    summary: 'Наименование, тип, страна производства и производитель. Без этих полей остальные работы не строятся.',
    owner: 'hq',
    fields: [
      field('name', 'Наименование продукта'),
      field('kind', 'Тип продукта', '', { hint: 'Лекарство, протез или оборудование — определяет весь дальнейший порядок' }),
      field('country', 'Страна производства'),
      field('manufacturer', 'Производитель'),
      field('sites', 'Производственные площадки', '', {
        hint: 'Включая OEM, фасовку и стерилизацию: расхождение площадок ломает досье',
      }),
    ],
  }),
  work({
    code: '0.2',
    title: 'Проверка карточки продукта',
    summary: 'Российская сторона проверяет, что тип, страна и производитель заполнены корректно и не противоречат документам.',
    owner: 'ru',
    blockedBy: ['0.1'],
    needsAgentConfirmation: true,
    note:
      kind === 'drug'
        ? 'Пограничные случаи (гель с лекарственным веществом, покрытие, филлер) — стоп и эскалация юристу: ошибка квалификации самая дорогая на старте.'
        : 'Если механизм действия фармакологический, иммунологический или метаболический — это лекарство, а не изделие. Пограничный случай эскалируется юристу.',
  }),
  work({
    code: '0.2.1',
    title: 'Проверка в государственных реестрах',
    summary:
      kind === 'drug'
        ? 'Поиск продукта в ГРЛС: возможно, регистрация уже есть и новая подача не нужна.'
        : 'Поиск в реестре медицинских изделий и в ГРЛС: возможно, продукт уже зарегистрирован.',
    owner: 'ru',
    blockedBy: ['0.2'],
    needsAgentConfirmation: true,
    portals: kind === 'drug' ? [PORTALS.grls] : [PORTALS.elkWidget, PORTALS.grls],
    fields: [
      field('result', 'Результат поиска', '', { options: ['не искали', 'найден', 'не найден'] }),
      field('number', 'Номер реестровой записи'),
      field('holder', 'Держатель записи'),
      field('models', 'Модели и исполнения в записи'),
    ],
    note: 'Реестр — источник истины по номерам. Портал хранит результат проверки и ссылку, а не свою копию реестра.',
  }),
]

const equipmentPlan = (): WorkItem[] => [
  ...intakeWorks('equipment'),
  work({
    code: '0.3',
    title: 'Досье производителя',
    summary: 'Собрать исходный комплект завода. Это материал для gap-анализа и перевода, а не готовое досье для подачи.',
    owner: 'hq',
    blockedBy: ['0.2.1'],
    slots: [
      slot('ifu', 'Инструкция по эксплуатации', 'hq'),
      slot('tech', 'Техническое описание', 'hq'),
      slot('models', 'Перечень моделей, исполнений и принадлежностей', 'hq', {
        requirement: 'Список закрывается до подачи: добавить артикулы потом нельзя.',
      }),
      slot('materials', 'Материалы контактирующих частей, включая манжету', 'hq'),
      slot('risks', 'Файл менеджмента рисков', 'hq'),
      slot('iso-src', 'ISO 13485', 'hq', { optional: true }),
      slot('iec', 'IEC 80601-2-30 и протоколы электробезопасности', 'hq', { optional: true }),
      slot('labels', 'Макеты этикеток и упаковки', 'hq'),
    ],
  }),
  work({
    code: '0.3.1',
    title: 'Класс риска, вид НКМИ и трек СИ',
    summary: 'Определить вид изделия по справочнику Минздрава, класс риска и нужен ли метрологический трек.',
    owner: 'ru',
    blockedBy: ['0.3'],
    needsAgentConfirmation: true,
    fields: [
      field('nkmi', 'Вид НКМИ, приказ № 4н'),
      field('class', 'Класс риска', '', { options: ['1', '2а', '2б', '3'] }),
      field('si', 'Изделие является средством измерений', '', { options: ['да', 'нет'] }),
      field('track', 'Правовой трек', '', { options: ['ПП РФ № 1684', 'ЕАЭС, Решение № 46'] }),
    ],
    note: 'Справочник видов ведёт Минздрав, не ЕПГУ. Занижение класса — типовая причина возврата досье.',
  }),
  work({
    code: '0.4',
    title: 'Перевод документов на русский',
    summary: 'Перевод с обязательной медицинской редактурой: машинный перевод инструкции экспертизу не проходит.',
    owner: 'translator',
    blockedBy: ['0.3.1'],
    slots: [
      slot('ifu-ru', 'Инструкция по эксплуатации на русском', 'translator', { needsTranslation: true }),
      slot('tech-ru', 'Техническое описание на русском', 'translator', { needsTranslation: true }),
      slot('labels-ru', 'Этикетки и упаковка на русском', 'translator', { needsTranslation: true }),
    ],
    note: 'Терминология инструкции, маркировки и техдокументации должна совпадать с видом НКМИ.',
  }),
  work({
    code: '0.5',
    title: 'Легализация документов и мандат УПП',
    summary: 'Нотариус, апостиль и назначение уполномоченного представителя производителя в России.',
    owner: 'notary',
    blockedBy: ['0.3.1'],
    needsAgentConfirmation: true,
    slots: deviceLegalSlots(),
    note: 'Без завершённого мандата кейс не переходит к подаче: заявителем выступает российская компания, и это условие права.',
  }),
  work({
    code: '0.6',
    title: 'Подбор лаборатории по области аккредитации',
    summary: 'Лаборатория должна иметь в области аккредитации нужный вид изделия и нужные испытания.',
    owner: 'ru',
    blockedBy: ['0.3.1'],
    portals: [PORTALS.fsa],
    fields: [
      field('scope', 'Требуемые области', 'технические испытания, ЭМС, токсикология'),
      field('candidate', 'Выбранная лаборатория'),
      field('accreditation', 'Номер аттестата аккредитации'),
    ],
    note: 'Протокол должен оформляться для целей государственной регистрации, не как внутренний входной контроль.',
  }),
  work({
    code: '0.7',
    title: 'Договоры с лабораторией и метрологией',
    summary: 'Законтрактовать испытания и метрологический трек параллельно, чтобы не терять месяцы.',
    owner: 'ru',
    blockedBy: ['0.5', '0.6'],
    parallelWith: ['0.7'],
    needsAgentConfirmation: true,
    slots: [
      slot('lab-contract', 'Договор и программа испытаний с лабораторией', 'ru'),
      slot('metrology-contract', 'Договор на испытания в целях утверждения типа СИ', 'ru', { optional: true }),
    ],
    fields: [field('program', 'Согласованное количество образцов и дублей')],
  }),
  work({
    code: '1',
    title: 'Уведомление о ввозе образцов',
    summary: 'Разрешение привезти то, на чём будут испытания. Подаётся до отгрузки с завода.',
    owner: 'ru',
    blockedBy: ['0.7'],
    needsAgentConfirmation: true,
    portals: [PORTALS.import610095, PORTALS.rznImport],
    fields: [
      field('samples', 'Количество образцов и принадлежностей'),
      field('shipment', 'Планируемая дата отгрузки'),
    ],
    note: 'Приказ Минздрава № 201н. Без этого шага таможня и цикл регистрации ломаются: экспертиза спросит происхождение образцов.',
  }),
  work({
    code: '2',
    title: 'Таможенное оформление образцов',
    summary: 'В декларации цель ввоза — государственная регистрация, а не коммерческая партия.',
    owner: 'broker',
    blockedBy: ['1'],
    needsAgentConfirmation: true,
    portals: [PORTALS.customs],
    slots: [slot('dt', 'Декларация на товары и товаросопроводительные документы', 'broker')],
  }),
  work({
    code: '3',
    title: 'Технические испытания, ЭМС и токсикология',
    summary: 'Протоколы лаборатории — доказательная база будущего заявления. Кабинеты Росздравнадзора здесь ещё не нужны.',
    owner: 'lab',
    blockedBy: ['2'],
    needsAgentConfirmation: true,
    slots: [
      slot('tech-report', 'Протокол технических испытаний', 'lab'),
      slot('emc-report', 'Протокол испытаний на электромагнитную совместимость', 'lab'),
      slot('tox-report', 'Протокол токсикологических исследований', 'lab'),
    ],
    note: 'На форму 630782 сейчас заходить нечего: прикладывать пока нечего.',
  }),
  work({
    code: '3.1',
    title: 'Утверждение типа средства измерений',
    summary: 'Отдельный метрологический контур: нужен, если изделие имеет измерительную функцию из перечня.',
    owner: 'gov',
    blockedBy: ['2'],
    parallelWith: ['3'],
    needsAgentConfirmation: true,
    portals: [PORTALS.arshin],
    slots: [slot('si-cert', 'Свидетельство об утверждении типа СИ', 'gov', { optional: true })],
    note: 'Если в работе 0.3.1 отмечено, что изделие не является СИ, работу можно закрыть как не требующуюся.',
  }),
  work({
    code: '3.2',
    title: 'Инспектирование производства',
    summary: 'Оценка производства по Правилам № 1684 учреждением, а не ISO-аудитором.',
    owner: 'gov',
    blockedBy: ['3'],
    needsAgentConfirmation: true,
    slots: [slot('inspection-act', 'Акт или заключение по результатам инспекции', 'gov')],
  }),
  work({
    code: '4',
    title: 'Заявление на государственную регистрацию',
    summary: 'Одно семейство моделей — одно заявление. Подаёт российская компания с усиленной подписью.',
    owner: 'ru',
    blockedBy: ['3', '3.2'],
    needsAgentConfirmation: true,
    portals: [PORTALS.register630782, PORTALS.rznRegistration],
    slots: [
      slot('application', 'Заявление и опись комплекта', 'ru'),
      slot('duty', 'Документ об уплате государственной пошлины', 'ru'),
    ],
    note: 'Следующий аппарат — новое заявление 630782, а не строка в поданном. Союзный трек — услуга 613264.',
  }),
  work({
    code: '5',
    title: 'Статусы, запросы и досылки',
    summary: 'Сопровождение поданного заявления: статусы в кабинете заявителя, ответы на запросы через ту же услугу.',
    owner: 'ru',
    blockedBy: ['4'],
    portals: [PORTALS.elkApplicant],
    fields: [field('status', 'Статус в государственном кабинете'), field('deadline', 'Срок ответа на запрос')],
    note: 'Это сопровождение, а не новая подача с нуля. Просроченный ответ означает решение по имеющимся материалам.',
  }),
  work({
    code: '6',
    title: 'После регистрации: коммерческий ввоз',
    summary: 'Другой таможенный контур: декларация с номером регистрационного удостоверения.',
    owner: 'broker',
    blockedBy: ['5'],
    portals: [PORTALS.customs],
    note: 'Уведомление 610095 на обычный импорт уже зарегистрированного изделия не нужно: образцы и торговля — две разные подачи.',
  }),
  work({
    code: '6.1',
    title: 'После регистрации: маркировка',
    summary: 'Подключение к системе маркировки, если вид изделия попал в обязательный перечень.',
    owner: 'ru',
    blockedBy: ['5'],
    portals: [PORTALS.markirovka],
    note: 'Операционка кодов остаётся у интеграторов: портал ведёт реквизиты и статус.',
  }),
]

const prosthesisPlan = (): WorkItem[] => [
  ...intakeWorks('prosthesis'),
  work({
    code: '0.3',
    title: 'Досье производителя',
    summary: 'Исходный комплект завода по изделию и принадлежностям.',
    owner: 'hq',
    blockedBy: ['0.2.1'],
    slots: [
      slot('ifu', 'Инструкция по применению', 'hq'),
      slot('tech', 'Техническое описание изделия', 'hq'),
      slot('models', 'Перечень моделей, размеров и принадлежностей', 'hq', {
        requirement: 'Список закрывается до подачи: «добавим артикулы потом» — типовая ошибка.',
      }),
      slot('materials', 'Материалы и биосовместимость', 'hq'),
      slot('risks', 'Файл менеджмента рисков', 'hq'),
      slot('iso-src', 'ISO 13485', 'hq', { optional: true }),
      slot('labels', 'Макеты этикеток и упаковки', 'hq'),
    ],
  }),
  work({
    code: '0.3.1',
    title: 'Класс риска и вид НКМИ',
    summary: 'Вид изделия по справочнику Минздрава, класс риска и развилка «принадлежность или отдельное удостоверение».',
    owner: 'ru',
    blockedBy: ['0.3'],
    needsAgentConfirmation: true,
    fields: [
      field('nkmi', 'Вид НКМИ, приказ № 4н'),
      field('class', 'Класс риска', '', { options: ['1', '2а', '2б', '3'] }),
      field('accessory', 'Регистрируется как', '', { options: ['отдельное изделие', 'принадлежность в составе системы'] }),
      field('track', 'Правовой трек', '', { options: ['ПП РФ № 1684', 'ЕАЭС, Решение № 46'] }),
    ],
  }),
  work({
    code: '0.4',
    title: 'Перевод документов на русский',
    summary: 'Перевод с медицинской редактурой и терминологией НКМИ.',
    owner: 'translator',
    blockedBy: ['0.3.1'],
    slots: [
      slot('ifu-ru', 'Инструкция по применению на русском', 'translator', { needsTranslation: true }),
      slot('tech-ru', 'Техническое описание на русском', 'translator', { needsTranslation: true }),
      slot('labels-ru', 'Этикетки и упаковка на русском', 'translator', { needsTranslation: true }),
    ],
  }),
  work({
    code: '0.5',
    title: 'Легализация документов и мандат УПП',
    summary: 'Нотариус, апостиль и назначение уполномоченного представителя производителя.',
    owner: 'notary',
    blockedBy: ['0.3.1'],
    needsAgentConfirmation: true,
    slots: deviceLegalSlots(),
  }),
  work({
    code: '0.6',
    title: 'Подбор лаборатории по области аккредитации',
    summary: 'Технические испытания и токсикология по виду изделия.',
    owner: 'ru',
    blockedBy: ['0.3.1'],
    portals: [PORTALS.fsa],
    fields: [
      field('scope', 'Требуемые области', 'технические испытания, токсикология'),
      field('candidate', 'Выбранная лаборатория'),
      field('accreditation', 'Номер аттестата аккредитации'),
    ],
  }),
  work({
    code: '0.7',
    title: 'Договор с лабораторией',
    summary: 'Программа испытаний согласуется до отгрузки образцов.',
    owner: 'ru',
    blockedBy: ['0.5', '0.6'],
    needsAgentConfirmation: true,
    slots: [slot('lab-contract', 'Договор и программа испытаний', 'ru')],
    fields: [field('program', 'Согласованное количество образцов и дублей')],
  }),
  work({
    code: '1',
    title: 'Уведомление о ввозе образцов',
    summary: 'Подаётся до отгрузки с завода. Приказ Минздрава № 201н.',
    owner: 'ru',
    blockedBy: ['0.7'],
    needsAgentConfirmation: true,
    portals: [PORTALS.import610095, PORTALS.rznImport],
    fields: [field('samples', 'Количество образцов'), field('shipment', 'Планируемая дата отгрузки')],
  }),
  work({
    code: '2',
    title: 'Таможенное оформление образцов',
    summary: 'Ввоз в целях государственной регистрации, не коммерческая партия.',
    owner: 'broker',
    blockedBy: ['1'],
    needsAgentConfirmation: true,
    portals: [PORTALS.customs],
    slots: [slot('dt', 'Декларация на товары', 'broker')],
  }),
  work({
    code: '3',
    title: 'Технические испытания и токсикология',
    summary: 'Протоколы для целей государственной регистрации.',
    owner: 'lab',
    blockedBy: ['2'],
    needsAgentConfirmation: true,
    slots: [
      slot('tech-report', 'Протокол технических испытаний', 'lab'),
      slot('tox-report', 'Протокол токсикологических исследований', 'lab'),
    ],
  }),
  work({
    code: '3.2',
    title: 'Инспектирование производства',
    summary: 'Оценка производства по Правилам № 1684.',
    owner: 'gov',
    blockedBy: ['3'],
    needsAgentConfirmation: true,
    slots: [slot('inspection-act', 'Акт или заключение по результатам инспекции', 'gov')],
  }),
  work({
    code: '4',
    title: 'Заявление на государственную регистрацию',
    summary: 'Одно семейство моделей — одно заявление.',
    owner: 'ru',
    blockedBy: ['3', '3.2'],
    needsAgentConfirmation: true,
    portals: [PORTALS.register630782, PORTALS.rznRegistration],
    slots: [
      slot('application', 'Заявление и опись комплекта', 'ru'),
      slot('duty', 'Документ об уплате государственной пошлины', 'ru'),
    ],
    note: 'Союзный трек ЕАЭС подаётся отдельной услугой 613264.',
  }),
  work({
    code: '5',
    title: 'Статусы, запросы и досылки',
    summary: 'Сопровождение заявления в кабинете заявителя.',
    owner: 'ru',
    blockedBy: ['4'],
    portals: [PORTALS.elkApplicant],
    fields: [field('status', 'Статус в государственном кабинете'), field('deadline', 'Срок ответа на запрос')],
  }),
  work({
    code: '6',
    title: 'После регистрации: коммерческий ввоз',
    summary: 'Декларация с номером регистрационного удостоверения.',
    owner: 'broker',
    blockedBy: ['5'],
    portals: [PORTALS.customs],
    note: 'Уведомление 610095 для коммерческого импорта не нужно.',
  }),
  work({
    code: '6.1',
    title: 'После регистрации: маркировка',
    summary: 'Если вид изделия попал в обязательную маркировку.',
    owner: 'ru',
    blockedBy: ['5'],
    portals: [PORTALS.markirovka],
  }),
]

const drugPlan = (): WorkItem[] => [
  ...intakeWorks('drug'),
  work({
    code: '0.3',
    title: 'Досье производителя',
    summary: 'Исходный комплект по препарату: качество, доклиника, клиника, производственная площадка.',
    owner: 'hq',
    blockedBy: ['0.2.1'],
    slots: [
      slot('quality', 'Модуль качества: состав, спецификации, методы контроля', 'hq'),
      slot('stability', 'Данные стабильности для климатической зоны', 'hq'),
      slot('preclinical', 'Доклинические данные', 'hq'),
      slot('clinical', 'Клинические данные или отчёт о биоэквивалентности', 'hq'),
      slot('gmp', 'Сертификат GMP страны производителя', 'hq'),
      slot('smf', 'Досье производственной площадки', 'hq'),
      slot('ifu', 'Инструкция по медицинскому применению и макеты упаковки', 'hq'),
    ],
  }),
  work({
    code: '0.3.1',
    title: 'Квалификация препарата и стратегия GMP',
    summary: 'Дженерик или оригинал, референтное государство, процедура и как закрывается GMP ЕАЭС.',
    owner: 'ru',
    blockedBy: ['0.3'],
    needsAgentConfirmation: true,
    fields: [
      field('type', 'Тип препарата', '', { options: ['дженерик', 'оригинальный', 'биоаналог'] }),
      field('reference', 'Референтное государство', 'Российская Федерация'),
      field('procedure', 'Процедура', '', { options: ['взаимного признания', 'децентрализованная'] }),
      field('gmp', 'Стратегия GMP', '', {
        options: ['инспекция ГИЛС и НП сразу', 'иностранный GMP плюс комплект п. 30 Правил'],
      }),
    ],
    note: 'По п. 30 Правил соответствие GMP ЕАЭС нужно подтвердить в течение трёх лет после регистрации.',
  }),
  work({
    code: '0.4',
    title: 'Перевод и приведение досье к требованиям Союза',
    summary: 'Перевод с медицинской редактурой, терминология Фармакопеи Союза, формат ОТД.',
    owner: 'translator',
    blockedBy: ['0.3.1'],
    slots: [
      slot('ifu-ru', 'Инструкция по медицинскому применению на русском', 'translator', { needsTranslation: true }),
      slot('labels-ru', 'Макеты упаковки и маркировки на русском', 'translator', { needsTranslation: true }),
      slot('quality-ru', 'Перевод модуля качества', 'translator', { needsTranslation: true }),
    ],
    note: 'Сборку валидного XML ОТД выполняет контур publishing: портал готовит комплект и выгружает его.',
  }),
  work({
    code: '0.5',
    title: 'Легализация документов и мандат представителя',
    summary: 'Назначение представителя держателя регистрационного удостоверения и контакта по фармаконадзору.',
    owner: 'notary',
    blockedBy: ['0.3.1'],
    needsAgentConfirmation: true,
    slots: [
      slot('poa', 'Доверенность представителя держателя удостоверения', 'hq', {
        requirement: 'Полномочия подавать досье, отвечать за качество и вести переписку. Нотариус, затем апостиль.',
        needsNotary: true,
        needsApostille: true,
        needsTranslation: true,
      }),
      slot('pv', 'Назначение контакта по фармаконадзору в государстве-члене', 'ru', {
        requirement: 'Требование правил надлежащей практики фармаконадзора Союза.',
      }),
      slot('signatory', 'Доказательства полномочий подписанта, 法定代表人', 'hq', {
        needsApostille: true,
        needsTranslation: true,
      }),
      slot('license', 'Свидетельство о регистрации юридического лица, 营业执照', 'hq', {
        needsApostille: true,
        needsTranslation: true,
      }),
      slot('gmp-legal', 'Сертификат GMP страны производителя', 'hq', {
        needsNotary: true,
        needsApostille: true,
        needsTranslation: true,
      }),
      slot('trademark', 'Право на товарный знак', 'hq', { needsApostille: true, optional: true }),
    ],
  }),
  work({
    code: '0.6',
    title: 'Испытательная база и организация исследований',
    summary: 'Лаборатория контроля качества и, при необходимости, площадка для биоэквивалентности.',
    owner: 'ru',
    blockedBy: ['0.3.1'],
    portals: [PORTALS.fsa],
    fields: [
      field('scope', 'Требуемые области', 'контроль качества, биоэквивалентность'),
      field('candidate', 'Лаборатория или исследовательская организация'),
    ],
  }),
  work({
    code: '0.7',
    title: 'Договоры: исследования и инспекция площадки',
    summary: 'Законтрактовать исследования и подготовить инспекцию производственной площадки в КНР.',
    owner: 'ru',
    blockedBy: ['0.5', '0.6'],
    needsAgentConfirmation: true,
    slots: [
      slot('cro-contract', 'Договор с исследовательской организацией', 'ru', { optional: true }),
      slot('gils-agreement', 'Соглашение на инспекцию производственной площадки', 'ru'),
    ],
    note: 'Оплата инспекции имеет нормативный срок: платёж фондируется заранее, портал клиента не кредитует.',
  }),
  work({
    code: '1',
    title: 'Ввоз образцов для контроля качества',
    summary: 'Ввоз серий для контроля качества оформляется как ввоз для целей регистрации.',
    owner: 'broker',
    blockedBy: ['0.7'],
    needsAgentConfirmation: true,
    portals: [PORTALS.customs],
    slots: [slot('dt', 'Декларация на товары и разрешительные документы', 'broker')],
  }),
  work({
    code: '3',
    title: 'Контроль качества и биоэквивалентность',
    summary: 'Протоколы контроля качества и отчёт о биоэквивалентности, если он требуется.',
    owner: 'lab',
    blockedBy: ['1'],
    needsAgentConfirmation: true,
    slots: [
      slot('qc-report', 'Протоколы контроля качества серий', 'lab'),
      slot('be-report', 'Отчёт о биоэквивалентности', 'lab', { optional: true }),
    ],
  }),
  work({
    code: '3.2',
    title: 'Инспекция производственной площадки',
    summary: 'Выезд инспектората на площадку в КНР, подготовка досье площадки и закрытие замечаний.',
    owner: 'gov',
    blockedBy: ['0.7'],
    parallelWith: ['3'],
    needsAgentConfirmation: true,
    slots: [
      slot('inspection-report', 'Отчёт по результатам инспекции', 'gov'),
      slot('capa', 'Реестр замечаний и план их закрытия', 'ru', { optional: true }),
    ],
  }),
  work({
    code: '4',
    title: 'Подача регистрационного досье',
    summary: 'Заявление и комплект подаются российским представителем через кабинет Минздрава.',
    owner: 'ru',
    blockedBy: ['3', '3.2'],
    needsAgentConfirmation: true,
    portals: [PORTALS.regmed],
    slots: [
      slot('application', 'Заявление и опись комплекта', 'ru'),
      slot('duty', 'Документ об уплате государственной пошлины', 'ru'),
    ],
    note: 'Проверка комплектности — до 10 рабочих дней, экспертиза в референтном государстве — до 140 рабочих дней.',
  }),
  work({
    code: '5',
    title: 'Экспертиза и ответы на запросы',
    summary: 'Сопровождение экспертизы: запросы, досылки, контроль нормативных сроков.',
    owner: 'ru',
    blockedBy: ['4'],
    portals: [PORTALS.regmed],
    fields: [field('status', 'Стадия экспертизы'), field('deadline', 'Срок ответа на запрос')],
    note: 'Досылка комплектности по лекарствам — до 90 рабочих дней. Просрочка означает решение по имеющимся материалам.',
  }),
  work({
    code: '6',
    title: 'После регистрации: ввоз и прослеживаемость',
    summary: 'Коммерческий ввоз по номеру удостоверения и подключение к системе мониторинга движения препаратов.',
    owner: 'ru',
    blockedBy: ['5'],
    portals: [PORTALS.customs],
    note: 'Для лекарств прослеживаемость ведётся в системе мониторинга движения лекарственных препаратов.',
  }),
]

export function buildWorkPlan(kind: ProductKind): WorkItem[] {
  if (kind === 'drug') return drugPlan()
  if (kind === 'prosthesis') return prosthesisPlan()
  return equipmentPlan()
}

/**
 * Продвигает план до указанной работы: всё до неё закрыто, она в работе.
 * Нужно только для сида, чтобы кейсы выглядели как живые.
 */
export function advanceTo(
  works: WorkItem[],
  code: string,
  status: WorkItem['status'] = 'waiting_client',
  actor = 'Е. Смирнова, офицер УПП',
): WorkItem[] {
  const index = works.findIndex((work) => work.code === code)
  if (index < 0) return works
  return works.map((work, position) => {
    if (position < index) {
      return {
        ...work,
        status: 'done',
        agentConfirmedBy: work.needsAgentConfirmation ? actor : undefined,
        agentConfirmedAt: work.needsAgentConfirmation ? '2026-08-20T10:00:00' : undefined,
        slots: work.slots.map((slot) =>
          slot.optional
            ? slot
            : { ...slot, files: [{ name: `${slot.id}.pdf`, uploadedBy: actor, at: '2026-08-20T10:00:00' }] },
        ),
      }
    }
    if (position === index) return { ...work, status }
    return work
  })
}
