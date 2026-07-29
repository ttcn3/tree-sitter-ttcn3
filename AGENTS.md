# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-18
**Commit:** 1d34d79
**Branch:** develop

## OVERVIEW
Tree-sitter grammar for **TTCN-3** (Testing and Test Control Notation, ETSI
ES 201 873-1). Production-ready — parses real-world 3GPP conformance
TTCN-3 code at **100% clean** (385/385 files in the NR5GC corpus, 0 ERROR
nodes), 159/159 corpus tests pass, parser generated without warnings.
Six language bindings ship in-tree: Node, Python, Rust, Go, C, Swift.

## STRUCTURE
```
.
├── grammar.js                    # THE grammar (1765 lines, hand-written)
├── src/                          # GENERATED artifacts (committed, do not edit)
│   ├── parser.c                  # 14.4M generated parser (ABI 15)
│   ├── grammar.json              # 322K generated JSON
│   ├── node-types.json           # 342K generated node types
│   └── tree_sitter/              # Vendored tree-sitter C runtime headers
├── test/corpus/                  # TTCN-3 grammar tests (15 thematic .txt files)
├── queries/                      # Editor support — 4 .scm files
│   ├── highlights.scm            # syntax highlighting
│   ├── locals.scm                # scope tracking
│   ├── tags.scm                  # code navigation
│   └── injections.scm            # language injection
├── bindings/                     # 6 language bindings + per-binding tests
│   ├── python/  node/  rust/  go/  c/  swift/
├── docs/                         # dev-plan.md, gap-analysis.md
├── examples/                     # 4 hand-written TTCN-3 modules (CI parses)
├── references/                   # tree-sitter-doc/, code/, specs/, AGENTS.md
├── scripts/                      # ensure-parser.js (CI helper)
├── binding.gyp                   # Node native build
├── Package.swift                 # Swift Package Manager
├── CMakeLists.txt                # CMake build (uses tree-sitter 0.26.x)
├── Makefile                      # C build (static + shared + pkg-config)
├── package.json                  # v0.2.1
├── Cargo.toml                    # v0.2.1
├── pyproject.toml + setup.py     # v0.2.1
└── tree-sitter.json              # CLI defaults
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Edit grammar rules | `grammar.js` | The ONLY hand-written grammar source |
| Add TTCN-3 test cases | `test/corpus/<concept>.txt` | Thematic naming (see `test/corpus/AGENTS.md`) |
| Update editor highlighting | `queries/highlights.scm` | Tree-sitter query language |
| Update editor scope/navigation | `queries/{locals,tags,injections}.scm` | |
| Modify a binding | `bindings/<lang>/` | Per-binding glue + tests |
| Regenerate parser | `npm test` or `tree-sitter generate` | Auto-runs on `npm test` |
| Build C library | `make` | Produces `.a`/`.so` + `.pc` |
| Development plan / status | `docs/dev-plan.md` | Phase-by-phase task list with status |
| Gap analysis vs spec | `docs/gap-analysis.md` | Feature inventory vs TTCN-3 spec coverage |
| TTCN-3 spec references | `references/specs/` | Local copies for offline reference |
| Tree-sitter docs | `references/tree-sitter-doc/` | Local copies |

## CODE MAP
`grammar.js` is a single 1765-line file. Approximate sections:

| Section | Approx. lines | Role |
|---------|---------------|------|
| `PREC` precedence table | 1–17 | 15 operator levels (primary=150 → logical_or=20) |
| `grammar({...})` config | 19–175 | `name`, `word`, `extras`, `conflicts`, `inline` |
| `_definition` union | 183–217 | 30+ definition kinds (module/group/func/class/...) |
| Module / Group / Function defs | 219–305 | module, group, func, external_function, altstep, testcase, configuration, control |
| Behavioral types | 307–338 | altstep_type, testcase_type, function_type |
| Class / Component / Constructor / Subtype | 340–397 | class_type, component_type, constructor, subtype |
| Pattern constraint / Record / Set / Union types | 397–453 | `('pattern', charstring, _)`, record_type, set_type, union_type |
| Declarations | 455–483 | var_decl, timer_decl, port_decl, port_declarator |
| Map / Enumerated / Port types | 485–548 | map_type, enumerated_type, port_type |
| Module parameter | 548–566 | module_parameter |
| Mode / Import definitions | 567–615 | mode_definition, import_definition (mode body now implemented) |
| `_expression` | 618–1020 | precedence chain + all expression kinds |
| `_statement` | 1022–~1500 | if/for/while/select/alt/interleave/do-while/label/goto/break/continue/return |
| Helpers | ~1500–1765 | attributes, parameters, identifiers, literals |

Key rules:
- `source_file` (line 177): `choice(repeat(seq($._definition, optional(';'))), $._expression)` — accepts standalone expressions to allow parsing module parameter values.
- `_identifier` (line 1711): `/[a-zA-Z_]\w*/`.
- `number` (line 1711+): `token(seq(/\d+(\.\d+)?/, optional(/[eE][+-]?[0-9][0-9_]*/),))`.

## CONVENTIONS
- **Grammar at root**, not `src/grammar.js` (deviation from standard tree-sitter layout).
- **Generated files committed**: `parser.c`, `grammar.json`, `node-types.json` are in git. Marked `linguist-generated` in `.gitattributes`. Do NOT edit manually — re-run `tree-sitter generate`.
- **No external scanner**: pure `grammar.js`, no `src/scanner.c`. Placeholders in `binding.gyp`/`bindings/rust/build.rs`/`Package.swift`/`bindings/go/binding.go` reference an optional scanner that doesn't exist.
- **Editor support via `queries/`**: four `.scm` files (highlights, locals, tags, injections) — Rust binding has the include stub.
- **Whitespace handling**: `extras: $ => [$.comment, /[\s\u00A0\uFEFF\u3000]+/]` — NBSP, ZWNBSP, ideographic space all count as whitespace.
- **Keyword extraction**: `word: $ => $._identifier` enforces keyword/identifier whitespace separation.
- **Optional semicolons**: TTCN-3 allows semicolons between top-level definitions to be omitted. This drives the GLR conflict declarations below.
- **Indentation** (`.editorconfig`): 2-space for JS/JSON/TOML/GYP, 4-space for C/C++/Rust/Swift/Python, tabs for Makefile/Go.

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT edit `src/parser.c`, `src/grammar.json`, `src/node-types.json`** — they're generated. Edit `grammar.js` and run `tree-sitter generate`.
- **DO NOT remove grammar conflicts** (declared in `grammar({ conflicts: [...] })`, line 32 onward) — they are **intentional GLR conflicts**:
  - `[$.break_stmt]`, `[$.continue_stmt]`, `[$.return_stmt]` — optional labels conflict with following statements.
  - `[$.reference, $.name]`, `[$.var_decl]`, `[$.const_decl]` — optional type/name conflicts with optional semicolons.
  - `[$.reference, $.type_instantiation_expression]`, `[$.name, $.type_instantiation_expression]` — `ref < num` vs `Type<...>` (v0.1.1 fix).
  - `[$.any_value]` — `?` length-attribute suffix overlap (v0.2.1 fix).
- **DO NOT change grammar without updating tests** (per `CONTRIBUTING.md`): grammar changes must not break existing tests; add tests for new grammar.
- **Pre-commit checklist** (`CONTRIBUTING.md`): `tree-sitter generate` → add tests → `npm run lint` → `npm test` → run affected binding tests.
- **TODO markers in grammar.js**:
  - Line 934: `// TODO: use correct expressions instead of just identifier` — `any from`/`all from` use `_identifier` instead of `_expression`.
  - (Mode body TODO at the old line 450 has been resolved — `mode_definition` body is now implemented.)

