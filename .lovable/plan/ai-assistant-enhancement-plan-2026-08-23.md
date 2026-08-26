# AI Assistant Enhancement Plan

The goal is to improve the "Bazar AI Assistant" so that all quick-action buttons (Product Search, Product Info, Delivery, etc.) are handled by the AI itself, maintaining a natural conversation flow while strictly adhering to the provided product database and memory files.

## Proposed Changes

### 1. Enhanced AI System Prompt
- Update `src/lib/ai-assistant.server.ts` to include specific instructions for handling the quick-action button labels.
- Instruct the AI to act as a proactive communicator that guides users through product discovery, category selection, and problem-solving.
- Reiterate strict grounding: NO general knowledge, only database and memory files.

### 2. Conversational Product Search
- Update the AI logic to handle "Product Search" by asking clarifying questions (e.g., categories, price range) rather than just performing a simple keyword match.
- Ensure the AI presents categories and asks the user to select one if the search is broad.

### 3. Integrated Button Handling
- Ensure that when a user clicks a button like "🔎 প্রোডাক্ট খুঁজুন", the AI receives this as input and responds by initiating a conversational search process (e.g., "অবশ্যই! আপনি কি ধরণের প্রোডাক্ট খুঁজছেন? আমাদের কাছে ইলেকট্রনিক্স, ফ্যাশন এবং গ্রোসারি আইটেম আছে।").

### 4. Logic Refinement
- Refine `handleAssistantQuery` to better detect when a user is interacting with these specific "action" intents and route them to conversational AI instead of deterministic fallbacks where possible.

## Technical Details
- **File:** `src/lib/ai-assistant.server.ts`
  - Update `systemPrompt` constant.
  - Refine keyword extraction and product retrieval to support multi-turn search.
- **File:** `src/components/ai/AIChatbot.tsx`
  - (Optional) Adjust frontend actions if needed to ensure button labels are passed to the AI as contextually relevant triggers.

## User Impact
- The AI will feel more "intelligent" and conversational.
- Customers will be guided through the shopping process step-by-step.
- The assistant remains safe by only using verified shop data.
