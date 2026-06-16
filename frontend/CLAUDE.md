# CLAUDE.md / AGENTS.md (Next.js — Project 3 of 3)

> This file is identical to `AGENTS.md` in this repo. Edit one, copy to the other.
> Read by Claude Code (`CLAUDE.md`) and by Codex / Cursor / Aider / Cline (`AGENTS.md`).

## Project role

This is the **target Next.js 15 frontend** of a 3-project migration from Symfony 1. It calls the Laravel backend over HTTP and renders the admin UI. The Symfony source defines the canonical UX, layout, and permission gating to reproduce.

When implementing a new screen / sub-tab / component, **always check the Symfony equivalent first** — that's the truth source for what to render, when to hide it, and which permissions gate it.

---

## Cross-project map (the trio)

| Role | Absolute path | Stack |
|---|---|---|
| **Source (read-only ref)** | `C:\xampp\htdocs\project` | Symfony 1 fork + Smarty 2/3 + jQuery `$.ajax2` |
| **Target backend** | `C:\laragon\www\backend-api` | Laravel 11 + nwidart/laravel-modules + Sanctum |
| **Target frontend (this project)** | `C:\Users\Mounkaila\WebstormProjects\icall26-front` | Next.js 15 + MUI 6 + TypeScript |

The 3 projects share the **same MySQL database per tenant**. Tenant 1 uses `site_db_name = site_theme32` and is reached at `http://tenant1.local`. The Next.js dev server proxies `/api/*` to the Laravel backend.

### Where to look for what (Symfony side, when migrating UX/UI)

- Smarty template (theme override wins): `C:\xampp\htdocs\project\sites\themes\admin\theme32a\designs\default\templates\<module>\<file>.tpl`
- Smarty base template: `C:\xampp\htdocs\project\modules\<module>\admin\designs\templates\<file>.tpl`
- Block component (renders inline): `C:\xampp\htdocs\project\modules\<module>\admin\blocks\<X>Action.class.php` (PHP) + matching `.tpl`
- Action class for full-page AJAX: `C:\xampp\htdocs\project\modules\<module>\admin\actions\ajax<Action><Entity>Action.class.php`
- i18n labels: `C:\xampp\htdocs\project\modules\<module>\admin\i18n\fr\messages.csv`
- Authoritative framework documentation: `C:\xampp\htdocs\project\documentation.md`

### Mapping table (Symfony → Laravel → Next.js)

| Symfony | Laravel | Next.js |
|---|---|---|
| Smarty `.tpl` template | controller method returning JSON | `src/modules/<M>/admin/components/<X>.tsx` |
| Smarty `{component name="/<m>/<X>"}` | controller method (block-style) | composable React component |
| `$.ajax2({url, data, target, errorTarget, loading})` | route returning `{ success, data }` | `apiClient.get/post(...)` from `@/shared/lib/api-client` |
| `$user->hasCredential([['x']])` (PHP) | `$request->user()->hasCredential([['x']])` | `usePermissions().hasCredential([['x']])` from `@/shared/contexts/PermissionsContext` |
| Smarty `{__('key')}` | `__('key')` (Lang) | `t.<key>` from `useContractTranslations()` |
| `mfMessages::addError($e)` (PHP) | `response()->json(['success'=>false,'message'=>...], 422)` | snackbar via state hook (see `useDocumentState`) |
| `target: "#tab-container"` HTML replace (jQuery) | n/a — JSON only | React state update + re-render |
| Form field `token: '{$form->getCSRFToken()}'` | Sanctum Bearer (different mechanism) | `apiClient` adds `Authorization: Bearer <token>` automatically |

### Naming conventions across the trio

| Concept | Symfony | Laravel | Next.js |
|---|---|---|---|
| Module folder | `app_domoprime_iso3` | `AppDomoprimeISO3` | `src/modules/AppDomoprimeISO3/` |
| Entity | `DomoprimeQuotation` | `DomoprimeQuotation` (Eloquent) | `DomoprimeQuotation` (TS interface) |
| Permission | `app_domoprime_iso3_contract_view_ite_documents` | same string in `t_permissions.name` | same string in `hasCredential([['...']])` |
| Service | (n/a — direct DB) | repository / service class | `iso3<X>Service` in `src/modules/<M>/admin/services/*.ts` |

---

## Project Overview (Next.js specifics)

