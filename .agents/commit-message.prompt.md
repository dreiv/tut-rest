# Generate Conventional Commit Message

Analyze current git changes (`git diff --cached` or `git diff`) and generate a conventional commit message.

## Rules

- **Type**: Choose from `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, or `chore`.
- **Scope**: Identify the affected area (e.g., `auth`, `api`). Omit if unclear.
- **Summary**: Short, imperative sentence. No capitalization at start, no trailing period.
- **Body/Footer**: Include only if changes are complex or have breaking changes/issue refs.

## Format

`<type>(<scope>): <summary>`

`[optional body]`

`[optional footer]`

Example: `feat(auth): add JWT-based login functionality`
