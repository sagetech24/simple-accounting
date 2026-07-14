---
name: commit-message-summary
description: >-
  Summarizes agent work and drafts a copy-paste Git commit message from session
  changes. Use when finishing implementation tasks, after creating or updating
  files, or when the user asks for a commit message. Does not run git commit or
  push — output is for manual use only.
---

# Commit Message Summary

## Purpose

At the end of work that changed the repository, produce a short **change summary** and a **recommended commit message** the user can copy into their own `git commit` flow. Never commit or push on the user's behalf unless they explicitly ask.

## When to apply

- After creating, updating, or deleting project files
- When the user asks for a commit message or change summary
- At the end of any implementation or fix task (paired with the project rule)

Skip the commit block when:
- The turn was question-only or review-only with **no** file changes
- The user explicitly said not to include a commit message

## Workflow

1. **Inventory changes** (when practical, run in parallel):
   - `git status` — untracked and modified files
   - `git diff` — unstaged changes
   - `git diff --staged` — staged changes
   - If git is unavailable, use the files you edited in the session

2. **Summarize for the user** (2–5 bullets):
   - What was created, updated, or removed
   - Why it matters (behavior, bug fix, UX), not a raw file list
   - Group related files; omit noise (formatting-only unless that was the task)

3. **Draft the commit message** using this repo's style (see below)

4. **Present for copy-paste** in the fixed footer format — do not run `git commit`, `git push`, or `gh`

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
- One logical change per message; if the session mixed unrelated work, suggest **separate** commits
- Do not include secrets, `.env`, or credentials in the message or summary
- Do not suggest committing files that should stay local (e.g. `.env`)

## Response footer (required when there are changes)

End the user-facing response with this block so they can copy it for a manual commit:

```markdown
---

## Recommended commit message

\`\`\`
<paste-ready commit message here>
\`\`\`

**Changed:** <one-line roll-up, e.g. "3 files — home search UI, ProductController filters">

_Manual commit only — not executed by the agent._
```

If multiple commits are clearer, use numbered blocks:

```markdown
### Commit 1
\`\`\`
feat: ...
\`\`\`

### Commit 2
\`\`\`
style: ...
\`\`\`
```

## What not to do

- Do not run `git commit`, `git push`, or open a PR unless the user explicitly requests it
- Do not amend or force-push unless the user's commit rules allow it and they asked
- Do not invent changes — only describe what was actually done in the session or diff
- Do not bury the commit block inside long prose; keep it as the **last** section of the response
