import { createFileRoute } from '@tanstack/react-router'
import { AIAssistantAdmin } from '@/components/ai/AIAdmin'

export const Route = createFileRoute('/sys-x7k9-control/ai-assistant')({
  component: AIAssistantAdmin,
})
