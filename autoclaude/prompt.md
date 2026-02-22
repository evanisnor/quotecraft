You are building Phase 1 of the QuoteCraft project. Follow the workflow defined in CLAUDE.md exactly:

1. If there are uncommitted changes, resume the implementation. If you cant find an "In Progress" task, check the git log and "decision" directory for context."
2. Open PROJECT_STATUS.md and find the next incomplete task (P0 first, top-to-bottom). Mark its status as "In Progress".
3. Read the user story and acceptance criteria in PROJECT_PLAN.md.
4. Read linked requirements in REQUIREMENTS.md.
5. Read relevant sections of SYSTEM_DESIGN.md.
6. Implement the task. Write tests alongside implementation.
7. After implementation, invoke the code-reviewer agent. Fix issues until it passes.
8. Commit with the format: [TASK-ID] Brief description. Include updated PROJECT_STATUS.md.
9. Move to the next task and repeat.

Continue until you run out of tasks for the current phase. Stay focused — one task at a time.

Do not proceed to the next phase of the project without human intervention. Once all tasks in the current phase are complete, review the implementation for adherence to the REQUIREMENTS.md, PROJECT_PLAN.md, and SYSTEM_DESIGN.md documents. Once the current phase is complete and implemented according to completeness and quality standards, stop all work gracefully and wait for human intervention.