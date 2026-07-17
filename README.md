# Tree-sitter Grammar for TTCN-3

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for
**TTCN-3** (Testing and Test Control Notation, ETSI ES 201 873-1).

## Status

`v0.1.1` — parses real-world 3GPP conformance TTCN-3 code at **97.7% clean**
(376/385 files in the NR5GC corpus have 0 errors; remaining 9 files contain
18 errors). The previous `v0.1.0` limit at 83.6% clean was traced to a
shift-reduce conflict in the LR(1) parse table: `ident '<'` could start either
a `type_instantiation_expression` (with `prec(PREC.primary)`) or a
`rel_expression`. Resolved by dropping the static precedence on
`type_instantiation_expression`, switching it to `prec.dynamic(-1, ...)`, and
declaring the table-level conflict explicitly (`[$.reference,
$.type_instantiation_expression]` and `[$.name,
$.type_instantiation_expression]`) so Tree-sitter's GLR engine forks at
runtime. Zero regressions; corpus size delta is +270 bytes.

The 9 remaining files have 18 errors across **3 distinct grammar gaps** that
are not `rel_expression`-related:

- **`-> value v_X` redirect inside `receive()` call** (5 errors, 4 files) —
  TTCN-3 spec §22.2; `redirection_expr` is not accepted in receive-argument
  position.
- **Array type with explicit size `[N]`** (1 error, 1 file) — e.g.
  `type float PTWLengthParameters[16];`. Array types with size specifier are
  unimplemented.
- **Inline `/* @status ... */` comment inside `type record` body** (4 errors,
  1 file) — comments between `{` and the first field confuse the block parser.

Plus 1 minor GLR-recovery edge: `IMS_CommonTemplates.ttcn` picked a different
recovery path at `fl_SIP_GenericParamCheckAndGetValue(...)` (leading-underscore
function name inside a `return` statement). Tree is still built correctly;
produces one extra ERROR marker.

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
