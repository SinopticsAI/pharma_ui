/**
 * Ошибки предметной области приходят кодом, а не строкой: интерфейс переводит
 * код на язык пользователя. Конверт Edge — `{"error": code, "message": ...}`
 * плюс поля, специфичные для кода (`missing`, `organizationStatus`, `subject`).
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Пользователь есть в Keycloak, но не привязан к аккаунту. */
  get isAccountNotLinked(): boolean {
    return this.status === 403 && this.code === 'account_not_linked'
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }
}

/** Коды, для которых у интерфейса есть собственная формулировка. */
export const ERROR_COPY: Record<string, string> = {
  account_not_linked: 'Пользователь ещё не привязан к аккаунту. Аккаунты заводит менеджер.',
  unauthorized: 'Нужен вход.',
  forbidden: 'Недостаточно прав для этого действия.',
  artifact_required: 'К статусу нужно приложить артефакт: выписку, скан или номер.',
  invalid_stage: 'Неизвестная стадия кейса.',
  filing_blocked: 'Подача недоступна: мандат не завершён или список моделей не закрыт.',
  profile_not_approved: 'Профиль компании не одобрен — продукт заводить рано.',
  product_incomplete: 'Карточка продукта неполная: не хватает обязательных полей.',
  not_complete: 'Варианты классификации предлагаются только при полной комплектности.',
  specialist_first: 'Классификацию сначала подтверждает специалист.',
  variant_forbidden: 'Этот вариант показан как предупреждение и не может быть выбран.',
  no_variant: 'Вариант классификации не выбран.',
  invalid_variant: 'Вариант не относится к этому продукту.',
  not_found: 'Запись не найдена.',
  internal_error: 'Ядро вернуло ошибку. Повторите позже.',
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_COPY[error.code] ?? error.message ?? error.code
  }
  return error instanceof Error ? error.message : String(error)
}
