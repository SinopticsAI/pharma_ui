import { createFileRoute } from '@tanstack/react-router'

// Раздел кейса выбирает дочерний маршрут: каждый из них редиректит в кабинет продукта.
export const Route = createFileRoute('/case/$caseId')({})
