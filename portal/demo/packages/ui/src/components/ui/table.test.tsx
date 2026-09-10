import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Table, TableCell, TableHead } from './table'

describe('Table', () => {
  it('разряжает ячейки заголовка и тела', () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead>Тип</TableHead>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TableCell>Файл</TableCell>
          </tr>
        </tbody>
      </table>,
    )

    expect(screen.getByRole('columnheader', { name: 'Тип' }).className).toContain('h-11')
    expect(screen.getByRole('columnheader', { name: 'Тип' }).className).toContain('px-3')
    expect(screen.getByRole('cell', { name: 'Файл' }).className).toContain('px-3')
    expect(screen.getByRole('cell', { name: 'Файл' }).className).toContain('py-3')
  })

  it('задаёт отступы сырым th и td через таблицу', () => {
    const { container } = render(
      <Table>
        <thead>
          <tr>
            <th>Тип</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Файл</td>
          </tr>
        </tbody>
      </Table>,
    )

    const table = container.querySelector('[data-slot="table"]')
    expect(table?.className).toContain('[&_td]:py-3')
    expect(table?.className).toContain('[&_th]:h-11')
  })
})
