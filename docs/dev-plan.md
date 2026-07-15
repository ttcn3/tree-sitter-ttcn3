# TTCN-3 Grammar — Development Plan

> Generated: 2026-07-15 · Branch: `main` · Spec: ETSI ES 201 873-1 V4.17.1 (2025-09)

This plan completes the tree-sitter TTCN-3 grammar from its current WIP state to a grammar that parses real-world 3GPP conformance TTCN code. See [`gap-analysis.md`](./gap-analysis.md) for the underlying inventory.

---

## Quick Wins (1–2 days each)

Land these as standalone PRs before the big phases to fix the most-cited real-world failures:

1. **Add `infinity`, `-infinity`, `not_a_number` keywords** — fixes the `HTTP_ASP_TypeDefs.ttcn` failure
2. **Add `+` / `-` literals and `omit` to the numeric-token set** (largely done)
3. **Fix `inline_template` rule** — make it `optional(seq($.reference, ':')) $._expression` — unblocks one class of testcases
4. **Fix the 3 known-failing corpus tests** (`class_type`, `component_type`, `configuration` produce wrong modifiers/visibility)
5. **Wire `import ... language "..."` clause** — allows `import from X language "ASN.1:2002" all with {encode "..."}` to parse cleanly

---

## Phase 0 — Expression Foundation

**Goal**: Expression parsing works for any real-world expression. New corpus file `expressions.txt`.

| Task | Description | Effort |
|------|-------------|--------|
| **E0.1** | Rebuild the expression precedence chain as the spec requires (XorExpression → AndExpression → NotExpression → EqualExpression → RelExpression → ShiftExpression → BitOrExpression → BitXorExpression → BitAndExpression → BitNotExpression → AddExpression → MulExpression → UnaryExpression → Primary). Keep `PREC.*` for precedence numbers. | 1 day |
| **E0.2** | Extend `Primary`: parenthesized expr, predefined value, presence-check ops (`ispresent`/`isbound`/`isvalue`/`ischosen`), function call. | 1 day |
| **E0.3** | Add **predefined-function call** — a dedicated rule matching all ~40 predefined function names from Annex C plus allowing any identifier that resolves to one. | 0.5 day |
| **E0.4** | Add **compound expressions**: assignment notation `{ field := expr, … }` and list notation `{ expr, … }` — these are also `Primary`. | 1 day |
| **E0.5** | Add `Minus` (`-`) placeholder for uninitialized fields. | 0.5 day |
| **E0.6** | Add **decoded field reference** `=> Type`. | 0.5 day |
| **E0.7** | Add `infinity`, `-infinity`, `not_a_number` reserved words to identifiers/keywords; ensure they aren't matched as `Identifier` in expression contexts. | 0.5 day |
| **E0.8** | Add `match`, `valueof`, `omit`, `present` template operations as `Primary` rules. | 1 day |
| **E0.9** | Add `ConstantExpression` as a stricter form of `Expression` (no function calls, no mutable vars). | 0.5 day |

**Tests**: `test/corpus/expressions.txt` with ~30 tests across operators, primaries, predefined fns, compound values.

---

## Phase 1 — Templates

**Goal**: Templates parse as written in real-world files. New corpus file `templates.txt`.

| Task | Description | Effort |
|------|-------------|--------|
| **T1.1** | Add `TemplateRestriction` properly: `(value)`, `(present)`, `(omit)`, plus no-restriction defaults. Wire into `template`, `parameter`, `var_decl` (template variant). | 0.5 day |
| **T1.2** | Add modifier chain `[FuzzyModifier][DeterministicModifier][AbstractModifier]` for `template` and `function`. | 0.5 day |
| **T1.3** | Add `BaseTemplate` — `(Type\|Signature) Name [type_parameters] [(TemplateOrValueFormalParList)]` and `FormalTemplatePar` for parameterized templates. | 1 day |
| **T1.4** | Add `BaseTemplateBody ::= SimpleSpec \| FieldSpecList \| ArrayValueOrAttrib` and `SimpleSpec ::= … \| SimpleTemplateSpec`. | 1 day |
| **T1.5** | Add `MatchingSymbol` alternatives: `?`, `*`, `(…)` template list, `(a..b)` range, `complement`, `pattern`, `subset`, `superset`, `permutation`, `decmatch`, `ifpresent`, length attribute. | 2 days |
| **T1.6** | Add `Pattern` parser — non-trivial; cover metacharacter rules (`*`, `?`, `\\`, `[…]`, `#{n,m}` repetition, `\\N{type}` substitution, `\\q(…)` quadruple). Cover via simpler regex tokens; defer full pattern matching details. | 1.5 days |
| **T1.7** | Add `DerivedTemplateBody` (`modifies` clause form). | 0.5 day |
| **T1.8** | Add `ActualParAssignment` (`name := expr` form in calls). | 0.5 day |

