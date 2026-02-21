You are building the QuoteCraft project. Follow the workflow defined in CLAUDE.md exactly:

0. If there are uncommitted changes, resume the implementation. If you cant find an "In Progress" task, check the git log and "decision" directory for context."
1. Open PROJECT_STATUS.md and find the next incomplete task (P0 first, top-to-bottom). Mark its status as "In Progress".
2. Read the user story and acceptance criteria in PROJECT_PLAN.md.
3. Read linked requirements in REQUIREMENTS.md.
4. Read relevant sections of SYSTEM_DESIGN.md.
5. Implement the task. Write tests alongside implementation.
6. After implementation, invoke the code-reviewer agent. Fix issues until it passes.
7. Commit with the format: [TASK-ID] Brief description. Include updated PROJECT_STATUS.md.
8. Move to the next task and repeat.

Continue until you run out of tasks or context. Stay focused — one task at a time.
