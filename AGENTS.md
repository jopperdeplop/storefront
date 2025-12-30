# Agentic Onboarding: Saleor Storefront

> **Goal**: The customer-facing storefront for the Saleor e-commerce platform.

## 1. Project Identity

- **Type**: Frontend Application (Headless).
- **Stack**:
  - **Framework**: Next.js 15
  - **Data Fetching**: GraphQL (Urql) talking to Saleor API.
  - **Styling**: Tailwind CSS
  - **State**: Zustand
- **Deployment**: Vercel.

## 2. Agent Protocol

> **Methodology**: Follow this cycle for every task.

1. **Explore**: Read `AGENTS.md` and `agent-docs/rules/design-system.md`.
2. **Verify**: Run `pnpm lint` (Tailwind Check) after every UI change.

## 3. Critical Rules

> [!IMPORTANT]
> This is a **Frontend-Only** application.

- **No Direct Database**: This app DOES NOT connect directly to a database. It fetches all data via the Saleor GraphQL API.
- **User Note**: _User has mentioned "Postgres (Neon)" in context of this app._ This likely refers to the backing Saleor instance's database, not something this Next.js app connects to directly. **Do not try to add pg/drizzle/prisma to this repo.**
- **Code Generation**: Run `pnpm generate` to update GraphQL types from the schema.
- **Automated Guardrails**:
  - **Linting**: `eslint-plugin-tailwindcss` is active. Order your classes!
  - **Type Safety**: Gaps in `graphql-codegen` will cause build failures.
- **Documentation Maintenance**: If you add new tech or struggle with a task, YOU MUST fix the docs (`AGENTS.md`) for the next agent. Keep it living.

## 6. Ecosystem Links

- **CMS**: `c:/Users/jopbr/Documents/GitHub/payload/AGENTS.md` (Payload CMS definitions).
- **Apps**: `c:/Users/jopbr/Documents/GitHub/apps/AGENTS.md` (Backend apps like Stripe/Search).

## 7. Deep Dive Documentation

- **Design System**: `agent-docs/rules/design-system.md` (Colors, Fonts).
- **Workflows**:
  - [Add Feature](agent-docs/workflows/add-feature.md) (GraphQL + UI steps).

## 3. Map of the Territory

- `src/app`: Next.js App Router (or Pages, check usage).
- `src/graphql`: GraphQL documents and generated types.
- `.graphqlrc.ts`: Code generation config.

## 4. Golden Paths

### Development

```bash
pnpm dev
```

### Code Gen (Important!)

```bash
# Run this if you change GraphQL queries
pnpm generate
```

### Testing

```bash
pnpm test
```
