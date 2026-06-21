# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# DevStash

A body jewelry site based in Trinidad and Tobago catered toward providing high quality body jewelry and aftercare solutions. 

## Context Files

Read these for full project context:

- @context/project-overview.md: Features, data models, tech stack, UI/UX
- @context/coding-standards.md: Code conventions and patterns
- @context/ai-interaction.md : Workflow and communication guidelines
- @context/current-feature.md: What we are currently working on
- @context/backend-architecture.md: Structure of our backend
- @context/styles.md : Follow this style sheet


## Tech Stack

- Next.js 16 (App Router, Server Components)
- TypeScript (strict)
- Prisma + Neon PostgreSQL
- NextAuth v5 (Email + GitHub)
- Tailwind CSS v4 + shadcn/ui
- Cloudflare R2 (file storage)
- OpenAI gpt-5-nano
- wipay (payments)

## Quick Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run lint       # Run ESLint
npm test           # Run Vitest (actions + utilities only)
npm run test:watch # Run Vitest in watch mode
```

## Payments — WiPay Plugins Payment Request API (v1.0.8)

Full spec: `docs/Payments API Documentation v1.0.8.pdf`. Hosted-page redirect flow: request a Hosted Page URL, redirect the payor, then handle the result on `response_url`.

**Endpoint** — `POST https://tt.wipayfinancial.com/plugins/payments/request` (use the URL matching the account's verified country: `bb`/`gy`/`jm`/`tt`).

**Response mode** — Send `Accept: application/json` for a JSON response (`{ url, message, transaction_id }`); omit it for an automatic web-redirect. `Content-Type: application/x-www-form-urlencoded` for the body.

**Required body params** — `account_number`, `country_code` (BB/JM/TT), `currency` (JMD/TTD/USD), `environment` (`live`/`sandbox`), `fee_structure` (`customer_pay`/`merchant_absorb`/`split`), `method` (`credit_card`), `order_id` (unique, alphanumeric ends; ≤48 chars FAC / ≤16 FGB), `origin`, `response_url`, `total` (2dp, min $1.00 USD equiv).

**Optional** — `avs` (0/1) plus AVS pre-fill fields (`addr1`, `addr2`, `city`, `state`, `country`, `zipcode`, `fname`/`lname`/`name`, `email`, `phone`), `card_type` (`mastercard`/`visa` — omit to show the Select Card Type page), `data`, `version`.

**Transaction response** — Arrives as a GET querystring on `response_url`. Key params: `status` (`success`/`failed`/`error`), `message`, `transaction_id`, `order_id`, `total`, `currency`, `card`, `date`, `hash`.

**Hash verification** — On `status=success`, verify `hash` = `md5(transaction_id + total + apiKey)` (concatenated, no separators; `total` is the original request total). The API Key is the account's secret — never expose it.

**Sandbox** — `environment=sandbox`, `account_number=1234567890`, API Key `123`. Sandbox `transaction_id` is prefixed `SB-`. Reporting/emails disabled in sandbox.

**Fees** — TT: 3.50% + $0.25 USD (free plan) / 3.00% + $0.25 USD (paid). `fee_structure` determines whether the fee is added to `total`.