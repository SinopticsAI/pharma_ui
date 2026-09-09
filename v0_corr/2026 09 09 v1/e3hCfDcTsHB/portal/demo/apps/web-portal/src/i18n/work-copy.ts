import type { ProductKind } from '../data/work'
import type { L10n, Locale } from './types'
import { pickL10n } from './types'

const L = (ru: string, en: string, zh: string): L10n => ({ ru, en, zh })

type WorkText = { title?: L10n; summary?: L10n; note?: L10n }
type SlotText = { title?: L10n; requirement?: L10n }
type FieldText = { label?: L10n; hint?: L10n }
type PortalText = { name?: L10n; when?: L10n; fee?: L10n; notThis?: L10n[] }

const WORKS: Record<string, WorkText> = {
  '*:0.1': {
    title: L('Карточка продукта', 'Product card', '产品卡片'),
    summary: L(
      'Наименование, тип, страна производства и производитель. Без этих полей остальные работы не строятся.',
      'Name, type, country of manufacture, and manufacturer. Other work items cannot be built without these fields.',
      '名称、类型、生产国和制造商。没有这些字段，后续工作无法建立。',
    ),
  },
  '*:0.2': {
    title: L('Проверка карточки продукта', 'Product card check', '产品卡片核查'),
    summary: L(
      'Российская сторона проверяет, что тип, страна и производитель заполнены корректно и не противоречат документам.',
      'The Russian side checks that type, country, and manufacturer are filled in correctly and do not contradict the documents.',
      '俄方核查类型、国家和制造商是否填写正确且与文件无矛盾。',
    ),
  },
  'drug:0.2': {
    note: L(
      'Пограничные случаи (гель с лекарственным веществом, покрытие, филлер) — стоп и эскалация юристу: ошибка квалификации самая дорогая на старте.',
      'Borderline cases (a gel with an active substance, a coating, a filler) stop here and escalate to counsel: a qualification error is the costliest mistake at the start.',
      '临界情形（含药物成分的凝胶、涂层、填充剂）在此停止并升级给律师：定性错误是启动阶段代价最高的失误。',
    ),
  },
  'equipment:0.2': {
    note: L(
      'Если механизм действия фармакологический, иммунологический или метаболический — это лекарство, а не изделие. Пограничный случай эскалируется юристу.',
      'If the mode of action is pharmacological, immunological, or metabolic, this is a medicinal product, not a device. A borderline case is escalated to counsel.',
      '若作用机制为药理、免疫或代谢，则是药品而非器械。临界情形升级给律师。',
    ),
  },
  'prosthesis:0.2': {
    note: L(
      'Если механизм действия фармакологический, иммунологический или метаболический — это лекарство, а не изделие. Пограничный случай эскалируется юристу.',
      'If the mode of action is pharmacological, immunological, or metabolic, this is a medicinal product, not a device. A borderline case is escalated to counsel.',
      '若作用机制为药理、免疫或代谢，则是药品而非器械。临界情形升级给律师。',
    ),
  },
  '*:0.2.1': {
    title: L('Проверка в государственных реестрах', 'Check in state registries', '国家登记簿核查'),
    note: L(
      'Реестр — источник истины по номерам. Портал хранит результат проверки и ссылку, а не свою копию реестра.',
      'The registry is the source of truth for numbers. The portal stores the check result and the link, not its own copy of the registry.',
      '登记簿是编号的事实来源。门户保存核查结果和链接，而不是自建登记簿副本。',
    ),
  },
  'drug:0.2.1': {
    summary: L(
      'Поиск продукта в ГРЛС: возможно, регистрация уже есть и новая подача не нужна.',
      'Search for the product in ГРЛС: registration may already exist, and a new filing may not be needed.',
      '在 ГРЛС 检索产品：可能已有注册，无需新的申报。',
    ),
  },
  'equipment:0.2.1': {
    summary: L(
      'Поиск в реестре медицинских изделий и в ГРЛС: возможно, продукт уже зарегистрирован.',
      'Search the medical device registry and ГРЛС: the product may already be registered.',
      '在医疗器械登记簿和 ГРЛС 中检索：产品可能已经注册。',
    ),
  },
  'prosthesis:0.2.1': {
    summary: L(
      'Поиск в реестре медицинских изделий и в ГРЛС: возможно, продукт уже зарегистрирован.',
      'Search the medical device registry and ГРЛС: the product may already be registered.',
      '在医疗器械登记簿和 ГРЛС 中检索：产品可能已经注册。',
    ),
  },
  '*:0.3': {
    title: L('Досье производителя', 'Manufacturer dossier', '制造商档案'),
  },
  'equipment:0.3': {
    summary: L(
      'Собрать исходный комплект завода. Это материал для gap-анализа и перевода, а не готовое досье для подачи.',
      'Collect the factory source pack. This is material for gap analysis and translation, not a ready filing dossier.',
      '收集工厂原始材料。这是差距分析和翻译用的材料，不是可申报的成套档案。',
    ),
  },
  'prosthesis:0.3': {
    summary: L(
      'Исходный комплект завода по изделию и принадлежностям.',
      'Factory source pack for the device and its accessories.',
      '工厂关于器械及附件的原始材料。',
    ),
  },
  'drug:0.3': {
    summary: L(
      'Исходный комплект по препарату: качество, доклиника, клиника, производственная площадка.',
      'Source pack for the product: quality, nonclinical, clinical, and the manufacturing site.',
      '药品原始材料：质量、临床前、临床和生产场地。',
    ),
  },
  'equipment:0.3.1': {
    title: L('Класс риска, вид НКМИ и трек СИ', 'Risk class, НКМИ kind, and measuring-instrument track', '风险等级、НКМИ 种类与计量器具路径'),
    summary: L(
      'Определить вид изделия по справочнику Минздрава, класс риска и нужен ли метрологический трек.',
      'Determine the device kind in the Ministry of Health catalogue, the risk class, and whether a metrology track is needed.',
      '按卫生部目录确定器械种类、风险等级，以及是否需要计量路径。',
    ),
    note: L(
      'Справочник видов ведёт Минздрав, не ЕПГУ. Занижение класса — типовая причина возврата досье.',
      'The kind catalogue is maintained by the Ministry of Health, not ЕПГУ. Understating the class is a typical reason for a dossier return.',
      '种类目录由卫生部维护，不是 ЕПГУ。压低等级是档案被退回的常见原因。',
    ),
  },
  'prosthesis:0.3.1': {
    title: L('Класс риска и вид НКМИ', 'Risk class and НКМИ kind', '风险等级与 НКМИ 种类'),
    summary: L(
      'Вид изделия по справочнику Минздрава, класс риска и развилка «принадлежность или отдельное удостоверение».',
      'Device kind in the Ministry of Health catalogue, risk class, and the fork “accessory or a separate authorization”.',
      '卫生部目录中的器械种类、风险等级，以及「附件还是单独注册证」的分叉。',
    ),
  },
  'drug:0.3.1': {
    title: L('Квалификация препарата и стратегия GMP', 'Product qualification and GMP strategy', '药品定性与 GMP 策略'),
    summary: L(
      'Дженерик или оригинал, референтное государство, процедура и как закрывается GMP ЕАЭС.',
      'Generic or originator, reference state, procedure, and how EAEU GMP is closed.',
      '仿制药或原研、参照国、程序，以及如何闭合欧亚经济联盟 GMP。',
    ),
    note: L(
      'По п. 30 Правил соответствие GMP ЕАЭС нужно подтвердить в течение трёх лет после регистрации.',
      'Under clause 30 of the Rules, EAEU GMP compliance must be confirmed within three years after registration.',
      '按规则第 30 条，欧亚经济联盟 GMP 符合性须在注册后三年内确认。',
    ),
  },
  'equipment:0.4': {
    title: L('Перевод документов на русский', 'Translation of documents into Russian', '文件译成俄文'),
    summary: L(
      'Перевод с обязательной медицинской редактурой: машинный перевод инструкции экспертизу не проходит.',
      'Translation with mandatory medical editing: a machine-translated IFU will not pass review.',
      '翻译并必须经医学审校：说明书机翻无法通过审评。',
    ),
    note: L(
      'Терминология инструкции, маркировки и техдокументации должна совпадать с видом НКМИ.',
      'Terminology in the IFU, labelling, and technical documentation must match the НКМИ kind.',
      '说明书、标识和技术文件的术语须与 НКМИ 种类一致。',
    ),
  },
  'prosthesis:0.4': {
    title: L('Перевод документов на русский', 'Translation of documents into Russian', '文件译成俄文'),
    summary: L(
      'Перевод с медицинской редактурой и терминологией НКМИ.',
      'Translation with medical editing and НКМИ terminology.',
      '翻译并经医学审校，术语对齐 НКМИ。',
    ),
  },
  'drug:0.4': {
    title: L('Перевод и приведение досье к требованиям Союза', 'Translation and alignment of the dossier with Union requirements', '翻译并将档案对齐联盟要求'),
    summary: L(
      'Перевод с медицинской редактурой, терминология Фармакопеи Союза, формат ОТД.',
      'Translation with medical editing, Union Pharmacopoeia terminology, and eCTD format.',
      '翻译并经医学审校，使用联盟药典术语和 ОТД 格式。',
    ),
    note: L(
      'Сборку валидного XML ОТД выполняет контур publishing: портал готовит комплект и выгружает его.',
      'A valid eCTD XML package is assembled in the publishing contour: the portal prepares the set and exports it.',
      '有效 ОТД XML 由出版系统组装：门户准备材料并导出。',
    ),
  },
  'equipment:0.5': {
    title: L('Легализация документов и мандат УПП', 'Document legalization and УПП mandate', '文件合法化与授权代表委任'),
    summary: L(
      'Нотариус, апостиль и назначение уполномоченного представителя производителя в России.',
      'Notary, apostille, and appointment of the manufacturer’s authorized representative in Russia.',
      '公证、附加证明书，以及在俄罗斯指定制造商授权代表。',
    ),
    note: L(
      'Без завершённого мандата кейс не переходит к подаче: заявителем выступает российская компания, и это условие права.',
      'Without a completed mandate the case does not move to filing: the applicant is the Russian company, and that is a legal condition.',
      '委任未完成则案件不能进入申报：申请人是俄罗斯公司，这是法律条件。',
    ),
  },
  'prosthesis:0.5': {
    title: L('Легализация документов и мандат УПП', 'Document legalization and УПП mandate', '文件合法化与授权代表委任'),
    summary: L(
      'Нотариус, апостиль и назначение уполномоченного представителя производителя.',
      'Notary, apostille, and appointment of the manufacturer’s authorized representative.',
      '公证、附加证明书，以及指定制造商授权代表。',
    ),
  },
  'drug:0.5': {
    title: L('Легализация документов и мандат представителя', 'Document legalization and representative mandate', '文件合法化与代表委任'),
    summary: L(
      'Назначение представителя держателя регистрационного удостоверения и контакта по фармаконадзору.',
      'Appointment of the marketing authorization holder’s representative and the pharmacovigilance contact.',
      '指定注册证持有人代表和药物警戒联系人。',
    ),
  },
  'equipment:0.6': {
    title: L('Подбор лаборатории по области аккредитации', 'Laboratory selection by accreditation scope', '按认可范围选择实验室'),
    summary: L(
      'Лаборатория должна иметь в области аккредитации нужный вид изделия и нужные испытания.',
      'The laboratory must have the required device kind and the required tests in its accreditation scope.',
      '实验室的认可范围须覆盖所需器械种类和所需检测。',
    ),
    note: L(
      'Протокол должен оформляться для целей государственной регистрации, не как внутренний входной контроль.',
      'The protocol must be issued for state registration, not as internal incoming inspection.',
      '报告须为国家注册目的出具，而不是作为内部进货检验。',
    ),
  },
  'prosthesis:0.6': {
    title: L('Подбор лаборатории по области аккредитации', 'Laboratory selection by accreditation scope', '按认可范围选择实验室'),
    summary: L(
      'Технические испытания и токсикология по виду изделия.',
      'Technical tests and toxicology for the device kind.',
      '按器械种类进行技术检测和毒理学。',
    ),
  },
  'drug:0.6': {
    title: L('Испытательная база и организация исследований', 'Testing base and research organization', '检测基地与研究组织'),
    summary: L(
      'Лаборатория контроля качества и, при необходимости, площадка для биоэквивалентности.',
      'A quality-control laboratory and, if needed, a bioequivalence site.',
      '质量控制实验室，必要时还有生物等效性场地。',
    ),
  },
  'equipment:0.7': {
    title: L('Договоры с лабораторией и метрологией', 'Contracts with the laboratory and metrology', '与实验室和计量机构的合同'),
    summary: L(
      'Законтрактовать испытания и метрологический трек параллельно, чтобы не терять месяцы.',
      'Contract testing and the metrology track in parallel so months are not lost.',
      '并行签约检测和计量路径，以免浪费数月时间。',
    ),
  },
  'prosthesis:0.7': {
    title: L('Договор с лабораторией', 'Laboratory contract', '实验室合同'),
    summary: L(
      'Программа испытаний согласуется до отгрузки образцов.',
      'The test programme is agreed before samples are shipped.',
      '检测方案在样品发运前商定。',
    ),
  },
  'drug:0.7': {
    title: L('Договоры: исследования и инспекция площадки', 'Contracts: studies and site inspection', '合同：研究与场地检查'),
    summary: L(
      'Законтрактовать исследования и подготовить инспекцию производственной площадки в КНР.',
      'Contract the studies and prepare the inspection of the manufacturing site in China.',
      '签约研究并准备对中国生产场地的检查。',
    ),
    note: L(
      'Оплата инспекции имеет нормативный срок: платёж фондируется заранее, портал клиента не кредитует.',
      'Inspection payment has a statutory deadline: funds are placed in advance; the client portal does not extend credit.',
      '检查付款有法定期限：款项须预先备妥，客户门户不提供垫付。',
    ),
  },
  'equipment:1': {
    title: L('Уведомление о ввозе образцов', 'Notification of sample import', '样品进口通知'),
    summary: L(
      'Разрешение привезти то, на чём будут испытания. Подаётся до отгрузки с завода.',
      'Permission to bring in what the tests will be run on. Filed before shipment from the factory.',
      '获准运入将用于检测的样品。须在工厂发运前申报。',
    ),
    note: L(
      'Приказ Минздрава № 201н. Без этого шага таможня и цикл регистрации ломаются: экспертиза спросит происхождение образцов.',
      'Ministry of Health order No. 201n. Without this step customs and the registration cycle break: review will ask where the samples came from.',
      '卫生部第 201н 号令。缺少此步，海关和注册周期会中断：审评会追问样品来源。',
    ),
  },
  'prosthesis:1': {
    title: L('Уведомление о ввозе образцов', 'Notification of sample import', '样品进口通知'),
    summary: L(
      'Подаётся до отгрузки с завода. Приказ Минздрава № 201н.',
      'Filed before shipment from the factory. Ministry of Health order No. 201n.',
      '须在工厂发运前申报。卫生部第 201н 号令。',
    ),
  },
  'drug:1': {
    title: L('Ввоз образцов для контроля качества', 'Import of samples for quality control', '质控样品进口'),
    summary: L(
      'Ввоз серий для контроля качества оформляется как ввоз для целей регистрации.',
      'Import of batches for quality control is filed as import for registration purposes.',
      '质控批次进口按注册目的进口办理。',
    ),
  },
  'equipment:2': {
    title: L('Таможенное оформление образцов', 'Customs clearance of samples', '样品通关'),
    summary: L(
      'В декларации цель ввоза — государственная регистрация, а не коммерческая партия.',
      'The declaration states the purpose of import as state registration, not a commercial shipment.',
      '申报单上的进口目的是国家注册，而不是商业批次。',
    ),
  },
  'prosthesis:2': {
    title: L('Таможенное оформление образцов', 'Customs clearance of samples', '样品通关'),
    summary: L(
      'Ввоз в целях государственной регистрации, не коммерческая партия.',
      'Import for state registration, not a commercial shipment.',
      '为国家注册目的进口，不是商业批次。',
    ),
  },
  'equipment:3': {
    title: L('Технические испытания, ЭМС и токсикология', 'Technical tests, EMC, and toxicology', '技术检测、电磁兼容与毒理学'),
    summary: L(
      'Протоколы лаборатории — доказательная база будущего заявления. Кабинеты Росздравнадзора здесь ещё не нужны.',
      'Laboratory protocols are the evidence base for the future application. Roszdravnadzor cabinets are not needed yet.',
      '实验室报告是未来申请的证据基础。此时尚不需要 Росздравнадзор 政务柜。',
    ),
    note: L(
      'На форму 630782 сейчас заходить нечего: прикладывать пока нечего.',
      'There is nothing to file on form 630782 yet: there is nothing to attach.',
      '现在还不必进入 630782 表格：尚无可附材料。',
    ),
  },
  'prosthesis:3': {
    title: L('Технические испытания и токсикология', 'Technical tests and toxicology', '技术检测与毒理学'),
    summary: L(
      'Протоколы для целей государственной регистрации.',
      'Protocols for state registration.',
      '用于国家注册的检测报告。',
    ),
  },
  'drug:3': {
    title: L('Контроль качества и биоэквивалентность', 'Quality control and bioequivalence', '质量控制与生物等效性'),
    summary: L(
      'Протоколы контроля качества и отчёт о биоэквивалентности, если он требуется.',
      'Quality-control protocols and a bioequivalence report if one is required.',
      '质量控制报告，以及必要时的生物等效性报告。',
    ),
  },
  'equipment:3.1': {
    title: L('Утверждение типа средства измерений', 'Type approval of a measuring instrument', '计量器具型式批准'),
    summary: L(
      'Отдельный метрологический контур: нужен, если изделие имеет измерительную функцию из перечня.',
      'A separate metrology contour: needed if the device has a listed measuring function.',
      '单独的计量路径：若器械具有目录中的测量功能则需要。',
    ),
    note: L(
      'Если в работе 0.3.1 отмечено, что изделие не является СИ, работу можно закрыть как не требующуюся.',
      'If work item 0.3.1 records that the device is not a measuring instrument, this item can be closed as not required.',
      '若工作 0.3.1 标明该器械不是计量器具，本项可关闭为无需办理。',
    ),
  },
  '*:3.2': {
    title: L('Инспектирование производства', 'Manufacturing inspection', '生产检查'),
  },
  'equipment:3.2': {
    summary: L(
      'Оценка производства по Правилам № 1684 учреждением, а не ISO-аудитором.',
      'Assessment of manufacture under Rules No. 1684 by an institution, not by an ISO auditor.',
      '由机构按第 1684 号规则评估生产，而不是由 ISO 审核员评估。',
    ),
  },
  'prosthesis:3.2': {
    summary: L('Оценка производства по Правилам № 1684.', 'Assessment of manufacture under Rules No. 1684.', '按第 1684 号规则评估生产。'),
  },
  'drug:3.2': {
    title: L('Инспекция производственной площадки', 'Manufacturing site inspection', '生产场地检查'),
    summary: L(
      'Выезд инспектората на площадку в КНР, подготовка досье площадки и закрытие замечаний.',
      'An inspectorate visit to the site in China, preparation of the site dossier, and closure of remarks.',
      '检查组赴中国场地、准备场地档案并关闭意见。',
    ),
  },
  'equipment:4': {
    title: L('Заявление на государственную регистрацию', 'Application for state registration', '国家注册申请'),
    summary: L(
      'Одно семейство моделей — одно заявление. Подаёт российская компания с усиленной подписью.',
      'One model family is one application. The Russian company files it with an enhanced electronic signature.',
      '一个型号系列对应一份申请。由俄罗斯公司使用增强电子签名提交。',
    ),
    note: L(
      'Следующий аппарат — новое заявление 630782, а не строка в поданном. Союзный трек — услуга 613264.',
      'The next device is a new 630782 application, not a line in one already filed. The Union track is service 613264.',
      '下一台设备是新的 630782 申请，而不是已提交申请中的一行。联盟路径是服务 613264。',
    ),
  },
  'prosthesis:4': {
    title: L('Заявление на государственную регистрацию', 'Application for state registration', '国家注册申请'),
    summary: L('Одно семейство моделей — одно заявление.', 'One model family is one application.', '一个型号系列对应一份申请。'),
    note: L(
      'Союзный трек ЕАЭС подаётся отдельной услугой 613264.',
      'The EAEU Union track is filed as a separate service 613264.',
      '欧亚经济联盟路径通过单独的服务 613264 申报。',
    ),
  },
  'drug:4': {
    title: L('Подача регистрационного досье', 'Filing of the registration dossier', '提交注册档案'),
    summary: L(
      'Заявление и комплект подаются российским представителем через кабинет Минздрава.',
      'The application and the set are filed by the Russian representative through the Ministry of Health cabinet.',
      '申请和材料由俄方代表通过卫生部政务柜提交。',
    ),
    note: L(
      'Проверка комплектности — до 10 рабочих дней, экспертиза в референтном государстве — до 140 рабочих дней.',
      'Completeness check is up to 10 working days; review in the reference state is up to 140 working days.',
      '完整性检查最长 10 个工作日，参照国审评最长 140 个工作日。',
    ),
  },
  'equipment:5': {
    title: L('Статусы, запросы и досылки', 'Statuses, queries, and supplements', '状态、问询与补正'),
    summary: L(
      'Сопровождение поданного заявления: статусы в кабинете заявителя, ответы на запросы через ту же услугу.',
      'Follow-up of the filed application: statuses in the applicant cabinet, replies to queries through the same service.',
      '已提交申请的跟进：申请人政务柜中的状态，通过同一服务答复问询。',
    ),
    note: L(
      'Это сопровождение, а не новая подача с нуля. Просроченный ответ означает решение по имеющимся материалам.',
      'This is follow-up, not a new filing from scratch. A late reply means a decision on the materials already on file.',
      '这是跟进，而不是从零重新申报。逾期答复意味着按已有材料作出决定。',
    ),
  },
  'prosthesis:5': {
    title: L('Статусы, запросы и досылки', 'Statuses, queries, and supplements', '状态、问询与补正'),
    summary: L(
      'Сопровождение заявления в кабинете заявителя.',
      'Follow-up of the application in the applicant cabinet.',
      '在申请人政务柜中跟进申请。',
    ),
  },
  'drug:5': {
    title: L('Экспертиза и ответы на запросы', 'Review and replies to queries', '审评与答复问询'),
    summary: L(
      'Сопровождение экспертизы: запросы, досылки, контроль нормативных сроков.',
      'Follow-up of review: queries, supplements, and control of statutory deadlines.',
      '跟进审评：问询、补正，并控制法定期限。',
    ),
    note: L(
      'Досылка комплектности по лекарствам — до 90 рабочих дней. Просрочка означает решение по имеющимся материалам.',
      'A completeness supplement for medicines is up to 90 working days. A missed deadline means a decision on the materials already on file.',
      '药品完整性补正最长 90 个工作日。逾期意味着按已有材料作出决定。',
    ),
  },
  'equipment:6': {
    title: L('После регистрации: коммерческий ввоз', 'After registration: commercial import', '注册后：商业进口'),
    summary: L(
      'Другой таможенный контур: декларация с номером регистрационного удостоверения.',
      'A different customs contour: a declaration with the marketing authorization number.',
      '另一套海关路径：申报单须带注册证号。',
    ),
    note: L(
      'Уведомление 610095 на обычный импорт уже зарегистрированного изделия не нужно: образцы и торговля — две разные подачи.',
      'Notification 610095 is not needed for ordinary import of an already registered device: samples and trade are two different filings.',
      '已注册器械的普通进口不需要 610095 通知：样品和贸易是两次不同的申报。',
    ),
  },
  'prosthesis:6': {
    title: L('После регистрации: коммерческий ввоз', 'After registration: commercial import', '注册后：商业进口'),
    summary: L(
      'Декларация с номером регистрационного удостоверения.',
      'A declaration with the marketing authorization number.',
      '带注册证号的申报单。',
    ),
    note: L(
      'Уведомление 610095 для коммерческого импорта не нужно.',
      'Notification 610095 is not needed for commercial import.',
      '商业进口不需要 610095 通知。',
    ),
  },
  'drug:6': {
    title: L('После регистрации: ввоз и прослеживаемость', 'After registration: import and traceability', '注册后：进口与追溯'),
    summary: L(
      'Коммерческий ввоз по номеру удостоверения и подключение к системе мониторинга движения препаратов.',
      'Commercial import against the authorization number and connection to the medicine movement monitoring system.',
      '凭注册证号商业进口，并接入药品流通监测系统。',
    ),
    note: L(
      'Для лекарств прослеживаемость ведётся в системе мониторинга движения лекарственных препаратов.',
      'For medicines, traceability is kept in the medicine movement monitoring system.',
      '药品追溯在药品流通监测系统中进行。',
    ),
  },
  '*:6.1': {
    title: L('После регистрации: маркировка', 'After registration: marking', '注册后：标识'),
  },
  'equipment:6.1': {
    summary: L(
      'Подключение к системе маркировки, если вид изделия попал в обязательный перечень.',
      'Connection to the marking system if the device kind is on the mandatory list.',
      '若该器械种类列入强制清单，则接入标识系统。',
    ),
    note: L(
      'Операционка кодов остаётся у интеграторов: портал ведёт реквизиты и статус.',
      'Day-to-day code operations stay with integrators: the portal keeps the particulars and the status.',
      '日常赋码仍由集成商处理：门户保存要件和状态。',
    ),
  },
  'prosthesis:6.1': {
    summary: L(
      'Если вид изделия попал в обязательную маркировку.',
      'If the device kind is subject to mandatory marking.',
      '若该器械种类属于强制标识范围。',
    ),
  },
}

