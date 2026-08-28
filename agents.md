# Repository Development Rules

## Scope

- Work only inside this repository.
- Do not modify files outside this repository.
- Do not modify unrelated files.
- Keep all changes narrowly scoped to the requested task.
- Do not perform unsolicited refactors, cleanup, reformatting, or dependency updates.

## Supplemental Project Context

- Before beginning project work, look for `Codex_Content.local.md` in the repository root. If it exists, read it as supplemental project context.
- `Codex_Content.local.md` is not authorization to implement documented backlog items.
- Explicit user instructions take precedence over both the local context file and the repository state. When the local context conflicts with the current source or repository state, the current source and repository state take precedence.
- If `Codex_Content.local.md` does not exist, continue normally without error and without requiring it.
- After completing requested project work, evaluate whether the changes materially affect durable project context in `Codex_Content.local.md`. If an update is warranted, propose the specific changes and request approval before modifying it. Do not update it for trivial implementation details or routine changes that do not materially affect project knowledge.

## Git Operations

- Never commit, push, merge, rebase, or create, delete, or switch branches unless the user explicitly requests that operation.
- Do not discard or overwrite existing uncommitted changes.
- Treat existing changes as user-owned unless clearly established otherwise.

## Before Making Changes

- Inspect the relevant existing implementations, surrounding code, configuration, and tests before editing.
- Preserve existing behavior unless the requested change explicitly requires otherwise.
- If a requested change is ambiguous and different interpretations could materially affect the result, ask the user for clarification rather than guessing.
- Before making a multi-file change, tell the user which files you intend to modify.

## Editing

- Make the smallest practical change that satisfies the request.
- Follow the repository’s existing architecture, conventions, naming, formatting, and patterns.
- Avoid broad rewrites when a targeted edit is sufficient.
- Do not overwrite or delete backup or archive files unless the user explicitly instructs you to do so.
- Do not rename, move, generate, or remove files unless required by the requested change.
- Do not start, stop, restart, install, update, or modify development services, dependencies, or development tooling without explicit user approval.

## Validation

- Running existing validation commands is permitted when appropriate.
- After code changes, run appropriate validation when practical and proportional to the change.
- Prefer the repository’s existing tests, type checking, linting, and build commands.
- Do not silently fix unrelated validation failures.
- Report which validation commands were run and their results.
- If validation cannot be run, explain why.
