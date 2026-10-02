# Git & GitHub Workflow Guide

This document outlines the version control policies, branching model, commit conventions, code review standards, and collaboration workflows for the **Online Book Inventory & Reservation System**.

---

## 1. Branching Strategy

We follow a structured Git feature-branch workflow designed to ensure code stability, auditability, and seamless teamwork.

```
       feat/user-reservations  ───●───●───●──────┐
      /                                           ▼ (Pull Request)
master (or main) ─────────────────────────────────●───────────────────● (Release Tag)
      \                                           ▲ (Pull Request)
       fix/inventory-lock-race ───●───●───────────┘
```

### Branch Types

| Branch Name | Source | Target | Purpose | Example |
|---|---|---|---|---|
| `main` / `master` | — | — | Production-ready, fully tested codebase. Protected from direct pushes. | `master` |
| `feature/<name>` | `master` | `master` | New user-facing features or system enhancements. | `feature/reservation-cancellation` |
| `fix/<name>` | `master` | `master` | Bug fixes and defect corrections. | `fix/overdue-calculation-timezone` |
| `chore/<name>` | `master` | `master` | Tooling updates, dependency bumps, docs, and maintenance. | `chore/update-readme-architecture` |
| `test/<name>` | `master` | `master` | Test suite enhancements and QA harnesses. | `test/concurrency-race-conditions` |

### Branch Naming Rules
- Use lowercase alphanumeric characters and hyphens (`-`).
- Always prefix with the branch category (`feature/`, `fix/`, `chore/`, `test/`).
- Keep branch names concise and descriptive (e.g., `feature/admin-book-modal`, not `feature/update123`).

---

## 2. Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification to ensure an informative and searchable Git history.

### Commit Format

```text
<type>(<scope>): <short imperative description>

[optional longer body explaining context, rationale, and non-obvious design choices]

[optional issue/ticket reference]
```

### Types
- `feat`: A new feature for users or administrators
- `fix`: A bug fix
- `docs`: Documentation only changes (e.g., `README.md`, `/docs`)
- `test`: Adding missing tests or correcting existing tests
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `style`: Formatting, missing semi-colons, white-space changes
- `chore`: Build process, package dependencies, or auxiliary tool changes

### Examples
- `feat(reservations): implement transaction-safe inventory decrement on reservation`
- `fix(auth): return 401 when Bearer token header is malformed`
- `docs(git): document branching strategy and PR checklist`
- `test(catalog): add integration tests for author deletion cascade`

### Commit Best Practices
1. **Atomic Commits**: Each commit should represent a single logical unit of work.
2. **Imperative Mood**: Use "Add feature" rather than "Added feature" or "Adds feature".
3. **No Secrets**: Never commit `.env` files, passwords, JWT secrets, or cloud credentials.
4. **Clean Working Tree**: Ensure `git status` shows no stray files, logs, or build artifacts before staging.

---

## 3. Step-by-Step Developer Workflow

### Step 1: Sync with Upstream
Before starting work on any feature or fix, pull the latest changes from the base branch:
```bash
git checkout master
git pull origin master
```

### Step 2: Create a Dedicated Branch
```bash
git checkout -b feature/book-search-filter
```

### Step 3: Implement & Test Incrementally
Make focused changes to the codebase:
- Write clean, modular, and maintainable code.
- Run tests regularly to catch regressions early:
```bash
# Run backend test suite (95 tests)
npm run test:backend

# Run frontend test suite (37 tests)
npm run test:frontend

# Verify production frontend build
npm run build:frontend
```

### Step 4: Stage & Commit
Review local changes before staging:
```bash
git status
git diff

# Stage specific files (or git add . after verifying git status)
git add src/components/BookSearch.jsx
git commit -m "feat(catalog): add real-time debounce search filter"
```

### Step 5: Push Branch & Open Pull Request
Push your branch to the remote repository:
```bash
git push -u origin feature/book-search-filter
```
Navigate to GitHub and open a Pull Request (PR) targeting `master`.

---

## 4. Pull Request & Code Review Workflow

### Pull Request Description Template
Every PR must include:
1. **Summary of Changes**: High-level explanation of what was changed and why.
2. **Impacted Areas**: Backend routes, database tables, or React components affected.
3. **Testing Evidence**: Output logs or screenshots confirming tests passed.
4. **Related Issues**: e.g., `Closes #42`.

### Code Review Checklist
Before approving and merging a PR, the reviewer must verify:
- [ ] **Functionality**: Does the code meet all acceptance criteria?
- [ ] **Security**: Are inputs validated and sanitized? Are database queries parameterized? No secrets exposed?
- [ ] **Data Integrity**: Are multi-step database updates enclosed in MySQL transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`)?
- [ ] **Error Handling**: Are errors caught gracefully and returned with structured JSON (`{ success: false, message: ... }`)?
- [ ] **Regression & Tests**: Did all backend (95) and frontend (37) tests pass without errors?
- [ ] **Build Verification**: Does `npm run build:frontend` compile with zero errors?
- [ ] **Clean Git History**: Are commit messages clear and conventional?

---

## 5. Merge Conflict Resolution

If the upstream `master` branch has progressed while your feature branch was in progress, resolve conflicts locally before merging:

### Method A: Rebase (Recommended for clean linear history)
```bash
git checkout feature/book-search-filter
git fetch origin
git rebase origin/master
```
If conflicts arise:
1. Git will pause and flag conflicting files.
2. Open each conflicting file and look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Resolve the conflict by choosing the correct code logic.
4. Stage resolved files: `git add <resolved-file>`.
5. Continue rebase: `git rebase --continue`.
6. Run the complete test suite: `npm test`.
7. Push force-with-lease to your branch: `git push --force-with-lease origin feature/book-search-filter`.

### Method B: Standard Merge
```bash
git checkout feature/book-search-filter
git fetch origin
git merge origin/master
# Resolve conflicts in editor, stage files, and commit:
git commit -m "merge: resolve conflicts with master"
npm test
git push origin feature/book-search-filter
```

---

## 6. Sensitive Files & Credential Safety

### Protection Rules
- **Never commit `.env` or `.env.*` files**: These are strictly ignored by `.gitignore`.
- **Use `.env.example` templates**: Placeholders only. No passwords, API keys, or production secrets.
- **Pre-commit Audit**:
  Always run `git status` and verify that neither `.env`, `node_modules/`, `dist/`, nor log files are staged.
- **Accidental Commit Remediation**:
  If a secret is accidentally committed locally (unpushed):
  ```bash
  git reset --soft HEAD~1
  git restore --staged .env
  git commit -c ORIG_HEAD
  ```
  If pushed to a remote repository, immediately revoke/rotate the compromised secret and rewrite git history using `git filter-repo` or BFG Repo-Cleaner.

---

## 7. Versioning & Releases

We use [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):
- `MAJOR`: Incompatible API changes or complete architecture rewrites.
- `MINOR`: Backwards-compatible new features (e.g., adding a report export feature).
- `PATCH`: Backwards-compatible bug fixes.

When releasing a new version:
```bash
git checkout master
git pull origin master
git tag -a v1.0.0 -m "Release v1.0.0: Initial production release with 12 complete phases"
git push origin v1.0.0
```
