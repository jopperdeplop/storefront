# Design System Rules: Storefront

## 1. Typography

- **Headings**: Use `font-serif` (Times New Roman).
  - Example: `<h1 className="font-serif text-4xl">Title</h1>`
- **Body / Price**: Use `font-sans` (Inter).
  - Example: `<p className="font-sans text-base">Description</p>`
- **Specs / technical**: Use `font-mono` (Courier).

## 2. Color Palette ("Euro-Standard")

Use these custom Tailwind utility classes.

- **Primary**: `text-terracotta` / `bg-terracotta` (Burnt Orange).
- **Backgrounds**: `bg-stone-50` (Editorial), `bg-stone-100` (Light Gray).
- **Legacy**: `carbon`, `vapor` (Use sparingly, prefer Stone).

## 3. UI Patterns

- **Async Data**: Always wrap async components in `<Suspense fallback={<Skeleton />}>`.
- **Icons**: Use `lucide-react`.
