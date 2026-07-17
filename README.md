# Tree-sitter Grammar for TTCN-3

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for
**TTCN-3** (Testing and Test Control Notation, ETSI ES 201 873-1).

## Status

`v0.2.1` — parses real-world 3GPP conformance TTCN-3 code at **100% clean**
(385/385 files in the NR5GC corpus have 0 errors; 0 ERROR nodes total).
Up from v0.2.0's 99.7% / 2 errors. Parser is generated without warnings;
159/159 corpus tests pass.

The v0.2.1 jump closed the **last grammar gap** left open by v0.2.0:

- **Trailing `ifpresent` matching attribute on template assignment RHS** —
  added an optional `extra_matching_attributes` field to the `template` rule
  so `template T x := f(args) ifpresent;` parses (spec rule 95
  ExtraMatchingAttributes). One new conflict declared: `[$.any_value]` —
  the existing `any_value: $ => seq('?', optional($.length_attribute))` rule
  overlapped with the new `length_attribute` suffix on expressions; GLR
  resolves in favor of the `any_value` interpretation.

**159/159 corpus tests pass** (158 from v0.2.0 + 1 new V1.17 test for the
template RHS ifpresent pattern).

## Earlier milestones

- **v0.2.0** — 99.7% clean (384/385, 2 errors). Closed four grammar gaps on
  top of v0.1.1: `-> value v_X` redirect inside `check(receive(...))`,
  array type with explicit size, inline `union`/`record`/`set` blocks in
  `type record` body, `complement(...)` with multiple args, and formal-
  parameter default with trailing `ifpresent`.
- **v0.1.1** — 97.7% clean (376/385, 18 errors). Diagnosed the `ident '<'`
  shift-reduce conflict on `type_instantiation_expression` vs.
  `rel_expression`: the static `prec(PREC.primary)` on type instantiation was
  committing the LR(1) table to the generics path on every
  `ref < num` pattern. Resolved by dropping the static precedence, switching
  to `prec.dynamic(-1, ...)`, and declaring the table-level conflicts
  (`[$.reference, $.type_instantiation_expression]` and `[$.name,
  $.type_instantiation_expression]`) so Tree-sitter's GLR engine forks at
  runtime. Zero regressions; parser size +270 bytes.
- **v0.1.0** — 83.6% clean (322/385, 204 errors).

## Language support

- [x] Module definitions, group definitions
- [x] Function / altstep / testcase / configuration / control
- [x] Behavioral types: component, port, timer, signature, class
- [x] Type system: record / set / union / enumerated / map / array / port / signature
- [x] Declarations: var / const / timer / port / template / modulepar
- [x] Templates: restrictions, modifiers, parameterized, modifies, all matching symbols (`?` / `*` / `ifpresent` / range / complement / subset / superset / permutation / decmatch / pattern / length)
- [x] Expressions: full precedence chain (or → and → not → rel → shift → bitwise → add → mul → unary → primary)
- [x] Statements: if / for / while / select / alt / interleave / do-while / label / goto / break / continue / return
- [x] Communication: port dot-ops, config ops, component lifetime, activate/default, timer ops
- [x] Test operations: testcase.stop, execute, test-component call
- [x] Editor support: syntax highlighting, scope tracking, code navigation, injections
- [ ] Tests for the optional external scanner (not used — grammar is pure `grammar.js`)

## Usage

### Build the C library

```bash
make            # produces libtree-sitter-ttcn3.{a,so} + tree-sitter-ttcn3.pc
make install    # installs to /usr/local
```

### Run tests

```bash
npm test                       # regenerates parser + runs corpus tests
npx tree-sitter test           # runs corpus tests only
npx tree-sitter generate       # regenerates parser only
```

### Parse a TTCN-3 file

```bash
npx tree-sitter parse path/to/file.ttcn
```

### Language bindings

Six bindings are shipped in-tree:

| Language | Build |
|----------|-------|
| Node | `npm install` |
| Python | `pip install .` |
| Rust | `cargo build` |
| Go | `go build` (after `tree-sitter generate`) |
| C | `make` |
| Swift | `swift build` (after `tree-sitter generate`) |

## Project layout

```
.
├── grammar.js               # The grammar (hand-written)
├── src/                     # Generated artifacts (committed, do not edit)
├── test/corpus/             # TTCN-3 grammar tests (158 tests)
├── queries/                 # Editor support (highlights, locals, tags, injections)
├── bindings/                # 6 language bindings
└── docs/                    # Development plan, gap analysis
```

## Documentation

- [Development plan](docs/dev-plan.md) — task breakdown, status, effort budget
- [Gap analysis](docs/gap-analysis.md) — feature inventory vs spec coverage

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). The grammar is a single hand-written
`grammar.js`; parser artifacts (`src/parser.c`, `src/grammar.json`,
`src/node-types.json`) are generated and committed.

> Note: This project is in maintenance mode. Change requests are welcome, but
> active development is not scheduled.
