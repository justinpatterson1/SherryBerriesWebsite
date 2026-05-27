# AI Interaction Guidelines

## Workflow

1. **Read context first** — Always read `CLAUDE.md` and referenced context files before starting work.
2. **Confirm before large changes** — For multi-file changes or architectural decisions, outline the plan and get approval.
3. **Work incrementally** — Complete one feature or fix at a time. Don't bundle unrelated changes.
4. **Stay in scope** — Only modify what's asked. No drive-by refactors, extra abstractions, or bonus features.

## Communication

- Be concise and direct.
- Lead with the action or answer, not the reasoning.
- When referencing code, include file paths and line numbers.
- Ask clarifying questions when requirements are ambiguous rather than guessing.

## Code Changes

- Read files before editing them.
- Prefer editing existing files over creating new ones.
- Test that changes don't break the build (`npm run build`, `npm run lint`, `npm test`).
- Follow the conventions in `context/coding-standards.md`.

## Testing

- Unit tests run via Vitest: `npm test` (single run) or `npm run test:watch`.
- **Only test server actions and utilities** — files in `src/actions/**` and `src/lib/**`.
- Do not write tests for React components.
- Co-locate tests next to the source file: `foo.ts` → `foo.test.ts`.
- Tests run in a Node environment (no jsdom).

## What to Avoid

- Don't add comments, docstrings, or type annotations to unchanged code.
- Don't add error handling for impossible scenarios.
- Don't create utilities or abstractions for one-time operations.
- Don't add backwards-compatibility shims — just change the code.
