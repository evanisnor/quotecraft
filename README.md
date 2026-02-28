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
- PostgreSQL and MinIO (via Docker Compose)
- API server with hot-reload (`air`)
- Dashboard (Next.js dev server)
- Widget (esbuild watch mode)

Press `Ctrl+C` to stop all processes.

## Available Commands

```sh
make bootstrap        # Install dev tools via Homebrew
make dev              # Start full development stack
make services-up      # Start Docker services only (PostgreSQL, MinIO)
make services-down    # Stop Docker services
make db-migrate       # Run database migrations
make db-seed          # Seed the database
make db-reset         # Drop, recreate, migrate, and seed the database
make widget-build     # Build the widget bundle (outputs content-hashed file to widget/dist/)
```

## Development URLs

| Service | URL |
|---------|-----|
| API | `http://localhost:8080` |
| Dashboard | `http://localhost:3000` |
| Widget bundle (watch mode) | `http://localhost:8080/static/widget.js` (when `make dev` is running) |
| MinIO console | `http://localhost:9001` (credentials: `minioadmin` / `minioadmin`) |
| MinIO API | `http://localhost:9000` |

## Widget Bundle

In development (`make dev`), the widget runs in watch mode and writes to `widget/dist/widget.js`. The API's `/static/*` handler serves this file at `http://localhost:8080/static/widget.js`.

To build the production bundle with a content-hashed filename:

```sh
make widget-build
```

This writes `widget/dist/widget.<hash8>.js` and `widget/dist/manifest.json`. The API's static handler serves both from `http://localhost:8080/static/`. The hash changes only when the bundle content changes, enabling long-lived CDN caching in production.

## Configuration

`config.yaml` at the repo root controls all service configuration with local development defaults pre-configured. Key settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `cdn.serve_local` | `true` | Enables the `/static/*` route on the API server |
| `cdn.widget_dir` | `../widget/dist` | Local directory served at `/static/` |
| `cdn.base_url` | `http://localhost:8080/static` | Base URL for asset references |
| `storage.provider` | `s3` | Uses MinIO in dev; use `filesystem` for tests |

See [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) for full architecture details.

Each sub-project also has its own Makefile:

```sh
make -C api lint test build
make -C dashboard lint test
make -C widget lint test build
make -C packages/formula-engine lint test
make -C packages/config-schema lint test
make -C packages/field-renderers lint test
```
