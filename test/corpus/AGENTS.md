# test/corpus/ — TTCN-3 Grammar Test Corpus

**Generated:** 2026-07-18

## OVERVIEW
Tree-sitter corpus tests for TTCN-3 grammar. Each `.txt` file contains one or more test cases in the standard tree-sitter format: `=== title ===` / TTCN-3 source / `---` / expected S-expression parse tree. The grammar ships with **15 thematic corpus files** totalling **159 tests** (counted from `tree-sitter test` output as of v0.2.1).

## STRUCTURE
```
test/corpus/
├── attributes.txt       # with { encode "UTF8", extension "X", ... }
├── behavior_types.txt   # type function / altstep / testcase declarations
├── behaviours.txt       # function / external function / altstep / testcase defs
├── class.txt            # type class ... {} finally {}
├── communication.txt    # port ops (send/receive/call/check/clear/...), config ops, timers, test ops
├── components.txt       # type component C extends D {}
├── configurations.txt   # configuration C() runs on C system C {}  +  mode definition
├── conflicts.txt        # GLR conflict cases (e.g. type ref vs name)
├── expressions.txt      # precedence chain, predefined funcs, presence checks, decoded refs
├── groups.txt           # group + nested group + visibility
├── literals.txt         # integers, floats, reserved numbers, charstrings (:error for invalid)
├── modules.txt          # module definitions
├── statements.txt       # if / for / while / select / alt / interleave / do-while / goto / break / continue / return
├── subtypes.txt         # type integer myInt / with attributes
└── templates.txt        # template (restriction) T x := body; — modifiers, params, modifies, matching symbols
```

## WHERE TO LOOK
| Adding tests for... | File | Convention |
|---------------------|------|------------|
| `function`, `external_function`, `altstep`, `testcase` defs | `behaviours.txt` | One test per variant |
| `type function/altstep/testcase` declarations | `behavior_types.txt` | Behavior type declarations |
| `with { ... }` blocks (encode, variant, display, extension, optional) | `attributes.txt` | Per-attribute tests |
| `module` definitions | `modules.txt` | Multiple + nested |
| `group` definitions | `groups.txt` | Visibility, nesting |
| `type integer X` style subtypes | `subtypes.txt` | With/without attributes |
| `type class` | `class.txt` | Single test (minimal) |
| `type component` | `components.txt` | Multiple — basic + ports/timers/vars |
| `configuration` / `mode` | `configurations.txt` | Configurations and `mode` definitions with body |
| Number/string/charstring literal parsing | `literals.txt` | Includes `:error` for invalid numbers |
| Grammar conflicts (GLR ambiguity) | `conflicts.txt` | Documents intentional ambiguity |
| Expression precedence, predefined funcs, presence checks, decoded refs | `expressions.txt` | One test per construct |
| Statements: if / for / while / select / alt / interleave / do-while / goto / break / continue / return | `statements.txt` | One test per construct |
| Templates (restrictions, modifiers, parameterized, modifies, matching symbols) | `templates.txt` | The largest file (~18K, ~30 tests) |
| Port ops (send/receive/call/check/clear/getcall/getreply/raise/checkstate), config ops (connect/map/disconnect/unmap), component lifetime (create/start/stop/alive/running), timer ops, activate/default, repeat, testcase.stop, execute | `communication.txt` | The second-largest file (~17K) |

## CONVENTIONS
- **Thematic naming**: file name matches the TTCN-3 language feature tested. Test the same feature in the same file across the corpus — `templates.txt` for any template-related grammar, `communication.txt` for any port / config / timer operation, etc.
- **British vs American spelling**: project uses both `behaviours.txt` (UK) and `behavior_types.txt` (US). Preserve existing spelling when adding — `behaviours.txt` for behavioral definitions, `behavior_types.txt` for behavior type declarations.
- **Test format**: `=== Title ===` / code / `---` / S-expression. No closing `---` required.
- **`:error` marker**: failing tests use `:error` after the title separator (see `literals.txt:Invalid number`).
- **Multiple variants per file**: `behaviours.txt` has 5 tests (Function / External Function / Altstep / Testcase / 2 real-world variants), `communication.txt` has ~50 tests (one per port op variant), `templates.txt` has ~30 tests (one per restriction/modifier/matching symbol). Don't bloat single-test files — extend an existing thematic file.
- **Real-world tests**: each thematic file ends with one or more "Real-world:" titled tests that pull from real 3GPP NR5GC conformance code. Add a real-world case whenever you add a new construct so coverage stays anchored to production input.

## ANTI-PATTERNS
- **DO NOT duplicate grammar changes without a test**: per `CONTRIBUTING.md`, grammar changes must include a test. Add to the relevant thematic file above.
- **DO NOT create a new thematic file lightly**: if you're adding tests for a feature that already has a thematic file (templates, communication, expressions, statements), put them there. A new file is only justified for a brand-new top-level language feature.
- **DO NOT** ignore existing failures — they signal grammar breakage. Run `npm test` after any `grammar.js` edit.
- **DO NOT** skip updating the expected S-expression when grammar changes necessarily alter the parse tree. Use `tree-sitter test --update` and review the diff before committing.

## COMMANDS
```bash
# Run all corpus tests (and regenerate parser first if called via npm test)
npm test

# Run without regenerating
npx tree-sitter test

# Run a single test file
npx tree-sitter test -f templates.txt

# Update expected parse trees after intentional grammar changes
npx tree-sitter test --update

# Show test count
npx tree-sitter test 2>&1 | grep "Total parses"
```

## NOTES
- **`templates.txt` and `communication.txt` are the load-bearing files** — they each contain ~30-50 tests and exercise the highest-risk grammar surface (matching-symbol ambiguities, port-op alt-clause nesting). Touch them carefully; review the full diff when running `tree-sitter test --update`.
- **`conflicts.txt` is load-bearing for parser generation**: tree-sitter would refuse to generate the parser without the GLR conflict declarations in `grammar.js` (line 32 onward). If a test here breaks after a grammar change, the fix is usually to add a new conflict entry to `grammar({ conflicts: [...] })`, not to rewrite the test.
- **Adding tests is the safe way to extend grammar coverage**: the parser is generated from `grammar.js`, but the corpus is hand-maintained. Each new TTCN-3 feature you implement should land with at least one positive test in its thematic file and (where applicable) one `:error` case in `literals.txt` or the relevant file.
- **15 thematic files + 159 tests** as of v0.2.1 (commit `1d34d79`). Run `npx tree-sitter test 2>&1 | grep "Total parses"` to confirm.