---
name: optimize-prompt
description: "Optimize a rough prompt into a precise, actionable one ready for another agent session. Use this skill whenever the user asks to improve, rewrite, or optimize a prompt they want to feed to an AI agent — including when they want model/effort/skill recommendations. Also use when the user has a feature description, task outline, or TODO and wants to turn it into a well-structured agent prompt. Triggers on: 'optimize this prompt', 'improve this prompt', 'rewrite for an agent', 'make this prompt better', 'prepare a prompt for', or any request involving prompt quality for agent handoff."
---

# Optimize Prompt

Turn rough, ambiguous, or incomplete prompts into precise, self-contained instructions that another agent can execute in a fresh session with zero prior context.

**Announce at start:** "I'm using the optimize-prompt skill to refine your prompt."

## Why This Matters

A prompt handed to a fresh agent session is the agent's *entire world*. Unlike a conversation where you can course-correct, a prompt-driven session succeeds or fails based on what's written. Vague intent, missing context, implicit assumptions, and unclear success criteria are the top reasons agent sessions produce disappointing results. This skill eliminates those failure modes.

## The Process

```
1. UNDERSTAND — Read the raw prompt, infer intent, identify gaps
2. RESEARCH  — Gather codebase context the agent will need
3. REWRITE   — Produce a structured, self-contained prompt
4. RECOMMEND — Model, effort, and skill selection
5. DELIVER   — Present the final output as a ready-to-use block
```

### Step 1: Understand the Raw Prompt

Read the user's prompt carefully. Identify:

- **Core intent**: What is the user actually trying to accomplish?
- **Implicit assumptions**: What does the user know that the agent won't?
- **Ambiguities**: Where could a fresh agent interpret differently than intended?
- **Missing context**: File paths, data shapes, business rules, UI patterns?
- **Scope boundaries**: What should the agent do vs. not do?

If anything is unclear, ask the user before proceeding — but limit questions to genuine blockers. Prefer researching the codebase over asking obvious questions.

### Step 2: Research Codebase Context

A fresh agent won't have your conversation history. Gather everything it needs:

- **Read the files** mentioned in the prompt — understand current structure, types, patterns
- **Check related files** — imports, types, sibling components, routes, translations
- **Look at data shapes** — what does the data the agent will work with actually look like?
- **Review AGENTS.md** — what project conventions must the agent follow?
- **Check i18n files** — if the task involves UI text, note existing translation key patterns
- **Scan for prior art** — are there similar components/patterns the agent should follow?

Extract the *minimum necessary context* — enough for the agent to work autonomously, not a dump of every file in the repo.

### Step 3: Rewrite the Prompt

Transform the raw prompt into a structured, self-contained document. The rewritten prompt must follow this structure:

```markdown
[One-line summary of the task]

## Context

[2-5 sentences of project/feature context the agent needs.
Include: what the app does, what stack is used, key conventions.]

## Current State

[Description of the current behavior/code that will be changed.
Include: file paths, component names, key data shapes or types.
Inline short code snippets if they clarify the starting point.]

## Requirements

[Numbered list of concrete, verifiable changes.
Each item is one thing the agent can check off.
Group related items under subheadings if >8 items.]

### [Subgroup name]
1. ...
2. ...

### [Subgroup name]
1. ...
2. ...

## Technical Constraints

[Bullet list of non-negotiable rules: patterns to follow,
things to avoid, libraries to use, i18n requirements, etc.]

## References

[File paths, doc URLs, image references the agent should consult.
Be specific: "See `source/app/components/ui/run-card.tsx` for the
existing pattern" — not "check the components folder".]

## Out of Scope

[Explicitly list what the agent should NOT do.
Prevents scope creep and wasted effort.]

## Agent Configuration

- **Model**: [Opus or Sonnet] — [justification]
- **Reasoning effort**: [low/medium/high] — [justification]
- **Skill**: [skill name or None] — [justification]
```

The "Agent Configuration" section at the end of the prompt ensures the executing agent knows which model, effort level, and skill to use — even if the person copy-pasting doesn't set these manually.

**Rewriting principles:**

- **Self-contained**: The prompt must work in a fresh session with zero conversation history. Never reference "what we discussed" or assume shared context.
- **Concrete over abstract**: "Show a `<s-badge tone='success'>nuovo</s-badge>` next to the title" beats "show a success indicator".
- **Verifiable**: Every requirement should be checkable. "The badge text must be lowercase" is verifiable. "Make it look nice" is not.
- **Ordered by dependency**: Put foundational changes first. If requirement 5 depends on requirement 2, the numbering should reflect that.
- **No redundancy**: Say each thing once. If a constraint applies to multiple requirements, put it in Technical Constraints, not repeated in each requirement.
- **Preserve the user's intent**: Don't add features or change scope. Clarify and structure what the user asked for — don't reinterpret it.
- **Include i18n keys**: If the task involves user-visible strings, specify the exact translation keys and values for all supported locales.

### Step 4: Recommend Model, Effort, Skill, and Tool

Based on the task's characteristics, recommend four things:

#### Model Selection (Opus vs Sonnet)

