# Docker Skill

Essential Docker patterns and practices for containerizing applications, building efficient images, and orchestrating multi-container systems.

## Dockerfile Best Practices

### File Structure and Syntax

**Use syntax directive**
```dockerfile
# syntax=docker/dockerfile:1
FROM ubuntu:22.04
```
- Always include the syntax parser directive as the first line
- Use `docker/dockerfile:1` to get the latest version 1 syntax
- BuildKit automatically checks for updates before building

**Default filename**
- Use `Dockerfile` (no extension) as the default name
- For multiple Dockerfiles: `<purpose>.Dockerfile` (e.g., `build.Dockerfile`, `test.Dockerfile`)
- Specify non-default files with `docker build -f <filename>`

### Base Image Selection

**Choose official and minimal images**
```dockerfile
FROM python:3.10-alpine
# or
FROM node:20-slim
```
- Prefer [Docker Official Images](https://hub.docker.com/search?badges=official)
- Use Alpine or slim variants for smaller attack surface
- Pin versions for production: `FROM alpine:3.21@sha256:a8560b36e8b8...`

**Multi-stage builds**
```dockerfile
# Build stage
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN go build -o myapp

# Production stage
FROM alpine:3.21
COPY --from=builder /app/myapp /usr/local/bin/
CMD ["myapp"]
```
- Separate build and runtime dependencies
- Only include runtime essentials in final image
- Reduce final image size dramatically
- Execute build steps in parallel when possible

### Layer Optimization

**Combine RUN commands**
```dockerfile
# Good - single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    package-bar \
    package-baz \
    package-foo \
    && rm -rf /var/lib/apt/lists/*

# Bad - multiple layers, cache issues
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y nginx
```

**Order instructions by change frequency**
```dockerfile
FROM node:20-alpine

# Dependencies change less frequently
COPY package.json package-lock.json ./
RUN npm ci

# Source code changes frequently
COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

**Leverage build cache**
- Place frequently changing instructions at the end
- Cache is invalidated when an instruction changes
- Each instruction creates a new layer
- Use `--no-cache` for clean builds: `docker build --no-cache`

### Package Management

**apt-get best practices**
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc-dev \
    make \
    && rm -rf /var/lib/apt/lists/*
```
- Always combine `apt-get update` with `apt-get install`
- Use `--no-install-recommends` to minimize packages
- Clean up package cache with `rm -rf /var/lib/apt/lists/*`
- Pin versions for reproducibility: `package=1.3.*`

**Version pinning**
```dockerfile
RUN pip install flask==3.0.* redis==5.0.*
# or
RUN npm install express@4.18.2
```

### File Operations

**COPY vs ADD**
```dockerfile
# Prefer COPY for local files
COPY requirements.txt .
COPY src/ ./src/

# Use ADD only for remote URLs or tar extraction
ADD --checksum=sha256:270d73... \
    https://example.com/file.tar.gz /tmp/
```
- Use `COPY` for simple file copying
- Use `ADD` for remote files with checksum validation
- Use bind mounts for temporary build files:
```dockerfile
RUN --mount=type=bind,source=requirements.txt,target=/tmp/requirements.txt \
    pip install --requirement /tmp/requirements.txt
```

**Use .dockerignore**
```
# .dockerignore
node_modules
.git
.env
*.md
test/
.dockerignore
Dockerfile*
```
- Exclude unnecessary files from build context
- Reduces context size and build time
- Similar syntax to `.gitignore`

### Dockerfile Instructions

**FROM - Base image**
```dockerfile
FROM alpine:3.21
# Use official, minimal base images
```

**WORKDIR - Set working directory**
```dockerfile
WORKDIR /app
# Always use absolute paths
# Avoid proliferating `RUN cd ...` instructions
```

**RUN - Execute commands**
```dockerfile
# Use pipefail for error handling
RUN set -o pipefail && \
    wget -O - https://some.site | wc -l > /number

# Use here-docs for multiple commands
RUN <<EOF
apt-get update
apt-get install -y curl
curl https://example.com
EOF
```

**ENV - Environment variables**
```dockerfile
ENV NODE_ENV=production
ENV PATH=/usr/local/app/bin:$PATH

# For temporary variables, use RUN
RUN export BUILD_VAR=value && \
    echo $BUILD_VAR && \
    unset BUILD_VAR
```
- Persists across layers
- Use for configuration that should remain in image
- For build-only vars, set and unset in same RUN

**EXPOSE - Document ports**
```dockerfile
EXPOSE 8080
EXPOSE 443
```
- Documents which ports the container listens on
- Doesn't actually publish ports (use `-p` flag at runtime)

**USER - Set non-root user**
```dockerfile
RUN groupadd -r appuser && \
    useradd --no-log-init -r -g appuser appuser
USER appuser
```
- Always run as non-root when possible
- Create user/group in Dockerfile
- Consider explicit UID/GID for consistency

**CMD vs ENTRYPOINT**
```dockerfile
# ENTRYPOINT sets the main command
ENTRYPOINT ["python", "app.py"]

# CMD provides default arguments
CMD ["--host", "0.0.0.0", "--port", "8080"]

# Together they allow flexible execution
# docker run myapp                    -> runs with defaults
# docker run myapp --port 9000        -> overrides CMD
```

**VOLUME - Define mount points**
```dockerfile
VOLUME /data
# For database storage, config, or mutable data
```

**LABEL - Add metadata**
```dockerfile
LABEL version="1.0" \
      description="My application" \
      maintainer="team@example.com"
```

### Security Practices

**Don't install unnecessary packages**
- Keep images minimal to reduce attack surface
- Only include runtime dependencies in final stage

**Don't use sudo**
```dockerfile
# Bad
RUN sudo apt-get install package

# Good
RUN apt-get install package
# Or use gosu for step-down execution
```

**Use specific versions**
```dockerfile
# Good
FROM node:20.11.1-alpine3.19

# Acceptable with digest pinning
FROM node:20-alpine@sha256:abc123...
```

### Build Commands

**Basic build**
```bash
docker build -t myapp:latest .
```

**Build with fresh base image**
```bash
docker build --pull -t myapp:latest .
```

**Clean build without cache**
```bash
docker build --pull --no-cache -t myapp:latest .
```

**Multi-platform build**
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .
```

**Build with build arguments**
```bash
docker build --build-arg VERSION=1.2.3 -t myapp:latest .
```

**Build with named context**
```bash
docker build --build-context docs=./docs .
```

## Build Context

### What is Build Context

The build context is the set of files accessible during build:
```bash
docker build [OPTIONS] PATH | URL | -
                         ^^^^^^^^^^^^^^
```

**Local directory context**
```bash
docker build .
# Uses current directory and subdirectories
```

**Git repository context**
```bash
docker build https://github.com/user/repo.git
docker build https://github.com/user/repo.git#main
docker build https://github.com/user/repo.git#main:subdirectory
```

**Remote tarball context**
```bash
docker build http://server/context.tar.gz
```

### Named Contexts

Use multiple contexts in a single build:
```bash
docker build --build-context scripts=https://github.com/user/scripts.git .
```

In Dockerfile:
```dockerfile
FROM alpine
COPY . /app
RUN --mount=from=scripts,target=/scripts /scripts/deploy.sh
```

### .dockerignore

Essential for excluding files from context:
```
# Version control
.git
.gitignore

# Dependencies
node_modules
vendor

# Build artifacts
dist
build
*.o

# Secrets and config
.env
*.key
*.pem

# Documentation
*.md
docs/

# Tests
test/
__tests__/
*.test.js
```

**Wildcard patterns**
- `*/temp*` - matches `somedir/temporary.txt`
- `*/*/temp*` - matches two levels deep
- `temp?` - matches single character
- `**/*.go` - matches all Go files recursively

**Negation**
```
*.md
!README.md
```

## Docker Compose

### Compose File Structure

**Basic compose.yaml**
```yaml
services:
  web:
    build: .
    ports:
      - "8000:5000"
    environment:
      - DEBUG=1
    volumes:
      - ./src:/app/src
    depends_on:
      - redis
      
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  redis-data:

networks:
  default:
    name: myapp-network
```

### Service Configuration

**Build from Dockerfile**
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
      args:
        - VERSION=1.0.0
      target: production
```

**Use pre-built image**
```yaml
services:
  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

**Port mapping**
```yaml
services:
  web:
    ports:
      - "8080:80"           # host:container
      - "127.0.0.1:3000:3000"  # bind to localhost only
      - "443:443/tcp"       # specify protocol
```

**Environment variables**
```yaml
services:
  app:
    environment:
      NODE_ENV: production
      API_KEY: ${API_KEY}   # from .env file or shell
    env_file:
      - .env
      - .env.prod
```

**Volumes**
```yaml
services:
  app:
    volumes:
      # Named volume
      - data:/var/lib/data
      
      # Bind mount
      - ./src:/app/src
      
      # Anonymous volume
      - /app/node_modules
      
      # Read-only mount
      - ./config:/app/config:ro

volumes:
  data:
    driver: local
```

**Networking**
```yaml
services:
  web:
    networks:
      - frontend
      - backend
      
  api:
    networks:
      - backend
      
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true  # No external access
```

**Dependencies**
```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Resource limits**
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Compose Watch (Development)

```yaml
services:
  web:
    build: .
    ports:
      - "8000:5000"
    develop:
      watch:
        # Sync changes to container
        - action: sync
          path: ./src
          target: /app/src
          
        # Rebuild on changes
        - action: rebuild
          path: package.json
          
        # Sync and restart
        - action: sync+restart
          path: ./config
          target: /app/config
```

Commands:
```bash
docker compose watch
# or
docker compose up --watch
```

### Multiple Compose Files

**Split configuration**
```yaml
# compose.yaml - base configuration
services:
  web:
    build: .
    ports:
      - "8000:5000"

# compose.override.yaml - development overrides (auto-loaded)
services:
  web:
    volumes:
      - ./src:/app/src
    environment:
      DEBUG: "1"

# compose.prod.yaml - production overrides
services:
  web:
    environment:
      DEBUG: "0"
    deploy:
      replicas: 3
```

**Use with include**
```yaml
# compose.yaml
include:
  - infra.yaml
  - services.yaml

services:
  web:
    build: .
```

**Merge files explicitly**
```bash
docker compose -f compose.yaml -f compose.prod.yaml up
```

### Essential Commands

**Start services**
```bash
docker compose up              # Foreground
docker compose up -d           # Background (detached)
docker compose up --build      # Rebuild images before starting
docker compose up --force-recreate  # Recreate containers
```

**Stop and remove**
```bash
docker compose down            # Stop and remove containers
docker compose down -v         # Also remove volumes
docker compose down --rmi all  # Also remove images
```

**View status and logs**
```bash
docker compose ps              # List services
docker compose logs            # View logs
docker compose logs -f web     # Follow logs for web service
docker compose logs --tail=100 # Last 100 lines
```

**Execute commands**
```bash
docker compose exec web bash              # Interactive shell
docker compose exec -it db psql -U postgres  # Run command
docker compose run --rm web npm test      # One-off command
```

**Manage services**
```bash
docker compose start           # Start existing containers
docker compose stop            # Stop without removing
docker compose restart         # Restart services
docker compose pause           # Pause services
docker compose unpause         # Unpause services
```

**Scale services**
```bash
docker compose up -d --scale web=3
```

**Pull and build**
```bash
docker compose pull            # Pull latest images
docker compose build           # Build services
docker compose build --no-cache  # Clean build
```

## Build Architecture

### Buildx and BuildKit

Docker Build uses a client-server architecture:
- **Buildx**: CLI tool (client) that interprets build commands
- **BuildKit**: Daemon (server) that executes builds

**Key benefits of BuildKit**:
- Parallel build step execution
- Incremental transfer of build context
- Efficient caching with import/export
- Multi-platform builds
- Advanced Dockerfile features

### Build Cache

**Cache keys are invalidated when:**
- Instruction changes
- Files copied by COPY/ADD change
- Parent layer changes

**Optimize cache usage:**
```dockerfile
# Copy dependency files first
COPY package*.json ./
RUN npm ci

# Copy source code last (changes frequently)
COPY . .
RUN npm run build
```

**Cache mount for package managers**
```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

## Container Runtime Best Practices

### Ephemeral Containers

Design containers to be:
- **Stateless**: Store data in volumes, not container filesystem
- **Disposable**: Can be stopped, destroyed, and replaced easily
- **Minimal setup**: Start quickly with minimal configuration

### One Process Per Container

```bash
# Good: separate containers
docker compose up

services:
  web:
    image: nginx
  app:
    image: myapp
  db:
    image: postgres
```

Each container should have one concern. Use Compose to connect containers.

### Decouple Applications

- Web application in one container
- Database in another
- Cache in another
- Makes horizontal scaling easier
- Enables independent updates

### Regular Rebuilds

```bash
# Pull latest base image and rebuild
docker build --pull --no-cache -t myapp:latest .
```

Rebuild images regularly to get:
- Security patches
- Updated dependencies
- Latest base image versions

## CI/CD Integration

**Build in CI pipeline**
```yaml
# GitHub Actions example
- name: Build Docker image
  run: docker build -t myapp:${{ github.sha }} .

- name: Run tests
  run: docker run myapp:${{ github.sha }} npm test

- name: Push to registry
  run: docker push myapp:${{ github.sha }}
```

## Quick Reference

### Common Build Flags

| Flag | Purpose |
|------|---------|
| `-t name:tag` | Name and tag the image |
| `-f Dockerfile` | Specify Dockerfile path |
| `--build-arg` | Pass build-time variables |
| `--target` | Build specific stage in multi-stage |
| `--platform` | Build for specific platform(s) |
| `--pull` | Always pull fresh base images |
| `--no-cache` | Build without using cache |
| `--progress=plain` | Show verbose build output |

### Common Compose Flags

| Flag | Purpose |
|------|---------|
| `-f compose.yaml` | Specify compose file |
| `-d` | Run in detached mode |
| `--build` | Build images before starting |
| `--force-recreate` | Recreate containers even if config unchanged |
| `--scale service=N` | Scale service to N instances |
| `-v` | Remove volumes when using down |
| `--no-deps` | Don't start dependent services |

### Debugging Tips

**View build details**
```bash
docker build --progress=plain .
docker buildx build --progress=plain .
```

**Inspect layers**
```bash
docker history myapp:latest
docker image inspect myapp:latest
```

**Debug running container**
```bash
docker compose exec web sh
docker compose logs -f web
docker compose top web
```

**Check port mappings**
```bash
docker compose port web 8000
docker ps
```

**Validate compose file**
```bash
docker compose config
docker compose config --services
docker compose config --volumes
```

## Example: Full Application Stack

```yaml
# compose.yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  web:
    build:
      context: ./web
      target: production
    labels:
      - "traefik.http.routers.web.rule=Host(`example.com`)"
    depends_on:
      api:
        condition: service_healthy
    environment:
      API_URL: http://api:8080

  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    volumes:
      - cache-data:/data

volumes:
  db-data:
  cache-data:
```

```dockerfile
# api/Dockerfile.prod
# syntax=docker/dockerfile:1

# Build stage
FROM golang:1.21 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app/api

# Production stage
FROM alpine:3.21
RUN apk --no-cache add ca-certificates curl
WORKDIR /app
COPY --from=builder /app/api .
USER nobody:nobody
EXPOSE 8080
HEALTHCHECK CMD curl -f http://localhost:8080/health || exit 1
CMD ["./api"]
```