**Tests**: `test/corpus/templates.txt` with 25+ tests across restrictions, bodies, matching mechanisms, parameterized templates.

---

## Phase 2 — Statements & Communication

**Goal**: Behaviour statements and comm ops work. New corpus files `statements.txt`, `communication.txt`, `timers.txt`.

| Task | Description | Effort |
|------|-------------|--------|
| **S2.1** | Add `setverdict` / `getverdict`. | 0.5 day |
| **S2.2** | Add `log` / `action` statements (variadic expressions). | 0.5 day |
| **S2.3** | Add **shorthand assignment** `x++` / `x--`. | 0.5 day |
| **S2.4** | Add **port dot-ops**: `.send(expr)`, `.receive`, `.trigger`, `.call`, `.reply`, `.raise`, `.catch`, `.getcall`, `.getreply`, `.check`, `.clear`, `.start`, `.stop`, `.halt`, `.checkstate`. | 2 days |
| **S2.5** | Add **config ops**: `connect(…)`, `map(…) [param(…)]`, `disconnect`, `unmap [param(…)]`. Include `port_ref` grammar (`Component.port` chain). | 1.5 days |
| **S2.6** | Add **component lifetime ops**: `comp.create(…) [alive]`, `.start(f(…))`, `.stop`, `.done` / `.killed` (with optional redirect). | 1.5 days |
| **S2.7** | Add **activate/default** ops: `activate(a(…))`, `deactivate`, `repeat`. | 0.5 day |
| **S2.8** | Add **timer ops**: `timer.start(expr)`, `timer.read`, `timer.stop`, `timer.running`, `timer.timeout`. | 1 day |
| **S2.9** | Add `testcase.stop` and `execute(…)` for testcase invocations. | 0.5 day |

**Tests**: `test/corpus/communication.txt`, `test/corpus/statements.txt`, `test/corpus/timers.txt`.

---

## Phase 3 — Types & Ports Polish

Most tasks parallelize with Phase 0–2 work; can land opportunistically.

| Task | Description | Effort |
|------|-------------|--------|
| **TP3.1** | Add `NestedMapDef` (`map from K to V` as field type). | 0.5 day |
| **TP3.2** | Add `anytype` predefined type. | 0.5 day |
| **TP3.3** | Add `port Type Name[expr]` port instance in component body — replace `port_decl` / parameter / etc. with a proper `PortInstance` rule. | 1 day |
| **TP3.4** | Extend `record_of_type` to support length-restricted subtypes: `type record length(…) of T Name;`. | 0.5 day |
| **TP3.5** | Add `multityped modulepar { … ; … }` block form. | 0.5 day |
| **TP3.6** | Add `universal charstring` type. | 0.5 day |
| **TP3.7** | Implement `mode` body (currently empty TODO at grammar.js:450). | 0.5 day |
| **TP3.8** | Improve modifier regex `@\w+` to specifically enumerate the spec's modifier set. | 0.5 day |

---

## Phase 4 — Real-World Validation

**Goal**: Real-world 3GPP conformance TTCN files parse cleanly.