const SLOTS: Record<string, SlotText> = {
  'equipment:0.3:ifu': { title: L('Инструкция по эксплуатации', 'Instructions for use', '使用说明书') },
  'equipment:0.3:tech': { title: L('Техническое описание', 'Technical description', '技术说明') },
  'equipment:0.3:models': {
    title: L('Перечень моделей, исполнений и принадлежностей', 'List of models, variants, and accessories', '型号、规格与附件清单'),
    requirement: L(
      'Список закрывается до подачи: добавить артикулы потом нельзя.',
      'The list is closed before filing: articles cannot be added afterwards.',
      '清单在申报前封闭：之后不能再增加货号。',
    ),
  },
  'equipment:0.3:materials': {
    title: L('Материалы контактирующих частей, включая манжету', 'Materials of contacting parts, including the cuff', '接触部件材料，包括袖带'),
  },
  'equipment:0.3:risks': { title: L('Файл менеджмента рисков', 'Risk management file', '风险管理文件') },
  '*:0.3:iso-src': { title: L('ISO 13485', 'ISO 13485', 'ISO 13485') },
  'equipment:0.3:iec': {
    title: L('IEC 80601-2-30 и протоколы электробезопасности', 'IEC 80601-2-30 and electrical safety protocols', 'IEC 80601-2-30 与电气安全报告'),
  },
  '*:0.3:labels': { title: L('Макеты этикеток и упаковки', 'Label and packaging artwork', '标签与包装稿') },
  'prosthesis:0.3:ifu': { title: L('Инструкция по применению', 'Instructions for use', '使用说明书') },
  'prosthesis:0.3:tech': { title: L('Техническое описание изделия', 'Technical description of the device', '器械技术说明') },
  'prosthesis:0.3:models': {
    title: L('Перечень моделей, размеров и принадлежностей', 'List of models, sizes, and accessories', '型号、尺码与附件清单'),
    requirement: L(
      'Список закрывается до подачи: «добавим артикулы потом» — типовая ошибка.',
      'The list is closed before filing: “we will add articles later” is a typical error.',
      '清单在申报前封闭：「以后再加货号」是典型错误。',
    ),
  },
  'prosthesis:0.3:materials': { title: L('Материалы и биосовместимость', 'Materials and biocompatibility', '材料与生物相容性') },
  'prosthesis:0.3:risks': { title: L('Файл менеджмента рисков', 'Risk management file', '风险管理文件') },
  'drug:0.3:quality': {
    title: L('Модуль качества: состав, спецификации, методы контроля', 'Quality module: composition, specifications, control methods', '质量模块：组成、规格、控制方法'),
  },
  'drug:0.3:stability': {
    title: L('Данные стабильности для климатической зоны', 'Stability data for the climatic zone', '对应气候带的稳定性数据'),
  },
  'drug:0.3:preclinical': { title: L('Доклинические данные', 'Nonclinical data', '临床前数据') },
  'drug:0.3:clinical': {
    title: L('Клинические данные или отчёт о биоэквивалентности', 'Clinical data or a bioequivalence report', '临床数据或生物等效性报告'),
  },
  'drug:0.3:gmp': { title: L('Сертификат GMP страны производителя', 'GMP certificate of the manufacturer’s country', '生产国 GMP 证书') },
  'drug:0.3:smf': { title: L('Досье производственной площадки', 'Manufacturing site dossier', '生产场地档案') },
  'drug:0.3:ifu': {
    title: L('Инструкция по медицинскому применению и макеты упаковки', 'SmPC and packaging artwork', '药品说明书与包装稿'),
  },
  'equipment:0.4:ifu-ru': { title: L('Инструкция по эксплуатации на русском', 'Instructions for use in Russian', '俄文使用说明书') },
  'equipment:0.4:tech-ru': { title: L('Техническое описание на русском', 'Technical description in Russian', '俄文技术说明') },
  '*:0.4:labels-ru': { title: L('Этикетки и упаковка на русском', 'Labels and packaging in Russian', '俄文标签与包装') },
  'prosthesis:0.4:ifu-ru': { title: L('Инструкция по применению на русском', 'Instructions for use in Russian', '俄文使用说明书') },
  'prosthesis:0.4:tech-ru': { title: L('Техническое описание на русском', 'Technical description in Russian', '俄文技术说明') },
  'drug:0.4:ifu-ru': { title: L('Инструкция по медицинскому применению на русском', 'SmPC in Russian', '俄文药品说明书') },
  'drug:0.4:labels-ru': { title: L('Макеты упаковки и маркировки на русском', 'Packaging and labelling artwork in Russian', '俄文包装与标识稿') },
  'drug:0.4:quality-ru': { title: L('Перевод модуля качества', 'Translation of the quality module', '质量模块译文') },
  '*:0.5:poa': {
    title: L('Доверенность или акт назначения уполномоченного представителя', 'Power of attorney or act appointing the authorized representative', '授权委托书或授权代表任命书'),
    requirement: L(
      'п. 87(а) и 65(а): полномочия представлять завод, отвечать за обращение в РФ, заверять документы, вести регистрацию. Частный документ: сначала нотариус 公证处, затем апостиль.',
      'Clauses 87(a) and 65(a): authority to represent the factory, be responsible for placing on the market in Russia, certify documents, and run registration. A private document: notary 公证处 first, then apostille.',
      '第 87(а) 和 65(а) 条：代表工厂、对在俄流通负责、核证文件并办理注册的权限。私人文书：先经公证处公证，再办附加证明书。',
    ),
  },
  '*:0.5:signatory': {
    title: L('Доказательства полномочий подписанта', 'Evidence of the signatory’s authority', '签署人权限证明'),
    requirement: L(
      'Кто является 法定代表人 и есть ли у него право подписи. Решение совета, приказ о назначении или выписка о представителе.',
      'Who the 法定代表人 is and whether that person may sign. A board resolution, appointment order, or extract on the representative.',
      '谁是法定代表人及其是否有权签署。董事会决议、任命令或代表摘录。',
    ),
  },
  '*:0.5:license': {
    title: L('Свидетельство о регистрации юридического лица, 营业执照', 'Legal entity registration certificate, 营业执照', '法人登记证明、营业执照'),
    requirement: L(
      'п. 87(н). Официальный документ: апостиль на оригинал или на нотариальную копию.',
      'Clause 87(n). An official document: apostille on the original or on a notarized copy.',
      '第 87(н) 条。官方文件：对原件或公证副本办理附加证明书。',
    ),
  },
  '*:0.5:site': {
    title: L('Документы на производственную площадку', 'Manufacturing site documents', '生产场地文件'),
    requirement: L(
      'п. 87(к): право производить по заявленному адресу — аренда, собственность, китайская производственная лицензия.',
      'Clause 87(k): the right to manufacture at the declared address — lease, title, or a Chinese manufacturing licence.',
      '第 87(к) 条：在申报地址生产的权利——租赁、产权或中国生产许可。',
    ),
  },
  '*:0.5:trademark': {
    title: L('Право на товарный знак', 'Trademark right', '商标权'),
    requirement: L(
      'п. 87(л), если бренд вынесен на упаковку и нет записи в Роспатенте. Китайское свидетельство на знак.',
      'Clause 87(l) if the brand is on the pack and there is no Rospatent record. A Chinese trademark certificate.',
      '第 87(л) 条：若品牌印在包装上且俄罗斯专利局无记录。中国商标证书。',
    ),
  },
  '*:0.5:iso': {
    title: L('ISO 13485 и отчёт инспекции к нему', 'ISO 13485 and the related inspection report', 'ISO 13485 及其检查报告'),
    requirement: L(
      'п. 87(к). Нотариальная копия и апостиль: сам по себе сертификат рынок не открывает, но без легализации копию часто не принимают.',
      'Clause 87(k). A notarized copy and apostille: the certificate alone does not open the market, but without legalization a copy is often refused.',
      '第 87(к) 条。公证副本和附加证明书：证书本身不能打开市场，但未经合法化的副本常不被接受。',
    ),
  },
  '*:0.5:other-certs': {
    title: L('NMPA, Free Sale, CE — по желанию', 'NMPA, Free Sale, CE — optional', 'NMPA、Free Sale、CE — 可选'),
    requirement: L(
      'Доказательная база для экспертизы, не замена регистрационного удостоверения.',
      'An evidence base for review, not a substitute for a marketing authorization.',
      '供审评使用的证据，不能替代注册证。',
    ),
  },
  'drug:0.5:poa': {
    title: L('Доверенность представителя держателя удостоверения', 'Power of attorney of the authorization holder’s representative', '注册证持有人代表委托书'),
    requirement: L(
      'Полномочия подавать досье, отвечать за качество и вести переписку. Нотариус, затем апостиль.',
      'Authority to file the dossier, be responsible for quality, and conduct correspondence. Notary, then apostille.',
      '提交档案、对质量负责并往来函件的权限。先公证，再办附加证明书。',
    ),
  },
  'drug:0.5:pv': {
    title: L('Назначение контакта по фармаконадзору в государстве-члене', 'Appointment of the pharmacovigilance contact in the member state', '在成员国指定药物警戒联系人'),
    requirement: L(
      'Требование правил надлежащей практики фармаконадзора Союза.',
      'A requirement of the Union good pharmacovigilance practice rules.',
      '联盟药物警戒规范的要求。',
    ),
  },
  'drug:0.5:signatory': {
    title: L('Доказательства полномочий подписанта, 法定代表人', 'Evidence of the signatory’s authority, 法定代表人', '签署人权限证明、法定代表人'),
  },
  'drug:0.5:license': {
    title: L('Свидетельство о регистрации юридического лица, 营业执照', 'Legal entity registration certificate, 营业执照', '法人登记证明、营业执照'),
  },
  'drug:0.5:gmp-legal': { title: L('Сертификат GMP страны производителя', 'GMP certificate of the manufacturer’s country', '生产国 GMP 证书') },
  'drug:0.5:trademark': { title: L('Право на товарный знак', 'Trademark right', '商标权') },
  'equipment:0.7:lab-contract': {
    title: L('Договор и программа испытаний с лабораторией', 'Laboratory contract and test programme', '实验室合同与检测方案'),
  },
  'equipment:0.7:metrology-contract': {
    title: L('Договор на испытания в целях утверждения типа СИ', 'Contract for tests for measuring-instrument type approval', '计量器具型式批准检测合同'),
  },
  'prosthesis:0.7:lab-contract': { title: L('Договор и программа испытаний', 'Contract and test programme', '合同与检测方案') },
  'drug:0.7:cro-contract': { title: L('Договор с исследовательской организацией', 'Contract with the research organization', '与研究机构的合同') },
  'drug:0.7:gils-agreement': {
    title: L('Соглашение на инспекцию производственной площадки', 'Agreement for manufacturing site inspection', '生产场地检查协议'),
  },
  '*:2:dt': { title: L('Декларация на товары и товаросопроводительные документы', 'Goods declaration and shipping documents', '货物申报单及随附单据') },
  'prosthesis:2:dt': { title: L('Декларация на товары', 'Goods declaration', '货物申报单') },
  'drug:1:dt': { title: L('Декларация на товары и разрешительные документы', 'Goods declaration and permits', '货物申报单及许可文件') },
  '*:3:tech-report': { title: L('Протокол технических испытаний', 'Technical test protocol', '技术检测报告') },
  'equipment:3:emc-report': { title: L('Протокол испытаний на электромагнитную совместимость', 'EMC test protocol', '电磁兼容检测报告') },
  '*:3:tox-report': { title: L('Протокол токсикологических исследований', 'Toxicology study protocol', '毒理学研究报告') },
  'drug:3:qc-report': { title: L('Протоколы контроля качества серий', 'Batch quality-control protocols', '批次质量控制报告') },
  'drug:3:be-report': { title: L('Отчёт о биоэквивалентности', 'Bioequivalence report', '生物等效性报告') },
  'equipment:3.1:si-cert': { title: L('Свидетельство об утверждении типа СИ', 'Measuring-instrument type approval certificate', '计量器具型式批准证书') },
  '*:3.2:inspection-act': { title: L('Акт или заключение по результатам инспекции', 'Inspection act or opinion', '检查纪要或结论') },
  'drug:3.2:inspection-report': { title: L('Отчёт по результатам инспекции', 'Inspection report', '检查报告') },
  'drug:3.2:capa': { title: L('Реестр замечаний и план их закрытия', 'Register of remarks and the closure plan', '意见登记及关闭计划') },
  '*:4:application': { title: L('Заявление и опись комплекта', 'Application and inventory of the set', '申请书与材料清单') },
  '*:4:duty': { title: L('Документ об уплате государственной пошлины', 'Proof of state fee payment', '国家规费缴纳证明') },
}

