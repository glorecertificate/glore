---
name: i18n-audit
description: 'Audit and fix translation files. Use when: checking unused translation keys, syncing it.json and en.json, removing orphaned keys, fixing malformed ICU/placeholder strings, sorting translation files alphabetically, ensuring Italian (primary locale) drives the key structure.'
argument-hint: 'Optional: --dry-run to preview changes without writing files'
---

# i18n Audit

Scans the source tree for translation key usage, cleans both locale files, and enforces structural consistency between `it.json` (primary) and `en.json`.

## When to Use

- After adding or removing features that include translated strings
- Before a release, to avoid shipping dead translation keys
- When `en.json` and `it.json` have diverged in structure
- When a colleague reports a missing or broken translation
- Periodically as a hygiene step

## Rules

1. **Italian is the source of truth.** `it.json` drives the key set. Any key in `en.json` that is absent from `it.json` is removed.
2. **Unused keys are removed.** Keys not referenced in any `src/` file are deleted from both files.
3. **Missing EN keys are flagged.** Keys in `it.json` with no counterpart in `en.json` are reported for manual translation.
4. **Format issues are detected.** Unbalanced `{}`  or placeholder mismatches between locales are reported.
5. **Both files are sorted.** Keys are sorted alphabetically (recursively), and both files are made structurally identical.

## Procedure

### 1. Run the audit script

```bash
node .agents/skills/i18n-audit/scripts/audit.js
```

Add `--dry-run` to preview without writing, `--remove-unused` to also delete unused keys, or `--verbose` to log every key checked:

```bash
# Preview everything, write nothing
node .agents/skills/i18n-audit/scripts/audit.js --dry-run

# Fix + sort + remove EN-only keys (safe default — unused keys are only reported)
node .agents/skills/i18n-audit/scripts/audit.js

# Fix + sort + remove unused keys too (use after confirming the unused list is safe)
node .agents/skills/i18n-audit/scripts/audit.js --remove-unused --verbose
```

### 2. Review the output

The script prints a structured report with five sections:

| Section | What it shows |
|---|---|
| Step 1 | Key references found in `src/` |
| Step 2 | Unused keys in `it.json` (will be removed) |
| Step 3 | EN-only keys that have no IT counterpart (will be removed) |
| Step 4 | IT keys missing from EN — **requires manual translation** |
| Step 5 | Malformed or mismatched placeholder patterns |

### 3. Handle manual items

If Step 4 or Step 5 report issues that the script cannot auto-fix:

- **Missing EN translations**: add the key to `en.json` with the translated value.
- **Placeholder mismatch**: inspect both the IT and EN strings and align the `{variable}` names.
- **Unbalanced braces**: correct the malformed string in `it.json`, then re-run.

### 4. Verify

After the script writes changes:

```bash
npm run check
```

Confirms types still compile and no keys are referenced that no longer exist.

## Script Reference

[audit.js](./scripts/audit.js) — main audit script (Node.js ESM, no dependencies)

### What it does internally

1. Loads `messages/it.json` and `messages/en.json`
2. Flattens both to dot-path maps (`Advisor.Chats.title`)
3. Scans all `.ts/.tsx` files in `src/` for `useTranslations`, `getTranslations`, `t('key')`, and `intlMetadata` calls
4. Cross-references found keys against both flat maps
5. Rebuilds cleaned objects, sorts all keys recursively, writes back

### Edge cases

- Keys used only via dynamic interpolation (e.g. `` t(`label-${status}`) ``) will appear unused. The script will warn but you should **keep those keys manually** — add them to a safelist comment near the dynamic usage.
- Keys shared across multiple namespaces with the same name are resolved per-file via the namespace declared in that file.
