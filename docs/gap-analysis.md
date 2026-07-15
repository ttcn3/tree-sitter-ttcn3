# TTCN-3 Grammar — Gap Analysis

> Generated: 2026-07-15 · Branch: `main` · Spec: ETSI ES 201 873-1 V4.17.1 (2025-09)

## Method

This gap analysis cross-references three sources:

1. **`grammar.js`** — 1062 lines, the hand-written tree-sitter grammar
2. **ETSI ES 201 873-1 V4.17.1** spec; Annex A (BNF) is the ground truth and sections 6–25 were surveyed
3. **385 real-world TTCN-3 files** in `references/code/NR5GC_IWD_26wk24/` (3GPP NR5GC conformance testsuite, ~6.7 M LOC across the corpus)

Empirical evidence was gathered by running `tree-sitter parse` on representative files and pinpointing exact failure columns.

---

## Current State

### What `grammar.js` already implements (declarations only)

- 30+ definition kinds declared in `_definition` (modules, groups, functions, altsteps, testcases, configurations, controls, behavior types, component types, class types, constructor, subtype, record/set/record-of/set-of/union/enumerated/port/signature/map types, var/timer/port/const decls, template, friend, import, mode)
- Precedence table for binary operators (`PREC`, grammar.js lines 1–17)
- Intentional GLR conflicts for optional labels, var/const names (grammar.js lines 32–58)
- 11 corpus tests across 8 thematic files (`test/corpus/`): **17 passing / 3 known-failing** — modifiers/visibility ordering in `class_type`, `component_type`, `configuration`

### What's currently broken on real-world TTCN

Spot-checked 5 files from the conformance suite — every one has parse errors:

| File | First error | What broke |
|------|-------------|------------|
| `PicsPixit/Parameters.ttcn` | line 81 | `:=` default with predefined-function call (`oct2bit('000102030405060708090A0B0C0D0E0F'O)`) — no expression support for function calls |
| `Common/HTTP/HTTP_ASP_TypeDefs.ttcn` | line 30 | `type record length (1 .. infinity) of …` — `infinity` is not a recognized keyword |
| `Common/NasEmulation/NasEmu5G_Component_NR_BASE.ttcn` | line 44 | `NASEMU_NR_BASE_PTC.create("NASEMU_NR_BASE") alive` — `.create(...) alive` method invocation + `alive` suffix unhandled |
| `Common/NR/NR_RRC_Templates.ttcn` | line ~21 | `template (present) … := ?;` parameterized templates with `?` matching; `template (omit) octetstring p_X := omit` |
| `Common/IP_PTC/IP_PTC_Component.ttcn` | line 91 | `type record length(tsc_NoOfIMSPDNs) of …` — `length(const_ref)`; lines 124–126 `port Type Name[expr]` component-internal port arrays |
| `Common/IMS_LibSip/LibSip_SIPTypesAndValues.ttcn` | line 141 | `const HostPort c_X := { host := "", portField := c_defaultSipPort }` — assigned compound values with field references |
| `Common/NR/NR_CellInfo.ttcn` | line 20+ | `import from X language "ASN.1:2002" all with {encode "..."}` — `with` clause placement / `language` clause interaction |
| `Common/NR/NR_SecurityDefinitionsAndExternalFunctions.ttcn` | line 14 | Same `import … language … with` issue |

---

## Gap Inventory (by Spec Section)

**Severity legend**:
- 🔴 **critical** — blocks parsing of any typical real-world file
- 🟠 **major** — broad corpus coverage missing
- 🟡 **minor** — edge cases, rarely used in practice

