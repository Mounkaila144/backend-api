# AGENT.md

Project instructions for Codex when working in this repository.

## Project Summary

This repository is the ICALL26 frontend, built from the Materialize MUI Next.js Admin Template and customized into a modular admin application.

Main stack:
- Next.js 15 App Router, React 18, TypeScript strict mode.
- MUI 6, Emotion, Tailwind CSS 3 with logical properties for RTL.
- Redux Toolkit for shared client state.
- Axios for backend calls through a shared API client.
- NextAuth and Prisma are still present from the template.
- Internationalization supports `en`, `fr`, and `ar`; Arabic is RTL.

Treat the app as a real business application, not only as a template. Prefer the feature modules in `src/modules` and shared utilities in `src/shared` over legacy template demo patterns.

## Commands

Use `pnpm` by default.

- `pnpm dev` - start the development server with Turbopack.
- `pnpm build` - build the production bundle.
- `pnpm start` - start the production server.
- `pnpm lint` - run ESLint.
- `pnpm lint:fix` - run ESLint with automatic fixes.
- `pnpm format` - format source files with Prettier.
- `pnpm build:icons` - bundle Iconify icons.
- `pnpm migrate` - run Prisma migrations using `.env`.
- `pnpm removeI18n` - run the template script that removes i18n features.

Before finishing code changes, run the most relevant check. For broad TypeScript or UI changes, prefer `pnpm lint` and `pnpm build` when time allows.

## Important Directories

- `src/app` - Next.js App Router routes.
- `src/app/[lang]` - locale-prefixed routes.
- `src/app/[lang]/admin/[...slug]` - dynamic admin module routing.
- `src/app/[lang]/superadmin/[...slug]` - dynamic superadmin module routing.
- `src/app/api` - Next.js API routes.
- `src/modules` - business feature modules. Add new domain work here first.
- `src/shared` - cross-module components, hooks, contexts, config, i18n, API, permissions, and utilities.
- `src/components/shared/DataTable` - reusable data table system.
- `src/@core`, `src/@layouts`, `src/@menu` - Materialize/MUI template core, layouts, and menu primitives.
- `src/data/dictionaries` and `src/shared/i18n` - translations.
- `src/prisma/schema.prisma` - Prisma schema.

Current business modules include:
- `AppDomoprime`
- `AppDomoprimeISO3`
- `Configuration`
- `Customers`
- `CustomersContracts`
- `CustomersDocuments`
- `CustomersMeetings`
- `Dashboard`
- `Site`
- `SuperAdmin`
- `Users`
- `UsersGuard`

## Path Aliases

Configured in `tsconfig.json`:

- `@/*` -> `src/*`
- `@core/*` -> `src/@core/*`
- `@layouts/*` -> `src/@layouts/*`
- `@menu/*` -> `src/@menu/*`
- `@assets/*` -> `src/assets/*`
- `@components/*` -> `src/components/*`
- `@configs/*` -> `src/configs/*`
- `@views/*` -> `src/views/*`
- `@/modules/*` -> `src/modules/*`
- `@/shared/*` -> `src/shared/*`

Use these aliases instead of deep relative imports when crossing feature boundaries.

## Routing And Layouts

The application uses the Next.js App Router with language prefixes.

Relevant route groups:
- `(dashboard)/(private)` - protected dashboard pages with dashboard layout.
- `(blank-layout-pages)` - auth and misc pages without dashboard chrome.
- `(guest-only)` - pages that authenticated users should not access.
- `admin/[...slug]` - admin module route dispatcher.
- `superadmin/[...slug]` - superadmin module route dispatcher.

Redirects are defined in `next.config.ts`:
- `/` -> `/en/dashboards/crm`
- `/:lang` -> `/:lang/dashboards/crm`
- paths without a language prefix get redirected to `/en/:path`

