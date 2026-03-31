# ADR 005 — Business repo structure (`src/`)

**Status:** Accepted

## Context

The Next.js `app/` directory is reserved for routing. All business logic — domain types, use-cases, repositories, serializers, and UI components — lived at the repo root alongside config files. As the codebase grew, the distinction between "framework plumbing" and "business code" became hard to see at a glance.

## Decision

All business and UI code lives under `src/`, using the Next.js built-in `src/` directory convention. The Next.js App Router is at `src/app/`, which Next.js discovers natively — no separate `app/` folder at the repo root:

```
src/
  app/             # Next.js App Router (routing and page shells, no domain logic)
  common/
    domain/          # types, Zod schemas, class packs
    application/     # use-cases, services
    infrastructure/  # Dexie repos, serializers, parsers, zip I/O
  ui/
    components/
    hooks/
    stores/
    hoc/
    layouts/
```

The TypeScript path alias `@/*` is mapped to `./src/*` in `tsconfig.json` and `vitest.config.ts`, so all existing `@/common/…` and `@/ui/…` imports continue to work without change.

## Consequences

- Any new domain, application, infrastructure, or UI file goes under `src/` — never at the repo root.
- Intra-`src/app/` page imports use relative paths, not `@/`.
- The mapping `@/* → src/*` must be kept in sync between `tsconfig.json` and `vitest.config.ts`.
- The `.next/` cache must be cleared after changing the alias (stale Webpack artifacts will reference the old path).
