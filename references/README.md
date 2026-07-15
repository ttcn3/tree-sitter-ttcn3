# `references/` — External material used by this project

Reference material used to plan and validate the TTCN-3 grammar against authoritative sources and real-world code. Not part of the grammar itself.

## Top-level layout

```
references/
├── specs/                          # TTCN-3 language specification
│   └── TTCN-3 Core Language, ETSI ES 201 873-1.md
├── code/                           # Real-world TTCN-3 source
│   └── NR5GC_IWD_26wk24/           # 3GPP NR5GC conformance testsuite, IWD week 26 / 2026
└── tree-sitter-doc/                # Tree-sitter official docs (offline markdown mirrors)
    ├── Tree-sitter-#1-using-parsers.md
    ├── Tree-sitter-#2-creating-parsers.md
    ├── Tree-sitter-#3-syntax-highlighting.md
    ├── Tree-sitter-#4-code-navigation.md
    ├── Tree-sitter-#5-cli-reference.md
    └── Tree-sitter-#5-implementation-#6-contributing.md
```

## `specs/`

| File | Description |
|------|-------------|
| `TTCN-3 Core Language, ETSI ES 201 873-1.md` | **ETSI ES 201 873-1 V4.17.1 (2025-09)** — the normative TTCN-3 Core Language standard. ~1.2 MB / 27 760 lines. The single source of truth for what the grammar should accept.<br> **Annex A (line 21740)** contains the extended BNF;<br>**Annex B (line 23384)** template matching mechanisms;<br>**Annex C (line 24765)** predefined functions. |

This file is referenced from the [`docs/gap-analysis.md`](../docs/gap-analysis.md) and [`docs/dev-plan.md`](../docs/dev-plan.md) deliverable tables.

## `code/`

Real-world TTCN-3 source for grammar validation. The aim is that the grammar should parse every file in here without errors.

> NOTE: this folder is not included in git, because the 3GPP NR5GC conformance testsuite is a large proprietary download. The `README.md` here documents the contents of the folder so that it can be recreated by anyone with access to the 3GPP FTP site.

### `code/NR5GC_IWD_26wk24/`

3GPP NR5GC conformance testsuite snapshot (downloaded and unzipped from the [3GPP FTP Site](https://www.3gpp.org/ftp/tsg_ran/WG5_Test_ex-T1/TTCN/Deliveries/TTCN3/iwd-TTCN3-B2026-03_D26wk24.zip)). Used as the empirical oracle for the gap analysis: every file was run through `tree-sitter parse` and the failure columns were catalogued.

- **385 `.ttcn` files**, ~19.5 MB total
- A handful of `.ttcn3` files alongside
- One large monolithic module (`NR5GC_Testsuite.ttcn`, 601.9 KB / 14 965 lines) at the root, plus a tree of feature-grouped modules

#### Top-level layout inside this subfolder

```
NR5GC_IWD_26wk24/
├── NR5GC_Testsuite.ttcn           (15K lines, main testcase driver module)
├── Common/                        (12 MB — shared type/template/component libraries)
├── NR5GC/                         (5.5 MB — NR5GC-specific testcases)
├── NR_TC_Common/                  (1.2 MB — NR testcase common helpers)
├── PicsPixit/                     (476 KB — PICS/PIXIT module-parameter declarations)
└── TCSE/                          (96 KB — Testcase applicability metadata)
```

#### `Common/` — one level deeper

The largest grouping. 18 sub-groupings of shared libraries; each is a flat directory of `.ttcn` modules. No nesting below this level.

```
Common/
├── Common/             Common4G5G/      CommonIP/
├── EPS_NAS/            HTTP/            IMS/
├── IMS_LibSip/         IMS_XSD/         IP_PTC/
├── MTC/                NAS/             NG_NAS/
├── NR/                 NR_CommonFrequency/   NR_Defs/
├── NR5GC/              NR_V2X/          NasEmulation/
├── POS/                SuppServices/
```

## `tree-sitter-doc/`

Local markdown mirrors of the official [Tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/). Kept in this repo so the docs can be searched and cited offline without web access. Upstream is a multi-page site; here it is collapsed into six long-form `.md` files mirroring the site's page order.

> These files are **about the Tree-sitter tool** (grammar DSL, CLI, queries, parser API). They are **not authoritative for TTCN-3 semantics** — see [`specs/`](#specs) for that.

| File | Topic | Read this when you need to… |
|------|-------|------------------------------|
| `Tree-sitter-#1-using-parsers.md` | C parser API, syntax trees, queries (S-expressions), predicates, `node-types.json`, ABI versions | consume a parser programmatically, write a tree-sitter query (`queries/*.scm`), or interpret parser output |
| `Tree-sitter-#2-creating-parsers.md` | `grammar.js` DSL (`seq`/`choice`/`prec`/`field`/…), rule design, precedence & associativity, conflicts, external scanners, corpus tests, publishing & semver | **edit `grammar.js`, design new rules, or debug parse conflicts** — the most-used file for grammar work |
| `Tree-sitter-#3-syntax-highlighting.md` | `queries/highlights.scm`, locals, language injection, `tree-sitter highlight` CLI | author syntax-highlighting queries or configure an embedded-language injection |
| `Tree-sitter-#4-code-navigation.md` | `queries/tags.scm`, `@role.kind` captures, `tree-sitter tags` CLI | author code-navigation queries (definitions, references, symbols) for LSP-style features |
| `Tree-sitter-#5-cli-reference.md` | Every `tree-sitter` subcommand: `init`, `generate`, `build`, `parse`, `test`, `fuzz`, `query`, `highlight`, `tags`, `version`, `playground`, etc. | look up a CLI flag, an option, or a `tree-sitter.json` field |
| `Tree-sitter-#5-implementation-#6-contributing.md` | Tree-sitter internals, AI contribution policy, release workflow, debugging tools (sanitizers, lldb), published packages | work on tree-sitter itself (rare for this project); relevant if upstream patches are being prepared |

## Related deliverables

- [`../docs/gap-analysis.md`](../docs/gap-analysis.md) — inventory of grammar gaps, tied to spec sections and verified against files in `code/`.
- [`../docs/dev-plan.md`](../docs/dev-plan.md) — phased completion plan that uses these references to scope and order work.
