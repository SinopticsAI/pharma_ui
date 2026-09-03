import type { ComponentType } from 'react'
import { makeAssistantToolUI } from '@assistant-ui/react'
import type { NodeOwner, NodeStatus, RiskLevel } from '@demo/domain'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useIntakeActions } from './context'
import styles from './intake.module.css'

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
      render: ({ args }) => <Render args={args} />,
    }),
  )
}

// -------------------------------------------------------------- ask-document --

interface AskDocumentArgs {
  itemType: string
  question: L10nArg
  acceptsText?: boolean
  why?: L10nArg
}

function AskDocument({ args }: { args: AskDocumentArgs }) {
  const asText = useText()
  const { attach, send, busy } = useIntakeActions()

  return (
    <section className={styles.card}>
      <h4>{asText(args.question, args.itemType)}</h4>
      {args.why ? <p className={styles.cardWhy}>{asText(args.why)}</p> : null}
      <div className={styles.cardActions}>
        <button type="button" className={styles.primary} disabled={busy} onClick={() => attach(args.itemType)}>
          Приложить файл
        </button>
        {args.acceptsText ? (
          <form
            className={styles.inlineAnswer}
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const input = new FormData(form).get('answer')
              if (typeof input === 'string' && input.trim()) send(input.trim())
              form.reset()
            }}
          >
            <input name="answer" placeholder="…или ответьте одной строкой" aria-label="Ответ текстом" />
            <button type="submit" className={styles.secondary}>
              Отправить
            </button>
          </form>
        ) : null}
      </div>
    </section>
  )
}

