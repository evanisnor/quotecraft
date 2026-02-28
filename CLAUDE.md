# QuoteCraft — Development Guide

Project Repository URL: https://github.com/evanisnor/quotecraft

## Project Overview

QuoteCraft is a free, no-code, embeddable quote/pricing calculator builder (SaaS). Users build calculators in a visual editor, customize appearance, and embed on any website via `<script>` tag. Free tier is unlimited (views, submissions, calculators) with a "Powered by QuoteCraft" badge. Paid tiers: Pro ($19/mo), Business ($49/mo), Agency ($99/mo).



## Project Documents

- **[PRODUCT_SPEC.md](./PRODUCT_SPEC.md)** — Product vision, user personas, feature descriptions, pricing tiers, competitive analysis
- **[REQUIREMENTS.md](./REQUIREMENTS.md)** — 144 functional requirements across 17 areas, organized by phase. Each requirement has a unique ID (e.g., `1.3.2`, `3.2.5`). This is the source of truth for what to build.
- **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)** — Architecture, data model, API design, security model, deployment strategy. Follow the design principles: stability > security > low cost > low maintenance > observability.
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** — Task-level status tracking. This is the working document you update as you complete work.

Reference this comprehensive project plan when it is referenced, or when you need more detail about a task:

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** — Epics, user stories, acceptance criteria, and task breakdowns. Every user story traces back to specific requirement IDs. Organized into 4 phases with priority levels P0–P6.

## Workflow: Picking and Completing Tasks

### 1. Choose the Next Task

Open `PROJECT_STATUS.md` and find the next incomplete task. Work in order:

- **Resume**: If there are uncommitted changes, or if a task is marked as 'In Progress', finish the current task before proceeding.
- **Priority first**: P0 before P1, P1 before P2, etc.
- **Dependencies matter**: Check `PROJECT_PLAN.md` for dependency notes. Don't start a story if its dependencies aren't complete.
- **Within a priority level**: Work top-to-bottom (task order within a story, story order within an epic).
- **Status**: After chosing a task, update its status to 'In Progress'

### 2. Before Writing Code

- Read the user story and acceptance criteria in `PROJECT_PLAN.md`.
- Read the linked requirements in `REQUIREMENTS.md` to understand what's expected.
- Read relevant sections of `SYSTEM_DESIGN.md` for architectural guidance.
- Understand existing code before modifying it.

### 3. Implement the Task

- Follow the architecture in `SYSTEM_DESIGN.md`. Don't deviate without discussing it first.
- Write tests before implementation. TDD with 100% line and branch coverage is MANDATORY. Follow code conventions as prescribed.
- Keep changes focused — stay on task.

As you implement tasks, maintain a record of your decisions in the `decisions` sub-directory. Each session must leave a decision log in a file in this directory following the naming convention `YYYY-MM-DD.md`. The contents of this doc should include:

- Which task and requirement IDs are being worked on
- Which decisions were made when implementing the task
- Any technical challenges or inconsistencies faced and how they were resolved

Use tool lookups to understand context about the code by following this process:

1. Read the git log for the current file or specific chunk of code
2. Extract task IDs and dates from the commit log for that file or specific chunk of code
3. Perform a text search on the `decisions` directory to find relevent context

### 4. Code Review (Required)

After implementation is complete but **before committing**, invoke the **code-reviewer agent** with the task ID. The reviewer checks security, completeness, test quality, code conventions, and requirement compliance.

- If the verdict is **FAIL**: fix all required changes, then re-run the review.
- If the verdict is **PASS WITH COMMENTS**: address any required changes. Suggestions are optional.
- If the verdict is **PASS**: proceed to commit.

**No code is committed without a passing review.**

### 5. Commit the Task

Each completed task gets its own commit. Every commit must include the updated `PROJECT_STATUS.md`.

**Commit format:**

```
[TASK-ID] Brief description of what was done

- Bullet points with specifics if needed
```

**Example:**

```
[INFR-US1-A001] Initialize monorepo with pnpm workspaces

- Configure pnpm-workspace.yaml with api, dashboard, widget, shared packages
- Add root package.json with shared scripts
```

**Steps for each commit:**

1. Ensure all tests, lint checks, and type checks pass
2. Format code
3. Stage the implementation files
4. Update `PROJECT_STATUS.md`: set the task's Status to `✅` and Completed to today's date (YYYY-MM-DD)
5. Stage `PROJECT_STATUS.md`
6. Commit with the format above
7. Push to `origin/main` on GitHub
8. Wait for CI to pass using `gh run watch` to monitor the latest workflow run. If CI fails:
   - If the failure is unrelated to your commit (e.g., a pre-existing broken test or infra flake), fix it as an independent change, commit it separately with a descriptive message (no task ID required), push, and confirm CI passes before moving on.
   - If the failure is caused by your commit, fix it in a follow-up commit (use the relevant task ID), push, and re-confirm CI passes. Do not force push!
   - Wait for the fix to pass on CI using `gh run watch` again. Keep making fix commits and pushing and watching until CI passes before moving on.

