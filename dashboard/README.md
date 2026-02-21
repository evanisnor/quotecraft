# QuoteCraft Dashboard

The QuoteCraft dashboard and marketing site — a Next.js app (TypeScript, App Router, Tailwind CSS).

## Development

From this directory, use the sub-project Makefile:

```
make help       # List available targets
make dev        # Start development server with hot-reload
make build      # Build for production
make lint       # Run ESLint and TypeScript type checking
make test       # Run tests
```

Or run from the monorepo root via `make dev` (starts all services together).

## Architecture

Code follows [Feature-Sliced Design](https://feature-sliced.design/):

```
src/
├── app/         # Next.js App Router: routing, layout, global styles
├── pages/       # FSD pages layer: page-level compositions
├── widgets/     # FSD widgets layer: self-contained UI blocks
├── features/    # FSD features layer: user-facing capabilities
├── entities/    # FSD entities layer: business domain objects
└── shared/      # Shared utilities: ui, lib, api, config
```
