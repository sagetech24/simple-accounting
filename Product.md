# Product Module

Scope and backlog for Product Price Monitoring live in the **product** Cursor skill (agent workflow + full reference).

| Resource | Path |
|----------|------|
| Agent skill (use for future features) | [`.cursor/skills/product/SKILL.md`](.cursor/skills/product/SKILL.md) |
| Full domain / backlog reference | [`.cursor/skills/product/reference.md`](.cursor/skills/product/reference.md) |
| Always-on PRD | [`.cursor/rules/PRD.mdc`](.cursor/rules/PRD.mdc) |

**How to use:** ask the agent to improve or add a Product feature (e.g. “add admin margin”, “price history”, “availability badge”). The product skill classifies tier (core / polish / v1.x), maps files, and enforces `purchase_price` privacy and soft-delete rules.
