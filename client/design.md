# Agency OS Design System

## Brand & Style
A modern, agency-focused SaaS dashboard built for high-velocity creative teams. The system uses a restrained red accent, clean neutrals, and a strong dark sidebar to create a commanding workspace that keeps content front and center.

## Token System
The Tailwind theme is configured with semantic token names so you can use consistent classes across the app.

### Core colors
- `bg-surface`, `text-on-surface`
- `bg-surface-container`, `border-surface-container`, `text-on-surface`
- `bg-primary`, `text-on-primary`
- `bg-secondary`, `text-on-secondary`
- `bg-error`, `text-on-error`
- `bg-background`, `text-on-background`
- `bg-surface-variant`

### Rounded corners
- `rounded-sm` → 0.25rem
- `rounded` → 0.5rem
- `rounded-md` → 0.75rem
- `rounded-lg` → 1rem
- `rounded-xl` → 1.5rem
- `rounded-full` → 9999px

### Spacing tokens
- `p-card-padding`, `px-card-padding`, `py-card-padding`
- `p-stack-sm`, `p-stack-md`, `p-stack-lg`
- `m-container-margin`
- `w-sidebar-width`

### Typography classes
Use Tailwind text utilities with these semantic font sizes:
- `text-display-lg`
- `text-headline-md`
- `text-headline-sm`
- `text-title-lg`
- `text-body-md`
- `text-body-sm`
- `text-label-md`
- `text-label-sm`
- `text-headline-lg-mobile`

### Surface and elevation
- card background: `bg-surface-container`
- card border: `border border-surface-container-high`
- card shadow: `shadow-card`
- overlay shadow: `shadow-overlay`

## Component guidance

### Sidebar
Use:
- `bg-[#1a1a1a] text-white`
- `w-sidebar-width`
- `rounded-lg` for nav pill backgrounds

### Buttons
Primary button:
- `bg-primary text-on-primary rounded-md px-4 py-2 font-semibold`

Secondary button:
- `bg-white text-on-surface border border-surface-tint rounded-md px-4 py-2`

Ghost button:
- `bg-transparent text-primary hover:text-surface-tint`

### Cards
- `bg-surface-container border border-surface-container-high rounded-lg shadow-card`
- `p-card-padding`

### Tables
- header row: `bg-surface-bright`
- row hover: `hover:bg-surface-container-low`
- cell text: `text-on-surface`

## Usage examples
```html
<div class="bg-background text-on-background min-h-screen">
  <section class="max-w-[1200px] mx-auto px-container-margin py-stack-lg">
    <div class="bg-surface-container rounded-xl border border-surface-container-high shadow-card p-card-padding">
      <h1 class="text-display-lg font-bold">Campaign dashboard</h1>
      <p class="text-body-md text-on-surface-variant mt-stack-sm">Agency workflows, content planning, and media analytics.</p>
    </div>
  </section>
</div>
```

## Commit message suggestion
`chore: add Agency OS Tailwind design tokens and design documentation`
