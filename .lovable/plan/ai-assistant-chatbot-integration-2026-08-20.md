# AI Assistant Chatbot Integration

I will add a powerful, production-grade AI Product & Order Assistant Chatbot to your homepage. This assistant will be integrated directly into your existing shopping system while strictly following your current design language.

## Proposed Changes

### AI Chatbot Engine
- **Search & Recommendation**: Connect the AI to your product database via secure server functions to provide real-time price, stock, and specification data.
- **Natural Language Understanding**: Support for both Bengali and English queries (e.g., "১৫০০ টাকার মধ্যে হেডফোন দেখান").
- **Shopping Integration**: Allow users to add products to the cart and confirm orders directly through the chat interface.

### UI & UX (Design Preservation)
- **Floating Widget**: A modern, mobile-responsive chat bubble on the homepage.
- **Bilingual Interface**: Initial welcome message and quick-action buttons in Bengali.
- **Minimalist Design**: Uses your existing Tailwind tokens and shadcn components (Buttons, Cards, ScrollArea) to ensure it feels like a native part of the site.

### Security & Integrity
- **Server-Side Validation**: All price and order logic is handled by secure backend functions; the AI never directly modifies the database.
- **Trusted Data Only**: The assistant will only use verified information from your database, preventing "AI hallucinations."

## Technical Details

- **Frontend Component**: `src/components/ai/AIChatbot.tsx` (using `framer-motion` for smooth animations).
- **Backend Logic**: `src/lib/ai-assistant.functions.ts` (TanStack Start server functions) and `src/lib/ai-assistant.server.ts` (PostgreSQL query logic).
- **Global Integration**: Mounted in `src/routes/__root.tsx` to ensure availability while maintaining a lightweight footprint.
