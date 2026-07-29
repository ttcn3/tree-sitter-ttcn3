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
| `TTCN-3 Core Language, ETSI ES 201 873-1.md` | **ETSI ES 201 873-1 V4.17.1 (2025-09)** — the normative TTCN-3 Core Language standard. ~1.2 MB / 27 760 lines. The single source of truth for what the grammar should accept. |

This file is referenced from the [`docs/gap-analysis.md`](../docs/gap-analysis.md) and [`docs/dev-plan.md`](../docs/dev-plan.md) deliverable tables.

### Chapter map of `TTCN-3 Core Language, ETSI ES 201 873-1.md`

Map of every numbered clause and annex in the spec, with file line ranges so you can jump straight to the section that defines any given construct. Use this when scoping grammar work or cross-referencing the gap analysis / dev plan. Line numbers are 1-based as shown by `Read` / `grep -n`.

#### Clauses (normative body)

| # | Title | Start | End | Summary |
|---|-------|------:|----:|---------|
| 1 | Scope | 852 | 869 | Scope of the TTCN-3 standard — a modular testing notation for test specifications and test suites. |
| 2 | References | 870 | 1050 | Normative and informative external references used by the spec. |
| 3 | Definition of terms, symbols and abbreviations | 1051 | 1537 | Glossary: terms (3.1), symbols (3.2), abbreviations (3.3) used throughout the document. |
| 4 | Introduction | 1538 | 1688 | The core language and its presentation formats (4.1), unanimity of the specification (4.2), conformance (4.3). |
| 5 | Basic language elements | 1689 | 3000 | Identifiers and keywords (5.1), scope rules (5.2, incl. formal-parameter scope and uniqueness), ordering (5.3), parameterization (5.4: formal `value` / `template` parameters, actual parameters, variadic), cyclic definitions (5.5). |
| 6 | Types and values | 3001 | 6945 | The largest clause. Basic types and values (6.1: simple basics, strings, subtyping — lists, ranges, length, patterns, mixed). Structured types (6.2: record, set, record of / set of, enumerated, union, anytype, array, default, communication port, component, component reference, SUT addressing, subtyping of structured types, timer, map, open type). Type compatibility (6.3), type synonym (6.4), automatic type (6.5). |
| 7 | Expressions | 6946 | 8067 | Operators (7.1: arithmetic, list, relational, logical, bitwise, shift, rotate, presence checking — `ispresent` / `ischosen` / `isvalue` / `isbound`). Field references and list elements (7.2). Decoded field reference (7.3). |
| 8 | Modules | 8068 | 9622 | Definition of a module (8.1), module definitions part (8.2: module parameters, groups, imports — single / group / same-kind / all / cross-edition / imports from imports / language-version compatibility, friend modules, visibility), module control part (8.3). |
| 9 | Port types, component types and test configurations | 9623 | 9930 | Communication ports (9.1) and the test system interface (9.2). |
| 10 | Declaring constants | 9931 | 9996 | Syntax and semantics of constant declarations. |
| 11 | Declaring variables | 9997 | 10222 | Value variables (11.1) and template variables (11.2). |
| 12 | Declaring timers | 10223 | 10291 | Timer declarations. |
| 13 | Declaring messages | 10292 | 10324 | Message type declarations used at message-based ports. |
| 14 | Declaring procedure signatures | 10325 | 10418 | Procedure-based port signatures (in / out / inout parameter kinds). |
| 15 | Declaring templates | 10419 | 12830 | Message templates (15.1), signature templates (15.2), global / local templates (15.3), in-line templates (15.4), modified templates (15.5), referencing template elements (15.6: strings, record/set fields, record of / set of, signature params, union alternatives, map elements), matching mechanisms (15.7), template restrictions (15.8), `match` (15.9), `valueof` (15.10), string/list concatenation (15.11), `omit` (15.12), `present` (15.13), presentness conversion (15.14), value extraction (15.15). |
| 16 | Functions, altsteps and testcases | 12831 | 13820 | Functions (16.1: invocation, predefined, external, invocation-from-specific-places, explicit control, `not-a-value` / `not-implemented`), altsteps (16.2: invocation), test cases (16.3). |
| 17 | Void | 13821 | 13822 | The `void` type (placeholder clause). |
| 18 | Overview of program statements and operations | 13823 | 13959 | Catalogue of every statement and operation kind defined in clauses 19–26. |
| 19 | Basic program statements | 13960 | 15113 | Assignments (19.1: basic, shorthand), if-else (19.2), select case / select union (19.3), for loops (19.4: counter, range-based), while (19.5), do-while (19.6), label (19.7), goto (19.8), stop execution (19.9), return (19.10), log (19.11), break (19.12), continue (19.13), statement block (19.14). |
| 20 | Statements and operations for alternative behaviours | 15114 | 15946 | Snapshot mechanism (20.1), alt statement (20.2), repeat (20.3), interleave (20.4), default handling (20.5: default mechanism, activate, deactivate). |
| 21 | Configuration Operations | 15947 | 17282 | Connection ops (21.1: connect, map, disconnect, unmap), test-case stop (21.2), test component operations (21.3: create, start, stop, kill, alive, running, done, killed, `any`/`all` summary, call). |
| 22 | Communication operations | 17283 | 19744 | Communication mechanisms (22.1: message-based, procedure-based, unicast/multicast/broadcast, general send/recv formats). Message-based ops (22.2: send, receive, trigger). Procedure-based ops (22.3: call, getcall, reply, getreply, raise, catch). Check operation (22.4). Port control ops (22.5: clear, start, stop, halt, checkstate). `any`/`all` with ports (22.6). |
| 23 | Timer operations | 19745 | 20105 | Timer mechanism (23.1), start timer op (23.2). |
| 24 | Test verdict operations | 20106 | 20309 | Setting and reading the test verdict. |
| 25 | External actions | 20310 | 20345 | Calling arbitrary external code at runtime. |
| 26 | Module control | 20346 | 20660 | The `control` part that drives test execution at the top of a module. |
| 27 | Specifying attributes | 20661 | 21739 | How attributes (encoding, display, extension, …) are attached to definitions. |

