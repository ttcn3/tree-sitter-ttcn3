# TTCN-3 Grammar — Development Plan

> Generated: 2026-07-15 · Branch: `feature/quick-wins-batch-1` (21 commits ahead of `main`) · Spec: ETSI ES 201 873-1 V4.17.1 (2025-09)

This plan completes the tree-sitter TTCN-3 grammar from its current WIP state to a grammar that parses real-world 3GPP conformance TTCN code. See [`gap-analysis.md`](./gap-analysis.md) for the underlying inventory.

> **Branch status (2026-07-15):** Quick Wins 3 of 5 done (QW1 done, QW3 **blocked — needs redesign**, QW4 done, QW5 done); Phase 0 expressions ~7 of 9 tasks done (E0.1, E0.2, E0.3, E0.4, E0.6, E0.8, E0.9 landed; E0.5 `Minus` placeholder still open; E0.7 `-infinity` closed via QW1). 0 corpus tests failing (34/34 pass). See inline status notes per task.

---

## Quick Wins (1–2 days each)

Land these as standalone PRs before the big phases to fix the most-cited real-world failures:

1. **Add `infinity`, `-infinity`, `not_a_number` keywords** — fixes the `HTTP_ASP_TypeDefs.ttcn` failure. **Status:** ✅ **done** — `infinity` and `not_a_number` were already in `reserved_number` (grammar.js line 1136); `-infinity` parses correctly via the existing `unary_expression` rule (operator `-` applied to the `infinity` `reserved_number` token), producing `(unary_expression operand: (reserved_number))`. Verified on a test snippet and locked in by two new corpus tests in `test/corpus/literals.txt` (`Infinity` and `Negative infinity`). Real-world 3GPP corpus scan: every occurrence is `infinity` (positive) — no `-infinity` found in the current snapshot, so the unary-minus approach is sufficient.
2. **Add `+` / `-` literals and `omit` to the numeric-token set** — narrowly scoped to the literal/reserved-token layer (the recent `compound_value`, `predefined_func_call`, `presence_check`, `decoded_field_reference`, `ConstantExpression`, template-op commits belong to Phase 0, not here). **Status:** the literal-token work is done; the broader expression work it triggered is tracked under Phase 0 below.
3. **Fix `inline_template` rule** — make it `optional(seq($.reference, ':')) $._expression` — unblocks one class of testcases (`NR_RRC_Templates.ttcn` parameterized templates). **Status:** 🛑 **blocked — recommended fix does not work as written.** Attempted on 2026-07-15: changing the rule creates cascading unresolved GLR conflicts. First, a top-level conflict between `source_file → _expression` and `source_file → inline_template → _expression`. Second, in every multi-element `template_values` (parameter list) context: `'(', _expression, ','` ambiguates between `parenthesized_expression`, `template_values` with a bare expr, and `template_values` wrapping `inline_template(expr)`. Adding `prec.dynamic(-1, ...)` to `inline_template` does **not** resolve these — tree-sitter's static conflict analysis still flags them. **Reverted; grammar is back to the original `seq($.reference, ':', $._expression)`.** Needs a different design: either (a) introduce a separate `template_value` rule for the bare form, used only inside `template_values`; or (b) split `inline_template` into two rules with disjoint contexts. Reopen when the real-world failure case (parameterized template body) is reproduced.
4. **Fix the 3 known-failing corpus tests** (`class_type`, `component_type`, `configuration` produce wrong modifiers/visibility) — also tracked here as the canonical Phase 5 cleanup item (P5.1 was removed to avoid duplication; this is the same task, scoped to "make the parser emit the spec-correct modifiers/visibility ordering"). **Status:** ✅ **done** — the expected S-expressions committed in `564c404` now match the parser output. All 3 tests pass (verified `tree-sitter test`: 34/34 pass, 0 failures). No grammar change was needed; the plan's "grammar-side fix" claim was stale.
5. **Wire `import ... language "..."` clause** — allows `import from X language "ASN.1:2002" all with {encode "..."}` to parse cleanly. **Status:** done (commit `12538b1`); `language_spec` is wired into `import_definition`.

---

## Phase 0 — Expression Foundation

