import { makeAssistantToolUI } from '@assistant-ui/react'
import { askDocumentFormSchema } from '@demo/contracts'
import type { NodeMapItem, NodeOwner, NodeStatus, RiskLevel } from '@demo/domain'
import { l10n } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { Button } from '@demo/ui/components/button'
import { Input } from '@demo/ui/components/input'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ComponentType } from 'react'
import { useForm } from 'react-hook-form'
import { NodeMapView } from '../NodeMap'
import { useIntakeActions } from './context'
import { coerceToolArgs } from './tool-args'

/**
 * Карточки диалога.
 *
 * Агент не пишет таблицы прозой: он вызывает инструмент, а кабинет рисует
 * компонент с настоящими кнопками. Поэтому карточки объявлены через
 * `makeAssistantToolUI` и привязаны к именам инструментов агента.
 *
 * Имя инструмента в потоке — ключ, под которым он зарегистрирован у агента
 * (`askDocument`), а инструкции агента ссылаются на его `id` (`ask-document`).
 * Регистрируем оба написания, чтобы карточка не пропала из-за переименования на
 * стороне `pharma-agent`.
 */

type L10nArg = { ru: string; en?: string; zh?: string }

function useText() {
  const { text } = useI18n()
  return (value: L10nArg | undefined, fallback = '') => text(l10n(value, fallback)).value
}

function register<TArgs>(names: string[], Render: ComponentType<{ args: TArgs }>): ComponentType[] {
  return names.map((toolName) =>
    makeAssistantToolUI<TArgs, unknown>({
      toolName,
      render: ({ args }) => <Render args={coerceToolArgs(args)} />,
    }),
  )
}

interface AskDocumentArgs {
  itemType: string
  question: L10nArg
  acceptsText?: boolean
  why?: L10nArg
}

function AskDocument({ args }: { args: AskDocumentArgs }) {
  const { t } = useI18n()
  const asText = useText()
  const { attachDocument, send, busy } = useIntakeActions()
  const form = useForm({
    resolver: zodResolver(askDocumentFormSchema),
    defaultValues: { answer: '' },
  })

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <h4 className="text-sm font-semibold">{asText(args.question, args.itemType)}</h4>
      {args.why ? <p className="text-sm text-muted-foreground">{asText(args.why)}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {/* Тип документа берётся из запроса агента: вложение уйдёт именно этим типом. */}
        <Button type="button" disabled={busy} onClick={() => attachDocument(args.itemType)}>
          {t('intake.card.attachFile')}
        </Button>
        {args.acceptsText ? (
          <form
            className="flex min-w-[220px] flex-1 gap-2"
            onSubmit={form.handleSubmit((values) => {
              send(values.answer)
              form.reset()
            })}
          >
            <Input
              {...form.register('answer')}
              placeholder={t('intake.card.answerPlaceholder')}
              aria-label={t('intake.card.answerAria')}
            />
            <Button type="submit" variant="outline" disabled={busy}>
              {t('intake.chat.send')}
            </Button>
          </form>
        ) : null}
      </div>
    </section>
  )
}

interface DraftFieldArg {
  key: string
  label: L10nArg
  value: string
  source: string
  confidence?: number | null
}

interface ShowDraftArgs {
  scope: 'company' | 'product'
  entityId: string
  fields: DraftFieldArg[]
  missing?: string[]
  canApprove: boolean
}

