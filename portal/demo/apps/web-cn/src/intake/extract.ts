import { agentApiBase } from './transport'

/**
 * Запуск разбора скана вне хода чата.
 *
 * Байты остаются в бакете. Кабинет только говорит Mastra, какой item читать.
 * Заголовки те же, что у /chat: Bearer и X-Pharma-Account. api-client сюда не
 * ходит — у него нет аккаунта в JWT, а X-API-Key браузеру нельзя.
 */

export async function startIntakeExtract(options: {
  organizationId: string
  itemId: string
  accountId: string
  getToken: () => Promise<string | null>
}): Promise<void> {
  const token = await options.getToken()
  const response = await fetch(`${agentApiBase()}/extract`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Pharma-Account': options.accountId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      organizationId: options.organizationId,
      itemId: options.itemId,
    }),
  })
  if (response.ok) return
  const raw = await response.text()
  throw new Error(raw.slice(0, 240) || `extract ${response.status}`)
}
