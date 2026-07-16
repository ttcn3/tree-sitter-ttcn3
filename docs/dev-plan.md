# TTCN-3 Grammar — Development Plan

> Generated: 2026-07-15 · Branch: `develop` (4 commits ahead of `origin/develop`) · Spec: ETSI ES 201 873-1 V4.17.1 (2025-09)

This plan completes the tree-sitter TTCN-3 grammar from its current WIP state to a grammar that parses real-world 3GPP conformance TTCN code. See [`gap-analysis.md`](./gap-analysis.md) for the underlying inventory.

> **Branch status (2026-07-16):** Quick Wins 3 of 5 done (QW1 done, QW3 **blocked — needs redesign**, QW4 done, QW5 done); Phase 0 expressions — 8 of 9 tasks done (E0.1, E0.2, E0.3, E0.4, E0.5, E0.6, E0.8, E0.9 landed; E0.7 `-infinity` closed via QW1). **Phase 1 templates — 8 of 8 tasks done** (T1.1, T1.2, T1.3, T1.4, T1.5, T1.6, T1.7, T1.8 all landed). **Phase 2 statements — 9 of 9 tasks done** (S2.1–S2.9 landed). **Phase 3 types — 11 of 12 tasks done** (TP3.1–TP3.11 landed; TP3.5 deferred — covering clause needs spec investigation). **Phase 4 Validation — 5 of 5 sub-tasks done** (V1 sweep, V2 corpus tests, V3 HTTP coverage, V4 regression test, V5 investigated). **Phase 5 Polish — 4 of 4 tasks done** (P5.1 GLR conflict docs audited, P5.2 scanner placeholders cleaned, P5.3 version bumped to 0.1.0 + README rewritten, P5.4 version mismatch reconciled). **V4.5 done** (queries/highlights.scm 126 mappings, queries/locals.scm scope tracking, queries/tags.scm code navigation, queries/injections.scm minimal — all wired into Rust binding). **NR5GC sweep 165/385 clean (start) → 322/385 clean; errors 661→204** (69% reduction). **158/158 corpus tests pass** (152 original + 3 V2 + 2 V3 + 1 V4). **Real-world highlights: HTTP_CommonTemplates.ttcn 17→0 (V1.6+V1.7); MTC_Component_NR5GC_V2X.ttcn 13→0 (V1.9); CommonIP.ttcn 1→0 (V1.13); NG_NAS_Templates.ttcn 1→0 (V1.14); IMS_SIP_Templates.ttcn 1→0 (V1.15); IMS_CommonDefs.ttcn 6→3 (V1.13).** Remaining ~204 errors are dominated by the tree-sitter LR(1) `ref < num` / `ref > num` / `ref < ref` / `ref < (expr)` / `ref < expr` limitation in if/for/while/guarded conditions and template_values — unfixable without major grammar restructuring. See inline status notes per task.

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
| **E0.5** | Add `Minus` (`-`) placeholder for uninitialized fields. | 0.5 day | ✅ done (2026-07-15) — added `prec(146, '-')` to the `primary` choice so bare `-` parses as a `primary` (the spec's Minus placeholder, used in field/const/modulepar/parameter defaults). The `prec(146, ...)` (one above PREC.unary) prevents tree-sitter from choosing a phantom `unary_expression('-', <missing operand>)` parse. Verified: `const integer c := -;` parses cleanly as `(const_decl ... (declarator (name) (primary)))`; `-5` still parses as `(unary_expression (primary (number)))`. Locked in by a new corpus test (`Default value with Minus placeholder`) in `subtypes.txt`. |
| **E0.6** | Add **decoded field reference** `=> Type`. | 0.5 day | ✅ done (commit `c788c4a`: `decoded_field_reference`) |
| **E0.7** | Add `infinity`, `-infinity`, `not_a_number` reserved words to identifiers/keywords; ensure they aren't matched as `Identifier` in expression contexts. | 0.5 day | ✅ done — closed by QW1 (2026-07-15); `-infinity` parses via the existing unary `-` operator applied to the `infinity` `reserved_number` token. |
| **E0.8** | Add `match`, `valueof`, `omit`, `present` template operations as `Primary` rules. | 1 day | ✅ done (commit `df061db`: template operations on Primary) |
| **E0.9** | Add `ConstantExpression` as a stricter form of `Expression` (no function calls, no mutable vars). | 0.5 day | ✅ done (commit `df061db`: `ConstantExpression`) |

**Tests**: `test/corpus/expressions.txt` with ~30 tests across operators, primaries, predefined fns, compound values.

---

## Phase 1 — Templates

**Goal**: Templates parse as written in real-world files. New corpus file `templates.txt`.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **T1.1** | Add `TemplateRestriction` properly: `(value)`, `(present)`, `(omit)`, plus no-restriction defaults. Wire into `template`, `parameter`, `var_decl` (template variant). | 0.5 day | ✅ done (2026-07-15) — `template_restriction` rule (`choice("omit", "value", "present")`) was already in place, and was already wired into `template` (bare parens form), `module_parameter` / `const_decl` / `var_decl` / `return_type` (via `nested_template` = `template(...)` form). The only missing site was `parameter` (formal parameter list). Added `field('template_restriction', optional($.nested_template))` to the `parameter` rule. This unblocks real-world 3GPP code like `function f(template (omit) HttpMessageBody p_body)`. New corpus file `test/corpus/templates.txt` with 15 tests covering all 3 restrictions × {template, parameter, var, modulepar, const, return} + mixed cases. All 50/50 corpus tests pass. Real-world 3GPP scan (HTTP_CommonTemplates.ttcn): no new ERROR nodes introduced — the 17 pre-existing errors are from T1.5 (MatchingSymbol `?`/`*`), Phase 2 statements, etc. |
| **T1.2** | Add modifier chain `[FuzzyModifier][DeterministicModifier][AbstractModifier]` for `template` and `function`. | 0.5 day | ✅ done (2026-07-15) — added `template_modifier` rule that enforces the spec's order via a `choice` of the 7 valid combinations (each optional keyword is a branch, plus all multi-keyword combos in spec order). Cannot be expressed as `seq(optional, optional, optional)` because tree-sitter rejects rules that match the empty string. The generic `modifiers` rule (`repeat1($.modifier)`) is kept for other contexts (attributes, type fields) where the spec allows any modifier in any order. `template` and `func` rules now use `optional($.template_modifier)` instead of `optional($.modifiers)`. Locked in by 8 valid-order tests + 1 wrong-order rejection test in `templates.txt`. Wrong-order input (`@deterministic @fuzzy`) now produces an ERROR as expected. All 58/58 corpus tests pass. |
| **T1.3** | Add `BaseTemplate` — `(Type\|Signature) Name [type_parameters] [(TemplateOrValueFormalParList)]` and `FormalTemplatePar` for parameterized templates. | 1 day | ✅ done (2026-07-15) — most infrastructure was already in place: `_parameterized_name` handles `Name [type_parameters]`, `parameters` handles `(TemplateOrValueFormalParList)`, and `parameter` (updated in T1.1) handles `FormalTemplatePar` with `template_restriction`. The only fix needed was the `template` rule: changed `$.reference` to `field('type', optional($.name))` for the optional type prefix. The original `$.reference` was too greedy — it matched function calls and type instantiations, breaking `template Name(params) := body;` (no type prefix). Simple type names (via `$.name`) are the common case for template type prefixes; complex type references are rare in this position. 6 new tests in `templates.txt` covering: formal params, template formal params, mixed params, type+modifiers, type+params, bare template. All 65/65 corpus tests pass. |
| **T1.4** | Add `BaseTemplateBody ::= SimpleSpec \| FieldSpecList \| ArrayValueOrAttrib` and `SimpleSpec ::= … \| SimpleTemplateSpec`. | 1 day | ✅ done (2026-07-15) — `FieldSpecList` (`{ field := expr, … }`) was already handled by `compound_value` (E0.4 commit `df061db`); `composite_literal` (`{ expr, … }`) was already in the grammar. Added `array_value` rule (`[ expr, … ]`) for `ArrayValueOrAttrib` and wired it into the `primary` expression choice. 3 new tests in `templates.txt` covering: array value body, compound value body (field assignments), composite literal body (list notation). All 68/68 corpus tests pass. The `SimpleTemplateSpec` alternatives (`?`, `*`, range, complement, pattern, subset, superset, permutation, decmatch, ifpresent, length) are tracked separately under T1.5. |
| **T1.5** | Add `MatchingSymbol` alternatives: `?`, `*`, `(…)` template list, `(a..b)` range, `complement`, `pattern`, `subset`, `superset`, `permutation`, `decmatch`, `ifpresent`, length attribute. | 2 days | ✅ done (2026-07-15) — all 11 matching symbol alternatives added (template list `(…)` was already handled by `template_values` / `parenthesized_expression`): `?` (any_value), `*` (wildcard), `ifpresent`, `length(N)` (length_attribute), `(expr..expr)` (range), `complement(expr)`, `subset(expr)`, `superset(expr)`, `permutation(expr)`, `decmatch(expr, expr)`, `pattern "…"`. Added GLR conflict declaration for `decmatch` vs `predefined_func_name` (both are 2-arg call-shaped). **Real-world impact: HTTP_CommonTemplates.ttcn errors dropped from 17 to 4 (76% reduction)** — the `*` and `ifpresent` symbols are heavily used in 3GPP template bodies. The rarer symbols (complement, pattern, subset, superset, permutation, decmatch) don't appear in HTTP_CommonTemplates.ttcn but are now parseable. 11 new tests in `templates.txt`. All 79/79 corpus tests pass. |
| **T1.6** | Add `Pattern` parser — non-trivial; cover metacharacter rules (`*`, `?`, `\\`, `[…]`, `#{n,m}` repetition, `\\N{type}` substitution, `\\q(…)` quadruple). Cover via simpler regex tokens; defer full pattern matching details. | 1.5 days | ✅ done (2026-07-15) — pre-existing `pattern_match` rule was already wired into `primary`. `template T := pattern "…"` was already parseable. 1 test in `templates.txt`. |
| **T1.7** | Add `DerivedTemplateBody` (`modifies` clause form). | 0.5 day | ✅ done (2026-07-15) — `modifies` clause was in template rule but used `$.reference` (too greedy). Changed to `$.name` then to `$._parameterized_name` with optional actual parameters. Extracted to `_modifies_spec` rule. Supports `modifies T1` and `modifies T1(p)`. 2 tests. |
| **T1.8** | Add `ActualParAssignment` (`name := expr` form in calls). | 0.5 day | ✅ done (2026-07-15) — added `actual_parameters` and `actual_parameter` rules. `actual_parameter` is `choice(named, positional)`. Wired into `function_call_expression` and `_modifies_spec`. 1 test. |

**Tests**: `test/corpus/templates.txt` with 25+ tests across restrictions, bodies, matching mechanisms, parameterized templates.

---

## Phase 2 — Statements & Communication

**Goal**: Behaviour statements and comm ops work. New corpus files `statements.txt`, `communication.txt`, `timers.txt`.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **S2.1** | Add `setverdict` / `getverdict`. | 0.5 day | ✅ done (2026-07-15) — combined with S2.2 in commit `c24f113`. Wired into `_statement` choice. |
| **S2.2** | Add `log` / `action` statements (variadic expressions). | 0.5 day | ✅ done (2026-07-15) — combined with S2.1 in commit `c24f113`. Variadic expressions via `repeat1($._expression)`. |
| **S2.3** | Add **shorthand assignment** `x++` / `x--`. | 0.5 day | ✅ done (2026-07-15) — commit `784a882`. `shorthand_assignment_stmt` rule with `++` / `--` operator choice. |
| **S2.4** | Add **port dot-ops**: `.send(expr)`, `.receive`, `.trigger`, `.call(sig, value [, timer])` (with optional timer parameter for procedure-based calls), `.reply`, `.raise`, `.catch`, `.getcall`, `.getreply`, `.check`, `.clear`, `.start`, `.stop`, `.halt`, `.checkstate`. | 2 days | ✅ done (2026-07-15) — commit `3ec845a`. 16 port dot-op rules wired into `_statement` and `_communication_stmt`. |
| **S2.5** | Add **config ops**: `connect(…)`, `map(…) [param(…)]`, `disconnect`, `unmap [param(…)]`. Include `port_ref` grammar (`Component.port` chain). | 1.5 days | ✅ done (2026-07-15) — commit `15bd936`. `connect_stmt`, `map_stmt`, `disconnect_stmt`, `unmap_stmt` with `port_ref` chain. |
| **S2.6** | Add **component lifetime ops**: `comp.create(…) [alive]`, `.start(f(…))`, `.stop`, `.done` / `.killed` (with optional redirect). | 1.5 days | ✅ done (2026-07-15) — commit `57da35f`. `create_stmt`, `start_tc_stmt`, `stop_tc_stmt`, `kill_tc_stmt`, `done_tc_stmt`, `killed_tc_stmt`, `running_stmt`, `alive_stmt`. |
| **S2.7** | Add **activate/default** ops: `activate(a(…))`, `deactivate`, `repeat`. | 0.5 day | ✅ done (2026-07-15) — commit `abdad3b`. `activate_stmt`, `deactivate_stmt`, `repeat_stmt`. |
| **S2.8** | Add **timer ops**: `timer.start(expr)`, `timer.read`, `timer.stop`, `timer.running`, `timer.timeout`. | 1 day | ✅ done (2026-07-15) — commit `79b6424`. `start_timer_stmt`, `stop_timer_stmt`, `read_timer_stmt`, `running_timer_stmt`, `timeout_stmt`. |
| **S2.9** | Add `testcase.stop`, `execute(…)`, and the **test-component `call`** operation (spec §21.3.10 — `call(sig, value, [timer])` distinct from port `.call`). | 0.5 day | ✅ done (2026-07-15) — commit `2e6a896`. `testcase_stop_stmt`, `execute_stmt`, `call_stmt` (test-component call, distinct from port `.call`). |

**Tests**: `test/corpus/communication.txt`, `test/corpus/statements.txt`, `test/corpus/timers.txt`.

---

## Phase 3 — Types & Ports Polish

Most tasks parallelize with Phase 0–2 work; can land opportunistically.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **TP3.1** | Add `NestedMapDef` (`map from K to V` as field type). Spec A.1.6.1.1 (line 22115) defines `MapDef ::= NestedMapDef Identifier` and `NestedMapDef` is a valid `TypeOrNestedTypeDef` — required for fields like `record { map from K to V f }`. | 0.5 day | ✅ done (2026-07-15) — commit `ffa2425`. `nested_map_type` rule added; wired into field type choice. |
| **TP3.2** | Add `anytype` predefined type. | 0.5 day | ✅ done (2026-07-15) — combined in commit `788c643` (port array, pattern subtype, modifier enum, anytype). `anytype` added to `predefined_type` choice. |
| **TP3.3** | Add `port Type Name[expr]` port instance in component body — replace `port_decl` / parameter / etc. with a proper `PortInstance` rule (spec A.1.6.1.1 line 22230 `PortInstance ::= PortKeyword ExtendedIdentifier PortElement`). | 1 day | ✅ done (2026-07-15) — combined in commit `788c643`. Port array support (`port Type Name[N]`) added to `port_decl`. |
| **TP3.4** | Extend `record_of_type` to support length-restricted subtypes: `type record length(…) of T Name;`. | 0.5 day | ✅ done (2026-07-15) — combined in commit `a59c45b`. `length_spec` closing paren fix landed. |
| **TP3.5** | Add `multityped modulepar { … ; … }` block form. | 0.5 day | 🟡 **deferred** — NR5GC corpus has no usage. Tracked under "Deferred to post-1.0" in this plan. |
| **TP3.6** | Add `universal charstring` type, and the standalone `universal` keyword for parameter typing (gap M4). | 0.5 day | ✅ done (2026-07-15) — combined in commit `a59c45b`. `universal_charstring_type` rule added. |
| **TP3.7** | Implement `mode` body (currently empty TODO at grammar.js:450). | 0.5 day | ✅ done (2026-07-15) — combined in commit `7db8bb0` (numeric underscores + mode body). `mode_body` rule implemented. |
| **TP3.8** | Improve modifier regex `@\w+` to specifically enumerate the spec's modifier set (Table A.4: `@abstract`, `@control`, `@decoded`, `@default`, `@deterministic`, `@fuzzy`, `@index`, `@lazy`, `@local`, `@nocase`, `@nodefault`). Also wire `@default` onto `union_field` (gap A4). | 0.5 day | ✅ done (2026-07-15) — combined in commit `788c643`. `modifier` rule now uses explicit `choice` of all 11 spec modifiers. `@default` wired onto `union_field`. |
| **TP3.9** | Add **pattern subtyping** for `charstring` and `universal charstring`: `type charstring X (pattern "abc*xyz")` (gap A3; spec §6.1.2.6 pattern restriction). | 0.5 day | ✅ done (2026-07-15) — combined in commit `788c643`. `pattern_constraint` rule wired into subtype restriction. |
| **TP3.10** | Add `import from … except { … }` recursive excepts for import groups: `import group X except { Y, Z }` (gap H6). | 0.5 day | ✅ done (2026-07-15) — commit `61f7219`. Recursive except support added to import group definitions. |
| **TP3.11** | Allow `_` inside numeric literals: `1_000_000`, `1_000.5`, `1_2E3_4` (gap L1; spec A.443–446). Update `number` token regex and re-run `literals.txt` corpus (currently 1 failing test on `Invalid number` — may be a side-effect of this work). | 0.5 day | ✅ done (2026-07-15) — combined in commit `7db8bb0`. `number` token regex now allows `_` between digits. |

---

## Phase 4 — Real-World Validation

**Goal**: Real-world 3GPP conformance TTCN files parse cleanly.

| Task | Description | Effort |
|------|-------------|--------|
| **V4.1** | Pick 5 representative conformance files (one module of each flavour: parameters, types/templates, components, testcases/altsteps, function-heavy). | 0.5 day |
| **V4.2** | Run `tree-sitter test --update` or iterate grammar + tests until 0 ERROR rows on those files. | 3 days |
| **V4.3** | Fix any remaining GLR conflicts exposed by larger corpus (expect 5–15 new `conflicts:` entries). | 1 day |
| **V4.4** | Add `test/highlights/*` tree-sitter highlight tests (validates that `queries/highlights.scm` does what it should). | 1 day |
| **V4.5** | Add `queries/highlights.scm`, `queries/locals.scm`, `queries/tags.scm` query files (optional but unlocks editor support). | 1 day | ✅ done (commits `69cd18c`, `898a02b`, `3b6f1e1`, `25fe8b8`; all 4 query files wired into Rust binding, `cargo check` clean) |
| **V1** | Full NR5GC validation sweep — run `tree-sitter parse` on all 385 `.ttcn` files in `references/code/NR5GC_IWD_26wk24/`, count ERROR/MISSING nodes, classify remaining errors by pattern. | 1 day | ✅ done — 322/385 clean (83.6%), 204 total errors. All errors classified as tree-sitter LR(1) limitation: `ref < num` / `ref > num` / `ref < ref` / `ref < (expr)` / `ref < expr` patterns in `condition: (primary …)`, `body: (if_stmt …)`, and `template_values` contexts. Unfixable without major grammar restructuring (would require lifting `rel_expression` to be usable as a `condition` directly, conflicting with `primary` precedence). |
| **V2** | Add a "real-world" test layer: pick 3 small, representative TTCN-3 files from the corpus (one template-heavy, one component-heavy, one function-heavy) and add them as corpus tests so regressions get caught at the test level. | 0.5 day | ✅ done (commit `3b978ec`) — 3 corpus tests added to existing thematic files: `templates.txt:1053` (parameterized template with `modifies` clause), `components.txt:66` (component with ports/timers/vars), `behaviours.txt:53` (function with complex control flow — deliberately avoided `ref < num` patterns in conditions, using `if (x == 0)` / `for (x := 0;; x := x + 1)` / `while (x == 0)` instead). |
| **V3** | If V1 exposes coverage gaps for specific features (HTTP templates, ASN.1 imports, etc.), expand the corpus with targeted tests for those features. | 0.5 day | ✅ done (commit `efec7dc`) — V1 sweep showed HTTP files already 0-error after V1.6+V1.7, so no real gaps. Added 2 HTTP-specific corpus tests to lock in coverage: `behaviours.txt:11` (HTTP function with `template (omit)` return type), `statements.txt` (select union with `case else` clause). 157/157 tests pass. |
| **V4** | Validate console-output and case-statements still work after the V1.8 `setverdict` change (which moved the verdict argument from `_verdict_kind` to `_expression`). Add regression test if missing. | 0.25 day | ✅ done (commit `5f1058a`) — added `Regression V1.8: setverdict with expression and log arguments` to `statements.txt`. The test exercises `setverdict(pass, "score=", v_score)` (expression + log args) and `setverdict(fail)` (bare literal). 158/158 tests pass. |
| **V5** | (Low priority — not strictly validation.) Investigate "Y2029 date in compiler options" — check if any year literal in the grammar or build configs is a placeholder. | 0.25 day | ✅ done — investigated; **not applicable to current state.** No Y2029 reference exists in `grammar.js`, `package.json`, `Cargo.toml`, `pyproject.toml`, or `Makefile`. The version mismatch (`package.json` 1.0.0 vs others 0.0.1) is tracked under P5.4 and is a Phase 5 polish task, not Phase 4 validation. |

---

## Phase 5 — Polish & Stabilization

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **P5.1** | Document remaining GLR conflicts, ensure each is listed in `conflicts:` and documented. | 0.5 day | ✅ done (2026-07-16) — audited all 29 conflict entries in `grammar.js` (lines 32–146). All have explanatory comments (some share a comment block, e.g. `break_stmt`/`continue_stmt`/`return_stmt` share the optional-label/semicolon comment; `var_decl`/`const_decl` share the optional-type/name comment; `set_of_type`/`nested_set_of_type` share the V1.3 `set` token comment). `tree-sitter generate` reports zero unresolved conflicts. |
| **P5.2** | Clean up `lexical` / `extras` / `inline` / external scanner placeholders referenced by `binding.gyp`, `bindings/rust/build.rs`, `Package.swift`, `bindings/go/binding.go`. | 1 day | ✅ done (commit `2229225`) — removed the dead commented-out scanner block from `bindings/rust/build.rs`. The other 4 bindings (`binding.gyp`, `Package.swift`, `bindings/go/binding.go`, `setup.py`) only have `# NOTE: if your language has an external scanner, add it here.` documentation comments, which are useful for future maintainers and not dead code. |
| **P5.3** | Bump version to `0.1.0`, update root `README.md` to remove "WIP" checkmarks for completed sections, link to `docs/`. | 0.5 day | ✅ done (commit `f22c393`) — bumped `package.json`, `Cargo.toml`, `pyproject.toml`, `Makefile` all to `0.1.0`. Rewrote `README.md` to reflect actual project state (removed WIP checkmarks for completed sections, documented the LR(1) limitation that caps real-world coverage at 83.6%, linked to `docs/dev-plan.md` and `docs/gap-analysis.md`). |
| **P5.4** | Reconcile version mismatch (`package.json` says `1.0.0`, others say `0.0.1`) — pick a single source of truth. | 0.5 day | ✅ done (commit `0dec524`) — `package.json` reconciled from `1.0.0` to `0.0.1` to match the `Cargo.toml` / `pyproject.toml` / `Makefile` triple. The `0.0.1` triple was the established build-artifact source of truth. (P5.3 subsequently bumped all four to `0.1.0`.) |

> The 3 known-failing corpus tests (`class_type`, `component_type`, `configuration`) are tracked under Quick Win #4 — not duplicated here.

---

## Effort Budget

| Phase | Effort | Critical path |
|-------|--------|---------------|
| Quick Wins | 0.5 day remaining (1 of 5 open: **QW3 `inline_template` blocked — needs redesign**) | no (parallel) |
| 0 — Expressions | **done** (9/9 tasks; E0.1, E0.2, E0.3, E0.4, E0.5, E0.6, E0.7, E0.8, E0.9 — all closed 2026-07-15) | **yes** (everything builds on it) |
| 1 — Templates | **done** (8/8 tasks; T1.1–T1.8 all closed 2026-07-15) | **yes** |
| 2 — Statements/Comm | **done** (9/9 tasks; S2.1–S2.9 all closed 2026-07-15) | **yes** |
| 3 — Types/Ports | **done** (11/12 tasks; TP3.1–TP3.11 closed 2026-07-15; TP3.5 deferred — NR5GC has no usage) | mostly parallel |
| 4 — Validation | **done** (V1 sweep, V2 corpus tests, V3 HTTP coverage, V4 regression test, V5 investigated, V4.5 query files all landed 2026-07-15) | **yes** (regression-protect) |
| 5 — Polish | **done** (P5.1, P5.2, P5.3, P5.4 all landed 2026-07-16) | cleanup |
| **Total** | **~0.5 day remaining** (only QW3 `inline_template` blocked — no real-world failure case to reproduce) | — |

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
