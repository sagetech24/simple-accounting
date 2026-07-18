---
name: commit-message-summary
description: >-
  Summarizes repo changes, drafts a conventional commit message, then runs
  git add, commit, and push. Use when the user invokes /commit-message or
  explicitly asks to commit with this skill.
---

# Commit Message Summary

## Purpose

When this skill is invoked (especially via `/commit-message`):

1. Inventory and summarize changes
2. Draft a conventional commit message
3. **Always** stage, commit, and push those changes

Do not stop after drafting the message — execute the git flow every time this skill is called.

## When to apply

- User invokes `/commit-message`
- User explicitly asks to commit using this skill

Skip entirely when:
- There are **no** file changes to commit
- The user explicitly said not to commit

## Workflow

1. **Inventory changes** (run in parallel when practical):
   - `git status` — untracked and modified files
   - `git diff` — unstaged changes
   - `git diff --staged` — staged changes
   - `git log -5 --oneline` — recent commit message style
   - If git is unavailable, use the files edited in the session

2. **Summarize for the user** (2–5 bullets):
   - What was created, updated, or removed
   - Why it matters (behavior, bug fix, UX), not a raw file list
   - Group related files; omit noise (formatting-only unless that was the task)

3. **Draft the commit message** using this repo's style (see below)

4. **Stage, commit, and push** (required — do not ask for confirmation):
   - Warn and exclude secrets (`.env`, credentials, etc.); never commit them
   - Stage relevant files: `git add` for the changed paths (prefer explicit paths over blanket `git add .` when mixed with unrelated files)
   - Commit with a HEREDOC (never `-i` flags):

     ```bash
     git commit -m "$(cat <<'EOF'
     <type>: <subject>

     <optional body>
     EOF
     )"
     ```

   - Push the current branch to its remote (`git push` or `git push -u origin HEAD` if no upstream)
   - Run `git status` after push to verify success
   - If a pre-commit hook fails: fix the issue, then create a **new** commit (do not amend unless user rules allow it)
   - Never force-push, amend, or skip hooks unless the user explicitly asks
   - Never update git config

5. **Present the result** in the response footer (message used + outcome)

## Commit message format

Match recent commit history: short **type** prefix, imperative mood, focus on **why**.

**Types** (pick one): `feat`, `fix`, `style`, `refactor`, `test`, `docs`, `chore`

**Structure:**

```text
<type>: <concise subject in imperative mood>

<optional body — 1–3 sentences on why, not a file manifest>
```

**Examples:**

```text
feat: add public product search by name and category
```

```text
style: tighten public landing spacing for tablet
```

```text
fix: hide purchase price from guest product payloads

Public Inertia props must never include purchase_price per PRD.
```

**Rules:**
- Subject line ~50–72 characters when possible; body only if it adds context
- One logical change per message; if the session mixed unrelated work, prefer **separate** commits (add/commit each, then one push)
- Do not include secrets, `.env`, or credentials in the message or summary
- Do not commit files that should stay local (e.g. `.env`)

## Response footer (required when there are changes)

End the user-facing response with this block:

```markdown
---

## Commit

\`\`\`
<commit message that was used>
\`\`\`

**Changed:** <one-line roll-up, e.g. "3 files — home search UI, ProductController filters">

**Git:** committed and pushed to `<branch>` (`<short-sha>` or remote result)
```

If multiple commits were clearer:

```markdown
### Commit 1
\`\`\`
feat: ...
\`\`\`

### Commit 2
\`\`\`
style: ...
\`\`\`

**Git:** both committed and pushed to `<branch>`
```

## What not to do

- Do not stop at a copy-paste draft when this skill was invoked — always `git add`, `git commit`, and `git push`
- Do not invent changes — only commit what appears in the status/diff
- Do not bury the commit block inside long prose; keep it as the **last** section of the response
- Do not open a PR unless the user explicitly asks
- Do not force-push to main/master; warn if the user requests it
