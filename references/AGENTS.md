# `references/` — Agent Guide

This folder holds **authoritative external material** used to plan and validate the TTCN-3 grammar. Everything here is **read-only reference material** — it is not part of the grammar itself, must not be edited as part of grammar work, and must not be cited as authoritative for things outside its domain.

If you only have time to skim this file, read the [Quick reference](#quick-reference-which-subfolder-for-which-question) and the [Anti-patterns](#anti-patterns) sections — everything else is supporting detail.

---

## Quick reference: which subfolder for which question?

| If the question is… | Look in… |
|---------------------|----------|
| "Is this construct valid TTCN-3?" / "What does the standard say about X?" | [`specs/`](./specs/) |
| "Where can I find a real-world `.ttcn` example of X?" / "Does the grammar parse file Y?" | [`code/`](./code/) |
| "How do I write a tree-sitter rule in `grammar.js`?" / "What does a DSL function do?" | [`tree-sitter-doc/Tree-sitter-#2-creating-parsers.md`](./tree-sitter-doc/Tree-sitter-#2-creating-parsers.md) |
| "What does a `tree-sitter <cmd>` flag do?" / "What goes in `tree-sitter.json`?" | [`tree-sitter-doc/Tree-sitter-#5-cli-reference.md`](./tree-sitter-doc/Tree-sitter-#5-cli-reference.md) |
| "How do I write a tree-sitter query / `.scm` file?" / "What does `(ERROR)` / `MISSING` mean?" | [`tree-sitter-doc/Tree-sitter-#1-using-parsers.md`](./tree-sitter-doc/Tree-sitter-#1-using-parsers.md) |
| "How do I write a `queries/highlights.scm`?" / "How do language injections work?" | [`tree-sitter-doc/Tree-sitter-#3-syntax-highlighting.md`](./tree-sitter-doc/Tree-sitter-#3-syntax-highlighting.md) |
| "How do I write a `queries/tags.scm`?" / "What are `@definition.function` etc.?" | [`tree-sitter-doc/Tree-sitter-#4-code-navigation.md`](./tree-sitter-doc/Tree-sitter-#4-code-navigation.md) |
| "How do I use the parser API from C / a binding?" / "What does `node-types.json` mean?" | [`tree-sitter-doc/Tree-sitter-#1-using-parsers.md`](./tree-sitter-doc/Tree-sitter-#1-using-parsers.md) |
| "How do I contribute to tree-sitter upstream?" / "What is the release process?" | [`tree-sitter-doc/Tree-sitter-#5-implementation-#6-contributing.md`](./tree-sitter-doc/Tree-sitter-#5-implementation-#6-contributing.md) (rarely needed for this project) |

---

## Subfolders

### `specs/` — TTCN-3 normative specification

| File | Role |
|------|------|
| `TTCN-3 Core Language, ETSI ES 201 873-1.md` | **ETSI ES 201 873-1 V4.17.1 (2025-09)** — the authoritative TTCN-3 Core Language standard. Single source of truth for what the grammar must accept. |

Anchor points inside this file (per the project README):

- **Annex A (line 21740)** — extended BNF for TTCN-3
- **Annex B (line 23384)** — template matching mechanisms
- **Annex C (line 24765)** — predefined functions

**Use this folder when:** resolving whether a TTCN-3 construct is valid, looking up BNF syntax, or scoping which parts of the language the grammar still needs to cover.

**Do NOT use this folder when:** looking for tree-sitter DSL syntax, CLI usage, or parser API details — those are in `tree-sitter-doc/`.

### `code/` — Real-world TTCN-3 source

| Subfolder | Role |
|-----------|------|
| `NR5GC_IWD_26wk24/` | 3GPP NR5GC conformance testsuite snapshot (385 `.ttcn` files, ~19.5 MB). Empirical oracle for grammar validation — the goal is for every file here to parse cleanly. |

> **NOTE:** `code/` is **not committed to git**. The 3GPP NR5GC testsuite is a large proprietary download. The README documents the layout so the folder can be regenerated from the [3GPP FTP](https://www.3gpp.org/ftp/tsg_ran/WG5_Test_ex-T1/TTCN/Deliveries/TTCN3/iwd-TTCN3-B2026-03_D26wk24.zip).

**Use this folder when:** finding real-world TTCN-3 examples of a construct, building a failing corpus to reproduce a grammar bug, or measuring grammar coverage against a known conformance suite.

**Do NOT use this folder when:** looking for canonical grammar rules (use `specs/`) or tree-sitter DSL help (use `tree-sitter-doc/`).

### `tree-sitter-doc/` — Tree-sitter official docs (offline mirrors)

Six markdown files that mirror the [official Tree-sitter docs](https://tree-sitter.github.io/tree-sitter/). Upstream is a multi-page site; here it is collapsed into six long-form `.md` files in the site's reading order. These exist so the docs can be searched and cited offline — they are not modified, not authoritative for TTCN-3, and not a substitute for the upstream site when the latest API is needed.

| # | File | Topic | When to read |
|---|------|-------|--------------|
| 1 | `Tree-sitter-#1-using-parsers.md` | C parser API, syntax trees, queries (S-expressions), predicates, `node-types.json`, ABI versions | consume a parser programmatically, write a tree-sitter query (`queries/*.scm`), or interpret parser output |
| 2 | `Tree-sitter-#2-creating-parsers.md` | `grammar.js` DSL (`seq` / `choice` / `prec` / `field` / `alias` / …), rule design, precedence & associativity, conflicts, hidden rules, fields, extras, supertypes, lexical analysis, external scanners, corpus tests, publishing & semver | **edit `grammar.js`, design new rules, or debug parse conflicts** — the most-used file for grammar work |
| 3 | `Tree-sitter-#3-syntax-highlighting.md` | `queries/highlights.scm`, locals queries (`@local.scope` / `@local.definition` / `@local.reference`), language injection, `tree-sitter highlight` CLI | author syntax-highlighting queries or configure an embedded-language injection |
| 4 | `Tree-sitter-#4-code-navigation.md` | `queries/tags.scm`, `@role.kind` captures, `#select-adjacent!` / `#strip!` directives, `tree-sitter tags` CLI | author code-navigation queries (definitions, references, symbols) for LSP-style features |
| 5 | `Tree-sitter-#5-cli-reference.md` | Every `tree-sitter` subcommand: `init-config`, `init`, `generate`, `build`, `parse`, `test`, `fuzz`, `query`, `highlight`, `tags`, `version`, `playground`, `dump-languages`, `complete`, plus the `tree-sitter.json` schema | look up a CLI flag, a CLI option, or a `tree-sitter.json` field |
| 6 | `Tree-sitter-#5-implementation-#6-contributing.md` | Tree-sitter internals (CLI pipeline, parse tables), AI contribution policy, release workflow, debugging tools (sanitizers, lldb pretty printers), published packages | work on tree-sitter itself (rare for this project) — relevant when preparing upstream patches |

**Use this folder when:** you need any tree-sitter reference — DSL syntax, CLI usage, query syntax, parser API, or release process.

**Do NOT use this folder when:** answering TTCN-3 semantics questions. These files are about the *tool*, not the *language*. For TTCN-3 correctness, always defer to `specs/`.

---

## Lookup strategies

The tree-sitter-doc files are long (the biggest is ~1480 lines). To find information efficiently:

1. **Start from the Quick-reference table above.** It maps question shapes to specific files. Do not read all six files top-to-bottom.
2. **Use `grep` / `ripgrep` on a specific term** inside a single file. For example:
   - "What does `prec.dynamic` do?" → grep `prec.dynamic` in `Tree-sitter-#2-creating-parsers.md`.
   - "What is `injection.combined`?" → grep `injection.combined` in `Tree-sitter-#3-syntax-highlighting.md`.
3. **For grammar DSL work, jump straight to `Tree-sitter-#2-creating-parsers.md`.** This is the canonical reference for any `grammar.js` work — precedence, associativity, conflicts, fields, extras, supertypes, lexical analysis, and external scanners are all in here.
4. **For CLI flag lookups, jump to `Tree-sitter-#5-cli-reference.md`.** It is organized as one section per subcommand.
5. **For the parser API / queries, jump to `Tree-sitter-#1-using-parsers.md`.** It is organized as: Getting Started → Basic Parsing → Advanced Parsing → Cursors → Query Syntax → Query Operators → Predicates → Static Node Types → ABI Versions.
6. **When in doubt about a TTCN-3 construct, prefer `specs/` over `tree-sitter-doc/`.** The latter only tells you what the *tool* can express — not what TTCN-3 actually allows.

For deeper, multi-source investigation, fire a `codegraph_explore` or `librarian` background agent with the question rather than re-reading the files yourself.

---

## Anti-patterns

These are common mistakes when working with this folder. **Do not do any of these:**

- **Do NOT edit any file under `references/` as part of grammar work.** These are external reference material. Edits to the spec or tree-sitter docs must happen upstream, not here.
- **Do NOT cite tree-sitter-doc as authoritative for TTCN-3 grammar correctness.** The files describe what the *tool* can parse, not what TTCN-3 *should* parse. For TTCN-3 semantics, cite `specs/`.
- **Do NOT cite specs/ for tree-sitter DSL or CLI questions.** Those are tool concerns; cite `tree-sitter-doc/`.
- **Do NOT read all six tree-sitter-doc files end-to-end.** They are long-form references, not narratives. Use the Quick-reference table and `grep` instead.
- **Do NOT confuse `code/` files with authoritative examples.** Real-world conformance testsuite code may use non-standard or legacy TTCN-3 patterns. When in doubt, cross-check against `specs/`.
- **Do NOT trust `code/NR5GC_IWD_26wk24/` to exist in a fresh clone.** It is git-ignored (large proprietary download). If your task depends on it, check for its presence before assuming it's available.
- **Do NOT duplicate content from `references/` into project docs without attribution.** When citing from `specs/` or `tree-sitter-doc/`, name the source file and (for the spec) the line number / annex.
- **Do NOT assume the tree-sitter-doc mirrors are the latest API.** They are point-in-time snapshots. For bleeding-edge tree-sitter changes, consult the [upstream site](https://tree-sitter.github.io/tree-sitter/) directly.

---

## Cross-references

This guide is scoped to `references/` only. For project-level knowledge (where the grammar lives, how it's built, what conventions to follow), see [`../AGENTS.md`](../AGENTS.md) at the repo root.

Project deliverables that consume this material:

- [`../docs/gap-analysis.md`](../docs/gap-analysis.md) — inventory of grammar gaps, tied to spec sections and verified against files in `code/`.
- [`../docs/dev-plan.md`](../docs/dev-plan.md) — phased completion plan that uses these references to scope and order work.
