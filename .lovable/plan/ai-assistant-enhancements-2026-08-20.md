# AI Assistant Enhancements

Enhance the AI Product & Order Assistant with persistent threads, order tracking, admin controls, and analytics.

## Proposed Changes

### Database Setup
- Create `ai_chat_threads` and `ai_chat_messages` for persistence.
- Create `ai_assistant_configs` for admin-managed FAQs and policies.
- Create `ai_assistant_analytics` for usage tracking.
- Enable RLS and proper grants for all new tables.

### AI Assistant Backend (`src/lib/ai-assistant.server.ts`)
- Implement `trackOrder` logic to check `orders` table by order number or user ID.
- Fetch FAQs and policies from `ai_assistant_configs` instead of hardcoded strings.
- Log interaction events to `ai_assistant_analytics`.
- Support `threadId` for retrieving previous context.

### Frontend Components (`src/components/ai/AIChatbot.tsx`)
- Implement session/thread management:
  - If user is logged in, fetch last active thread from database.
  - If guest, use local storage session.
- Add "Track Order" button and flow in chat.
- Implement proper rendering for order status responses.

### Admin Interface
- Create `src/routes/sys-x7k9-control.ai-assistant.tsx` for managing FAQ/Policies.
- Update `src/routes/sys-x7k9-control.analytics.tsx` or create a new view for AI usage stats (conversion rates, top questions).
- Add AI Assistant link to the Admin sidebar in `src/routes/sys-x7k9-control.tsx`.

## Technical Details
- Using TanStack Start server functions for secure DB access.
- Framer Motion for UI animations in the chatbot.
- Recharts for analytics visualization in the dashboard.
- Supabase RLS policies to ensure user privacy for chat history.