const FIELDS: Record<string, FieldText> = {
  '*:0.1:name': { label: L('Наименование продукта', 'Product name', '产品名称') },
  '*:0.1:kind': {
    label: L('Тип продукта', 'Product type', '产品类型'),
    hint: L(
      'Лекарство, протез или оборудование — определяет весь дальнейший порядок',
      'Drug, prosthesis, or equipment — this determines the rest of the plan',
      '药品、假肢或设备——决定后续全部顺序',
    ),
  },
  '*:0.1:country': { label: L('Страна производства', 'Country of manufacture', '生产国') },
  '*:0.1:manufacturer': { label: L('Производитель', 'Manufacturer', '制造商') },
  '*:0.1:sites': {
    label: L('Производственные площадки', 'Manufacturing sites', '生产场地'),
    hint: L(
      'Включая OEM, фасовку и стерилизацию: расхождение площадок ломает досье',
      'Including OEM, packaging, and sterilization: a site mismatch breaks the dossier',
      '包括 OEM、分装和灭菌：场地不一致会破坏档案',
    ),
  },
  '*:0.2.1:result': { label: L('Результат поиска', 'Search result', '检索结果') },
  '*:0.2.1:number': { label: L('Номер реестровой записи', 'Registry entry number', '登记编号') },
  '*:0.2.1:holder': { label: L('Держатель записи', 'Record holder', '记录持有人') },
  '*:0.2.1:models': { label: L('Модели и исполнения в записи', 'Models and variants in the record', '记录中的型号与规格') },
  '*:0.3.1:nkmi': { label: L('Вид НКМИ, приказ № 4н', 'НКМИ kind, order No. 4n', 'НКМИ 种类，第 4н 号令') },
  '*:0.3.1:class': { label: L('Класс риска', 'Risk class', '风险等级') },
  'equipment:0.3.1:si': { label: L('Изделие является средством измерений', 'The device is a measuring instrument', '该器械属于计量器具') },
  '*:0.3.1:track': { label: L('Правовой трек', 'Legal track', '法律路径') },
  'prosthesis:0.3.1:accessory': { label: L('Регистрируется как', 'Registered as', '注册为') },
  'drug:0.3.1:type': { label: L('Тип препарата', 'Product type', '药品类型') },
  'drug:0.3.1:reference': { label: L('Референтное государство', 'Reference state', '参照国') },
  'drug:0.3.1:procedure': { label: L('Процедура', 'Procedure', '程序') },
  'drug:0.3.1:gmp': { label: L('Стратегия GMP', 'GMP strategy', 'GMP 策略') },
  '*:0.6:scope': { label: L('Требуемые области', 'Required scopes', '所需范围') },
  '*:0.6:candidate': { label: L('Выбранная лаборатория', 'Selected laboratory', '选定实验室') },
  'drug:0.6:candidate': { label: L('Лаборатория или исследовательская организация', 'Laboratory or research organization', '实验室或研究机构') },
  '*:0.6:accreditation': { label: L('Номер аттестата аккредитации', 'Accreditation certificate number', '认可证书编号') },
  '*:0.7:program': { label: L('Согласованное количество образцов и дублей', 'Agreed number of samples and duplicates', '商定的样品与复样数量') },
  '*:1:samples': { label: L('Количество образцов и принадлежностей', 'Number of samples and accessories', '样品与附件数量') },
  'prosthesis:1:samples': { label: L('Количество образцов', 'Number of samples', '样品数量') },
  '*:1:shipment': { label: L('Планируемая дата отгрузки', 'Planned shipment date', '计划发运日期') },
  '*:5:status': { label: L('Статус в государственном кабинете', 'Status in the government cabinet', '国家政务柜中的状态') },
  'drug:5:status': { label: L('Стадия экспертизы', 'Review stage', '审评阶段') },
  '*:5:deadline': { label: L('Срок ответа на запрос', 'Deadline to reply to a query', '答复问询的期限') },
}

