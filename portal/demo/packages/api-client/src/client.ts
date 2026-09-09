import {
  caseDetailSchema,
  caseItemListSchema,
  caseItemSchema,
  chatMessageListSchema,
  downloadTicketSchema,
  identitySchema,
  intakeMessageListSchema,
  intakeMessageSchema,
  intakeSessionSchema,
  ledgerLineListSchema,
  organizationItemListSchema,
  organizationItemSchema,
  organizationListSchema,
  organizationSchema,
  productListSchema,
  productSchema,
  registrationCaseListSchema,
  registrySearchSchema,
  riskReportOrNullSchema,
  statusEntryListSchema,
  statusEntrySchema,
  uploadTicketSchema,
  variantListSchema,
} from '@demo/contracts'
import type {
  CaseDetail,
  CaseItem,
  ChatMessage,
  ClassificationVariant,
  Contour,
  DownloadTicket,
  Identity,
  IntakeMessage,
  IntakeScope,
  IntakeSession,
  LedgerLine,
  Locale,
  Organization,
  OrganizationItem,
  Product,
  RegistrationCase,
  RegistrySearch,
  RiskReport,
  StageKey,
  StatusEntry,
  UploadTicket,
} from '@demo/domain'
import type { ZodType } from 'zod'
import { ApiError } from './errors'

/**
 * Единственная точка выхода в ядро кабинета.
 *
 * Клиент собран вручную по мапперам `pharma-edge/scr/_shared/edge_domain.py`:
 * спецификация шлюза описывает маршруты и авторизацию, но не схемы тел, поэтому
 * генерировать из неё нечего.
 *
 * `X-API-Key` и `X-Pharma-Account` здесь не появляются ни при каких условиях:
 * это служебный путь агента и вебхуков Plane, а не браузера.
 */

export interface ApiClientOptions {
  baseUrl: string
  contour: Contour
  getToken: () => Promise<string | null>
  /** Вызывается на 401: токен истёк или отозван. */
  onUnauthorized?: () => void
}

export interface AddStatusInput {
  stage: StageKey
  text: string
  artifact: string
  enteredBy?: string
}

export interface UploadRequest {
  itemType: string
  fileName: string
  contentType: string
  title?: string
  /** Только для документов интейка: с productId файл ложится на уровень продукта. */
  productId?: string
}

export interface ApproveProductInput {
  as: 'specialist' | 'client'
  variantId?: string
  checkedAgainst?: string
}

