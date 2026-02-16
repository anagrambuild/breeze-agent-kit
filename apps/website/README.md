# Breeze Agent Kit — Website

Landing page and integration docs for [Breeze Agent Kit](https://github.com/anagrambuild/breeze-agent-kit). Shows supported tokens and tabbed setup guides for each integration path:

- **MCP** — stdio server setup for Claude Desktop, Cursor, etc.
- **402** — payment-gated HTTP API using the x402 protocol
- **Skill** — skill config for agent frameworks
- **Openclaw** — one-command install via Clawhub

## Stack

- **Next.js 16** (Turbopack)
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**

## Development

From the repo root:

```bash
bun run dev:website
```

Or from this directory:

```bash
bun run dev
```

The dev server starts at `http://localhost:3000`.

## Build

```bash
bun run build
bun run start
```