**Goal**: Expression parsing works for any real-world expression. New corpus file `expressions.txt`.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **E0.1** | Rebuild the expression precedence chain as the spec requires (XorExpression → AndExpression → NotExpression → EqualExpression → RelExpression → ShiftExpression → BitOrExpression → BitXorExpression → BitAndExpression → BitNotExpression → AddExpression → MulExpression → UnaryExpression → Primary). Keep `PREC.*` for precedence numbers. | 1 day | ✅ done (2026-07-15) — split the single `binary_expression` / `unary_expression` rules into 14 spec-named chain rules plus `primary`. Each rule matches only with its operator; operands are `_expression` so PREC.* drives associativity. `_expression` is a flat choice of all 15 levels. Added `or_expression` (the plan's chain listed 14; `or` is at PREC.logical_or=20 in the existing PREC table and was preserved). Real-world error count on `HTTP_ASP_TypeDefs.ttcn` unchanged (2 errors before/after — pre-existing WIP issues, not regressions). All 34 corpus tests pass; test S-expressions regenerated via `tree-sitter test --update`. Test churn: `expressions.txt` (236 lines), `conflicts.txt` (42), `literals.txt` (14) — mostly the new `(primary (number))` wrapping around literals. |
| **E0.2** | Extend `Primary`: parenthesized expr, predefined value, presence-check ops (`ispresent`/`isbound`/`isvalue`/`ischosen`), function call. | 1 day | ✅ done (commit `c788c4a`: `parenthesized_expression`, `presence_check`, `predefined_func_call`); `expressions.txt` covers it |
| **E0.3** | Add **predefined-function call** — a dedicated rule matching all ~40 predefined function names from Annex C plus allowing any identifier that resolves to one. | 0.5 day | ✅ done (commit `c788c4a`: `predefined_func_call` rule) |
| **E0.4** | Add **compound expressions**: assignment notation `{ field := expr, … }` and list notation `{ expr, … }` — these are also `Primary`. | 1 day | ✅ done (commit `df061db`: `compound_value`) |
| **E0.5** | Add `Minus` (`-`) placeholder for uninitialized fields. | 0.5 day | ⬜ open |
| **E0.6** | Add **decoded field reference** `=> Type`. | 0.5 day | ✅ done (commit `c788c4a`: `decoded_field_reference`) |
| **E0.7** | Add `infinity`, `-infinity`, `not_a_number` reserved words to identifiers/keywords; ensure they aren't matched as `Identifier` in expression contexts. | 0.5 day | ✅ done — closed by QW1 (2026-07-15); `-infinity` parses via the existing unary `-` operator applied to the `infinity` `reserved_number` token. |
| **E0.8** | Add `match`, `valueof`, `omit`, `present` template operations as `Primary` rules. | 1 day | ✅ done (commit `df061db`: template operations on Primary) |
| **E0.9** | Add `ConstantExpression` as a stricter form of `Expression` (no function calls, no mutable vars). | 0.5 day | ✅ done (commit `df061db`: `ConstantExpression`) |

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
| **S2.4** | Add **port dot-ops**: `.send(expr)`, `.receive`, `.trigger`, `.call(sig, value [, timer])` (with optional timer parameter for procedure-based calls), `.reply`, `.raise`, `.catch`, `.getcall`, `.getreply`, `.check`, `.clear`, `.start`, `.stop`, `.halt`, `.checkstate`. | 2 days |
| **S2.5** | Add **config ops**: `connect(…)`, `map(…) [param(…)]`, `disconnect`, `unmap [param(…)]`. Include `port_ref` grammar (`Component.port` chain). | 1.5 days |
| **S2.6** | Add **component lifetime ops**: `comp.create(…) [alive]`, `.start(f(…))`, `.stop`, `.done` / `.killed` (with optional redirect). | 1.5 days |
| **S2.7** | Add **activate/default** ops: `activate(a(…))`, `deactivate`, `repeat`. | 0.5 day |
| **S2.8** | Add **timer ops**: `timer.start(expr)`, `timer.read`, `timer.stop`, `timer.running`, `timer.timeout`. | 1 day |
| **S2.9** | Add `testcase.stop`, `execute(…)`, and the **test-component `call`** operation (spec §21.3.10 — `call(sig, value, [timer])` distinct from port `.call`). | 0.5 day |

**Tests**: `test/corpus/communication.txt`, `test/corpus/statements.txt`, `test/corpus/timers.txt`.

---

## Phase 3 — Types & Ports Polish

Most tasks parallelize with Phase 0–2 work; can land opportunistically.

| Task | Description | Effort |
|------|-------------|--------|
| **TP3.1** | Add `NestedMapDef` (`map from K to V` as field type). Spec A.1.6.1.1 (line 22115) defines `MapDef ::= NestedMapDef Identifier` and `NestedMapDef` is a valid `TypeOrNestedTypeDef` — required for fields like `record { map from K to V f }`. | 0.5 day |
| **TP3.2** | Add `anytype` predefined type. | 0.5 day |
| **TP3.3** | Add `port Type Name[expr]` port instance in component body — replace `port_decl` / parameter / etc. with a proper `PortInstance` rule (spec A.1.6.1.1 line 22230 `PortInstance ::= PortKeyword ExtendedIdentifier PortElement`). | 1 day |
| **TP3.4** | Extend `record_of_type` to support length-restricted subtypes: `type record length(…) of T Name;`. | 0.5 day |
| **TP3.5** | Add `multityped modulepar { … ; … }` block form. | 0.5 day |
| **TP3.6** | Add `universal charstring` type, and the standalone `universal` keyword for parameter typing (gap M4). | 0.5 day |
| **TP3.7** | Implement `mode` body (currently empty TODO at grammar.js:450). | 0.5 day |
| **TP3.8** | Improve modifier regex `@\w+` to specifically enumerate the spec's modifier set (Table A.4: `@abstract`, `@control`, `@decoded`, `@default`, `@deterministic`, `@fuzzy`, `@index`, `@lazy`, `@local`, `@nocase`, `@nodefault`). Also wire `@default` onto `union_field` (gap A4). | 0.5 day |
| **TP3.9** | Add **pattern subtyping** for `charstring` and `universal charstring`: `type charstring X (pattern "abc*xyz")` (gap A3; spec §6.1.2.6 pattern restriction). | 0.5 day |
| **TP3.10** | Add `import from … except { … }` recursive excepts for import groups: `import group X except { Y, Z }` (gap H6). | 0.5 day |
| **TP3.11** | Allow `_` inside numeric literals: `1_000_000`, `1_000.5`, `1_2E3_4` (gap L1; spec A.443–446). Update `number` token regex and re-run `literals.txt` corpus (currently 1 failing test on `Invalid number` — may be a side-effect of this work). | 0.5 day |

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
| **P5.1** | Document remaining GLR conflicts, ensure each is listed in `conflicts:` and documented. | 0.5 day |
| **P5.2** | Clean up `lexical` / `extras` / `inline` / external scanner placeholders referenced by `binding.gyp`, `bindings/rust/build.rs`, `Package.swift`, `bindings/go/binding.go`. | 1 day |
| **P5.3** | Bump version to `0.1.0`, update root `README.md` to remove "WIP" checkmarks for completed sections, link to `docs/`. | 0.5 day |
| **P5.4** | Reconcile version mismatch (`package.json` says `1.0.0`, others say `0.0.1`) — pick a single source of truth. | 0.5 day |

> The 3 known-failing corpus tests (`class_type`, `component_type`, `configuration`) are tracked under Quick Win #4 — not duplicated here.

---

## Effort Budget

| Phase | Effort | Critical path |
|-------|--------|---------------|
| Quick Wins | 0.5 day remaining (1 of 5 open: **QW3 `inline_template` blocked — needs redesign**) | no (parallel) |
| 0 — Expressions | 0.5 day remaining (E0.5 `Minus` placeholder of 9 tasks; E0.1, E0.7 closed) | **yes** (everything builds on it) |
| 1 — Templates | 7–10 days | **yes** |
| 2 — Statements/Comm | 7–10 days | **yes** |
| 3 — Types/Ports | 4–6 days (3 new tasks TP3.9, TP3.10, TP3.11) | mostly parallel |
| 4 — Validation | 5–7 days | **yes** (regression-protect) |
| 5 — Polish | 2.5–4 days (P5.1 deduped into QW4) | cleanup |
| **Total** | **27–40 working days remaining** | — |

---

## Risks & Open Questions

- **GLR conflict explosion**: each new alternative in `_expression` and `_statement` risks creating new conflicts. Mitigate by keeping alternatives narrow and using `prec.dynamic` + named precedence where helpful. Expect to **add 5–15 new `conflicts:` entries through the project**. (`timer_decl` and `port_decl` GLR conflicts were already declared on `feature/quick-wins-batch-1`; expect more from Phase 1 / 2 work.)
- **Numeric literals with underscores** (gap L1): spec allows `_` inside numbers (e.g., `1_000_000`). Tracked as TP3.11.
- **Char/Universal char quadruples** `char(0,0,1,113)` and **USI-like** `char(U+0171)`: spec defines these; may punt to a token rule.
- **`TemplateInstance` overlap with `Expression`**: the spec uses `TemplateInstance` where a value-only expression is allowed when a value parameter is on the receiving side; the grammar should accept the broader set and leave semantic validation to user tooling.
- **Patterns** (`pattern "..."`) are very rich; recommended to capture as a regex token to keep grammar tractable. Subtype-level pattern (TP3.9) and template-body pattern (T1.6) are distinct tasks.
- **Real-world ASN.1 imports**: many files use `language "ASN.1:2002"` with `encode "UNALIGNED_PER_..."` in `import … all with {…}`. **Done** on `feature/quick-wins-batch-1` (QW5 / commit `12538b1`).
- **Test corpus discipline**: thematic test files work well — keep adding to existing files (`behaviours.txt`, `templates.txt`, `statements.txt`, …) rather than creating new top-level files (see `test/corpus/AGENTS.md`).
- **`infinity` / `-infinity` expression parsing** *(closed 2026-07-15)*: spec treats `infinity` and `-infinity` as a single float value pair (spec C.1.9 line 24943). The grammar distinguishes the unary-minus case (legitimate in expression context, produces `(unary_expression operand: (reserved_number))`) from the bare `infinity` literal. Real-world 3GPP corpus scan: only `infinity` (positive) appears — no `-infinity` in `HTTP_ASP_TypeDefs.ttcn` (line 31 has `(1 .. infinity)`, not `-infinity`). The unary-minus approach is sufficient; locked in by two new corpus tests in `literals.txt`.
- **`???` not-implemented identifier**: spec A.1.5 (Table A.2) lists `???` as a special terminal. Not currently a token in the grammar; deferred to post-1.0 unless real-world files demand it.

---

## Deferred to post-1.0

These are 🟡-severity gaps from `gap-analysis.md` that are explicitly out of scope for the 0.1.0 grammar. They are documented so future contributors know they exist and what the work would be; not required for the grammar to parse the 3GPP conformance testsuite.

| Gap | Description | Why deferred |
|-----|-------------|--------------|
| **L2** | `Bstring` allowance of whitespace + line continuations (`'foo\<LF>bar'B`). Spec A.447. | Rare in real-world TTCN; regex tightening can wait. |
| **L3** | `FreeText` (used in `log` / `action` / `with`) is very lax (ExtendedAlphaNum); current `charstring` regex is narrower. Spec A.461. | Current grammar accepts most real-world cases; tightening is an edge case. |
| **L4** | `?` and `*` as tokens; reserved keywords — current grammar may misclassify `*` as multiply-op in some positions. Spec A.467–471. | Wildcard use is in template bodies (T1.5); after T1.5 lands, re-evaluate. |
| **M3** | `GetAttributeOp` — `TypeOrTemplate.encode`, `.variant`, `.display`. Spec A.560. | Used in attributes and `external` functions; not seen in conformance corpus. |
| **M5** | `in` / `out` / `inout` parameter directions completeness. Spec A.466–468. | Current `formal_parameter` covers most cases; spec edge cases can wait. |
| **G1** | Full signature def grammar — `signature Foo() return T exception (E, F)`. Spec §14 / A.183. | Partial in current grammar; `exception` clause is rare in real-world code. |
| **G5** | `all` port message list (deprecated but still in use). Spec A.62. | Partial; deprecation path means the deprecated form will go away eventually. |
| **D7** | `done` / `killed` (component lifetime) with optional redirect. Spec §21.3 / A.279. | **Re-evaluate**: S2.6 mentions this; confirm it covers the redirect form once S2.6 lands. |
| **F3** | `DerivedTemplateBody` (`modifies` clause form) — `template Foo := modifies Base.x := …` style. Spec §15.5 / A.152. | Partial in current grammar; full form is rare. |
| **F12** | Subset / Superset match. Spec A.135. | T1.5 covers `?`/`*`/range; subset/superset can land in T1.5 or as T1.11. |
| **F13** | `permutation` keyword. Spec A.140. | Same as F12. |
| **K1** | `mode` definition body (mode spec) — TODO at grammar.js:450. Spec A.498–507. | Tracked as TP3.7 — **not** deferred. (Listed here for cross-reference only.) |
| **K2** | `action(…)` external action. Spec §25 / A.499. | Tracked under S2.2. (Cross-reference only.) |

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
