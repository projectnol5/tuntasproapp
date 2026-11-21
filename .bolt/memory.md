# Project memory

## Product intent & audience

- Vite + React application intended for production deployment (specific product/audience not yet specified).

## Brand personality & voice

- Not yet inferred from project context.

## Visual design & UX direction

- Not yet inferred from this turn. Authoritative global design instructions live in `.bolt/prompt` (Tailwind + shadcn/ui + Lucide React + JSX).

## Decisions, constraints & rationale

- Stack: Vite with `@vitejs/plugin-react`; config is TypeScript (`vite.config.ts`).
- Build runtime: WebContainer, Node 18; uses `@rolldown/binding-wasm32-wasi` (experimental WASI warnings are expected, not errors).
- Known failure mode: `package.json` may list deps that are not actually present in `node_modules`, producing `[UNRESOLVED_IMPORT]` for `vite` and `@vitejs/plugin-react` and `ERR_MODULE_NOT_FOUND` during config load.
- Fix pattern: run `npm install` (or equivalent) before build/deploy to ensure deps are materialized; then verify build locally before suggesting retry.

## Open questions & assumptions

- Assumes default Vite React template structure; no custom build scripts confirmed yet.
- Product purpose, content, and design specifics not yet provided by user.