### A. Types (§6) — moderate gaps

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| A1 | §6.1.2.3 | `Range` subtypes: `type integer X (1 .. 10);` literal range constraints | **missing** — `length_spec` exists but no general `AllowedValuesSpec` `( … )` | 🟠 |
| A2 | §6.1.2.3 | `infinity` / `-infinity` / `not_a_number` reserved words | **missing** | 🔴 |
| A3 | §6.1.2.5 | `pattern` subtyping: `type charstring X (pattern "abc*xyz");` | **missing** | 🟡 |
| A4 | §6.2.5 | Union field `@default` modifier | **missing** (grammar only has `@default` on `field`, not `union_field`) | 🟡 |
| A5 | §6.2.13 | Subtyping of structured types (length + list + range mixing) | partial | 🟠 |
| A6 | §6.2.15 | Nested map types as field types (`NestedMapDef`) | **missing** — `map_type` exists only at top level | 🔴 |
| A7 | §6.2.7 | Array definition `Type Name[N]` on type definitions | partial — only on field/param | 🟠 |
| A8 | §6.2.6 | `anytype` predefined type in `nested_type` | **missing** | 🟡 |
| A9 | §6.2.16 | `open type` predefined | **missing** | 🟡 |

### B. Expressions (§7) — **largest gap by far**

The grammar's `_expression` (line 489) has ~12 alternatives; the spec's `SingleExpression` has 14 precedence levels, ~30 operator/production variants, and ~40 predefined-function names.

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| B1 | §7.0 / A.527 | **Compound expressions** — `{ field := expr, … }` assignment notation and `{ expr, … }` value-list notation | **missing** — `composite_literal` collapses both but lacks field-name syntax | 🔴 |
| B2 | §7.0 | The `Minus` (placeholder `-`) for uninitialized values in compound expressions | **missing** | 🟠 |
| B3 | §7.1.0 / A.561 | **Presence checking**: `ispresent(x)`, `isbound(x)`, `isvalue(x)`, `ischosen(u, alt)` | **missing** | 🔴 |
| B4 | §7.1.4 | `not`, `and`, `or`, `xor` logical operators | partial — present as `_expression` alternatives but no precedence chain | 🟠 |
| B5 | §7.1.1 | Full precedence chain (Unary → Mul → Add → BitOr/Xor/And/Not → Shift → Rel → Equal → And → Xor → Or) | `PREC.*` constants correct but the production chain (XorExpression…Primary) is missing | 🟠 |
| B6 | §7.2 | Field reference chain `a.b.c.d` extending left-to-right with index/dot/`=>` | partial — `selector_expression` + `index_expression` are left-recursive; `decoded_field_reference` `=> type` **missing** | 🟠 |
| B7 | Annex C | Predefined functions: `int2char`, `int2bit`, `bit2int`, `oct2bit`, `char2oct`, `lengthof`, `match`, `valueof`, `isbound`, `decvalue`, `encvalue`, `decmatch`, `testcasename`, `substr`, `replace`, … | **missing** | 🔴 |
| B8 | A.179 | **Function invocation** `f(…)` on a `FunctionRef` including qualified `module.f(…)` | partial — `function_call_expression` exists for unqualified refs only | 🟠 |
| B9 | Annex C | `match(value, template)`, `valueof(template)`, `isbound(value)`, `isvalue(template)`, `ispresent(template)`, `ischosen(union, name)`, `decmatch(template, type)` | **missing** | 🔴 |
| B10 | §7.1.3 | Compound value comparison `{ a:=1 } == { a:=2 }` on structured types | flows from B1 | 🟠 |
| B11 | §7.1.1 | Float special values handling `-infinity`, `infinity`, `not_a_number` as expression operands | **missing** | 🟡 |
| B12 | §7.3 | **Decoded field reference**: `x => Type` (postfix decode operator) | **missing** | 🟡 |
| B13 | A.273 | `ComponentType.create(…)` **method invocation** + `[AliveKeyword]` suffix (e.g., `MyComp.create("name") alive`) | **missing** — concrete failure on `NasEmu5G_Component_NR_BASE.ttcn:44` | 🔴 |
| B14 | A.562 | `&` string/list concatenation (already in `additive`) | covered | ✅ |
| B15 | §10 / A.534 | `ConstantExpression` (more restricted form used in type lists / enum values / modulepars — no mutable vars, no function calls) | **missing** — grammar conflates with `Expression` | 🟠 |

