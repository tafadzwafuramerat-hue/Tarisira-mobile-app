# Tarisira Assistant

The in-app assistant currently uses local, rule-based matching. It does not call OpenAI or another AI service, so chatting does not require API credits or send chat messages to an AI provider.

## Supported tasks

- Greet users and show available help.
- Show current stock quantities and low-stock count.
- Summarize sales and list outstanding debtors.
- Add stock for an existing product.
- Record a debt for a customer.
- Record a payment for an existing debtor.

The assistant asks for confirmation before changing stock or debt records. Reply `yes`/`hongu` to confirm or `no`/`kwete` to cancel.

## Example commands

- `hello` or `help`
- `show stock`
- `add Bread 5`
- `add debt Tawanda $20`
- `show debtors`
- `pay Tawanda $10`

Commands must match the app's supported patterns and product/debtor names. For unsupported requests, use the relevant screen in the app.

The Supabase `ai-chat` function may still exist in the project, but the chat screen does not use it.