| Task | Description | Effort |
|------|-------------|--------|
| **V4.1** | Pick 5 representative conformance files (one module of each flavour: parameters, types/templates, components, testcases/altsteps, function-heavy). | 0.5 day |
| **V4.2** | Run `tree-sitter test --update` or iterate grammar + tests until 0 ERROR rows on those files. | 3 days |
| **V4.3** | Fix any remaining GLR conflicts exposed by larger corpus (expect 5–15 new `conflicts:` entries). | 1 day |
| **V4.4** | Add `test/highlights/*` tree-sitter highlight tests (validates that `queries/highlights.scm` does what it should). | 1 day |
| **V4.5** | Add `queries/highlights.scm`, `queries/locals.scm`, `queries/tags.scm` query files (optional but unlocks editor support). | 1 day |

---

## Phase 5 — Polish & Stabilization

| Task | Description | Effort |
|------|-------------|--------|
| **P5.1** | Resolve the 3 known-failing corpus tests (`class_type`, `component_type`, `configuration` produce wrong modifiers/visibility) by walking the BNF more strictly. | 0.5 day |
| **P5.2** | Document remaining GLR conflicts, ensure each is listed in `conflicts:` and documented. | 0.5 day |
| **P5.3** | Clean up `lexical` / `extras` / `inline` / external scanner placeholders referenced by `binding.gyp`, `bindings/rust/build.rs`, `Package.swift`, `bindings/go/binding.go`. | 1 day |
| **P5.4** | Bump version to `0.1.0`, update root `README.md` to remove "WIP" checkmarks for completed sections, link to `docs/`. | 0.5 day |
| **P5.5** | Reconcile version mismatch (`package.json` says `1.0.0`, others say `0.0.1`) — pick a single source of truth. | 0.5 day |

---

## Effort Budget

| Phase | Effort | Critical path |
|-------|--------|---------------|
| Quick Wins | 1–2 days | no (parallel) |
| 0 — Expressions | 5–7 days | **yes** (everything builds on it) |
| 1 — Templates | 7–10 days | **yes** |
| 2 — Statements/Comm | 7–10 days | **yes** |
| 3 — Types/Ports | 3–5 days | mostly parallel |
| 4 — Validation | 5–7 days | **yes** (regression-protect) |
| 5 — Polish | 3–5 days | cleanup |
| **Total** | **30–45 working days** | — |

---

## Risks & Open Questions

- **GLR conflict explosion**: each new alternative in `_expression` and `_statement` risks creating new conflicts. Mitigate by keeping alternatives narrow and using `prec.dynamic` + named precedence where helpful. Expect to **add 5–15 new `conflicts:` entries through the project**.
- **Numeric literals with underscores**: spec allows `_` inside numbers (e.g., `1_000_000`). Current grammar only allows digits + `.` + `E` suffix.
- **Char/Universal char quadruples** `char(0,0,1,113)` and **USI-like** `char(U+0171)`: spec defines these; may punt to a token rule.
- **`TemplateInstance` overlap with `Expression`**: the spec uses `TemplateInstance` where a value-only expression is allowed when a value parameter is on the receiving side; the grammar should accept the broader set and leave semantic validation to user tooling.
- **Patterns** (`pattern "..."`) are very rich; recommended to capture as a regex token to keep grammar tractable.
- **Real-world ASN.1 imports**: many files use `language "ASN.1:2002"` with `encode "UNALIGNED_PER_..."` in `import … all with {…}`. Fixing import-with-language-with-encoding is a quick win.
- **Test corpus discipline**: thematic test files work well — keep adding to existing files (`behaviours.txt`, `templates.txt`, `statements.txt`, …) rather than creating new top-level files (see `test/corpus/AGENTS.md`).

---

## Recommended Order of Operations

1. Land all 5 quick wins as PRs.
2. **Phase 0** (expressions) — non-negotiable foundation.
3. **Phase 1** (templates) — depends on Phase 0.
4. **Phase 2** (statements + comms) — depends on Phase 0.
5. **Phase 4** (validation) — gate the project at this point; decide whether further feature work is wanted.
6. **Phase 3** (types/ports polish) — opportunistic throughout Phases 0–2.
7. **Phase 5** (polish) — final cleanup before tagging `0.1.0`.

The phases are not strictly serial — many phase-3 items can land alongside earlier phases — but the dependencies above hold.
