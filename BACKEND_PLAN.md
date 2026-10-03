# Sohoj Pay Voice Assistant — Backend Plan

## Product rule

The AI may understand, explain, and prepare a transaction, but it must never execute one by itself. A deterministic transaction service validates every field, shows the final charge, and requires an explicit confirmation plus the user's normal PIN/biometric authorization.

## Suggested architecture

1. **API gateway / BFF** — Authenticates the mobile or web session, rate-limits requests, and exposes a small frontend-friendly API.
2. **Conversation orchestrator** — Stores the current step (`intent`, `recipient`, `amount`, `review`) and decides which question comes next. The allowed flow is a server-owned state machine, not an open-ended AI decision.
3. **Bangla voice service** — Converts audio to text and response text to audio. Keep a text fallback for unsupported browsers and noisy environments.
4. **Intent and entity service** — Extracts only supported intents and fields, such as `cash_out`, phone number, and amount. It should return confidence scores and ask again when confidence is low.
5. **Contacts / beneficiaries service** — Returns masked recent and favourite recipients. Full numbers should be revealed only when necessary and authorized.
6. **Transaction service** — Validates wallet balance, agent status, limits, fees, and fraud rules. It creates a short-lived transaction draft but cannot complete it without a confirmation token and PIN/biometric authorization.
7. **Help / knowledge service** — Answers product questions from approved FAQ content using retrieval. It must not invent fees, limits, or policy answers.
8. **Audit and analytics** — Records state transitions, confirmations, recognition confidence, failures, and consent without storing raw audio by default.

## Core API contract

### Conversation

- `POST /v1/voice/sessions` — Start a session and return the Bangla welcome prompt.
- `POST /v1/voice/sessions/:id/messages` — Accept text or an uploaded audio reference; return transcript, interpreted intent/entities, next state, display model, and TTS audio URL.
- `POST /v1/voice/sessions/:id/confirmations` — Confirm one proposed field or state transition. Include the proposal ID so an old confirmation cannot be reused.
- `POST /v1/voice/sessions/:id/cancel` — Cancel and invalidate all pending proposals.

Example response:

```json
{
  "sessionId": "vas_123",
  "state": "CONFIRM_RECIPIENT",
  "promptBn": "করিম স্টোর, ০১৭••••৫৬৭৮। নম্বরটি কি ঠিক আছে?",
  "proposal": {
    "id": "prop_456",
    "field": "recipientId",
    "displayValue": "করিম স্টোর · ০১৭••••৫৬৭৮"
  },
  "allowedActions": ["CONFIRM", "CHANGE", "CANCEL"]
}
```

### Transaction draft

- `POST /v1/transaction-drafts` — Create a draft only from a confirmed voice session.
- `GET /v1/transaction-drafts/:id/quote` — Return recipient, amount, exact fee, total, limits, and expiry.
- `POST /v1/transaction-drafts/:id/authorize` — Verify PIN/biometric challenge and create a one-time authorization token.
- `POST /v1/transactions` — Execute with the draft ID, authorization token, and an idempotency key.
- `GET /v1/transactions/:id` — Return final status and receipt.

## Data model

- `voice_sessions`: user, locale, current state, expiry, status.
- `voice_turns`: transcript, redacted entities, confidence, prompt key, timestamps.
- `field_proposals`: proposed value, masked display value, confirmation status, expiry.
- `transaction_drafts`: service type, recipient ID, amount, fee quote, status, expiry.
- `authorizations`: draft ID, challenge result, one-time token hash, expiry.
- `audit_events`: actor, action, state before/after, device/session metadata.
- Existing domain tables: users, wallets, agents/recipients, limits, transactions, ledger entries.

Raw audio should be opt-in and short-lived. Phone numbers and transcripts must be encrypted and redacted in logs.

## State machine

`WELCOME → CONFIRM_INTENT → GET_RECIPIENT → CONFIRM_RECIPIENT → GET_AMOUNT → CONFIRM_AMOUNT → REVIEW → AUTHORIZE → EXECUTE → RECEIPT`

Every arrow after user-provided data requires a new server proposal and explicit confirmation. `CHANGE`, `CANCEL`, timeout, and low-confidence paths return to a safe earlier state. The model can suggest a state; only the orchestrator can change it.

## Technology options

- **Backend:** NestJS/TypeScript or FastAPI/Python; PostgreSQL; Redis for short-lived sessions and idempotency locks.
- **Voice:** a provider with tested `bn-BD` speech-to-text and text-to-speech. Keep it behind an adapter so providers can be changed after real-user testing.
- **AI:** structured-output intent/entity extraction with a strict supported-intent schema. Use deterministic parsing first for phone numbers and amounts.
- **Async work:** a queue for TTS generation, notifications, analytics, and receipt delivery; transaction execution stays synchronous and strongly controlled.

## Delivery phases

### Phase 1 — Hackathon MVP

- Cash-out flow only, text plus browser voice input.
- Dummy contacts and sandbox transactions.
- Server state machine, field confirmations, fee quote, and fake PIN screen.
- Test with multiple Bangla accents and noisy recordings.

### Phase 2 — Pilot

- Real STT/TTS provider, authenticated contacts, real limits and fees.
- Send money, recharge, balance, and approved help answers.
- Fraud checks, observability, accessibility testing, and human support handoff.

### Phase 3 — Production

- Integration with the regulated wallet/ledger, reconciliation, dispute handling, disaster recovery, penetration testing, and compliance review.
- Gradual rollout with feature flags and per-intent kill switches.

## Critical tests

- No transaction executes from speech alone.
- A changed recipient or amount invalidates every earlier quote and authorization.
- Duplicate requests with the same idempotency key create one transaction.
- Low-confidence audio, ambiguous Bangla number words, silence, and background speech always ask for clarification.
- Session expiry, device switching, replayed confirmations, insufficient balance, limit failure, and agent-status changes fail safely.