const PORTALS: Record<string, PortalText> = {
  'https://elk.roszdravnadzor.gov.ru/widget/': {
    name: L(
      'Реестр медицинских изделий, виджет Росздравнадзора',
      'Medical device registry, Roszdravnadzor widget',
      '医疗器械登记簿，Roszdravnadzor 小组件',
    ),
    when: L('до начала любых работ по продукту', 'before any work on the product starts', '在该产品任何工作开始之前'),
  },
  'https://grls.rosminzdrav.ru': {
    name: L(
      'ГРЛС, государственный реестр лекарственных средств',
      'ГРЛС, the state register of medicinal products',
      'ГРЛС，国家药品登记簿',
    ),
    when: L('до начала любых работ по продукту', 'before any work on the product starts', '在该产品任何工作开始之前'),
  },
  'https://pub.fsa.gov.ru': {
    name: L(
      'Реестр аккредитованных лиц, области аккредитации',
      'Register of accredited persons, accreditation scopes',
      '获认可机构登记簿、认可范围',
    ),
    when: L('до подписания договора с лабораторией', 'before signing a contract with the laboratory', '与实验室签约之前'),
  },
  'https://www.gosuslugi.ru/610095/1/form': {
    name: L(
      'ЕПГУ, услуга 610095 — уведомление о ввозе образцов',
      'ЕПГУ, service 610095 — notification of sample import',
      'ЕПГУ，服务 610095 — 样品进口通知',
    ),
    when: L('до отгрузки с завода', 'before shipment from the factory', '工厂发运之前'),
    fee: L('пошлины нет', 'no fee', '无规费'),
    notThis: [
      L('не форма 630782 и не начало регистрации', 'not form 630782 and not the start of registration', '不是 630782 表格，也不是注册的开始'),
      L('не право продавать', 'not a right to sell', '不是销售权'),
      L(
        'не коммерческий ввоз уже зарегистрированного изделия',
        'not commercial import of an already registered device',
        '不是已注册器械的商业进口',
      ),
    ],
  },
  'https://roszdravnadzor.gov.ru/medproducts/import': {
    name: L(
      'Росздравнадзор, страница ввоза медицинских изделий',
      'Roszdravnadzor, medical device import page',
      'Roszdravnadzor，医疗器械进口页面',
    ),
  },
  'https://edata.customs.ru': {
    name: L(
      'ЛК участника ВЭД ФТС или таможенный представитель',
      'FTS foreign-trade participant cabinet or a customs representative',
      '海关总署外贸参与人柜或海关代理人',
    ),
    when: L('после уведомления 610095', 'after notification 610095', '在 610095 通知之后'),
    notThis: [
      L(
        'не коммерческая партия: цель ввоза — государственная регистрация',
        'not a commercial shipment: the purpose of import is state registration',
        '不是商业批次：进口目的是国家注册',
      ),
    ],
  },
  'https://fgis.gost.ru/fundmetrology': {
    name: L(
      'ФГИС «Аршин», утверждение типа средства измерений',
      'FGIS “Arshin”, type approval of a measuring instrument',
      'FGIS「Аршин」，计量器具型式批准',
    ),
    when: L('параллельно техническим испытаниям', 'in parallel with technical tests', '与技术检测并行'),
    notThis: [
      L(
        'не форма 630782: это отдельный метрологический контур Росстандарта',
        'not form 630782: this is a separate Rosstandart metrology contour',
        '不是 630782 表格：这是 Росстандарт 的单独计量路径',
      ),
    ],
  },
  'https://www.gosuslugi.ru/630782/1/form': {
    name: L(
      'ЕПГУ, услуга 630782 — государственная регистрация медицинского изделия',
      'ЕПГУ, service 630782 — state registration of a medical device',
      'ЕПГУ，服务 630782 — 医疗器械国家注册',
    ),
    when: L(
      'протоколы, инспекция, досье, пошлина и документы УПП готовы',
      'protocols, inspection, dossier, fee, and УПП documents are ready',
      '报告、检查、档案、规费和授权代表文件均已就绪',
    ),
    notThis: [
      L(
        'нельзя «добавить строку» в поданное заявление: следующий аппарат — новое заявление',
        'you cannot “add a line” to a filed application: the next device is a new application',
        '不能在已提交申请中「加一行」：下一台设备是新申请',
      ),
      L(
        'союзный трек ЕАЭС подаётся отдельной услугой 613264',
        'the EAEU Union track is filed as a separate service 613264',
        '欧亚经济联盟路径通过单独的服务 613264 申报',
      ),
    ],
  },
  'https://roszdravnadzor.gov.ru/medproducts/registration': {
    name: L(
      'Росздравнадзор, страница регистрации медицинских изделий',
      'Roszdravnadzor, medical device registration page',
      'Roszdravnadzor，医疗器械注册页面',
    ),
  },
  'https://elk.roszdravnadzor.gov.ru/rzn-applicant/main': {
    name: L(
      'ЕЛК Росздравнадзора, кабинет заявителя',
      'Roszdravnadzor ELK, applicant cabinet',
      'Roszdravnadzor ЕЛК，申请人柜',
    ),
    when: L('после подачи 630782', 'after filing 630782', '提交 630782 之后'),
  },
  'https://markirovka.ru': {
    name: L('Честный знак', 'Chestny Znak', '诚实标志'),
    when: L(
      'если вид изделия попал в обязательную маркировку',
      'if the device kind is subject to mandatory marking',
      '若该器械种类属于强制标识',
    ),
  },
  'https://lk.regmed.ru': {
    name: L('Личный кабинет Минздрава, lk.regmed.ru', 'Ministry of Health cabinet, lk.regmed.ru', '卫生部个人柜，lk.regmed.ru'),
    when: L('досье собрано, пошлина уплачена', 'the dossier is assembled and the fee is paid', '档案已齐、规费已缴'),
  },
}

