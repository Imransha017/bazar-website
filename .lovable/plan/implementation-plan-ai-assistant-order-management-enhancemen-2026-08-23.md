# Implementation Plan - AI Assistant Order & Management Enhancement

The user wants to enhance the AI Assistant to allow it to submit orders on behalf of customers, provide direct product links for manual ordering, and add a dedicated feature in the admin panel to view all AI-submitted orders.

## User Requirements
- **AI Ordering**: The AI should be able to collect customer/product details and submit orders if the customer cannot do it themselves.
- **Product Links**: The AI should provide single product page links for manual ordering.
- **Admin Feature**: Add a dedicated section or filter in the admin panel to view all orders placed by the AI.
- **Content Persistence**: Update the text content in the AI Assistant management page (as specified in the prompt).

## Technical Details
- **Database Schema**: The `orders` table already has `source` (set to 'ai_assistant') and `ai_thread_id` columns.
- **AI Logic**: `src/lib/ai-order.server.ts` already contains most of the logic for conversational ordering (collecting name, phone, address, etc.).
- **Admin UI**: `src/routes/sys-x7k9-control.orders.tsx` already has a "🤖 AI" badge and an "AI Orders" filter. I will verify if a dedicated "AI Orders" section is needed or if the existing filter is sufficient based on the user's request for a "separate feature".
- **Text Update**: I will update the branding/intro text in the AI management component.

## Proposed Changes

### 1. Update AI Management Branding/Text
- Modify `src/components/ai/AIAdmin.tsx` to reflect the new descriptive text provided by the user in the "Appearance" or "Intro" section.

### 2. Verify and Enhance AI Ordering Flow
- Ensure `src/lib/ai-order.server.ts` correctly handles the conversational flow and saves the order with `source = 'ai_assistant'`.
- Verify the product link generation in `src/lib/ai-assistant.server.ts` to ensure customers get valid single product page links.

### 3. Add Dedicated "AI Orders" Tab/Page in Admin
- Although a filter exists, I will make the "AI Orders" more prominent in the admin navigation or as a dedicated tab in the orders page to satisfy the "separate feature" requirement.

### 4. Text Replacements
- Apply the specific Bengali text provided by the user to the relevant element in the AI Assistant Management page.

