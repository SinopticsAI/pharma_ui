import { createFileRoute } from '@tanstack/react-router'
import { RoadmapPage } from '../../../pages/Roadmap'

export const Route = createFileRoute('/case/$caseId/roadmap')({
  component: RoadmapPage,
})
