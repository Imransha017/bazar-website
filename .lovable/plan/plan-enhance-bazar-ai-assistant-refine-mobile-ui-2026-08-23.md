# Plan: Enhance Bazar AI Assistant & Refine Mobile UI

Improve AI accuracy for product, order, and delivery queries, reduce the assistant icon size on mobile, and implement a draggable floating widget for better accessibility.

## User Review Required

> [!IMPORTANT]
> - The AI Assistant will now be strictly grounded in "Memory Files" and "Catalog Data" to ensure accuracy. If information isn't found in these sources, it will professionally redirect to human support (WhatsApp).
> - Draggable functionality will use a lightweight Framer Motion implementation to ensure it works across all screen sizes.

## Proposed Changes

### AI Accuracy & Knowledge
- Update the system prompt in `src/lib/ai-assistant.server.ts` to prioritize delivery and policy information.
- Enhance the keyword extraction logic to better handle Bengali e-commerce terms (e.g., "delivery charge", "how to order").
- Refine the fallback mechanism to provide more helpful instructions when data is missing.

### Mobile UI Refinement
- Update `src/components/ai/AIChatbot.tsx` to reduce the floating button size on mobile screens (viewport width < 768px).
- Implement `framer-motion`'s `drag` property on the floating button container.
- Constrain the drag area within the viewport boundaries to prevent the icon from being moved off-screen.

### Functional Verification
- Verify the assistant correctly answers questions about delivery charges and order status based on database policies.
- Test the draggable behavior on both desktop (mouse) and mobile (touch) simulations.

## Technical Details

### `src/components/ai/AIChatbot.tsx`
- Wrap the main button container in a `motion.div` with `drag`, `dragConstraints`, and `dragElastic`.
- Use Tailwind responsive classes (`size-12 md:size-16`) to shrink the icon on mobile.
- Adjust the `fixed` positioning and `z-index` to ensure the draggable state persists correctly.

### `src/lib/ai-assistant.server.ts`
- Inject specific context about delivery charges (e.g., "৳৬০ ডেলিভারি চার্জ") into the prompt if not already explicitly in memory files.
- Refine the `systemPrompt` to explicitly guide the AI on "Delivery Procedures" and "Payment Methods".
