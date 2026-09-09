import type { Organization } from '@demo/domain'
import { I18nProvider } from '@demo/i18n'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AddProductCard } from './CreateActions'
import { DEMO_ORG_MINGHU } from './demo/ids'

const org = (id: string, status: Organization['status'], name = id): Organization => ({
  id,
  accountId: 'acc',
  kind: 'cn',
  name: { zh: name, en: name, ru: name },
  status,
  draft: {},
  profile: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

function renderCard(organizations: Organization[], onStart = vi.fn()) {
  render(
    <I18nProvider defaultLocale="ru" locked>
      <AddProductCard titleKey="portfolio.addProduct" organizations={organizations} busy={false} onStart={onStart} />
    </I18nProvider>,
  )
  return onStart
}

afterEach(cleanup)

describe('AddProductCard', () => {
  it('блокирует добавление без одобренной компании', () => {
    const onStart = renderCard([org('org-draft', 'draft'), org(DEMO_ORG_MINGHU, 'profile_approved')])
    const button = screen.getByRole('button', { name: /Добавить продукт/ })
    expect(button).toHaveProperty('disabled', true)
    expect(screen.getByText('Доступно после того, как профиль компании одобрен')).toBeTruthy()
    fireEvent.click(button)
    expect(onStart).not.toHaveBeenCalled()
    expect(screen.queryByText('Выберите компанию')).toBeNull()
  })

  it('не создаёт продукт, пока компания не выбрана', () => {
    const minghu = org('org-minghu', 'profile_approved', 'Minghu')
    const ruikang = org('org-ruikang', 'profile_approved', 'Ruikang')
    const onStart = renderCard([minghu, ruikang])

    fireEvent.click(screen.getByRole('button', { name: /Добавить продукт/ }))
    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByText('Выберите компанию')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Minghu' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ruikang' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ruikang' }))
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith(ruikang)
  })
})