## UNIQUE STYLES
- **All 6 bindings in-tree** (python, node, rust, go, c, swift) — most tree-sitter grammars only ship node+python. Each binding ships with at least one test (`binding_test.{js,go,py}`).
- **Tree-sitter 0.26.x with ABI 15**: grammar targets the latest API (peer dep `tree-sitter: ^0.25.0` for node binding, `tree-sitter-cli: ^0.26.11` for dev).
- **Source files accept standalone expressions** (not just definitions) — useful for parsing module parameter values, but unusual.
- **TTCN-3-specific abstractions** in grammar: `runs on`, `mtc`, `system` clauses on behavioral definitions; `modifies` clause on templates; `@nodefault`, `[else]` alt guards; parameterized templates with `(@lazy | @fuzzy | @deterministic | @abstract)` modifiers.
- **CI quality gates**: `ci.yml` runs parser tests + all 5 binding test suites on ubuntu/windows/macos-15; `lint.yml` runs ESLint on `grammar.js`; both gate pushes to `master` and pull requests.
- **Multi-version Python**: `setup.py` builds with `py_limited_api=True` targeting Python 3.10 ABI (`0x030A0000`); wheel tag pinned to `cp310`/`abi3`.

## COMMANDS
```bash
# Regenerate parser + run corpus tests (does both in sequence)
npm test

# Just regenerate (no tests)
tree-sitter generate

# Just run tests (no regeneration)
tree-sitter test
# or:
make test

# Lint grammar.js
npm run lint

# Build C library (static + shared + pkg-config)
make
make install                    # installs to /usr/local

# Per-binding tests
cd bindings/python && pip install . && pytest tests/
cd bindings/rust   && cargo test --release
cd bindings/go     && go test
cd bindings/node   && node binding_test.js
# Swift: CI only (macOS-15). Local `swift test` from bindings/swift.
```

## NOTES
- **Status**: v0.2.1 — feature-complete enough to parse the NR5GC conformance corpus at 100%. Active development continues on `develop`; releases happen via tagged commits through the `publish.yml` workflow.
- **Test corpus is thematic**, not exhaustive-per-rule. See `test/corpus/AGENTS.md` for the file map.
- **Version**: all artifacts (package.json, Cargo.toml, pyproject.toml, Makefile, CMakeLists.txt) at `0.2.1`. `setup.py` has no version field; it relies on `pip` metadata.
- **No `tree-sitter.json` config** — uses CLI defaults.
- **`.codegraph` symlink** in root → external codegraph cache for the project (read-only).
- **Branch policy**: feature work on topic branches; PRs target `develop` (or `master` if `develop` doesn't exist). CI runs on pushes to `master` and on pull requests.