### C. Statements (§19) — major gaps

Grammar's `_statement` (line 701) has ~24 alternatives; spec has more, including `repeat`, `activate`, `deactivate`, `setverdict`, `getverdict`, `action`, `log`, all communication ops.

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| C1 | §19.11 | `log` statement: `log(value, value, …)` | **missing** | 🟠 |
| C2 | §19.1 / A.541 | **Shorthand assignment** `x++` / `x--` | **missing** (grammar has `++`/`--` as unary only) | 🟠 |
| C3 | §16.1.5 / A.496 | `setverdict(pass, "reason")` | **missing** | 🔴 |
| C4 | A.498 | `getverdict()` | **missing** | 🟡 |
| C5 | §25 / A.499 | `action("text" & expr)` external action statements | **missing** | 🟡 |
| C6 | §19.13 / A.524 | `continue` (declared; label support & reachability rules incomplete) | partial | 🟡 |
| C7 | A.582–585 | `if (…){} else if (…){}` chain — grammar only allows one `else if_stmt` (recursion covers it) | partial | 🟡 |
| C8 | A.590 | `select union (u) { case (variant1){…} case (variant2){…} }` (enum variants for unions) | grammar has `select_union_stmt` but lacks field-name-only form for union alternatives | 🟠 |
| C9 | A.573–575 | For loop (both `for(init;cond;post)` and `for(var x in range)`) | covered | ✅ |
| C10 | A.554 | `SubStatement` for alt/interleave bodies | covered via `_communication_stmt` | ✅ |
| C11 | A.323 / §22.3.1 | `call` with timers and parameters | **missing** | 🟠 |

### D. Communication operations (§22) — major gaps

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| D1 | §22.1.4 / A.313 | `port.send(value)` and `receive`/`trigger`/`getcall`/`getreply`/`reply`/`raise`/`catch`/`check` — message-based send/receive/trigger | grammar's `guarded_stmt` uses `redirection_expr` for the extract-value form but lacks the full port dot-operation chain | 🟠 |
| D2 | §22.3 / A.319 | `port.call(sig, value)` / `.getcall` / `.reply` / `.getreply` / `.raise` / `.catch` — procedure-based ops | **missing** | 🟠 |
| D3 | §22.4 / A.372 | `port.check(…)` check operation | **missing** | 🟡 |
| D4 | §22.5 / A.383–390 | `clear` / `start` / `stop` / `halt` / `checkstate` port control | **missing** | 🟠 |
| D5 | §21.1 / A.287–308 | `connect(…)`, `map(…)`, `disconnect(…)`, `unmap(…)` — config statements | **missing** as actual rules | 🟠 (concrete failure on `NasEmu5G_Component_NR_BASE.ttcn:48–50`) |
| D6 | §21.3 / A.272 | `Component.create(…)` `alive` — covered in B13 | — | (see B13) |
| D7 | §21.3 / A.279 | `done` / `killed` (component lifetime) | **missing** | 🟠 |
| D8 | §21.3 / A.302 | `comp.start(funcRef(args))` start test component | **missing** | 🟠 |
| D9 | §21.3 / A.304 | `comp.stop` / `all component.stop` / `comp.kill` | **missing** | 🟡 |
| D10 | A.406 / §24 | `testcase.stop` | **missing** | 🟡 |
| D11 | §20.5 / A.520 | `activate(altstepRef(args))` / `deactivate` | **missing** | 🟠 |
| D12 | §20.4 / A.510 | `repeat` (inside alt bodies) | **missing** | 🟠 |

### E. Timer operations (§23) — missing

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| E1 | A.396–403 | `timer.start(expr)`, `timer.read`, `timer.stop`, `timer.running`, `timer.timeout [-> value @index]` | grammar has `_communication_stmt` but no specific `start_timer`/`timeout_stmt` rules | 🟠 |
| E2 | A.402 | `[any timer].timeout` syntax for alt guards | partial | 🟡 |

