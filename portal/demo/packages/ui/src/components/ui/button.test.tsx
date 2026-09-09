import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('рендерит подпись', () => {
    render(<Button>Открыть</Button>)
    expect(screen.getByRole('button', { name: 'Открыть' })).toBeTruthy()
  })
})