function ShowDraft({ args }: { args: ShowDraftArgs }) {
  const { t } = useI18n()
  const asText = useText()
  const { approveDraft, send, busy } = useIntakeActions()
  const missing = args.missing ?? []

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <h4 className="text-sm font-semibold">{t('intake.card.reviewTitle')}</h4>
      <table className="w-full text-sm">
        <tbody>
          {(args.fields ?? []).map((field) => (
            <tr key={field.key} className="border-b last:border-0">
              <th scope="row" className="py-1 pr-3 text-left font-medium">
                {asText(field.label, field.key)}
              </th>
              <td className="py-1">
                <span className="block">{field.value}</span>
                <span className="text-xs text-muted-foreground">{field.source}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {missing.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('intake.card.missing').replace('{list}', missing.join(', '))}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!args.canApprove || busy}
          onClick={() => approveDraft(args.scope, args.entityId)}
        >
          {t('intake.card.approve')}
        </Button>
        <Button type="button" variant="outline" onClick={() => send(t('intake.card.fixInChatMessage'))}>
          {t('intake.card.fixInChat')}
        </Button>
      </div>
    </section>
  )
}

interface VariantArg {
  id: string
  variantType: 'recommended' | 'alternative' | 'forbidden'
  title: L10nArg
  summary: L10nArg
  pros?: L10nArg[]
  cons?: L10nArg[]
  reason?: L10nArg
  budget?: { currency: string; baskets: { key: string; amount: number }[] }
  cycleMonths?: [number, number]
}

const VARIANT_TAG: Record<VariantArg['variantType'], MessageKey> = {
  recommended: 'intake.card.variant.recommended',
  alternative: 'intake.card.variant.alternative',
  forbidden: 'intake.card.variant.forbidden',
}

function Variant({ variant }: { variant: VariantArg }) {
  const { t, locale } = useI18n()
  const asText = useText()
  const { send, busy } = useIntakeActions()
  const forbidden = variant.variantType === 'forbidden'
  const numberLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-GB' : 'ru-RU'

  return (
    <article
      className={`space-y-2 rounded-md border p-3 ${forbidden ? 'opacity-70' : ''} ${variant.variantType === 'recommended' ? 'border-primary' : ''}`}
    >
      <header className="space-y-1">
        <span className="text-xs text-muted-foreground">{t(VARIANT_TAG[variant.variantType])}</span>
        <h4 className="text-sm font-semibold">{asText(variant.title, variant.id)}</h4>
      </header>
      <p className="text-sm">{asText(variant.summary)}</p>

      {(variant.pros ?? []).length > 0 ? (
        <ul className="list-disc pl-4 text-sm">
          {(variant.pros ?? []).map((item, index) => (
            <li key={index}>{asText(item)}</li>
          ))}
        </ul>
      ) : null}
      {(variant.cons ?? []).length > 0 ? (
        <ul className="list-disc pl-4 text-sm text-muted-foreground">
          {(variant.cons ?? []).map((item, index) => (
            <li key={index}>{asText(item)}</li>
          ))}
        </ul>
      ) : null}

      {variant.reason ? <p className="text-sm">{asText(variant.reason)}</p> : null}

      {variant.budget ? (
        <dl className="grid grid-cols-2 gap-1 text-sm">
          {variant.budget.baskets.map((basket) => (
            <div key={basket.key} className="contents">
              <dt className="text-muted-foreground">{basket.key}</dt>
              <dd className="m-0">
                {variant.budget?.currency === 'RMB' ? '¥ ' : ''}
                {basket.amount.toLocaleString(numberLocale)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {variant.cycleMonths ? (
        <p className="text-sm text-muted-foreground">
          {t('intake.card.cycleMonths')
            .replace('{from}', String(variant.cycleMonths[0]))
            .replace('{to}', String(variant.cycleMonths[1]))}
        </p>
      ) : null}

      {forbidden ? null : (
        <Button
          type="button"
          disabled={busy}
          onClick={() => send(t('intake.card.chooseVariantMessage').replace('{id}', variant.id))}
        >
          {t('intake.card.chooseVariant')}
        </Button>
      )}
    </article>
  )
}

function ShowVariants({ args }: { args: { productId: string; variants: VariantArg[] } }) {
  const { t } = useI18n()

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <h4 className="text-sm font-semibold">{t('intake.card.variantsTitle')}</h4>
      <div className="grid gap-3 md:grid-cols-2">
        {(args.variants ?? []).map((variant) => (
          <Variant key={variant.id} variant={variant} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t('intake.card.variantsLead')} {t('common.estimate')}
      </p>
    </section>
  )
}

interface RiskArgs {
  organizationId: string
  level: RiskLevel
  verdict: 'pending' | 'accepted' | 'rejected'
  reasoning: L10nArg
  checks?: { name: string; result: string; detail?: string }[]
}

const RISK_LEVEL_LABEL: Record<RiskLevel, MessageKey> = {
  low: 'intake.card.risk.low',
  medium: 'intake.card.risk.medium',
  high: 'intake.card.risk.high',
  unknown: 'intake.card.risk.unknown',
}

const VERDICT_LABEL: Record<RiskArgs['verdict'], MessageKey> = {
  pending: 'intake.card.verdict.pending',
  accepted: 'intake.card.verdict.accepted',
  rejected: 'intake.card.verdict.rejected',
}

function ShowRiskReport({ args }: { args: RiskArgs }) {
  const { t } = useI18n()
  const asText = useText()

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <h4 className="text-sm font-semibold">
        {t(RISK_LEVEL_LABEL[args.level])} · {t(VERDICT_LABEL[args.verdict])}
      </h4>
      <p className="text-sm">{asText(args.reasoning)}</p>
      {(args.checks ?? []).length > 0 ? (
        <table className="w-full text-sm">
          <tbody>
            {(args.checks ?? []).map((check) => (
              <tr key={check.name} className="border-b last:border-0">
                <th scope="row" className="py-1 pr-3 text-left font-medium">
                  {check.name}
                </th>
                <td className="py-1">
                  <span className="block">{check.result}</span>
                  {check.detail ? <span className="text-xs text-muted-foreground">{check.detail}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  )
}

interface NodeArg {
  code: string
  title: L10nArg
  status: NodeStatus
  owner: NodeOwner
  dueHint?: L10nArg
  critical?: boolean
}

function ShowNodeMap({ args }: { args: { caseId: string; nodes: NodeArg[] } }) {
  const { t } = useI18n()
  const items: NodeMapItem[] = (args.nodes ?? []).map((node, index) => ({
    code: node.code,
    position: index,
    title: node.title,
    status: node.status,
    owner: node.owner,
    dueHint: node.dueHint,
    blockedBy: [],
    critical: Boolean(node.critical),
  }))

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <h4 className="text-sm font-semibold">{t('map.title')}</h4>
      <NodeMapView items={items} className="h-[280px]" />
    </section>
  )
}

function OfferProductWindow({ args: _args }: { args: { organizationId?: string } }) {
  const { t } = useI18n()
  const { startProductWindow, startProductReady, busy } = useIntakeActions()

  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <h4 className="text-sm font-semibold">{t('intake.card.offerProductTitle')}</h4>
      <p className="text-sm text-muted-foreground">{t('intake.card.offerProductLead')}</p>
      <Button type="button" disabled={busy || !startProductReady} onClick={() => startProductWindow()}>
        {t('intake.card.offerProduct')}
      </Button>
    </section>
  )
}

function EscalateToCounsel({ args }: { args: { productId: string; reason: L10nArg } }) {
  const { t } = useI18n()
  const asText = useText()

  return (
    <section className="rounded-lg border bg-muted/40 p-3 text-sm">
      {t('intake.card.escalated').replace('{reason}', asText(args.reason))}
    </section>
  )
}

const TOOL_UIS: ComponentType[] = [
  ...register<AskDocumentArgs>(['askDocument', 'ask-document'], AskDocument),
  ...register<ShowDraftArgs>(['showDraft', 'show-draft'], ShowDraft),
  ...register<{ productId: string; variants: VariantArg[] }>(['showVariants', 'show-variants'], ShowVariants),
  ...register<RiskArgs>(['showRiskReport', 'show-risk-report'], ShowRiskReport),
  ...register<{ caseId: string; nodes: NodeArg[] }>(['showNodeMap', 'show-node-map'], ShowNodeMap),
  ...register<{ organizationId?: string }>(['offerProductWindow', 'offer-product-window'], OfferProductWindow),
  ...register<{ productId: string; reason: L10nArg }>(['escalateToCounsel', 'escalate-to-counsel'], EscalateToCounsel),
]

/** Монтируется один раз внутри рантайма: регистрирует рендер каждой карточки. */
export function IntakeToolUIs() {
  return (
    <>
      {TOOL_UIS.map((ToolUI, index) => (
        <ToolUI key={index} />
      ))}
    </>
  )
}
