# ADR 004 — Browser-only persistence (IndexedDB / no backend)

**Status:** Accepted

## Context

Dataset annotation tools typically require a server for storage, authentication, and collaboration. However, a server introduces deployment complexity, hosting costs, and data privacy concerns (training images may be proprietary).

## Decision

All persistence uses IndexedDB via Dexie. There is no server, no API routes, no server actions, and no cloud sync. The app is deployed as a static HTML/CSS/JS bundle (`next build` with `output: "export"`).

## Rationale

- **Zero infrastructure**: users can self-host on any static file server or CDN.
- **Privacy**: training images never leave the user's browser.
- **Offline-first**: the app works without an internet connection after initial load.
- **Simplicity**: no auth, no sessions, no API versioning.

## Consequences

- Storage is limited by IndexedDB quotas (~50% of available disk on Chrome).
- No collaboration — each browser has its own isolated dataset.
- Export/import (via zip) is the only data transfer mechanism.
- The app cannot be used as a multi-user annotation platform without significant architectural changes (which would require a new ADR).
