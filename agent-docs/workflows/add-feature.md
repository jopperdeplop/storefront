# Workflow: Add a Storefront Feature

## 1. Define GraphQL Operations

- Create or update `.graphql` files in `src/graphql/`.
  - Example: `ProductList.graphql`.
- **CRITICAL STEP**: Run `pnpm generate` to update the TypeScript types.
  - _Agent Check_: Did you run this? If not, imports like `@/generated/graphql` will break.

## 2. Create UI Component

- Location: `src/ui/components/<FeatureName>/`.
- Style: Functional Component.
- Props: Typed strictly (often taking a Fragment from GraphQL).

## 3. Integrate into Page

- Import component.
- Fetch data (using `urql` or server component fetch).
- Wrap in `Suspense`.

## 4. Design Check

- Are you using `font-serif` for the title?
- Are you using `text-terracotta` for the call-to-action?
