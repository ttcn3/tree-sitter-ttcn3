# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-14
**Commit:** d551707
**Branch:** main

## OVERVIEW
Tree-sitter grammar for **TTCN-3** (Testing and Test Control Notation) — a WIP grammar covering module definitions, behavioral types, and component types. Single-file grammar (`grammar.js`) compiled to a parser consumed by 6 language bindings. **Status: WIP** — Expressions, Advanced Parameterization, and Tests are unimplemented per `README.md`.

## STRUCTURE
```
.
├── grammar.js               # THE grammar (1062 lines, hand-written)
├── src/                     # GENERATED artifacts (committed, do not edit)
│   ├── parser.c             # 6.9M generated parser
│   ├── grammar.json         # 201K generated JSON
│   ├── node-types.json      # 162K generated node types
│   └── tree_sitter/         # Vendored tree-sitter C runtime headers
├── test/corpus/             # TTCN-3 grammar tests (11 thematic .txt files)
└── bindings/                # 6 language bindings (all auto-generated init)
    ├── python/  node/  rust/  go/  c/  swift/
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Edit grammar rules | `grammar.js` | The ONLY hand-written grammar source |
| Add TTCN-3 test cases | `test/corpus/<concept>.txt` | Thematic naming (see `test/corpus/AGENTS.md`) |
| Regenerate parser | `npm test` or `tree-sitter generate` | Auto-runs on `npm test` |
| Modify a binding | `bindings/<lang>/` | Each is ~10-50 lines of glue code |
| Build C library | `make` | Produces `.a`/`.so` + `.pc` |

## CODE MAP
grammar.js is a single 1062-line file. Sections are approximate (types & declarations intermix):

| Section | Approx. lines | Role |
|---------|---------------|------|
| `PREC` precedence table | 1-17 | 15 operator levels (primary=150 → logical_or=20) |
| `grammar({...})` config | 19-58 | `name`, `word`, `extras`, `conflicts` |
| `_definition` union | 74-108 | 30+ definition kinds (module/group/func/class/...) |
| Module/Group/Function definitions | 110-282 | module, group, func, altstep, testcase, configuration, control, *_type, class_type, component_type, constructor, subtype |
| Types & Declarations (intermixed) | 284-441 | record/set/union, var/timer/port/template, map/enumerated/port/signature, modulepar/const |
| Import/Mode | 443-487 | mode_definition (TODO empty body), import_definition |
| Expressions | 489-667 | `_expression`, unary/binary ops, references, calls |
| Statements | 700-887 | `_statement`, control flow (if/for/while/select/alt/interleave) |
| Helpers | 942-1062 | attributes, parameters, identifiers, literals |

Key rules:
- `source_file` (line 68): `choice(repeat(seq($._definition, optional(';'))), $._expression)` — accepts standalone expressions to allow parsing module parameter values
- `_identifier` (line 1027): `/[a-zA-Z_]\w*/`
- `number` (line 1038): `token(seq(/\d+(\.\d+)?/, optional(/[eE][+-]?[0-9][0-9_]*/),))`

## CONVENTIONS
- **Grammar at root**, not `src/grammar.js` (deviation from standard tree-sitter layout)
- **Generated files committed**: `parser.c` (6.9M), `grammar.json`, `node-types.json` are in git. Marked `linguist-generated` in `.gitattributes`. Do NOT edit manually — re-run `tree-sitter generate`.
- **No external scanner**: pure grammar.js, no `src/scanner.c`. Placeholders in `binding.gyp`/`bindings/rust/build.rs`/`Package.swift`/`bindings/go/binding.go` reference an optional scanner that doesn't exist.
- **No `queries/` directory**: no highlights/injections/locals/tags `.scm` files. Rust binding has commented-out includes for them.
- **Whitespace handling**: `extras: $ => [$.comment, /[\s\u00A0\uFEFF\u3000]+/]` — NBSP, ZWNBSP, ideographic space all count as whitespace.
- **Keyword extraction**: `word: $ => $._identifier` enforces keyword/identifier whitespace separation.
- **Optional semicolons**: TTCN-3 allows semicolons between top-level definitions to be omitted. This is what causes the GLR conflicts below.
- **Indentation** (`.editorconfig`): 2-space for JS/JSON/TOML/GYP, 4-space for C/C++/Rust/Swift/Python, tabs for Makefile/Go.

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT edit `src/parser.c`, `src/grammar.json`, `src/node-types.json`** — they're generated. Edit `grammar.js` and run `tree-sitter generate`.
- **DO NOT remove grammar conflicts** (lines 32-58) — they are **intentional GLR conflicts** documented in the code:
  - `[$.break_stmt]`, `[$.continue_stmt]`, `[$.return_stmt]` — optional labels conflict with following statements
  - `[$.reference, $.name]`, `[$.var_decl]`, `[$.const_decl]` — optional type/name conflicts with optional semicolons
- **DO NOT change grammar without updating tests** (per `CONTRIBUTING.md`): grammar changes must not break existing tests; add tests for new grammar.
- **Pre-commit checklist** (`CONTRIBUTING.md`): `tree-sitter generate` → add tests → `npm test` (which re-generates AND runs tests).
- **TODO markers in grammar.js**:
  - Line 450: `// TODO: Mode Spec` — `mode_definition` body is empty
  - Line 655: `// TODO: use correct expressions instead of just identifier` — `any from`/`all from` use `_identifier` instead of `_expression`

## UNIQUE STYLES
- **All 6 bindings in-tree** (python, node, rust, go, c, swift) — most tree-sitter grammars only ship node+python.
- **7 build configs** for 6 languages: `Makefile`, `package.json`, `Cargo.toml`, `pyproject.toml`+`setup.py`, `binding.gyp`, `Package.swift`. Each binding is 1-4 trivial glue files.
- **Source files accept standalone expressions** (not just definitions) — useful for parsing module parameter values, but unusual.
- **TTCN-3-specific abstractions** in grammar: `runs on`, `mtc`, `system` clauses on behavioral definitions; `modifies` clause on templates; `@nodefault`, `[else]` alt guards.

## COMMANDS
```bash
# Regenerate parser + run tests (does both in sequence)
npm test

# Just regenerate (no tests)
tree-sitter generate

# Just run tests (no regeneration)
tree-sitter test
# or:
make test

# Build C library (static + shared + pkg-config)
make

# Install C library to /usr/local
make install

# Rust binding build
cargo build

# Python binding build
pip install .

# Clean C build artifacts
make clean
```

## NOTES
- **README is explicit**: project is WIP and "we do not work on this project at the moment". Treat as maintenance-mode — change requests welcome but don't expect active development.
- **No highlights/injections queries** — language server features (Neovim, Helix, etc.) won't have syntax highlighting until `queries/highlights.scm` is added. The Rust binding already has the include stub.
- **Python limited API**: `setup.py` builds with `py_limited_api=True` targeting Python 3.8 ABI.
- **Version mismatch**: `package.json` says `1.0.0`, `Makefile`/`pyproject.toml`/`Cargo.toml` all say `0.0.1`. The `0.0.1` triple is the source of truth for build artifacts.
- **No `tree-sitter.json` config** — uses only CLI defaults.
- **`.codegraph` symlink** in root → external codegraph cache for the project (read-only).