// ----------------------------------------------------------------- show-draft --

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
  const asText = useText()
  const { approveDraft, send, busy } = useIntakeActions()
  const missing = args.missing ?? []

  return (
    <section className={styles.card}>
      <h4>Проверьте распознанное</h4>
      <table className={styles.draftTable}>
        <tbody>
          {(args.fields ?? []).map((field) => (
            <tr key={field.key}>
              <th scope="row">{asText(field.label, field.key)}</th>
              <td>
                <span className={styles.draftValue}>{field.value}</span>
                {/* Поле без источника проверить нельзя, поэтому источник обязателен. */}
                <span className={styles.draftSource}>{field.source}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {missing.length > 0 ? <p className={styles.cardWhy}>Не хватает: {missing.join(', ')}</p> : null}
      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.primary}
          disabled={!args.canApprove || busy}
          onClick={() => approveDraft(args.scope, args.entityId)}
        >
          Одобрить данные
        </button>
        <button type="button" className={styles.secondary} onClick={() => send('Нужно исправить поле')}>
          Исправить в диалоге
        </button>
      </div>
    </section>
  )
}

// -------------------------------------------------------------- show-variants --

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

const VARIANT_TAG: Record<VariantArg['variantType'], string> = {
  recommended: 'рекомендуем',
  alternative: 'альтернатива',
  forbidden: 'так делать нельзя',
}

function Variant({ variant }: { variant: VariantArg }) {
  const asText = useText()
  const { send, busy } = useIntakeActions()
  const forbidden = variant.variantType === 'forbidden'
  const className = [
    styles.variant,
    variant.variantType === 'recommended' ? styles.variantRecommended : '',
    forbidden ? styles.variantForbidden : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={className}>
      <header>
        <span className={styles.variantTag}>{VARIANT_TAG[variant.variantType]}</span>
        <h4>{asText(variant.title, variant.id)}</h4>
      </header>
      <p>{asText(variant.summary)}</p>

      {(variant.pros ?? []).length > 0 ? (
        <ul className={styles.pros}>
          {(variant.pros ?? []).map((item, index) => (
            <li key={index}>{asText(item)}</li>
          ))}
        </ul>
      ) : null}
      {(variant.cons ?? []).length > 0 ? (
        <ul className={styles.cons}>
          {(variant.cons ?? []).map((item, index) => (
            <li key={index}>{asText(item)}</li>
          ))}
        </ul>
      ) : null}

      {variant.reason ? <p className={styles.variantReason}>{asText(variant.reason)}</p> : null}

      {variant.budget ? (
        <dl className={styles.budget}>
          {variant.budget.baskets.map((basket) => (
            <div key={basket.key}>
              <dt>{basket.key}</dt>
              <dd>
                {variant.budget?.currency === 'RMB' ? '¥ ' : ''}
                {basket.amount.toLocaleString('ru-RU')}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {variant.cycleMonths ? (
        <p className={styles.variantCycle}>
          {variant.cycleMonths[0]}–{variant.cycleMonths[1]} мес. до продаж
        </p>
      ) : null}

      {/* Запрещённый вариант существует, чтобы его объяснить, а не выбрать. */}
      {forbidden ? null : (
        <button
          type="button"
          className={styles.primary}
          disabled={busy}
          onClick={() => send(`Выбираю вариант ${variant.id}`)}
        >
          Выбрать этот вариант
        </button>
      )}
    </article>
  )
}

function ShowVariants({ args }: { args: { productId: string; variants: VariantArg[] } }) {
  const { t } = useI18n()

  return (
    <section className={styles.card}>
      <h4>Варианты классификации</h4>
      <div className={styles.variants}>
        {(args.variants ?? []).map((variant) => (
          <Variant key={variant.id} variant={variant} />
        ))}
      </div>
      {/* Вариант выбирает клиент, фиксирует специалист: карта строится после обоих. */}
      <p className={styles.disclaimer}>
        Классификацию подтверждает специалист, затем клиент. {t('common.estimate')}
      </p>
    </section>
  )
}

// ------------------------------------------------------------ show-risk-report --

interface RiskArgs {
  organizationId: string
  level: RiskLevel
  verdict: 'pending' | 'accepted' | 'rejected'
  reasoning: L10nArg
  checks?: { name: string; result: string; detail?: string }[]
}

const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'риск низкий',
  medium: 'риск средний',
  high: 'риск высокий',
  unknown: 'риск не определён',
}

const VERDICT_LABEL: Record<RiskArgs['verdict'], string> = {
  pending: 'проверка не завершена',
  accepted: 'берём в работу',
  rejected: 'в работу не берём',
}

function ShowRiskReport({ args }: { args: RiskArgs }) {
  const asText = useText()

  return (
    <section className={styles.card}>
      <h4>
        {RISK_LEVEL_LABEL[args.level]} · {VERDICT_LABEL[args.verdict]}
      </h4>
      {/* Уровень без обоснования недопустим, а исходные материалы не показываются. */}
      <p>{asText(args.reasoning)}</p>
      {(args.checks ?? []).length > 0 ? (
        <table className={styles.draftTable}>
          <tbody>
            {(args.checks ?? []).map((check) => (
              <tr key={check.name}>
                <th scope="row">{check.name}</th>
                <td>
                  <span className={styles.draftValue}>{check.result}</span>
                  {check.detail ? <span className={styles.draftSource}>{check.detail}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  )
}

// -------------------------------------------------------------- show-node-map --

interface NodeArg {
  code: string
  title: L10nArg
  status: NodeStatus
  owner: NodeOwner
  dueHint?: L10nArg
  critical?: boolean
}

function ShowNodeMap({ args }: { args: { caseId: string; nodes: NodeArg[] } }) {
  const asText = useText()
  const { t } = useI18n()

  return (
    <section className={styles.card}>
      <h4>{t('map.title')}</h4>
      <table className={styles.draftTable}>
        <tbody>
          {(args.nodes ?? []).map((node) => (
            <tr key={node.code}>
              <th scope="row">
                {node.code}
                {node.critical ? ` · ${t('map.critical')}` : ''}
              </th>
              <td>
                <span className={styles.draftValue}>{asText(node.title)}</span>
                <span className={styles.draftSource}>
                  {t(`nodeStatus.${node.status}`)} · {t(`nodeOwner.${node.owner}`)}
                  {node.dueHint ? ` · ${asText(node.dueHint)}` : ''}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// --------------------------------------------------------- escalate-to-counsel --

function EscalateToCounsel({ args }: { args: { productId: string; reason: L10nArg } }) {
  const asText = useText()

  return (
    <section className={`${styles.card} ${styles.cardQuiet}`}>
      {/* Пограничная квалификация уходит юристу, а не закрывается автоответом. */}
      <span>Вопрос передан юристу: {asText(args.reason)}</span>
    </section>
  )
}

const TOOL_UIS: ComponentType[] = [
  ...register<AskDocumentArgs>(['askDocument', 'ask-document'], AskDocument),
  ...register<ShowDraftArgs>(['showDraft', 'show-draft'], ShowDraft),
  ...register<{ productId: string; variants: VariantArg[] }>(['showVariants', 'show-variants'], ShowVariants),
  ...register<RiskArgs>(['showRiskReport', 'show-risk-report'], ShowRiskReport),
  ...register<{ caseId: string; nodes: NodeArg[] }>(['showNodeMap', 'show-node-map'], ShowNodeMap),
  ...register<{ productId: string; reason: L10nArg }>(
    ['escalateToCounsel', 'escalate-to-counsel'],
    EscalateToCounsel,
  ),
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
