import type {
  Actor,
  LedgerStatus,
  MandateStepKey,
  NodeOwner,
  NodeStatus,
  Role,
  StageKey,
  Track,
} from '@demo/domain'

export const ROLE_LABEL: Record<Role, string> = {
  client: 'клиент',
  specialist: 'регуляторный специалист',
  operator: 'оператор',
  admin: 'администратор',
}

export const NODE_STATUS_LABEL: Record<NodeStatus, string> = {
  done: 'закрыт',
  in_progress: 'в работе',
  planned: 'запланирован',
  later: 'позже',
  goal: 'цель',
}

export const NODE_OWNER_LABEL: Record<NodeOwner, string> = {
  you: 'клиент',
  us: 'мы',
  contractor: 'подрядчик',
  gov: 'госорган',
}

export const STAGE_LABEL: Record<StageKey, string> = {
  onboarding: 'Онбординг',
  qualification: 'Квалификация',
  case: 'Кейс заведён',
  roadmap: 'Дорожная карта',
  dossier: 'Досье',
  samples: 'Образцы и испытания',
  filing: 'Подача',
  expertise: 'Экспертиза',
  registry: 'Реестровая запись',
  postreg: 'После РУ',
}

export const ACTOR_LABEL: Record<Actor, string> = {
  hq: 'штаб-квартира в КНР',
  ru: 'российская компания',
  lab: 'лаборатория',
  gov: 'регулятор',
}

export const TRACK_LABEL: Record<Track, string> = {
  pp1684: 'Национальный трек, ПП РФ № 1684',
  eaeu46: 'ЕАЭС, Решение № 46',
  eaeu78: 'ЕАЭС, Решение № 78',
}

export const LEDGER_STATUS_LABEL: Record<LedgerStatus, string> = {
  received: 'счёт получен',
  accepted: 'акцептован, ждёт фондирования',
  funded: 'фондирование получено',
  paid: 'оплачен',
  closed: 'закрыт актом',
}

export const LEDGER_ACTION_LABEL: Partial<Record<LedgerStatus, string>> = {
  accepted: 'Акцептовать счёт',
  funded: 'Отметить фондирование',
  paid: 'Отметить оплату по оригиналу',
  closed: 'Закрыть актом',
}

export const MANDATE_STEP_LABEL: Record<MandateStepKey, string> = {
  'service-contract': 'Сервисный договор',
  'power-of-attorney': 'Доверенность',
  apostille: 'Апостиль',
  'notarized-translation': 'Нотариальный перевод',
  'representative-registered': 'Представитель назначен',
}

export const MANDATE_STATUS_LABEL: Record<'done' | 'in-progress' | 'pending', string> = {
  done: 'завершено',
  'in-progress': 'в работе',
  pending: 'не начато',
}

export const CREDENTIAL_LABEL: Record<'esia' | 'ukep' | 'mchd', string> = {
  esia: 'ЕСИА',
  ukep: 'УКЭП',
  mchd: 'МЧД',
}

export const OPERATORS = [
  'Е. Смирнова, офицер УПП',
  'А. Ветров, координатор испытаний',
  'Финансы, ООО «Синоптикс РУ»',
]
