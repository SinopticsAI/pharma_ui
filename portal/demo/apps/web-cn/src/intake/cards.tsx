import type { CardPayload, DraftField, MockVariant } from '@demo/mock'
import styles from './intake.module.css'

/**
 * Карточки диалога.
 *
 * Содержание вынесено сюда, а не в текст модели: драфт надо проверять по
 * полям и источникам, а варианты — сравнивать рядом. Свободный абзац для
 * этого не годится.
 */

function DraftTable({ fields }: { fields: DraftField[] }) {
  return (
    <table className={styles.draftTable}>
      <tbody>
        {fields.map((field) => (
          <tr key={field.key}>
            <th scope="row">{field.label.ru}</th>
            <td>
              <span className={styles.draftValue}>{field.value}</span>
              {/* Поле без источника проверить нельзя, поэтому источник обязателен. */}
              <span className={styles.draftSource}>{field.source}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function VariantCard({ variant, onSelect }: { variant: MockVariant; onSelect?: (id: string) => void }) {
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
        <span className={styles.variantTag}>
          {variant.variantType === 'recommended'
            ? 'рекомендуем'
            : forbidden
              ? 'так делать нельзя'
              : 'альтернатива'}
        </span>
        <h4>{variant.title}</h4>
      </header>
      <p>{variant.summary}</p>

      {variant.pros.length > 0 ? (
        <ul className={styles.pros}>
          {variant.pros.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {variant.cons.length > 0 ? (
        <ul className={styles.cons}>
          {variant.cons.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {variant.reason ? <p className={styles.variantReason}>{variant.reason}</p> : null}

      {variant.budget ? (
        <dl className={styles.budget}>
          {variant.budget.baskets.map((basket) => (
            <div key={basket.key}>
              <dt>{basket.key}</dt>
              <dd>
                ¥ {basket.amount.toLocaleString('ru-RU')}
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
      {onSelect && !forbidden ? (
        <button type="button" className={styles.primary} onClick={() => onSelect(variant.id)}>
          Выбрать этот вариант
        </button>
      ) : null}
    </article>
  )
}

export function IntakeCard({
  card,
  onApprove,
  onSelectVariant,
  onAttach,
  onAnswer,
}: {
  card: CardPayload
  onApprove: () => void
  onSelectVariant: (variantId: string) => void
  onAttach: (itemType: string) => void
  onAnswer: (text: string) => void
}) {
  switch (card.kind) {
    case 'ask':
      return (
        <section className={styles.card}>
          <h4>{card.question}</h4>
          {card.why ? <p className={styles.cardWhy}>{card.why}</p> : null}
          <div className={styles.cardActions}>
            <button type="button" className={styles.primary} onClick={() => onAttach(card.itemType)}>
              Приложить файл
            </button>
            {/* Точечный запрос: строка текста закрывает пробел не хуже файла. */}
            {card.acceptsText ? (
              <form
                className={styles.inlineAnswer}
                onSubmit={(event) => {
                  event.preventDefault()
                  const input = new FormData(event.currentTarget).get('answer')
                  if (typeof input === 'string' && input.trim()) onAnswer(input.trim())
                  event.currentTarget.reset()
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

    case 'processing':
      return (
        <section className={`${styles.card} ${styles.cardQuiet}`}>
          {/* Ответ приходит целиком, поэтому ожидание надо показать явно. */}
          <span className={styles.spinner} aria-hidden="true" />
          <span>Агент читает документ: {card.what}</span>
        </section>
      )

    case 'draft':
      return (
        <section className={styles.card}>
          <h4>Проверьте распознанное</h4>
          <DraftTable fields={card.fields} />
          {card.missing.length > 0 ? (
            <p className={styles.cardWhy}>Не хватает: {card.missing.join(', ')}</p>
          ) : null}
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.primary}
              disabled={!card.canApprove}
              onClick={onApprove}
            >
              Одобрить данные
            </button>
            <button type="button" className={styles.secondary} onClick={() => onAnswer('Нужно исправить поле')}>
              Исправить в диалоге
            </button>
          </div>
        </section>
      )

    case 'approved':
      return (
        <section className={`${styles.card} ${styles.cardOk}`}>
          <strong>{card.text}</strong>
        </section>
      )

    case 'variants':
      return (
        <section className={styles.card}>
          <h4>Варианты классификации</h4>
          <div className={styles.variants}>
            {card.variants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} onSelect={onSelectVariant} />
            ))}
          </div>
          <p className={styles.disclaimer}>{card.disclaimer}</p>
        </section>
      )

    case 'case':
      return (
        <section className={`${styles.card} ${styles.cardOk}`}>
          <strong>Кейс {card.caseId}</strong>
          <p>{card.text}</p>
        </section>
      )

    default:
      return null
  }
}