type Query = Record<string, string | number | boolean | undefined>

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private url(path: string, query?: Query): string {
    const url = new URL(path.replace(/^\//, ''), `${this.options.baseUrl.replace(/\/$/, '')}/`)
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
    return url.toString()
  }

  private async request<T>(
    method: string,
    path: string,
    init: { body?: unknown; query?: Query; schema?: ZodType<T> } = {},
  ): Promise<T> {
    // Offline-витрина: ядра нет, поэтому любой живой запрос отклоняем как 404.
    // Списки подставят demo-строки только при VITE_DEMO_OFFLINE, а demo-* id сюда не доходят.
    if (this.options.baseUrl === 'offline://demo') {
      throw new ApiError(404, 'offline_demo', 'offline demo: core is not reachable')
    }
    const token = await this.options.getToken()
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Pharma-Contour': this.options.contour,
    }
    if (token) headers.Authorization = `Bearer ${token}`
    if (init.body !== undefined) headers['Content-Type'] = 'application/json'

    const url = this.url(path, init.query)
    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      })
    } catch (cause) {
      // Сюда попадает всё, до чего не дошёл HTTP: нет DNS у домена ядра, нет
      // шлюза перед функциями, не прошёл preflight, оборвалась сеть. Браузер
      // говорит про это одинаковое «Failed to fetch», поэтому адрес и причину
      // называем сами — иначе оператор ищет ошибку в токене.
      throw new ApiError(0, 'core_unreachable', String(cause), { url, baseUrl: this.options.baseUrl })
    }

    const raw = await response.text()
    let payload: Record<string, unknown> = {}
    if (raw) {
      try {
        payload = JSON.parse(raw) as Record<string, unknown>
      } catch {
        throw new ApiError(response.status, 'invalid_response', raw.slice(0, 200))
      }
    }

    if (!response.ok) {
      const { error, message, ...details } = payload
      if (response.status === 401) this.options.onUnauthorized?.()
      throw new ApiError(
        response.status,
        typeof error === 'string' ? error : 'edge_error',
        typeof message === 'string' ? message : response.statusText,
        details,
      )
    }

    const data = payload.data
    if (init.schema) {
      const parsed = init.schema.safeParse(data)
      if (!parsed.success) {
        console.warn(`Ответ Edge не совпал со схемой ${method} ${path}`, parsed.error.flatten())
        return data as T
      }
      return parsed.data
    }
    return data as T
  }

  /**
   * Список, которого в ядре ещё может не быть: 404 не прячет экран заглушкой,
   * а даёт пустую таблицу. Остальные ошибки остаются ошибками.
   */
  private async listOrEmpty<T>(path: string, schema: ZodType<T[]>): Promise<T[]> {
    try {
      const data = await this.request('GET', path, { schema })
      return Array.isArray(data) ? data : []
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return []
      throw error
    }
  }

  // ---------------------------------------------------------------- личность --

  getMe(): Promise<Identity> {
    return this.request('GET', '/accounts/me', { schema: identitySchema })
  }

  // ---------------------------------------------------------------- компании --

  listOrganizations(): Promise<Organization[]> {
    return this.request('GET', '/organizations', { schema: organizationListSchema })
  }

  createOrganization(input: { name?: string; kind?: string } = {}): Promise<Organization> {
    return this.request('POST', '/organizations', { body: input, schema: organizationSchema })
  }

  getOrganization(organizationId: string): Promise<Organization> {
    return this.request('GET', `/organizations/${organizationId}`, { schema: organizationSchema })
  }

  patchOrganization(
    organizationId: string,
    body: { draft?: Record<string, unknown>; status?: string; name?: string },
  ): Promise<Organization> {
    return this.request('PATCH', `/organizations/${organizationId}`, { body, schema: organizationSchema })
  }

  getOrganizationRisk(organizationId: string): Promise<RiskReport | null> {
    return this.request('GET', `/organizations/${organizationId}/risk`, { schema: riskReportOrNullSchema })
  }

  listOrganizationItems(organizationId: string): Promise<OrganizationItem[]> {
    return this.request('GET', `/organizations/${organizationId}/items`, { schema: organizationItemListSchema }).then(
      (data) => (Array.isArray(data) ? data : []),
    )
  }

  requestOrgUploadUrl(organizationId: string, body: UploadRequest): Promise<UploadTicket> {
    return this.request('POST', `/organizations/${organizationId}/items/upload-url`, {
      body,
      schema: uploadTicketSchema,
    })
  }

  /**
   * `sessionId` называет диалог. `usePlane: true` просит Edge стартовать
   * pharma-intake; без флага разбор — POST /extract на агенте.
   */
  confirmOrgUpload(
    organizationId: string,
    itemId: string,
    sessionId?: string,
    extras?: { usePlane?: boolean },
  ): Promise<OrganizationItem> {
    const body: { sessionId?: string; usePlane?: boolean } = {}
    if (sessionId) body.sessionId = sessionId
    if (extras?.usePlane) body.usePlane = true
    return this.request('POST', `/organizations/${organizationId}/items/${itemId}/confirm-upload`, {
      body,
      schema: organizationItemSchema,
    })
  }

  /** Ссылка на просмотр скана. Открывать в новой вкладке, а не читать fetch-ем. */
  requestOrgItemDownloadUrl(organizationId: string, itemId: string): Promise<DownloadTicket> {
    return this.request('POST', `/organizations/${organizationId}/items/${itemId}/download-url`, {
      schema: downloadTicketSchema,
    })
  }

  promoteOrgItem(organizationId: string, itemId: string): Promise<OrganizationItem> {
    return this.request('POST', `/organizations/${organizationId}/items/${itemId}/promote`, {
      schema: organizationItemSchema,
    })
  }

  // ---------------------------------------------------------------- продукты --

  listProducts(organizationId: string): Promise<Product[]> {
    return this.request('GET', `/organizations/${organizationId}/products`, { schema: productListSchema })
  }

  createProduct(organizationId: string, input: { name?: string; kind?: string } = {}): Promise<Product> {
    return this.request('POST', `/organizations/${organizationId}/products`, { body: input, schema: productSchema })
  }

  getProduct(productId: string): Promise<Product> {
    return this.request('GET', `/products/${productId}`, { schema: productSchema })
  }

  patchProduct(
    productId: string,
    body: { draft?: Record<string, unknown>; status?: string; name?: string; kind?: string },
  ): Promise<Product> {
    return this.request('PATCH', `/products/${productId}`, { body, schema: productSchema })
  }

  listVariants(productId: string): Promise<ClassificationVariant[]> {
    return this.request('GET', `/products/${productId}/variants`, { schema: variantListSchema })
  }

  /** Сначала специалист с `variantId`, затем клиент — и только тогда строится кейс. */
  approveProduct(productId: string, input: ApproveProductInput): Promise<Product> {
    return this.request('POST', `/products/${productId}/approve`, { body: input, schema: productSchema })
  }

  // ------------------------------------------------------------------ интейк --

  createIntakeSession(input: {
    scope: IntakeScope
    organizationId?: string
    productId?: string
    locale?: Locale
  }): Promise<IntakeSession> {
    return this.request('POST', '/intake/sessions', { body: input, schema: intakeSessionSchema })
  }

  /** Последняя сессия аккаунта по компании или продукту. Пусто — 404, не создание. */
  findIntakeSession(input: {
    scope: IntakeScope
    organizationId?: string
    productId?: string
  }): Promise<IntakeSession> {
    return this.request('GET', '/intake/sessions', { query: input, schema: intakeSessionSchema })
  }

  getIntakeSession(sessionId: string): Promise<IntakeSession> {
    return this.request('GET', `/intake/sessions/${sessionId}`, { schema: intakeSessionSchema })
  }

  listIntakeMessages(sessionId: string): Promise<IntakeMessage[]> {
    return this.request('GET', `/intake/sessions/${sessionId}/messages`, { schema: intakeMessageListSchema }).then(
      (data) => (Array.isArray(data) ? data : []),
    )
  }

  /**
   * Нить в браузере пустая после перезагрузки: агент журнал почти не пишет.
   * Кабинет сам кладёт ход, чтобы при следующем открытии диалог был на месте.
   */
  appendIntakeMessage(
    sessionId: string,
    body: { role: 'user' | 'agent' | 'system'; text: string; itemId?: string; payload?: Record<string, unknown> },
  ): Promise<IntakeMessage> {
    return this.request('POST', `/intake/sessions/${sessionId}/messages`, {
      body,
      schema: intakeMessageSchema,
    })
  }

  // ------------------------------------------------------------------- кейсы --

  /** Список отдаёт только карточки: карта приходит в `getCase`. */
  listCases(): Promise<RegistrationCase[]> {
    return this.request('GET', '/cases', { schema: registrationCaseListSchema })
  }

  getCase(caseId: string): Promise<CaseDetail> {
    return this.request('GET', `/cases/${caseId}`, { schema: caseDetailSchema })
  }

  listCaseItems(caseId: string): Promise<CaseItem[]> {
    return this.request('GET', `/cases/${caseId}/items`, { schema: caseItemListSchema })
  }

  requestDossierUploadUrl(caseId: string, body: UploadRequest): Promise<UploadTicket> {
    return this.request('POST', `/cases/${caseId}/items/upload-url`, { body, schema: uploadTicketSchema })
  }

  confirmDossierUpload(caseId: string, itemId: string, extras?: { usePlane?: boolean }): Promise<CaseItem> {
    return this.request('POST', `/cases/${caseId}/items/${itemId}/confirm-upload`, {
      body: extras?.usePlane ? { usePlane: true } : {},
      schema: caseItemSchema,
    })
  }

  /** Явный старт Plane по кейсу. Кабинет зовёт только при включённой галочке. */
  startCase(caseId: string, body: { workflow?: string; language?: string } = {}): Promise<unknown> {
    return this.request('POST', `/cases/${caseId}/actions/start`, { body })
  }

  listStatuses(caseId: string): Promise<StatusEntry[]> {
    return this.request('GET', `/cases/${caseId}/statuses`, { schema: statusEntryListSchema })
  }

  /** Пишет только оператор: у роли `client` маршрут отдаёт 403. */
  addStatus(caseId: string, input: AddStatusInput): Promise<StatusEntry> {
    return this.request('POST', `/cases/${caseId}/statuses`, { body: input, schema: statusEntrySchema })
  }

  listLedger(caseId: string): Promise<LedgerLine[]> {
    return this.listOrEmpty(`/cases/${caseId}/ledger`, ledgerLineListSchema)
  }

  listChat(caseId: string): Promise<ChatMessage[]> {
    return this.listOrEmpty(`/cases/${caseId}/chat`, chatMessageListSchema)
  }

  searchRegistry(query: string, source: 'elk' | 'grls' = 'elk'): Promise<RegistrySearch> {
    return this.request('GET', '/registry/search', { query: { q: query, source }, schema: registrySearchSchema })
  }

  /**
   * Содержимое файла идёт в хранилище напрямую по presigned URL: интерфейс
   * отвечает за прогресс и метаданные, а не за проксирование байтов.
   */
  async putFile(ticket: UploadTicket, file: File): Promise<void> {
    let response: Response
    try {
      response = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
    } catch (cause) {
      throw new ApiError(0, 'storage_unreachable', String(cause), { objectKey: ticket.objectKey })
    }
    if (!response.ok) {
      throw new ApiError(response.status, 'upload_failed', `storage refused ${response.status}`)
    }
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options)
}