### F. Templates (§15) — major gaps

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| F1 | §15.4 / A.151 | **In-line templates**: `(Type : Body)` | broken — `inline_template` only does `reference ':' expression` | 🟠 |
| F2 | §15.0 / A.87 | `template [Restriction] [Modifier] BaseTemplate [modifies X] := Body` — full template rule | grammar's flat `template` rule is missing `[FuzzyModifier][DeterministicModifier][AbstractModifier]` chain | 🟠 |
| F3 | §15.5 / A.152 | `modifies BaseTemplateBody := BaseTemplateBody` (derived/template body) | grammar's `modifies` clause exists but not `DerivedTemplateBody` form | 🟡 |
| F4 | A.471 | `TemplateModifier` — `template (present)`, `template (omit)`, `template (value)`, `template (parameterized-type)` | grammar's `nested_template` only knows the 3 restrictions | 🟠 |
| F5 | A.88 | `BaseTemplate ::= (Type \| Signature) Identifier ["(" TemplateOrValueFormalParList ")"]` for parameterized templates | **missing** | 🔴 (concrete failure on `RRC_Templates.ttcn`) |
| F6 | A.93 | **Formal template parameters** in functions/templates (kind `template`, with optional `(restriction)`) | **missing** | 🔴 (concrete failure on `RRC_Templates.ttcn:233–236`) |
| F7 | Annex B / A.109 | Template matching: `?`, `*`, `(a, b, c)`, `(1..10)`, `complement(…)`, `pattern "…"`, `subset(…)`, `superset(…)`, `permutation(…)`, `ifpresent`, `length(…)`, `decmatch` | **missing** | 🔴 |
| F8 | A.111 | `CharStringMatch` (pattern) and `pattern` keyword | **missing** | 🟠 |
| F9 | A.107 | Permutation elements `permutation(…)` | **missing** | 🟠 |
| F10 | A.91 | `modifies` clause with parameterized body | partial | 🟡 |
| F11 | A.112 | `ifpresent` keyword & `length(…)` matching attributes on templates | **missing** | 🟠 |
| F12 | A.135 | Subset / Superset match | **missing** | 🟡 |
| F13 | A.140 | `permutation` keyword | **missing** | 🟡 |

### G. Ports (§9, §14, §22) — moderate gaps

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| G1 | §14 / A.183 | Full signature def grammar — `signature Foo() return T exception (E, F)` | partial | 🟡 |
| G2 | §9.1 / A.50 | `type port X message { in M1; out M2 }` body | covered | ✅ |
| G3 | §6.2.10 / A.80–82 | **Port instance in component body**: `port Type p1, p2[N];` | **missing** — grammar's `port_decl` is top-level only; component body falls back incorrectly | 🔴 (concrete failure on `IP_PTC_Component.ttcn:124`) |
| G4 | §9.1 / A.55–57 | `map param(…)` / `unmap param(…)` clauses | covered | ✅ |
| G5 | A.62 | `all` port message list (deprecated but still in use) | partial | 🟡 |
| G6 | §6.2.10 | `type component C extends D1, D2 {}` (multi-extends) | covered | ✅ |

### H. Modules / Imports (§8) — partial gaps

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| H1 | §8.2.3 / A.224 | `import from X language "…" all` (with language spec) | grammar has `language_spec` but possibly miswired inside `import_definition` | 🔴 (concrete failure on RRC / NR_CellInfo) |
| H2 | §8.2.3.6 / A.244 | Qualified identifier in type identifier lists (`QualifiedIdentifier`) | uses `$.references` which is just `Identifier`-based | 🟡 |
| H3 | §5.2.1 / A.149 | `Identifier ":=" TemplateInstance` actual parameter assignment (named actuals) | **missing** — `ActualParAssignment` is a distinct production | 🟠 |
| H4 | §8.2.4 | `friend module A, B, C;` | covered | ✅ |
| H5 | A.256 | `modulepar { … }` block (multi-typed module pars) | **missing** | 🟡 |
| H6 | A.237 | Import group recursive excepts — `import group X except { … }` | partial | 🟠 |

