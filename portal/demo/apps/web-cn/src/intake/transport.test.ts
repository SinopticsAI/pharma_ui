import { describe, expect, it } from 'vitest'
import { messagesWithoutScanBytes } from './transport'

describe('messagesWithoutScanBytes', () => {
  it('keeps the upload receipt and drops the data-URI of the scan', () => {
    const [out] = messagesWithoutScanBytes([
      {
        role: 'user',
        parts: [
          { type: 'text', text: 'Файл «11-nmpa-certificate.jpg» принят' },
          {
            type: 'file',
            filename: '11-nmpa-certificate.jpg',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,aaaa',
          },
        ],
        attachments: [{ name: '11-nmpa-certificate.jpg' }],
      },
    ]) as Array<Record<string, unknown>>

    expect(out.parts).toEqual([{ type: 'text', text: 'Файл «11-nmpa-certificate.jpg» принят' }])
    expect(out.attachments).toBeUndefined()
    expect(JSON.stringify(out)).not.toMatch(/data:image/)
  })
})
