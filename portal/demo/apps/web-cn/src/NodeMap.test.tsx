import { I18nProvider } from '@demo/i18n'
import { render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { demoNodes } from './demo/catalog'
import { NodeMapView } from './NodeMap'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

const hidden = { hidden: true }

describe('NodeMapView', () => {
  it('рисует карточки демо-карты со статусом, сроком и ручками связей', () => {
    render(
      <I18nProvider defaultLocale="ru" locked>
        <NodeMapView items={demoNodes()} />
      </I18nProvider>,
    )

    const critical = within(document.querySelector('[data-testid="rf__node-M5"]') as HTMLElement)
    expect(critical.getByText(/M5/, hidden)).toBeTruthy()
    expect(critical.getByText('Испытания (ГОСТ)', hidden)).toBeTruthy()
    expect(critical.getByText('в работе', hidden)).toBeTruthy()
    expect(critical.getByText('подрядчик', hidden)).toBeTruthy()
    expect(critical.getByText('до 18.09', hidden)).toBeTruthy()
    expect(document.querySelector('[data-id="M5"] [data-handlepos="left"]')).toBeTruthy()
    expect(document.querySelector('[data-id="M5"] [data-handlepos="right"]')).toBeTruthy()
    expect(document.querySelector('[data-testid="rf__node-M1"]')?.getAttribute('style')).toContain('280px')
  })
})
