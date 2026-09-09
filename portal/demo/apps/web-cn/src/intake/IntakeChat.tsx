import {
  AssistantRuntimeProvider,
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { describeError, useApi, useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { IntakeMessage, ProgressSection } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Empty } from '../kit'
import { usePlaneEnabled } from '../planeToggle'
import {
  useApproveCompanyProfile,
  useApproveProductData,
  useIntakeMessages,
  useOrganization,
  useOrganizationItems,
  useProduct,
} from '../queries'
import { usePortfolioCreate } from '../portfolio-create'
import { createIntakeAttachmentAdapter, pickIntakeFile } from './attachments'
import { IntakeToolUIs } from './cards'
import { type IntakeActions, IntakeActionsProvider, useIntakeActions } from './context'
import { ExtractHttpError, startIntakeExtract } from './extract'
import {
  EXTRACTION_SLOW_MS,
  type ExtractionItem,
  extractionReadyIdsFromTexts,
  formatExtractionReady,
  formatProfileApproved,
  isSettledStatus,
  itemsNeedingExtract,
  newestByUpdatedAt,
  nextAutoTurnItem,
  nextGiveUpItem,
  nextPendingSeen,
  type ProcessLine,
  processLine,
  readAutoturnFired,
  scopeExtractionItems,
  shouldAutoTurn,
  shouldKickMastraExtract,
  textsFromUnknownMessages,
  userMessagePresentation,
  writeAutoturnFired,
} from './extractionStatus'
import {
  JOURNAL_ASSISTANT_ROLES,
  JOURNAL_USER_ROLES,
  type JournalUiRole,
  journalPersistedIds,
  journalText,
  journalToolFallbackKey,
  journalToUiMessages,
  normalizeUiMessages,
  uiMessagesToRepository,
  unpersistedAppends,
} from './history'
import { ProgressPanel } from './ProgressPanel'
import { type AgentId, createIntakeTransport } from './transport'

const WAITING_PROCESS = new Set<ProcessLine['kind']>(['accepted', 'reading', 'filling'])

const ExtractionUiContext = createContext<{
  line: ProcessLine | null
  hideEmpty: boolean
  chatFailed: boolean
  uploadBusy: boolean
  lastAssistantEmpty: boolean
}>({
  line: null,
  hideEmpty: false,
  chatFailed: false,
  uploadBusy: false,
  lastAssistantEmpty: false,
})

function TypingDots({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="status" aria-live="polite" aria-label={label}>
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" aria-hidden />
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" aria-hidden />
      <span className="size-1.5 animate-bounce rounded-full bg-current" aria-hidden />
    </span>
  )
}

function lastAssistantIsEmpty(messages: unknown): boolean {
  if (!Array.isArray(messages) || messages.length === 0) return false
  const last = messages[messages.length - 1] as { role?: string; content?: unknown; parts?: unknown }
  if (last?.role !== 'assistant') return false
  const content = last.content ?? last.parts
  if (content == null) return true
  if (typeof content === 'string') return content.trim() === ''
  if (!Array.isArray(content)) return false
  return content.every((part) => {
    if (!part || typeof part !== 'object') return true
    const row = part as { type?: string; text?: string }
    if (row.type === 'text' || row.type == null) return !row.text?.trim()
    return false
  })
}

/**
 * Экран интейка: слева нить диалога и загрузки, справа комплектность по разделам.
 *
 * Окно рисует журнал Edge (`GET .../messages`), не память Mastra. User пишется
 * в журнал сразу после Send, assistant — только после успешного `/chat`.
 *
 * Документ прикладывается скрепкой в самом композере: файл становится вложением
 * сообщения, а не отдельной загрузкой рядом с чатом.
 */

function processLineText(line: ProcessLine, t: (key: MessageKey) => string): string {
  const name = line.fileName
  const seconds = String(line.elapsedSec ?? 0)
  if (line.kind === 'filling') return t('intake.chat.fillingCard')
  if (line.kind === 'accepted') return t('intake.chat.process.accepted').replace('{name}', name)
  if (line.kind === 'reading') {
    return t('intake.chat.process.reading').replace('{name}', name).replace('{seconds}', seconds)
  }
  if (line.kind === 'gateway') return t('intake.chat.process.gateway').replace('{name}', name)
  if (line.kind === 'hung') {
    return t('intake.chat.process.hung').replace('{name}', name).replace('{seconds}', seconds)
  }
  return t('intake.chat.process.emptyCard').replace('{name}', name)
}

function UserText({ text }: { text: string }) {
  const { t } = useI18n()
  const kind = userMessagePresentation(text)
  if (kind === 'extraction-ready') {
    return <span data-cabinet-turn>{t('intake.chat.extractionReady')}</span>
  }
  if (kind === 'profile-approved') {
    return <span data-cabinet-turn>{t('intake.chat.profileApproved')}</span>
  }
  return <span>{text}</span>
}

function UserMessage() {
  return (
    <MessagePrimitive.Root
      className="max-w-[80%] space-y-1 rounded-lg px-3 py-2 text-sm [&:has([data-cabinet-turn])]:bg-transparent [&:has([data-cabinet-turn])]:text-muted-foreground [&:not(:has([data-cabinet-turn]))]:ml-auto [&:not(:has([data-cabinet-turn]))]:bg-primary [&:not(:has([data-cabinet-turn]))]:text-primary-foreground"
      data-role="user"
    >
      <MessagePrimitive.Parts components={{ Text: ({ text }) => <UserText text={text} /> }} />
      <MessagePrimitive.Attachments>
        {() => (
          <AttachmentPrimitive.Root className="flex items-center gap-2 text-xs opacity-80">
            <AttachmentPrimitive.Name />
          </AttachmentPrimitive.Root>
        )}
      </MessagePrimitive.Attachments>
    </MessagePrimitive.Root>
  )
}

function AssistantMessage() {
  const { t } = useI18n()
  const { line } = useContext(ExtractionUiContext)
  return (
    <MessagePrimitive.Root
      className="max-w-[90%] space-y-2 rounded-lg bg-muted px-3 py-2 text-sm"
      data-role="assistant"
    >
      <MessagePrimitive.If hasContent>
        <MessagePrimitive.Parts />
      </MessagePrimitive.If>
      {line ? null : (
        <MessagePrimitive.If last hasContent={false}>
          <TypingDots label={t('intake.chat.replying')} />
        </MessagePrimitive.If>
      )}
    </MessagePrimitive.Root>
  )
}

function Thread() {
  const { t } = useI18n()
  const { setItemType, composerItemType } = useIntakeActions()
  const { line, hideEmpty, chatFailed, uploadBusy, lastAssistantEmpty } = useContext(ExtractionUiContext)
  const waiting = line ? WAITING_PROCESS.has(line.kind) : false

  return (
    <ThreadPrimitive.Root className="flex h-[min(72vh,720px)] flex-col rounded-lg border bg-card">
      <ThreadPrimitive.Viewport className="flex-1 space-y-3 overflow-y-auto p-4">
        {hideEmpty ? null : (
          <ThreadPrimitive.Empty>
            <p className="text-sm text-muted-foreground">{t('intake.chat.empty')}</p>
          </ThreadPrimitive.Empty>
        )}

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        {line ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" data-process={line.kind}>
            {waiting ? <TypingDots /> : null}
            {processLineText(line, t)}
          </div>
        ) : chatFailed || lastAssistantEmpty ? null : (
          <ThreadPrimitive.If running>
            <div
              className="max-w-[90%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
              data-role="assistant"
            >
              <TypingDots label={t('intake.chat.replying')} />
            </div>
          </ThreadPrimitive.If>
        )}
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className="space-y-2 border-t p-3">
        <div className="flex flex-wrap gap-2 empty:hidden">
          <ComposerPrimitive.Attachments>
            {() => (
              <AttachmentPrimitive.Root className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs">
                <AttachmentPrimitive.Name />
                {uploadBusy ? (
                  <Loader2 className="size-3.5 animate-spin" aria-label={t('intake.chat.uploading')} />
                ) : (
                  <AttachmentPrimitive.Remove
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={t('intake.chat.removeAttachment')}
                  >
                    ×
                  </AttachmentPrimitive.Remove>
                )}
              </AttachmentPrimitive.Root>
            )}
          </ComposerPrimitive.Attachments>
        </div>

        <div className="flex items-end gap-2">
          <ComposerPrimitive.Input
            className="min-h-9 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder={t('intake.chat.placeholder')}
            rows={1}
          />
          <ComposerPrimitive.AddAttachment
            multiple={false}
            disabled={uploadBusy}
            onClick={() => setItemType(composerItemType)}
            className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            {t('intake.chat.attach')}
          </ComposerPrimitive.AddAttachment>
          <ComposerPrimitive.Send
            disabled={uploadBusy}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {t('intake.chat.send')}
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  )
}

