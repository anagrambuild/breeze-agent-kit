# mcp

Placeholder Node + TypeScript app for upcoming MCP server work.

## Current status

- Minimal HTTP server in `src/index.ts`
- `GET /healthz` returns a simple JSON health response
- All other routes return a placeholder text response

## Development

From this directory:

```bash
bun run dev
```

Or from the repo root:

```bash
bun run --filter mcp dev
```

## Scripts

- `bun run dev` - run with Node watch mode via `tsx`
- `bun run build` - compile TypeScript to `dist`
- `bun run start` - run compiled server
- `bun run check` - TypeScript no-emit check
- `bun run test` - Node test runner placeholder