### 6. When a Task is Complete

Run `/compact` to summarize the session context before starting the next task. This keeps the context window available for the next task and prevents auto-compact from firing mid-task when in-flight context is most needed.

A hook injects a reminder whenever a task is marked completed — act on it immediately by running `/compact`.

### 7. When a Story is Complete

When all tasks in a user story are done, verify the acceptance criteria from `PROJECT_PLAN.md` are met before moving on. If everything is complete, update `PROJECT_STATUS.md` and commit.

### 8. When an Epic is Complete

Make sure tasks of all priorities within an epic are complete before moving on to the next epic. Perform an additional code review to make sure everything was built according to standards.

### 9. When a Phase is Complete

Once all tasks in a phase are complete, Once all tasks in the current phase are complete, review the implementation for adherence to the REQUIREMENTS.md, PROJECT_PLAN.md, and SYSTEM_DESIGN.md documents. Stop all work and exit cleanly. Do not proceed to the next phase. Wait for human intervention.

## Tech Stack

- **API**: Go (REST API, single binary deployment, minimal memory footprint)
- **Dashboard & Marketing Site**: Next.js (TypeScript) — SSR for SEO pages/template gallery, React SPA for dashboard
- **Widget**: Vanilla TypeScript, Shadow DOM isolation, no framework dependencies
- **Database**: PostgreSQL with migrations
- **Shared**: TypeScript types and validation schemas shared between dashboard and widget
- **Formula Engine**: TypeScript, shared between dashboard (preview) and widget (runtime)
- **CDN**: Widget bundle served from CDN (CloudFront or similar)

## Agents & Skills

Specialized agents are available for delegating implementation work. They carry full context of the relevant skill files, project documents, and architectural conventions.

### Golang Agent

**Auto-delegates when:** Writing, reviewing, debugging, or modifying Go code in the API server.
**Agent definition:** [.claude/agents/golang.md](.claude/agents/golang.md)
**Skill reference:** [.claude/skills/golang/SKILL.md](.claude/skills/golang/SKILL.md)

### Web Development Agent

**Auto-delegates when:** Writing, reviewing, debugging, or modifying TypeScript/React/Next.js code in the dashboard, marketing site, or widget.
**Agent definition:** [.claude/agents/webdev.md](.claude/agents/webdev.md)
**Skill reference:** [.claude/skills/webdev/SKILL.md](.claude/skills/webdev/SKILL.md)

### Design Skill

**Reference when:** Building UI components, layouts, styling, or making UX decisions for the dashboard, marketing site, or widget.
**Skill reference:** [.claude/skills/design/SKILL.md](.claude/skills/design/SKILL.md)

### Docker Skill

**Reference when:** Writing Dockerfiles, docker-compose configs, or working on container orchestration and deployment.
**Skill reference:** [.claude/skills/docker/SKILL.md](.claude/skills/docker/SKILL.md)

### Code Reviewer Agent

**Invoked when:** A task implementation is complete, before committing. This is a mandatory gate in the workflow (see step 4).
**Agent definition:** [.claude/agents/code-reviewer.md](.claude/agents/code-reviewer.md)
**Reviews:** Security, completeness, test quality, code conventions, and requirement compliance. Must return PASS before code is committed.

## Code Conventions

- **Go backend**: Follow patterns in the [Golang skill](.claude/skills/golang/SKILL.md) — gofmt, error handling, interfaces at consumer, context propagation, structured logging with slog
- **TypeScript frontend**: Follow patterns in the [Web Development skill](.claude/skills/webdev/SKILL.md) — strict mode, no `any`, ES modules, proper React patterns
- The widget must have zero framework dependencies and a minimal bundle size
- The formula engine is TypeScript shared between dashboard (preview) and widget (runtime)
- Shadow DOM for widget CSS isolation — never leak styles into the host page
- All API endpoints follow the patterns in SYSTEM_DESIGN.md (auth, validation, error handling)
- Code to interfaces. Composition over inheritance.
- Build on top of abstraction layers (meaningful internal APIs) that keep state and behavior de-coupled. Push complexity down the stack.
- TDD is mandatory. Write hermetic tests by using stubs, fakes, and custom mocks whenever necessary with a strong preference for stubs.
- Use ubiquitous language and bounded contexts based on the QuoteCraft domain specification to keep code logically organized and understandable.
- Externalize all system configuration into the root `config.yaml` which is organized by service
- Automated testing needs to be comprehensive

## What Not to Do

- Don't force push to remote. Always make separate commits to fix issues
- Don't ignore failing CI results
- Don't skip writing tests to save time
- Don't half-ass an implementation by leaving stubs and TODOs
- Don't add features or refactor code beyond what the current task requires
- Don't deviate from SYSTEM_DESIGN.md architecture without explicit approval
- Don't panic and delete relevant code
- Don't commit multiple tasks in a single commit
- Don't leave PROJECT_STATUS.md out of a commit
