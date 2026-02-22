# QuoteCraft

Free, no-code, embeddable quote/pricing calculator builder (SaaS).

## Getting Started

### Prerequisites

- macOS with [Homebrew](https://brew.sh) installed
- Docker Desktop

### Bootstrap

Install all required dev tools (Go, Node.js, pnpm, air, Docker):

```sh
make bootstrap
```

### Start the Dev Stack

```sh
make dev
```

This starts:
- PostgreSQL (via Docker Compose)
- API server with hot-reload (`air`)
- Dashboard (Next.js dev server)
- Widget (esbuild watch mode)

Press `Ctrl+C` to stop all processes.

## Available Commands

```sh
make bootstrap        # Install dev tools via Homebrew
make dev              # Start full development stack
make services-up      # Start Docker services only
make services-down    # Stop Docker services
make db-migrate       # Run database migrations
make db-seed          # Seed the database
make db-reset         # Drop, recreate, migrate, and seed the database
```

Each sub-project also has its own Makefile:

```sh
make -C api lint test build
make -C dashboard lint test
make -C widget lint test build
make -C packages/formula-engine lint test
make -C packages/config-schema lint test
make -C packages/field-renderers lint test
```
