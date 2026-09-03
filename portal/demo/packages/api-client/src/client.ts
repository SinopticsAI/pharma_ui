import type {
  CaseDetail,
  CaseItem,
  ClassificationVariant,
  Contour,
  Identity,
  IntakeMessage,
  IntakeScope,
  IntakeSession,
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
    init: { body?: unknown; query?: Query } = {},
  ): Promise<T> {
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

    return payload.data as T
  }

  // ---------------------------------------------------------------- личность --

  getMe(): Promise<Identity> {
    return this.request('GET', '/accounts/me')
  }

  // ---------------------------------------------------------------- компании --

  listOrganizations(): Promise<Organization[]> {
    return this.request('GET', '/organizations')
  }

  createOrganization(input: { name?: string; kind?: string } = {}): Promise<Organization> {
    return this.request('POST', '/organizations', { body: input })
  }

  getOrganization(organizationId: string): Promise<Organization> {
    return this.request('GET', `/organizations/${organizationId}`)
  }

  patchOrganization(
    organizationId: string,
    body: { draft?: Record<string, unknown>; status?: string; name?: string },
  ): Promise<Organization> {
    return this.request('PATCH', `/organizations/${organizationId}`, { body })
  }

  getOrganizationRisk(organizationId: string): Promise<RiskReport | null> {
    return this.request('GET', `/organizations/${organizationId}/risk`)
  }

  listOrganizationItems(organizationId: string): Promise<OrganizationItem[]> {
    return this.request('GET', `/organizations/${organizationId}/items`)
  }

  requestOrgUploadUrl(organizationId: string, body: UploadRequest): Promise<UploadTicket> {
    return this.request('POST', `/organizations/${organizationId}/items/upload-url`, { body })
  }

  confirmOrgUpload(organizationId: string, itemId: string): Promise<OrganizationItem> {
    return this.request('POST', `/organizations/${organizationId}/items/${itemId}/confirm-upload`)
  }

  promoteOrgItem(organizationId: string, itemId: string): Promise<OrganizationItem> {
    return this.request('POST', `/organizations/${organizationId}/items/${itemId}/promote`)
  }

  // ---------------------------------------------------------------- продукты --

  listProducts(organizationId: string): Promise<Product[]> {
    return this.request('GET', `/organizations/${organizationId}/products`)
  }

  createProduct(organizationId: string, input: { name?: string; kind?: string } = {}): Promise<Product> {
    return this.request('POST', `/organizations/${organizationId}/products`, { body: input })
  }

  getProduct(productId: string): Promise<Product> {
    return this.request('GET', `/products/${productId}`)
  }

  patchProduct(
    productId: string,
    body: { draft?: Record<string, unknown>; status?: string; name?: string; kind?: string },
  ): Promise<Product> {
    return this.request('PATCH', `/products/${productId}`, { body })
  }

  listVariants(productId: string): Promise<ClassificationVariant[]> {
    return this.request('GET', `/products/${productId}/variants`)
  }

  /** Сначала специалист с `variantId`, затем клиент — и только тогда строится кейс. */
  approveProduct(productId: string, input: ApproveProductInput): Promise<Product> {
    return this.request('POST', `/products/${productId}/approve`, { body: input })
  }

  // ------------------------------------------------------------------ интейк --

  createIntakeSession(input: {
    scope: IntakeScope
    organizationId?: string
    productId?: string
    locale?: Locale
  }): Promise<IntakeSession> {
    return this.request('POST', '/intake/sessions', { body: input })
  }

  getIntakeSession(sessionId: string): Promise<IntakeSession> {
    return this.request('GET', `/intake/sessions/${sessionId}`)
  }

  /** Журнал только на чтение: пишет его агент тулом `append-chat-message`. */
  listIntakeMessages(sessionId: string): Promise<IntakeMessage[]> {
    return this.request('GET', `/intake/sessions/${sessionId}/messages`)
  }

  // ------------------------------------------------------------------- кейсы --

  /** Список отдаёт только карточки: карта приходит в `getCase`. */
  listCases(): Promise<RegistrationCase[]> {
    return this.request('GET', '/cases')
  }

  getCase(caseId: string): Promise<CaseDetail> {
    return this.request('GET', `/cases/${caseId}`)
  }

  listCaseItems(caseId: string): Promise<CaseItem[]> {
    return this.request('GET', `/cases/${caseId}/items`)
  }

  requestDossierUploadUrl(caseId: string, body: UploadRequest): Promise<UploadTicket> {
    return this.request('POST', `/cases/${caseId}/items/upload-url`, { body })
  }

  confirmDossierUpload(caseId: string, itemId: string): Promise<CaseItem> {
    return this.request('POST', `/cases/${caseId}/items/${itemId}/confirm-upload`)
  }

  listStatuses(caseId: string): Promise<StatusEntry[]> {
    return this.request('GET', `/cases/${caseId}/statuses`)
  }

  /** Пишет только оператор: у роли `client` маршрут отдаёт 403. */
  addStatus(caseId: string, input: AddStatusInput): Promise<StatusEntry> {
    return this.request('POST', `/cases/${caseId}/statuses`, { body: input })
  }

  searchRegistry(query: string, source: 'elk' | 'grls' = 'elk'): Promise<RegistrySearch> {
    return this.request('GET', '/registry/search', { query: { q: query, source } })
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
