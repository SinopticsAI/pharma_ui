import { I18nProvider } from '@demo/i18n'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressPanel } from './ProgressPanel'

describe('ProgressPanel', () => {
  it('renders the company checklist in mock order with pills and why-block', () => {
    render(
      <I18nProvider defaultLocale="ru" locked>
        <ProgressPanel
          title="Прогресс профиля"
          percent={12}
          missing={[]}
          sections={[
            { key: 'banking', filled: 0, total: 1 },
            { key: 'identity', filled: 1, total: 2 },
            { key: 'documents', filled: 0, total: 2 },
            { key: 'authority', filled: 0, total: 2 },
            { key: 'risk', filled: 0, total: 1 },
          ]}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Прогресс профиля')).toBeTruthy()
    expect(screen.getByText('агент отмечает сам')).toBeTruthy()
    expect(screen.getByText('Профиль: 12%')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('12')

    const labels = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(labels).toEqual([
      'Реквизиты и реестр1 из 2',
      'Документы компанииосталось',
      'Полномочия и подписиосталось',
      'Банк и счетаосталось',
      'Проверка рисков (Тяньянча)запустится автоматически',
    ])

    expect(screen.getByText('Зачем это нужно')).toBeTruthy()
    expect(screen.queryByText('Профиль компании')).toBeNull()
  })
})