| Signal | → Model |
|--------|---------|
| Single file, clear spec, mechanical changes | Sonnet |
| 1-3 files, well-defined UI or logic changes | Sonnet |
| Multi-file with integration concerns, ambiguous requirements | Opus |
| Architectural decisions, >10K lines touched, multi-service | Opus |
| New patterns without prior art in the codebase | Opus |
| Complex state management or data flow redesign | Opus |

**Default to Sonnet** — it's faster and cheaper. Recommend Opus only when the complexity signals are strong.

#### Reasoning Effort

| Signal | → Effort |
|--------|----------|
| Straightforward implementation, clear spec, existing patterns | Low |
| Moderate complexity, some judgment calls, 2-5 files | Medium |
| Novel patterns, complex logic, many interacting requirements | High |
| Ambiguous requirements, architectural decisions | High |

**Default to medium** — it covers most implementation tasks well.

#### Skill Selection

Evaluate whether a skill would improve the agent's output. Only recommend a skill if it genuinely helps — not every task needs one.

| Situation | → Skill |
|-----------|---------|
| Task has 5+ independent sub-tasks | `/subagent-driven-development` |
| Task needs a phased implementation plan | `/writing-plans` |
| Task involves building Polaris web component UI | `/shopify-polaris-web-components` |
| Task involves designing or improving UI surfaces | `/frontend-design` |
| Task is a single focused change, <3 files | No skill needed |
| Task has 2+ fully independent workstreams | `/dispatching-parallel-agents` |

If a skill is recommended, include the invocation instruction in the output prompt (e.g. "Invoke the `writing-plans` skill to...").

#### Tool Selection

Recommend the best tool for executing the prompt:

| Signal | → Tool |
|--------|--------|
| Multi-file edits, UI work, needs file explorer/preview, uses skills | **Copilot for VS Code** |
| Single-file scripting, shell automation, quick CLI tasks | **Copilot CLI** (`gh copilot`) |
| Long-running autonomous tasks, complex orchestration, deep research | **Claude CLI** (`claude`) |
| Needs MCP servers (Prisma, Shopify, Context7) | **Copilot for VS Code** or **Claude CLI** |

**Default to Copilot for VS Code** — it has full workspace context, skill support, and MCP access. Recommend Claude CLI for heavily autonomous multi-step work. Recommend Copilot CLI only for simple, terminal-centric tasks.

### Step 5: Deliver the Output

Present the final output in this format:

---

**Tool**: `Copilot for VS Code`, `Copilot CLI`, or `Claude CLI` — with a one-line justification
**Model**: `Sonnet` or `Opus` — with a one-line justification
**Reasoning effort**: `low`, `medium`, or `high` — with a one-line justification
**Skill**: `/<skill-name>` or `None` — with a one-line justification

Then the full rewritten prompt in a fenced code block, ready to copy-paste:

````
```
[The complete rewritten prompt]
```
````

---

## Branch-Aware Prompts

When the user asks to run the work in a specific branch (e.g. "do this on a new branch", "use branch X", "create a feature branch"), the generated prompt must encode branch management so the executing agent doesn't skip it.

### When the user asks for a new branch

Determine a branch name if the user hasn't provided one. Use the prefix `feat/` for additive work and `fix/` for bug fixes, followed by a short descriptive slug (2-4 words, kebab-case):

- `feat/image-upload`
- `feat/variant-matching-ui`
- `fix/csv-parsing`
- `fix/offline-token-refresh`

Pick the prefix based on the nature of the task. When in doubt, use `feat/`.

Add the following to the **Technical Constraints** section of the rewritten prompt:

```
- Work on branch `<branch-name>`. Create it from the current HEAD with:
  `git checkout -b <branch-name>`
  All file edits, migrations, and commits must happen on this branch.
- Name for the first commit that adds or modifies files: use Conventional Commits format,
  e.g. `feat(scope): short description` or `fix(scope): short description`.
```

### When the user names an existing branch

If the user specifies an existing branch by name, add to **Technical Constraints**:

```
- Check out branch `<branch-name>` before making any changes:
  `git checkout <branch-name>`
  All work must be committed to this branch.
```

### Placement in the prompt

Branch instructions belong in **Technical Constraints** — not in Requirements (they're not feature requirements) and not in a standalone section (they're setup mechanics). This keeps branch context discoverable but not buried.

## Anti-Patterns

- **Context dumping**: Don't paste entire files into the prompt. Extract the relevant parts.
- **Over-specifying implementation**: Describe *what* should happen, not *how* to code it line-by-line (unless the user explicitly wants that level of detail).
- **Forgetting i18n**: If the task has user-visible strings, always include translation requirements.
- **Scope inflation**: Don't add requirements the user didn't ask for. Optimize the prompt, don't redesign the feature.
- **Forgetting branch setup**: If the user requested a branch, always include it in Technical Constraints — don't leave it as an implicit expectation.
- **Vague references**: "Check the docs" → "See https://specific-url#section". "Look at the component" → "See `source/app/components/ui/run-card.tsx:45-80`".
- **Missing the out-of-scope section**: Fresh agents love to "improve" things. Explicit boundaries prevent this.