export const OPTIONS: Record<string, L10n> = {
  'не искали': L('не искали', 'not searched', '未检索'),
  найден: L('найден', 'found', '已找到'),
  'не найден': L('не найден', 'not found', '未找到'),
  да: L('да', 'yes', '是'),
  нет: L('нет', 'no', '否'),
  'ПП РФ № 1684': L('ПП РФ № 1684', 'RF Government Decree No. 1684', '俄联邦政府第 1684 号决议'),
  'ЕАЭС, Решение № 46': L('ЕАЭС, Решение № 46', 'EAEU, Decision No. 46', '欧亚经济联盟第 46 号决定'),
  'отдельное изделие': L('отдельное изделие', 'separate device', '单独器械'),
  'принадлежность в составе системы': L(
    'принадлежность в составе системы',
    'accessory as part of a system',
    '作为系统组成部分的附件',
  ),
  дженерик: L('дженерик', 'generic', '仿制药'),
  оригинальный: L('оригинальный', 'originator', '原研'),
  биоаналог: L('биоаналог', 'biosimilar', '生物类似药'),
  'Российская Федерация': L('Российская Федерация', 'Russian Federation', '俄罗斯联邦'),
  'взаимного признания': L('взаимного признания', 'mutual recognition', '互认'),
  децентрализованная: L('децентрализованная', 'decentralized', '分散程序'),
  'инспекция ГИЛС и НП сразу': L(
    'инспекция ГИЛС и НП сразу',
    'GILS and NP inspection immediately',
    '立即接受 ГИЛС 与 НП 检查',
  ),
  'иностранный GMP плюс комплект п. 30 Правил': L(
    'иностранный GMP плюс комплект п. 30 Правил',
    'foreign GMP plus the clause 30 set',
    '外国 GMP 外加规则第 30 条材料',
  ),
  'технические испытания, ЭМС, токсикология': L(
    'технические испытания, ЭМС, токсикология',
    'technical tests, EMC, toxicology',
    '技术检测、电磁兼容、毒理学',
  ),
  'технические испытания, токсикология': L(
    'технические испытания, токсикология',
    'technical tests, toxicology',
    '技术检测、毒理学',
  ),
  'контроль качества, биоэквивалентность': L(
    'контроль качества, биоэквивалентность',
    'quality control, bioequivalence',
    '质量控制、生物等效性',
  ),
}

