import { I18nProvider } from '@demo/i18n'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { demoNodes } from './demo/catalog'
import { NodeMapView } from './NodeMap'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

describe('NodeMapView', () => {
  it('рисует карточки демо-карты со статусом, сроком и ручками связей', () => {
    render(
      <I18nProvider defaultLocale="ru" locked>
        <NodeMapView items={demoNodes()} />
      </I18nProvider>,
    )

    const critical = document.querySelector('[data-testid="rf__node-M5"]')
    expect(critical?.textContent).toContain('M5')
    expect(critical?.textContent).toContain('Испытания (ГОСТ)')
    expect(critical?.textContent).toContain('в работе')
    expect(critical?.textContent).toContain('подрядчик')
    expect(critical?.textContent).toContain('до 18.09')
    expect(document.querySelector('[data-id="M5"] [data-handlepos="left"]')).toBeTruthy()
    expect(document.querySelector('[data-id="M5"] [data-handlepos="right"]')).toBeTruthy()
    expect(document.querySelector('[data-testid="rf__node-M1"]')?.getAttribute('style')).toContain('280px')
  })
})