Layouts:
- `src/@layouts/LayoutWrapper.tsx` chooses the active layout.
- `src/@layouts/VerticalLayout.tsx` implements the sidebar layout.
- `src/@layouts/HorizontalLayout.tsx` implements top navigation.
- `src/@layouts/BlankLayout.tsx` is for auth and simple pages.

Settings such as layout, theme mode, and skin are stored in cookies through `themeConfig.settingsCookieName`. If a visual setting appears stuck during development, clear browser cookies or reset through the customizer.

## Feature Module Pattern

Prefer a feature-first structure inside `src/modules/<ModuleName>`.

Recommended organization:
- `types/` or `*.types.ts` - domain and API types.
- `services/` - typed API calls.
- `hooks/` - state, business logic, filtering, permissions, and actions.
- `components/` - UI-only pieces.
- `menu.config.ts` - module menu entries.
- route/page adapters only compose hooks and components.

Keep business logic out of large page components. Components should mostly render props and call handlers from hooks.

When adding a new module menu:
1. Create or update `src/modules/<ModuleName>/menu.config.ts`.
2. Register it in `src/shared/config/menu-registry.ts`.
3. Ensure route generation matches the module's admin or superadmin context.

## API Access

Use the shared API client and typed services. Do not call `fetch` or raw `axios` directly from components unless there is a clear existing local pattern.

Primary API client:
- `src/shared/lib/api-client.ts`

Important behavior:
- Base URL uses `NEXT_PUBLIC_API_URL` with `/api` fallback.
- Admin requests include `X-Tenant-ID` from `localStorage.tenant_id`.
- Requests include `Accept-Language` from the current URL/local storage.
- Auth tokens are stored separately for admin and superadmin contexts.
- 401 responses try token refresh once, then clear auth state and redirect to login.
- Superadmin context is detected from `/superadmin` in the path.

Backend data rules:
- Use current backend field names, not old Symfony labels. Example: use `team.name`, not `regie_callcenter`.
- Treat API fields as optional when permissions can hide them.
- Use optional chaining and explicit fallbacks for display values.
- Status objects should display `status.value ?? status.name` where applicable.
- Some booleans may arrive as strings such as `YES`, `NO`, `Y`, or `N`; use or create a helper instead of inline checks.

## Auth And Permissions

Auth-related files:
- `src/libs/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/hocs/AuthGuard.tsx`
- `src/hocs/GuestOnlyRoute.tsx`
- `src/modules/UsersGuard`
- `src/shared/contexts/PermissionsContext.tsx`
- `src/shared/components/permissions/Can.tsx`
- `src/shared/utils/permissions.ts`

Frontend permissions are for UI visibility only. The backend remains the source of truth for security.

Permission conventions:
- Prefer explicit permission slugs.
- For column visibility, use an `AVAILABLE_COLUMNS` configuration with a permission or credential field.
- Compute permitted columns with `useMemo`.
- Use `Set` for O(1) lookup of permitted column ids.
- Desktop tables and mobile cards must follow the same permission rules.
- Keep permission logic in hooks or helpers, not scattered through JSX.

Existing credential arrays may use OR-style groups such as `[['superadmin', 'admin', 'specific_permission']]`. Preserve the current module's pattern when editing.

## Internationalization

Supported locales:
- `en`
- `fr`
- `ar`

Important files:
- `src/configs/i18n.ts`
- `src/data/dictionaries/*.json`
- `src/shared/i18n/translations/*.json`
- `src/utils/getDictionary.ts`
- `src/shared/i18n/use-translation.ts`
- `src/components/layout/shared/LanguageDropdown.tsx`
- `src/shared/components/LanguageSwitcher.tsx`

Rules:
- Keep route URLs locale-aware.
- Do not hardcode user-facing strings in new reusable UI when a translation layer is already used nearby.
- Preserve RTL support for Arabic. Use logical CSS utilities/properties where possible.

## UI And Styling

Use the existing MUI and Materialize conventions.