export function IntakeChat({
  agentId,
  sessionId,
  organizationId,
  productId,
  title,
  sections,
  missing = [],
  percent,
  aside,
  draftEmpty = true,
}: {
  agentId: AgentId
  sessionId: string
  organizationId: string
  productId?: string
  title: string
  sections: ProgressSection[]
  missing?: string[]
  percent: number
  /** Реквизиты и документы: иначе они уезжают под чат и их не видно. */
  aside?: ReactNode
  draftEmpty?: boolean
}) {
  const { t } = useI18n()
  const journal = useIntakeMessages(sessionId)

  if (journal.isLoading) {
    return <Empty>{t('common.loading')}</Empty>
  }

  return (
    <IntakeChatRuntime
      key={sessionId}
      agentId={agentId}
      sessionId={sessionId}
      organizationId={organizationId}
      productId={productId}
      title={title}
      sections={sections}
      missing={missing}
      percent={percent}
      aside={aside}
      journalRows={journal.data ?? []}
      journalFailed={journal.isError}
      journalLoadError={journal.error}
      draftEmpty={draftEmpty}
    />
  )
}

function IntakeChatRuntime({
  agentId,
  sessionId,
  organizationId,
  productId,
  title,
  sections,
  missing = [],
  percent,
  aside,
  journalRows,
  journalFailed,
  journalLoadError,
  draftEmpty,
}: {
  agentId: AgentId
  sessionId: string
  organizationId: string
  productId?: string
  title: string
  sections: ProgressSection[]
  missing?: string[]
  percent: number
  aside?: ReactNode
  journalRows: IntakeMessage[]
  journalFailed: boolean
  journalLoadError: unknown
  draftEmpty: boolean
}) {
  const api = useApi()
  const queryClient = useQueryClient()
  const identity = useIdentity()
  const { locale, t } = useI18n()
  const { getAccessToken } = useAuth()
  const [uploadError, setUploadError] = useState<unknown>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [chatError, setChatError] = useState<unknown>(null)
  const [journalError, setJournalError] = useState<unknown>(null)
  const [lastAssistantEmpty, setLastAssistantEmpty] = useState(false)
  const cancelRunRef = useRef<(() => void) | undefined>(undefined)
  const clearingRunRef = useRef(false)
  const persisted = useRef(journalPersistedIds(journalRows))
  const seed = useMemo(() => journalToUiMessages(journalRows, locale), [journalRows, locale])
  const seedRepository = useMemo(() => (seed.length > 0 ? uiMessagesToRepository(seed) : undefined), [seed])

  // Тип документа называет карточка `ask-document` перед выбором файла, а нужен
  // он адаптеру в момент отправки — поэтому не состояние, а ссылка.
  const composerItemType = agentId === 'companyIntake' ? 'business-license' : 'other'
  const itemType = useRef(composerItemType)

  const approveCompany = useApproveCompanyProfile(organizationId)
  const approveProduct = useApproveProductData(productId ?? '')
  const company = useOrganization(organizationId)
  const { startProduct, busy: createBusy, failure: createFailure } = usePortfolioCreate()
  const orgItems = useOrganizationItems(organizationId)
  const product = useProduct(productId ?? '')
  const extractionItems = useMemo<ExtractionItem[]>(() => {
    const rows = productId ? (product.data?.documents ?? []) : (orgItems.data ?? [])
    return scopeExtractionItems(rows, productId)
  }, [orgItems.data, product.data?.documents, productId])
  const pendingSeen = useRef(new Set<string>())
  const firedIds = useRef(new Set<string>())
  const extractStarted = useRef(new Set<string>())
  const fillingRef = useRef(false)
  const [filling, setFilling] = useState(false)
  const [fillingFileName, setFillingFileName] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [threadRunning, setThreadRunning] = useState(false)
  const [liveExtractIds, setLiveExtractIds] = useState<string[]>([])
  const [extractFailed, setExtractFailed] = useState<{ itemId: string; fileName: string } | null>(null)
  const [usePlane] = usePlaneEnabled()
  const usePlaneRef = useRef(usePlane)
  usePlaneRef.current = usePlane

  const transport = useMemo(
    () =>
      createIntakeTransport({
        agentId,
        sessionId,
        accountId: identity.accountId,
        locale,
        organizationId,
        productId,
        getToken: getAccessToken,
      }),
    [agentId, sessionId, identity.accountId, locale, organizationId, productId, getAccessToken],
  )

  const attachments = useMemo(
    () =>
      createIntakeAttachmentAdapter({
        api,
        queryClient,
        organizationId,
        productId,
        sessionId,
        itemType: () => itemType.current,
        planeEnabled: () => usePlaneRef.current,
        onError: (error) => setUploadError(() => error),
        onBusy: setUploadBusy,
        uploadedText: ({ name }) => t('intake.chat.uploaded').replace('{name}', name),
      }),
    [api, queryClient, organizationId, productId, sessionId, t],
  )

  const persistJournal = useCallback(
    (messages: ReturnType<typeof normalizeUiMessages>, roles: ReadonlySet<JournalUiRole>) => {
      // User — сразу после Send. Assistant — onFinish и когда нить остановилась (504 не зовёт onFinish).
      const writes = unpersistedAppends(messages, persisted.current, roles, (toolName) =>
        t(journalToolFallbackKey(toolName)),
      )
      if (writes.length > 0 && roles === JOURNAL_USER_ROLES) setChatError(null)
      for (const body of writes) {
        persisted.current.add(body.payload.clientMessageId)
        void api.appendIntakeMessage(sessionId, body).catch((error: unknown) => {
          persisted.current.delete(body.payload.clientMessageId)
          setJournalError(() => error)
        })
      }
    },
    [api, sessionId, t],
  )
  const persistJournalRef = useRef(persistJournal)
  persistJournalRef.current = persistJournal

  const runtime = useChatRuntime({
    transport,
    adapters: { attachments },
    messages: seed,
    ...(seedRepository ? { messageRepository: seedRepository } : {}),
    onFinish: ({ messages }) => {
      persistJournalRef.current(messages, JOURNAL_ASSISTANT_ROLES)
    },
    onError: (error) => {
      setChatError(() => error)
      setThreadRunning(false)
      if (clearingRunRef.current) return
      clearingRunRef.current = true
      try {
        cancelRunRef.current?.()
      } finally {
        clearingRunRef.current = false
      }
    },
  })
  cancelRunRef.current = () => {
    const thread = runtime.thread as { cancel?: () => void; cancelRun?: () => void }
    thread.cancel?.()
    thread.cancelRun?.()
  }

  useEffect(() => {
    const thread = runtime.thread as {
      getState?: () => { isRunning?: boolean; messages?: unknown }
      subscribe?: (listener: () => void) => () => void
    }
    let seenRunning = false
    const sync = () => {
      const state = thread.getState?.()
      const running = Boolean(state?.isRunning)
      setThreadRunning(running)
      setLastAssistantEmpty(lastAssistantIsEmpty(state?.messages))
      persistJournalRef.current(normalizeUiMessages(state?.messages), JOURNAL_USER_ROLES)
      if (!running) {
        persistJournalRef.current(normalizeUiMessages(state?.messages), JOURNAL_ASSISTANT_ROLES)
      }
      if (running) {
        seenRunning = true
        return
      }
      if (!seenRunning || !fillingRef.current) return
      fillingRef.current = false
      setFilling(false)
    }
    sync()
    return thread.subscribe?.(sync)
  }, [runtime])

  useEffect(() => {
    const accountId = identity.accountId
    if (!accountId || !organizationId) return
    if (!shouldKickMastraExtract(usePlane)) return
    for (const item of itemsNeedingExtract(extractionItems, extractStarted.current)) {
      extractStarted.current.add(item.id)
      setExtractFailed((current) => (current && current.itemId !== item.id ? null : current))
      setLiveExtractIds((ids) => (ids.includes(item.id) ? ids : [...ids, item.id]))
      void startIntakeExtract({
        organizationId,
        itemId: item.id,
        accountId,
        getToken: getAccessToken,
      })
        .then(() => {
          setExtractFailed((current) => (current?.itemId === item.id ? null : current))
          void queryClient.invalidateQueries({ queryKey: ['organization-items', organizationId] })
          void queryClient.invalidateQueries({ queryKey: ['organization', organizationId] })
          if (productId) void queryClient.invalidateQueries({ queryKey: ['product', productId] })
        })
        .catch((error: unknown) => {
          // Не вынимаем id: повторный poll иначе снова бьёт /extract, пока item uploaded.
          setExtractFailed({ itemId: item.id, fileName: item.fileName })
          if (!(error instanceof ExtractHttpError)) setUploadError(() => error)
        })
        .finally(() => {
          setLiveExtractIds((ids) => ids.filter((id) => id !== item.id))
        })
    }
  }, [extractionItems, getAccessToken, identity.accountId, organizationId, productId, queryClient, usePlane])

  useEffect(() => {
    const flying = extractionItems.filter((item) => item.status === 'uploaded' || item.status === 'confirmed')
    if (flying.length === 0 && !filling) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [extractionItems, filling])

  useEffect(() => {
    setExtractFailed((current) => {
      if (!current) return null
      const newest = newestByUpdatedAt(extractionItems)
      if (newest && newest.id !== current.itemId) return null
      const failed = extractionItems.find((row) => row.id === current.itemId)
      if (failed && isSettledStatus(failed.status)) return null
      return current
    })
  }, [extractionItems])

  useEffect(() => {
    const fromThread = extractionReadyIdsFromTexts(
      textsFromUnknownMessages((runtime.thread as { getState?: () => { messages?: unknown } }).getState?.().messages),
    )
    const fromJournal = extractionReadyIdsFromTexts(journalRows.map((message) => journalText(message, locale)))
    for (const item of extractionItems) {
      if (fromThread.has(item.id) || fromJournal.has(item.id) || readAutoturnFired(sessionId, item.id)) {
        firedIds.current.add(item.id)
      }
    }

    const settled = nextAutoTurnItem(pendingSeen.current, extractionItems, firedIds.current)
    const giveUp = nextGiveUpItem(extractionItems, nowMs, firedIds.current)
    pendingSeen.current = nextPendingSeen(pendingSeen.current, extractionItems, firedIds.current)
    const candidate = settled ?? giveUp
    if (!shouldAutoTurn(threadRunning, candidate) || !candidate) return
    const status = settled ? settled.status : 'rejected'
    if (status !== 'parsed' && status !== 'rejected') return

    firedIds.current.add(candidate.id)
    writeAutoturnFired(sessionId, candidate.id)
    fillingRef.current = true
    setFillingFileName(candidate.fileName)
    setFilling(true)
    void runtime.thread.append({
      role: 'user',
      content: [
        {
          type: 'text',
          text: formatExtractionReady({
            itemId: candidate.id,
            status,
            organizationId,
          }),
        },
      ],
    })
  }, [extractionItems, journalRows, locale, nowMs, organizationId, runtime, sessionId, threadRunning])

  useEffect(() => {
    if (!filling) return
    const timer = window.setTimeout(() => {
      fillingRef.current = false
      setFilling(false)
    }, EXTRACTION_SLOW_MS)
    return () => window.clearTimeout(timer)
  }, [filling])

  const line = processLine({
    items: extractionItems,
    nowMs,
    filling,
    fillingFileName,
    liveExtractIds: new Set(liveExtractIds),
    extractFailed,
    draftEmpty,
  })
  const hideEmpty = journalRows.length > 0 || extractionItems.length > 0 || Boolean(line)

  const actions = useMemo<IntakeActions>(
    () => ({
      send: (text) => {
        void runtime.thread.append({ role: 'user', content: [{ type: 'text', text }] })
      },
      composerItemType,
      setItemType: (value) => {
        itemType.current = value
      },
      attachDocument: (value) => {
        itemType.current = value
        void pickIntakeFile().then((file) => {
          if (!file) return
          setUploadError(null)
          return runtime.thread.composer.addAttachment(file).catch((error: unknown) => {
            setUploadError(() => error)
          })
        })
      },
      approveDraft: (scope, _entityId) => {
        if (scope === 'company') {
          approveCompany.mutate(undefined, {
            onSuccess: () => {
              void runtime.thread.append({
                role: 'user',
                content: [{ type: 'text', text: formatProfileApproved() }],
              })
            },
          })
        } else if (productId) approveProduct.mutate()
      },
      startProductWindow: () => {
        if (company.data) void startProduct(company.data)
      },
      startProductReady: Boolean(company.data),
      busy: approveCompany.isPending || approveProduct.isPending || uploadBusy || createBusy,
    }),
    [
      runtime,
      approveCompany,
      approveProduct,
      productId,
      composerItemType,
      uploadBusy,
      company.data,
      startProduct,
      createBusy,
    ],
  )

  // Загрузка падает вне нити: сообщение агенту не уходит, вложение остаётся в
  // композере. Показываем причину рядом с чатом, чтобы можно было повторить.
  const failure = uploadError ?? chatError ?? approveCompany.error ?? approveProduct.error ?? journalError ?? createFailure

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <IntakeActionsProvider value={actions}>
        <ExtractionUiContext.Provider
          value={{ line, hideEmpty, chatFailed: Boolean(chatError), uploadBusy, lastAssistantEmpty }}
        >
          <IntakeToolUIs />
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-2">
              {failure ? <p className="text-sm text-destructive">{describeError(failure)}</p> : null}
              {journalFailed ? <p className="text-sm text-destructive">{describeError(journalLoadError)}</p> : null}
              <Thread />
            </div>
            <div className="max-h-[min(72vh,720px)] space-y-4 overflow-y-auto">
              <ProgressPanel sections={sections} missing={missing} percent={percent} title={title} />
              {aside}
            </div>
          </div>
        </ExtractionUiContext.Provider>
      </IntakeActionsProvider>
    </AssistantRuntimeProvider>
  )
}