#### Annexes

| Annex | Title | Start | End | Summary |
|-------|-------|------:|----:|---------|
| A | BNF and static semantics | 21740 | 23383 | **Normative.** Extended BNF for the entire TTCN-3 core language — the canonical grammar for parsing. Static-semantics rules that constrain the BNF. **Primary reference for grammar work.** |
| B | Matching values | 23384 | 24764 | **Normative.** Detailed template-matching mechanisms (the rules by which `match` decides whether a value fits a template). |
| C | Predefined TTCN-3 functions | 24765 | 26647 | **Normative.** Catalogue of all built-in functions (`int2str`, `replace`, `isvalue`, `decvalue`, `encvalue`, `match`, `ispresent`, `ischosen`, `isbound`, timer helpers, component-state queries, …). |
| D | Preprocessing macros | 26648 | 26822 | **Normative.** `%if` / `%else` / `%endif` and friends. |
| E | Library of Useful Types | 26823 | 27157 | **Informative.** Standardised type templates (PxInfo, AddressValue, etc.) recommended for reuse across test suites. |
| F | Operations on TTCN-3 active objects | 27158 | 27587 | **Informative.** Reference material on the runtime semantics of ports, timers, components, and test verdicts. |
| G | Deprecated language features | 27588 | 27716 | **Informative.** Historical constructs still accepted but superseded (e.g. legacy parameterization). |
| H | Bibliography | 27717 | 27760 | **Informative.** Referenced external publications. |

> Lines 1–851 are the front matter (cover page, copyright, foreword, modal-verbs terminology, table of contents, IPR) — not numbered clauses.

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
