# Tree-sitter Grammar for TTCN-3

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for
**TTCN-3** (Testing and Test Control Notation, ETSI ES 201 873-1).

## Status

`v0.1.0` — parses real-world 3GPP conformance TTCN-3 code at 83.6% clean
(322/385 files in the NR5GC corpus have 0 errors; remaining 63 files contain
~204 errors, all of the same shape: `ref < num` / `ref > num` / `ref < ref` /
`ref < (expr)` / `ref < expr` patterns inside `if` / `for` / `while` / `guarded`
conditions and `template_values` lists. This is a tree-sitter LR(1) limitation,
not a grammar bug — fixing it would require lifting `rel_expression` to be
usable as a `condition` directly, which conflicts with `primary` precedence.
Tracked as an unfixable without major grammar restructuring.)

**158/158 corpus tests pass** (152 original + 3 real-world + 2 HTTP + 1 regression).

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
