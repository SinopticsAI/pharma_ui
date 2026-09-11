import type { ApiClient } from '@demo/api-client'
import type { OrganizationItem, UploadTicket } from '@demo/domain'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { createIntakeAttachmentAdapter } from './attachments'

const TICKET: UploadTicket = {
  uploadUrl: 'https://storage.yandexcloud.net/pharma-dossier/org-1/doc',
  itemId: 'item-1',
  objectKey: 'org-1/doc',
  expiresIn: 900,
}

function fakeApi(calls: string[], overrides: Partial<Record<'putFile', () => Promise<void>>> = {}) {
  return {
    requestOrgUploadUrl: vi.fn(async () => {
      calls.push('upload-url')
      return TICKET
    }),
    putFile: vi.fn(
      overrides.putFile ??
        (async () => {
          calls.push('put')
        }),
    ),
    confirmOrgUpload: vi.fn(async () => {
      calls.push('confirm')
      return {} as OrganizationItem
    }),
  }
}

function adapterWith(
  api: ReturnType<typeof fakeApi>,
  onError?: (error: unknown) => void,
  onBusy?: (busy: boolean) => void,
) {
  return createIntakeAttachmentAdapter({
    api: api as unknown as ApiClient,
    queryClient: new QueryClient(),
    organizationId: 'org-1',
    productId: 'prod-1',
    sessionId: 'ses-1',
    itemType: () => 'poa-upp',
    planeEnabled: () => false,
    onError,
    onBusy,
  })
}

const file = () => new File(['x'], 'doverennost.pdf', { type: 'application/pdf' })

describe('createIntakeAttachmentAdapter', () => {
  it('грузит документ presigned-контрактом и кладёт itemId в текстовую часть', async () => {
    const calls: string[] = []
    const api = fakeApi(calls)
    const adapter = adapterWith(api)

    const pending = await adapter.add({ file: file() })
    expect(pending.status).toEqual({ type: 'requires-action', reason: 'composer-send' })

    const complete = await adapter.send(pending)

    expect(calls).toEqual(['upload-url', 'put', 'confirm'])
    expect(api.requestOrgUploadUrl).toHaveBeenCalledWith('org-1', {
      itemType: 'poa-upp',
      fileName: 'doverennost.pdf',
      contentType: 'application/pdf',
      title: 'doverennost.pdf',
      productId: 'prod-1',
    })
    // Сессия называет диалог: по ней ядро адресует разбор обратно в ту же нить.
    expect(api.confirmOrgUpload).toHaveBeenCalledWith('org-1', 'item-1', 'ses-1', { usePlane: false })
    expect(complete.status).toEqual({ type: 'complete' })
    expect(complete.content).toEqual([
      {
        type: 'text',
        text: 'Документ «doverennost.pdf» загружен в ядро. organizationId: org-1, itemType: poa-upp, itemId: item-1',
      },
    ])
  })

  it('не подтверждает загрузку, если хранилище отказало, и отдаёт ошибку экрану', async () => {
    const calls: string[] = []
    const api = fakeApi(calls, {
      putFile: async () => {
        throw new Error('storage refused 403')
      },
    })
    const onError = vi.fn()
    const adapter = adapterWith(api, onError)

    const pending = await adapter.add({ file: file() })

    await expect(adapter.send(pending)).rejects.toThrow('storage refused 403')
    expect(calls).toEqual(['upload-url'])
    expect(api.confirmOrgUpload).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('сигналит onBusy до putFile и сбрасывает после успеха', async () => {
    const calls: string[] = []
    const api = fakeApi(calls)
    const adapter = adapterWith(api, undefined, (busy) => calls.push(busy ? 'busy-true' : 'busy-false'))
    const pending = await adapter.add({ file: file() })
    await adapter.send(pending)
    expect(calls).toEqual(['busy-true', 'upload-url', 'put', 'confirm', 'busy-false'])
  })

  it('сбрасывает onBusy, если хранилище отказало', async () => {
    const calls: string[] = []
    const api = fakeApi(calls, {
      putFile: async () => {
        throw new Error('storage refused 403')
      },
    })
    const adapter = adapterWith(api, undefined, (busy) => calls.push(busy ? 'busy-true' : 'busy-false'))
    const pending = await adapter.add({ file: file() })
    await expect(adapter.send(pending)).rejects.toThrow('storage refused 403')
    expect(calls).toEqual(['busy-true', 'upload-url', 'busy-false'])
  })

  it('держит onBusy пока идёт пачка, а не сбрасывает после первого файла', async () => {
    const release: Array<() => void> = []
    const api = {
      requestOrgUploadUrl: vi.fn(async () => TICKET),
      putFile: vi.fn(() => new Promise<void>((resolve) => release.push(resolve))),
      confirmOrgUpload: vi.fn(async () => ({}) as OrganizationItem),
    }
    const busy: boolean[] = []
    const adapter = createIntakeAttachmentAdapter({
      api: api as unknown as ApiClient,
      queryClient: new QueryClient(),
      organizationId: 'org-1',
      productId: 'prod-1',
      sessionId: 'ses-1',
      itemType: () => 'other',
      planeEnabled: () => false,
      onBusy: (value) => busy.push(value),
    })

    const first = await adapter.add({ file: file() })
    const second = await adapter.add({ file: new File(['y'], 'ifu.pdf', { type: 'application/pdf' }) })
    const sendFirst = adapter.send(first)
    const sendSecond = adapter.send(second)
    await vi.waitFor(() => expect(release).toHaveLength(2))
    expect(busy).toEqual([true])

    release[0]()
    await sendFirst
    expect(busy).toEqual([true])

    release[1]()
    await sendSecond
    expect(busy).toEqual([true, false])
  })

  it('передаёт usePlane на confirm, когда галочка включена', async () => {
    const api = fakeApi([])
    const adapter = createIntakeAttachmentAdapter({
      api: api as unknown as ApiClient,
      queryClient: new QueryClient(),
      organizationId: 'org-1',
      sessionId: 'ses-1',
      itemType: () => 'business-license',
      planeEnabled: () => true,
    })
    const pending = await adapter.add({ file: file() })
    await adapter.send(pending)
    expect(api.confirmOrgUpload).toHaveBeenCalledWith('org-1', 'item-1', 'ses-1', { usePlane: true })
  })
})