### I. Configuration / SUT (§21, §25)

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| I1 | §21.3.10 | `call` test component operation | **missing** (see also D family) | 🟡 |

### J. Annotations / Attributes (§27)

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| J1 | §27 / A.488–494 | All modifiers (`@abstract`, `@decoded`, `@index`, `@lazy`, `@local`, `@nocase`, `@deterministic`, `@fuzzy`, `@control`, `@nodefault`, `@default`) | `modifier: /@\w+/` is too lax — matches `@sic`, `@desc`, etc., that aren't modifiers | 🟡 |
| J2 | A.487 | `override` keyword in attributes | partial — inside `attributes` rule | 🟡 |
| J3 | A.491 | `group all [except {…}]` in attribute qualifiers | partial | 🟡 |

### K. Mode / Outdated / SUTAction

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| K1 | A.498–507 | `mode` definition body (mode spec) — TODO at grammar.js:450 | **empty body** (acknowledged TODO) | 🟡 |
| K2 | §25 / A.499 | `action(…)` external action | **missing** | 🟡 |

### L. Lexical / Tokens

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| L1 | A.443–446 | Number rule needs to allow underscores; floats with `E` notation | grammar's `number` token is mostly correct (regex: `\d+(\.\d+)?` + optional `E` suffix) but `_` not allowed in numeric literals (spec allows `1_000_000`) | 🟡 |
| L2 | A.447 | `Bstring` allowance of whitespace + line continuations (`'foo\<LF>bar'B`) | partial — regex `'([01*? ])+'(b\|B)` doesn't allow `\<LF>` | 🟡 |
| L3 | A.461 | `FreeText` (used in `log`/`action`/`with`) is very lax (ExtendedAlphaNum); current `charstring` regex is narrower | 🟡 |
| L4 | A.467–471 | `?` and `*` are tokens; reserved keywords — current grammar may misclassify `*` as multiply-op in some positions | 🟡 |

### M. Misc / Structural

| # | Spec ref | Feature | Status | Severity |
|---|----------|---------|--------|----------|
| M1 | §5.2.2 | Identifiers can be qualified: `Module.Type` | partial — present in `nested_type` | 🟡 |
| M2 | A.594 | `UniversalCharString` (`universal charstring`) | **missing** | 🟡 |
| M3 | A.560 | `GetAttributeOp` — `TypeOrTemplate.encode`, `.variant`, `.display`, etc. | **missing** | 🟡 |
| M4 | A.421 | `UniversalKeyword` (`universal`) | **missing** | 🟡 |
| M5 | A.466–468 | `in`/`out`/`inout` parameter directions — also needed for `AltstepInstance` actuals etc. | partial | 🟡 |

---

## Critical-Path Dependency Graph

```
B (expressions) ──┐
                  │
A (types) ────────┼──► F (templates) ──► C (statements) ──► D (communication)
                  │                                          │
                  └──► E (timers)                           └─► Phase 4 validation
                                                                  ▲
                                          G (ports) ──────────────┘
                                          H (imports) ─────────────┘
```

Foundation: **B + A** unblocks every feature. **F** depends on **B**. **D + E** depend on **B + C**. **G + H** are mostly parallel with A.

---

## References

- Spec file: `references/specs/TTCN-3 Core Language, ETSI ES 201 873-1.md`
- Spec Annex A BNF: line **21740** → end of `A.1.6.9`
- Spec Annex B template matching mechanisms: line **23384**
- Spec Annex C predefined functions: line **24765**
- Spec Table A.3 keyword list: line **21912**
- Real-world sample files under `references/code/NR5GC_IWD_26wk24/` cited above show ~85% of the gaps in the wild.