function lookup<T extends object>(
  kind: ProductKind,
  code: string,
  extra: string | undefined,
  table: Record<string, T>,
): T | undefined {
  const specific = extra ? table[`${kind}:${code}:${extra}`] : table[`${kind}:${code}`]
  const shared = extra ? (table[`*:${code}:${extra}`] ?? table[`*:${extra}`]) : table[`*:${code}`]
  if (!specific && !shared) return undefined
  return { ...shared, ...specific }
}

export function workTitle(kind: ProductKind, code: string, fallback: string, locale: Locale): string {
  return pickL10n(lookup(kind, code, undefined, WORKS)?.title, locale, fallback)
}

export function workSummary(kind: ProductKind, code: string, fallback: string, locale: Locale): string {
  return pickL10n(lookup(kind, code, undefined, WORKS)?.summary, locale, fallback)
}

export function workNote(kind: ProductKind, code: string, fallback: string | undefined, locale: Locale): string | undefined {
  const note = lookup(kind, code, undefined, WORKS)?.note
  if (note) return pickL10n(note, locale, fallback ?? '')
  return fallback
}

export function slotTitle(kind: ProductKind, code: string, slotId: string, fallback: string, locale: Locale): string {
  return pickL10n(lookup(kind, code, slotId, SLOTS)?.title, locale, fallback)
}