- Prefer MUI components for forms, tables, dialogs, navigation, and feedback.
- Use `src/components/shared/DataTable` for reusable table behavior.
- Use Tailwind for layout utilities when consistent with surrounding code.
- Use CSS modules for local component-specific styles when the nearby code does.
- Do not introduce a new design system.
- Keep dashboards dense, practical, and easy to scan.
- Match existing spacing, colors, typography, and card patterns.

Theme files:
- `src/@core/theme`
- `src/@core/theme/overrides`
- `src/configs/themeConfig.ts`
- `src/configs/primaryColorConfig.ts`
- `src/components/theme`

Icon system:
- Iconify icons are bundled by `pnpm build:icons`.
- Bootstrap Icons are the default icon set.
- Prefer existing icon patterns before adding new libraries.

## TypeScript And React Standards

TypeScript:
- Keep strict typing.
- Use `import type` for type-only imports.
- Prefer `unknown` plus type guards over `any`.
- Use interfaces for component props when extending or sharing shapes.
- Keep API response types aligned with backend reality.
- Use discriminated unions for meaningful async or state variants.

React:
- Prefer Server Components by default.
- Add `'use client'` only for hooks, event handlers, local state, browser APIs, or client-only libraries.
- Do not define React components inside other components.
- Extract large components into smaller components and hooks.
- Memoize expensive derived values with `useMemo`.
- Use `useCallback` for handlers passed deep or into memoized children.
- Avoid prop drilling past two levels; use composition or context.
- Avoid boolean prop proliferation; prefer a `variant`, config object, or compound component where appropriate.

## Code Style

Follow the repository ESLint and Prettier configuration.

Import order expected by the lint rules:
1. `react`
2. `next/**`
3. External packages
4. Internal aliases such as `@/**`
5. Relative imports

Other standards:
- Components use PascalCase filenames.
- Utilities and configs use camelCase.
- CSS modules use `*.module.css`.
- Delete dead code instead of commenting it out.
- Comments should explain why, not restate what the code does.
- Prefer guard clauses over deeply nested conditionals.
- Avoid magic strings for storage keys, endpoints, and permission names.
- Avoid unrelated refactors while fixing a focused issue.

## Testing And Verification

There is no explicit `test` script in `package.json` at the time of writing. Do not claim tests were run unless a valid command was actually run.

Use the available checks:
- `pnpm lint` for lint and import/order issues.
- `pnpm build` for TypeScript and Next.js integration issues.
- `pnpm format` only when formatting source files is appropriate.

When making risky UI changes, run the app with `pnpm dev` and inspect the affected route if possible.

## Environment Notes

Common environment variables:
- `NEXT_PUBLIC_API_URL` - backend API base URL used by the shared API client.
- `NEXTAUTH_SECRET` - NextAuth JWT/session secret.
- `NEXTAUTH_URL` - full auth URL.
- `NEXTAUTH_BASEPATH` - auth base path when deployed under a subdirectory.
- `API_URL` - may still be used by legacy/template auth code.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - Google OAuth.
- `DATABASE_URL` - Prisma database URL.
- `BASEPATH` - deployment subdirectory support in Next config.

Prisma:
- Schema is `src/prisma/schema.prisma`.
- `prisma generate` runs on `postinstall`.
- If Prisma types are missing, run dependency installation again before changing generated assumptions.

## Codex Workflow

When modifying this project:
1. Read the nearby module before editing.
2. Preserve existing module conventions unless they are clearly broken.
3. Prefer changes in `src/modules` or `src/shared` over edits in template internals.
4. Keep API logic in services and hooks.
5. Keep JSX focused on rendering.
6. Update menus, permissions, translations, and mobile views together when a feature requires them.
7. Run a relevant verification command and report exactly what passed or failed.
8. Do not revert unrelated user changes in the working tree.

Current repository may contain local uncommitted work. Check `git status --short` before larger edits and avoid touching unrelated files.