This is a **Materialize MUI Next.js Admin Template** - a full-featured admin dashboard built with Next.js 15, Material-UI (MUI) 6, TypeScript, and Prisma. The project includes internationalization (i18n) support for English, French, and Arabic with RTL support.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm format` - Format code with Prettier

### Database
- `pnpm migrate` - Run Prisma migrations (requires `.env` file)
- Prisma schema location: `src/prisma/schema.prisma`
- Database: SQLite (configurable via `DATABASE_URL` in `.env`)

### Other
- `pnpm build:icons` - Bundle Iconify icons (runs automatically on postinstall)
- `pnpm removeI18n` - Remove translation scripts

## Architecture

### App Structure (Next.js 15 App Router)

The application uses Next.js App Router with a sophisticated routing structure:

```
src/app/
├── [lang]/                          # Language-based routing (en, fr, ar)
│   ├── (dashboard)/(private)/       # Authenticated dashboard pages
│   └── (blank-layout-pages)/        # Pages without dashboard layout
│       └── (guest-only)/            # Login, register, etc.
└── api/                             # API routes
```

**Route Groups:**
- `(dashboard)/(private)` - Protected pages requiring authentication, includes full dashboard layout
- `(blank-layout-pages)` - No dashboard chrome, used for auth pages and misc pages
- `(guest-only)` - Nested within blank-layout, prevents access for authenticated users

### Path Aliases (tsconfig.json)

- `@/*` → `src/*`
- `@core/*` → `src/@core/*` - Core theme, hooks, utilities
- `@layouts/*` → `src/@layouts/*` - Layout components (Vertical, Horizontal, Blank)
- `@menu/*` → `src/@menu/*` - Menu system and navigation
- `@assets/*` → `src/assets/*`
- `@components/*` → `src/components/*`
- `@configs/*` → `src/configs/*`
- `@views/*` → `src/views/*` - Page-level view components

### Layout System

The application supports **three layout modes**:
1. **Vertical Layout** - Traditional sidebar navigation (default)
2. **Horizontal Layout** - Top navigation bar
3. **Collapsed Layout** - Minimized sidebar

**Key Layout Files:**
- `src/@layouts/LayoutWrapper.tsx` - Switches between layout modes based on settings
- `src/@layouts/VerticalLayout.tsx` - Sidebar layout implementation
- `src/@layouts/HorizontalLayout.tsx` - Top navigation layout
- `src/@layouts/BlankLayout.tsx` - Minimal layout for auth pages

**Layout Configuration:**
- Settings stored in cookies (see `themeConfig.settingsCookieName`)
- Theme customizer component allows runtime layout switching
- Settings context: `src/@core/contexts/settingsContext.tsx`

### Authentication (NextAuth.js)

- Configuration: `src/libs/auth.ts`
- API route: `src/app/api/auth/[...nextauth]/route.ts`
- Providers: Credentials (custom login API) and Google OAuth
- Session strategy: JWT
- Auth guards:
  - `src/hocs/AuthGuard.tsx` - Protects private routes
  - `src/hocs/GuestOnlyRoute.tsx` - Restricts authenticated users from auth pages

**Environment Variables Required:**
- `NEXTAUTH_SECRET` - JWT encryption secret
- `NEXTAUTH_URL` - Full auth URL including basepath
- `NEXTAUTH_BASEPATH` - If deploying to subdirectory
- `API_URL` - Backend API for credentials login
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For OAuth

### Internationalization (i18n)

**Supported Languages:** English (en), French (fr), Arabic (ar)

**Key Files:**
- `src/configs/i18n.ts` - i18n configuration including RTL support for Arabic
- `src/data/dictionaries/` - Translation JSON files
- `src/utils/getDictionary.ts` - Server-side translation loader
- `src/components/layout/shared/LanguageDropdown.tsx` - Language switcher

**Direction Handling:**
- RTL automatically applied for Arabic
- Direction prop flows through Providers → ThemeProvider
- MUI theme and Tailwind both support RTL

### State Management

- **Redux Toolkit** - Global state (`src/redux-store/`)
- Slices:
  - `calendar.ts` - Calendar events
  - `chat.ts` - Chat messages
  - `email.ts` - Email client
  - `kanban.ts` - Kanban boards
- Provider: `src/redux-store/ReduxProvider.tsx` (wraps app in Providers)

### Menu/Navigation System

**Menu Data:**
- `src/data/navigation/verticalMenuData.tsx` - Sidebar menu structure
- `src/data/navigation/horizontalMenuData.tsx` - Top nav menu structure

**Menu Components:**
- `src/@menu/` - Core menu system library
- `src/components/layout/vertical/VerticalMenu.tsx` - Sidebar renderer
- `src/components/layout/horizontal/HorizontalMenu.tsx` - Top nav renderer
- `src/components/GenerateMenu.tsx` - Dynamic menu generation from data

**Menu System Features:**
- Supports nested submenus, sections, links, external links
- Menu configuration: `src/@menu/defaultConfigs.ts`
- Toggle animations controlled by duration constants

### Theming (MUI + Tailwind)

**MUI Theme:**
- Theme definition: `src/@core/theme/`
- Color schemes: `src/@core/theme/colorSchemes.ts`
- Component overrides: `src/@core/theme/overrides/` (extensive MUI customization)
- Mode: Supports `light`, `dark`, `system`
- Skin: `default` or `bordered`

**Tailwind:**
- Config: `tailwind.config.ts`
- Custom plugin: `src/@core/tailwind/plugin.ts`
- Uses `tailwindcss-logical` for RTL-aware spacing
- Preflight disabled (MUI provides base styles)
- Important selector: `#__next` (scopes Tailwind to app)

**Theme Configuration:**
- `src/configs/themeConfig.ts` - Default theme settings
- Settings persisted in cookies
- Customizer UI: `src/@core/components/customizer/`

### Data Layer

**Fake Data:**
- `src/fake-db/` - Mock data for demos (apps, pages, widgets)
- API routes in `src/app/api/` serve this data

**Prisma (Real Database):**
- Schema: `src/prisma/schema.prisma`
- Models: User, Account, Session, VerificationToken (NextAuth adapter schema)
- Default provider: SQLite (can be changed to PostgreSQL, MySQL, etc.)

### Component Patterns

**Custom Components:**
- `src/@core/components/` - Reusable core components (customizer, scroll-to-top, option-menu)
- `src/components/` - App-specific components (layout, dialogs, cards)
- `src/components/dialogs/` - Reusable dialog components (confirmation, payment, user forms)

**HOCs:**
- `src/hocs/TranslationWrapper.tsx` - Provides dictionary to client components
- `src/hocs/AuthGuard.tsx` - Protects routes, redirects to login
- `src/hocs/GuestOnlyRoute.tsx` - Redirects authenticated users away from auth pages

**Client Wrappers:**
- Heavy libraries lazy-loaded via client wrappers in `src/libs/`:
  - `ApexCharts.tsx`, `Recharts.tsx` - Chart libraries
  - `ReactPlayer.tsx` - Video player

### Styling Strategy

**CSS Modules:**
- Used for component-specific styles
- Examples: `src/@core/components/customizer/styles.module.css`

**Global Styles:**
- `src/app/globals.css` - Base styles and Tailwind imports
- Library styles: `src/libs/styles/` (react-datepicker, fullcalendar, etc.)

**MUI Styled Components:**
- `@emotion/styled` for styled components
- Emotion cache configuration for SSR

### Icon System

**Iconify:**
- Icons bundled at build time via `pnpm build:icons`
- Bundle script: `src/assets/iconify-icons/bundle-icons-css.ts`
- Uses Bootstrap Icons by default
- Remote fallback available

## Code Standards

### ESLint Rules

**Import Ordering:**
1. `react`
2. `next/**`
3. External packages
4. `@/**` (internal aliases)
5. Relative imports

**Spacing Rules:**
- Blank line before comments (with exceptions for block/object/array starts)
- Blank line after variable declarations
- Blank line before/after functions and multi-line blocks
- Blank line before return statements
- Blank line after imports

**TypeScript:**
- Consistent type imports required (`import type`)
- No `any` allowed in lint (but disabled in config)
- Unused vars are errors

### File Naming
- React components: PascalCase (e.g., `VerticalLayout.tsx`)
- Utilities/configs: camelCase (e.g., `themeConfig.ts`)
- CSS Modules: `*.module.css`

## Important Notes

### Redirects
The app automatically redirects:
- `/` → `/en/dashboards/crm`
- `/:lang` → `/:lang/dashboards/crm`
- Missing language prefix → `/en/:path`

These are defined in `next.config.ts`.

### Cookie-Based Settings
Layout, theme mode, skin, and other UI settings are stored in cookies. To see config changes during development, either:
1. Use the Customizer reset button
2. Clear cookies from browser DevTools

### Prisma Client Generation
`prisma generate` runs automatically on `postinstall`. If Prisma types are missing, run `pnpm install` again.

### BASEPATH Support
The app supports deployment to subdirectories via the `BASEPATH` environment variable. All URLs and auth paths respect this setting.

### Translation Removal
The template includes scripts to remove i18n features if not needed (`pnpm removeI18n`). This modifies packages, layout files, and removes translation-related code.

## Code Quality Standards

These rules come from installed skills (clean-code, typescript-advanced-types, vercel-react-best-practices, vercel-composition-patterns, test-driven-development, architecture-patterns). Apply them automatically to ALL code — never wait for the user to ask.

### Clean Code (skill: clean-code)
- Intention-revealing names: `getCustomerFullName()` not `getName()`, `permittedColumnIds` not `ids`
- Functions do ONE thing, max 20 lines. If name has "and", split it
- Early returns over nested if/else: guard clauses first, happy path last
- No dead code: delete unused imports, variables, components — don't comment them out
- Don't comment bad code — rewrite it. Comments explain WHY, not WHAT
- Small parameter lists: 0-2 ideal, 3+ needs an options object or interface
- No magic strings: use constants for storage keys, credential names, API endpoints
- Avoid null returns: use fallback values (`|| '-'`) or optional chaining (`?.`)
- DRY: 3+ identical patterns → extract helper, 2 similar → leave as-is

### React Best Practices (skills: vercel-react-best-practices, vercel-composition-patterns)
- Components: max 150 lines. If larger, extract sub-components or custom hooks
- Extract logic to custom hooks: `useContractListState`, `useContracts`, etc.
- Memoize expensive computations: `useMemo` for filtered/derived data, `useCallback` for handlers passed as props
- Never define components inside components — extract to separate files
- Conditional rendering: prefer early returns and `&&` over ternary nesting
- Prop drilling max 2 levels — beyond that, use Context or composition
- Boolean prop proliferation → use compound components or variant prop
- Co-locate related files: `contracts-list/useContractListState.ts` next to `ContractMobileCard.tsx`
- Prefer Server Components by default, use `'use client'` only when needed (hooks, event handlers, browser APIs)

### TypeScript Advanced Types (skill: typescript-advanced-types)
- Always type props with interfaces: `interface ContractColumnConfig extends ColumnConfig`
- Use `type` imports: `import type { CustomerContract } from '../../types'`
- Prefer `unknown` over `any` — use type guards instead of `as` assertions
- Generics for reusable components: `interface PaginatedProps<T> { items: T[]; total: number }`
- Discriminated unions for state: `type Result<T> = { status: 'success'; data: T } | { status: 'error'; error: string }`
- Mapped types to avoid duplication: `type EditForm<T> = Partial<T>` for edit versions of create types
- Use `readonly` for immutable data: `readonly permissions: string[]`
- Template literal types for string patterns when appropriate
- API response types must match backend: permission-gated fields use `?` (e.g. `customer?: { phone?: string }`)

### Architecture Patterns (skill: architecture-patterns)
- Module structure: `types/` (domain) → `hooks/` (logic) → `components/` (UI) → `services/` (API calls)
- Custom hooks encapsulate all business logic — components only render
- Services abstract API calls behind typed functions — components never call `fetch` directly
- Co-locate by feature, not by type: `modules/CustomersContracts/admin/` has its own hooks, components, types

### Test-Driven Development (skill: test-driven-development)
- RED-GREEN-REFACTOR: write failing test → minimal code to pass → refactor
- One behavior per test: split tests with "and" in their names
- Real code in tests, mocks ONLY for API calls and external dependencies
- Use React Testing Library: test behavior (what user sees), not implementation
- Run tests with `pnpm test` — never commit code that breaks existing tests

### Permissions Pattern (always apply)
- Column visibility: `AVAILABLE_COLUMNS` array with `credential` field per column
- Filter with `useMemo`: `permittedColumns = AVAILABLE_COLUMNS.filter(col => !col.credential || hasCredential(col.credential))`
- O(1) lookup: `permittedColumnIds = new Set(permittedColumns.map(col => col.id))`
- Mobile cards must also respect permissions (use `hidden` prop with `hasCredential()`)
- Backend is source of truth for security — frontend only hides UI (defense in depth)
- Credential format: `[['superadmin', 'admin', 'specific_permission']]` (OR logic matching Symfony 1)

### API Data Access (always apply)
- Use backend field names, not legacy Symfony names: `team.name` not `regie_callcenter`
- Always handle optional fields with `?.` and fallback `|| '-'`
- Status objects: access `status.value ?? status.name` for i18n display
- Booleans from API are strings: use helper `isYes(val)` to check "YES"/"NO"/"Y"/"N"

---

## Migration learnings (consolidated — Symfony → Next.js patterns)

### Authentication / API client
- Token stored in `localStorage.auth_token` (Bearer)
- `apiClient` (`@/shared/lib/api-client`) injects `Authorization: Bearer <token>` automatically — never call `fetch` directly
- For PDF/blob downloads: use `apiClient.get(url, { responseType: 'blob' })`, then `URL.createObjectURL(blob)` + `window.open(url, '_blank')`. A direct `<a href>` won't work because Sanctum requires the Bearer header.

### Permissions (`hasCredential`)
- Hook: `usePermissions()` from `@/shared/contexts/PermissionsContext`
- Symfony 1-style API: `hasCredential([['superadmin', 'app_domoprime_iso3_contract_view_ite_documents']])` (OR logic by default)
- Always include `'superadmin'` as the first element of inner array — superadmin bypass
- Backend is the source of truth for security; the frontend hides UI only (defense in depth)
- Permission strings are **byte-identical** to Symfony — copy-paste the credential name from the Symfony component's `getUser()->hasCredential(...)` call

### Hold gates (CRITICAL — discovered while migrating documents tab)
Symfony `contract.tpl:2` wraps the entire normal layout in:
```smarty
{if $contract->isHold() || ($user->hasCredential([['contract_view_hold_quote']]) && $contract->isHoldQuote())}
   {* HOLD branch - compact, NO documents *}
{else}
   {* NORMAL branch - full layout WITH documents *}
{/if}
```
Reproduced in `src/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/EditSubTabDocuments.tsx`:
- if `contract.is_hold === 'YES'` → render Alert (warning) instead of documents
- if `contract.is_hold_quote === 'YES'` AND `hasCredential([['superadmin','contract_view_hold_quote']])` → render Alert
- else render the type-specific section

When migrating any other tab whose Symfony equivalent is inside the same `{else}` branch (lines 336-1115 of `contract.tpl`), reproduce this gate.

### Polluter-type document split
Symfony renders 6 distinct document blocks per polluter (ITE / BOILER / PAC / TYPE1 / TYPE2 / legacy ISO), each with its own credential gate. Next.js mirrors this:
- `src/.../sub-tabs/documents/sections/BasePolluterDocumentsSection.tsx` — shared logic
- 5 thin wrappers `Documents{ITE,Boiler,Pack,Type1,Type2}Section.tsx` — each gates on its own credential (`app_domoprime_iso3_contract_view_<type>_documents`) and returns null if the user lacks it
- 1 fallback `DocumentsLegacySection.tsx` for unmapped polluter types
- `EditSubTabDocuments.tsx` is the orchestrator that switches by `contract.polluter.type`

### `display:none` vs switch routing
Symfony renders ALL polluter-type blocks in the DOM and toggles visibility with `display:none` based on a JS change handler on `select[name=polluter_id]`. Next.js prefers a switch-based router (re-render on prop change), which is cleaner. Don't reproduce the `display:none` pattern.

### Static document rows must NOT be gated by `lastQuotation`
A common bug while migrating documents: hiding all rows behind `lastQuotation && canViewQuotations`. Wrong! Symfony shows static rows (PreMeeting, AfterWork, AllDocs, AllSigned, CompanyModels, CompanyDocSignatures) even when there are 0 quotations. Only the **quotation action bar** is gated by `lastQuotation`; everything else renders as long as its own permission allows it.

### File serving (S3 / MinIO with legacy fallback)
The Laravel backend serves files via 3-step resolution:
1. `TenantStorageManager.getCurrentDisk()` (S3 / MinIO in production, local in dev)
2. local Laravel storage (`storage_path("app/private/sites/{site_db_name}/...")`)
3. legacy Symfony path (`config('migration.legacy_path')` + `sites/{site_db_name}/...`)

The S3 keeps the same hierarchy as Symfony for direct migration (e.g., `sites/site_theme32/frontend/data/models/documents/companies/12/model.pdf`).

### Composability pattern
For polluter-type variants (or any "5 nearly-identical components, 1 differs"):
- One `BaseSection` parameterized by a `type` prop
- N thin wrappers — each adds its credential gate and passes `type` to the base
- Orchestrator routes by `polluter.type` (with fallback)

This keeps the credential check **explicit per type** (matches Symfony) while DRY for shared logic.

### Translation keys
- `useContractTranslations()` returns dictionary from `src/modules/CustomersContracts/translations/{en,fr,ar}.json`
- All contract-tab keys prefixed `doc...` for documents, `contract...` for general
- Add new keys in the same format across all 3 locale files

---

## List page performance patterns (CRITICAL — apply to EVERY list)

These rules come from a real measured optimization: ContractsList1 went from **LCP 6.7 s → 493 ms** (×13.7) by fixing 3 specific bugs. Reproduce these patterns for every new list (and audit the existing ones: `ContractsList1`, `MeetingsList`, `UsersList`, `Customers`).

### 1. Never read tenant Storage in `Resource::toArray()` without caching

**Symptom:** the first row of a list takes 2 000–3 000 ms while the rest take 1 ms — backend `json_encode` blows up.

**Cause:** `app(<X>SettingsService::class)->getXxx()` calls `loadConfig()` which reads `XxxSettings.dat` from S3 (`tenant_s3` disk) on every HTTP request. One S3 read = 2 s on local Laragon. Confirmed via per-row timings: `[2537, 1.6, 1.1, 1.0, …]`.

**Fix (apply this template to every `*SettingsService`):**
- Add a class-level static cache `protected static array $configByTenant = []` keyed by `tenant->site_id`.
- Wrap the Storage read in `Cache::store('file')->get(...)` / `put(...)` (TTL 600 s). Force the `file` driver because the project's default is Redis and Redis is not always running — `Cache::remember` with the default driver throws `RedisException` and burns 2 s per call.
- Invalidate both caches in `save()` and `refresh()`.
- Reference implementation: `Modules/CustomersContracts/Services/ContractSettingsService.php` (mirror to `Modules/CustomersMeetings/Services/MeetingSettingsService.php`).

In the Resource's `toArray()`, also keep an in-method `static $statusCache = null` so the *first* row pays the (now-cached) lookup and the rest hit the static.

### 2. Never render heavy modals at mount

**Symptom:** the list page bundle is huge and the table is interactive 1–2 s late even after the API returns.

**Cause:** dialogs like `CreateContractWizard`, `EditContractDialog`, `Send{Sms,Email}Dialog`, `UserAddModal`, etc. ship rich form fields, date pickers, and wizard steps — bundling them in the initial chunk delays hydration.

**Fix:**
- Replace `import X from './X'` with `const X = dynamic(() => import('./X'), { ssr: false })`.
- Wrap each dialog usage in `{open && <X open ... />}` so the chunk doesn't even download until the dialog opens.
- Reference: `src/modules/CustomersContracts/admin/components/ContractsList1.tsx`. Same pattern is now applied to `MeetingsList.tsx` and `UserListTable.tsx`.

### 3. Never duplicate filter hydration in a `useEffect`

**Symptom:** `/<resource>` is called 2–3 times at mount instead of once.

**Cause:** the parent component (`ContractsList1.tsx`) maps URL sidebar filters to backend params via `initialBackendFilters` (a `useMemo`) and passes them to `useContracts(initialBackendFilters)` — so filters are already in the **first** request. A second `useEffect` inside `useContractListState` then loops over the same filters and calls `updateFilter(...)` per-key, which mutates state and triggers a second `loadContracts`. React StrictMode double-mount in dev makes it look like 3 calls.

**Fix:**
- Inject persisted filters at the source (`initialBackendFilters` → hook initial state). Done.
- Delete any "On mount: sync URL-persisted sidebar filters" `useEffect` inside the list-state hook.
- Reference: removed in `useContractListState.tsx` and `useMeetingListState.tsx`.

### 4. Persist UI state in event handlers, not in `useEffect`

**Symptom:** an extra effect run on mount, and on every visibility toggle.

**Cause:** writing `localStorage` from `useEffect(..., [columnVisibility])` runs once on mount with the initial value (no-op write) and again every change.

**Fix:** wrap `setColumnVisibility` in a handler that also writes `localStorage`. Reference: `useContractListState.tsx` (`handleColumnVisibilityChange`), now applied to `Customers.tsx`.

### 5. Backend `index()` controllers must stay thin

For a list endpoint, the controller should do at most: resolve permissions → call `repository->getFilteredXxx()` → wrap in `XxxListCollection` → return JSON. **No `Storage::` reads, no extra DB roundtrips outside the repository.**

Per-list-row settings (cancel/blowing/placement flags, etc.) belong in the `*SettingsService` with the cache from rule #1. The Resource consumes them through a method-level `static` cache so the cost is paid once per request.

### 6. Permission gates must use indexed lookups, not loops

`HasPermissions` trait already exposes O(1) `getPermissionIndex()` and `getGroupIndex()`. Never write `$user->permissions->contains('name', 'X')` in a hot path — that's O(n) per row × 15 rows × N permission checks = thousands of array scans.

### 7. Always measure with Chrome DevTools MCP before declaring "fixed"

The optimizer's loop:
1. `mcp__chrome-devtools__performance_start_trace` → navigate → `performance_stop_trace`. Read LCP and TTFB.
2. `evaluate_script` with `performance.getEntriesByType('resource')` to count duplicate API calls and per-call durations.
3. Add a `?__profile=1` query param to the slow endpoint that returns `permissions_ms`, `repository_ms`, `resource_toArray_ms`, `json_encode_ms`, per-row timings, query count + cumulative time. **Per-row timings reveal whether the cost is per-row (eager-load problem) or one-time (settings/cache miss).**
4. Compare before/after for: `client_ms`, controller breakdown, and number of API calls at mount.

### Checklist for a NEW list page

When you build a new admin list (e.g. `MyEntitiesList.tsx`), apply these in order:

**Frontend**
- [ ] Component < 200 lines. If larger, extract `useMyEntityListState`, mobile card, filter panel.
- [ ] All modals (create/edit/send/etc.) imported via `next/dynamic({ ssr: false })`.
- [ ] All modals wrapped in `{open && <Dialog />}`. No "always mounted, hidden" pattern.
- [ ] `initialBackendFilters` computed from URL `searchParams` and passed to `useMyEntities(initialBackendFilters)`. **No hydration `useEffect`.**
- [ ] Column visibility persisted in an event handler (`handleColumnVisibilityChange`), not in `useEffect`.
- [ ] Statistics/secondary calls (`/statistics`, `/filter-options`) fired in parallel, never blocking the table.
- [ ] No effect with a missing dep that re-runs `loadXxx` on filter-object identity changes — use stable refs or include the actual filter values as deps.

**Backend**
- [ ] `index()` controller: ≤ 30 lines, no `Storage::`, no `Cache::` outside the service.
- [ ] If the Resource needs per-tenant settings, the service uses the **2-level cache pattern** (static class + `Cache::store('file')`).
- [ ] Resource `toArray()` uses a method-level `static` cache for any value that is the same for every row in the request.
- [ ] Repository: eager-load only relations the visible columns need. Use `select('id,name')` on every `belongsTo`/`hasOne`.
- [ ] Permissions resolved via `HasPermissions` indexed lookups (`hasCredential` is already O(1)).
- [ ] No N+1: confirm with `?__profile=1` that the query count stays roughly constant when going from 1 to 50 rows.

**Verification**
- [ ] Open the page in Chrome DevTools MCP. LCP must be < 1 s for ≤ 50 rows on local dev.
- [ ] Network tab: only **one** `/<resource>` call at mount in production build (StrictMode dev shows 2 — that's expected).
- [ ] Re-load: TTFB on `/<resource>` < 300 ms with the cache warm.

---

## Quick-find recipes

- **"Where is the Symfony render of this UI?"** →
  Find the Smarty template: theme override `sites/themes/admin/theme32a/designs/default/templates/<m>/<file>.tpl` first, then base `modules/<m>/admin/designs/templates/<file>.tpl`
- **"Which permission hides this row in Symfony?"** →
  Open the matching `*Action.class.php` (or component action in `blocks/`) and read the `hasCredential(...)` call. Copy the same string into `usePermissions().hasCredential([['...']])`
- **"How to migrate a fieldset that uses `target: '#tab-container'`?"** →
  Replace the AJAX-replace pattern with React state: an early `return <X />` in the parent component, then state setter to flip back when done
- **"Which Laravel endpoint serves this Symfony URL?"** →
  Symfony URL `/module/<m>/admin/<Action>` → Laravel typically `/api/admin/<m>/<resource>/<action>`. Check `Modules/<M>/Routes/admin.php`