export function slotRequirement(
  kind: ProductKind,
  code: string,
  slotId: string,
  fallback: string | undefined,
  locale: Locale,
): string | undefined {
  const requirement = lookup(kind, code, slotId, SLOTS)?.requirement
  if (requirement) return pickL10n(requirement, locale, fallback ?? '')
  return fallback
}

export function fieldLabel(kind: ProductKind, code: string, fieldId: string, fallback: string, locale: Locale): string {
  return pickL10n(lookup(kind, code, fieldId, FIELDS)?.label, locale, fallback)
}

export function fieldHint(
  kind: ProductKind,
  code: string,
  fieldId: string,
  fallback: string | undefined,
  locale: Locale,
): string | undefined {
  const hint = lookup(kind, code, fieldId, FIELDS)?.hint
  if (hint) return pickL10n(hint, locale, fallback ?? '')
  return fallback
}

export function optionLabel(value: string, locale: Locale): string {
  return pickL10n(OPTIONS[value], locale, value)
}

export function portalName(url: string, fallback: string, locale: Locale): string {
  return pickL10n(PORTALS[url]?.name, locale, fallback)
}

export function portalWhen(url: string, fallback: string | undefined, locale: Locale): string | undefined {
  const when = PORTALS[url]?.when
  if (when) return pickL10n(when, locale, fallback ?? '')
  return fallback
}

export function portalFee(url: string, fallback: string | undefined, locale: Locale): string | undefined {
  const fee = PORTALS[url]?.fee
  if (fee) return pickL10n(fee, locale, fallback ?? '')
  return fallback
}

export function portalNotThis(url: string, fallback: string[] | undefined, locale: Locale): string[] | undefined {
  const lines = PORTALS[url]?.notThis
  if (lines) return lines.map((line, index) => pickL10n(line, locale, fallback?.[index] ?? ''))
  return fallback
}
