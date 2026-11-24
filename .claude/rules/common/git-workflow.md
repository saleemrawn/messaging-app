# Git Workflow

## Commit Message Format

```
<type>(<scope>): <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Scope is the app being changed, e.g. `feat(api): …`, `fix(web): …`, `chore(web): …`. This is the same format as the Git section in the root CLAUDE.md.

## Important Notes

- DO NOT add authors or co-authors to git commit message

## Pull Request Workflow

When creating PRs:

1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

> For the full development process (planning, TDD, code review) before git operations,
> see [development-workflow.md](./development-workflow.md).
