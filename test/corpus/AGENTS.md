# test/corpus/ — TTCN-3 Grammar Test Corpus

**Generated:** 2026-07-14

## OVERVIEW
Tree-sitter corpus tests for TTCN-3 grammar. Each `.txt` file contains one or more test cases in the standard tree-sitter format: `=== title ===` / TTCN-3 source / `---` / expected S-expression parse tree.

## STRUCTURE
```
test/corpus/
├── attributes.txt      # with { encode "UTF8", extension "X", ... }
├── behavior_types.txt  # type function / altstep / testcase declarations
├── behaviours.txt      # function / external function / altstep / testcase defs
├── class.txt           # type class ... {} finally {}
├── components.txt      # type component C extends D {}
├── configurations.txt  # configuration C() runs on C system C {}
├── conflicts.txt       # GLR conflict cases (e.g. type ref vs name)
├── groups.txt          # group + nested group + visibility
├── literals.txt        # integers, floats, invalid number (:error)
├── modules.txt         # module definitions, nested modules
└── subtypes.txt        # type integer myInt / with attributes
```

## WHERE TO LOOK
| Adding tests for... | File | Convention |
|---------------------|------|------------|
| `function`, `external_function`, `altstep`, `testcase` | `behaviours.txt` | One test case per declaration variant |
| `type function/altstep/testcase` | `behavior_types.txt` | Behavior type declarations |
| `with { ... }` blocks (encode, variant, display, extension, optional) | `attributes.txt` | Per-attribute tests |
| `module` definitions | `modules.txt` | Multiple + nested |
| `group` definitions | `groups.txt` | Visibility, nesting |
| `type integer X` style subtypes | `subtypes.txt` | With/without attributes |
| `type class` | `class.txt` | Single test (minimal) |
| `type component` | `components.txt` | Single test (minimal) |
| `configuration` | `configurations.txt` | Single test (minimal) |
| Number/string literal parsing | `literals.txt` | Includes `:error` for invalid numbers |
| Grammar conflicts (GLR ambiguity) | `conflicts.txt` | Documents intentional ambiguity |

## CONVENTIONS
- **Thematic naming**: file name matches the TTCN-3 language feature tested (`behaviours.txt` for function/altstep/testcase defs, NOT per-feature).
- **British vs American spelling**: project uses both `behaviours.txt` (UK) and `behavior_types.txt` (US). Preserve existing spelling when adding — `behaviours.txt` for behavioral definitions, `behavior_types.txt` for behavior type declarations.
- **Test format**: `=== Title ===` / code / `---` / S-expression / (no closing `---` needed in some files).
- **`:error` marker**: failing tests use `:error` after the title separator (see `literals.txt:Invalid number`).
- **Minimal tests for rare features**: `class.txt`, `components.txt`, `configurations.txt` each have one test. Extend when adding related coverage.

## ANTI-PATTERNS
- **DO NOT duplicate grammar changes without a test**: per `CONTRIBUTING.md`, grammar changes must include a test. Add to the relevant thematic file above.
- **DO NOT put tests in random-named files**: match the thematic naming (e.g. don't create `template.txt` — put template tests in `behaviours.txt` or `attributes.txt`).
- **DO NOT**: ignore existing failures — they signal grammar breakage. Run `npm test` after any `grammar.js` edit.

## COMMANDS
```bash
# Run all corpus tests (and regenerate parser first if called via npm test)
npm test

# Run without regenerating
tree-sitter test

# Run a single test file
tree-sitter test -f attributes.txt

# Update expected parse trees after intentional grammar changes
tree-sitter test --update
```

## NOTES
- **No expression tests**: README lists "Expressions" as unimplemented. The `expressions.txt` corpus file does not exist yet.
- **No advanced parameterization tests**: also unimplemented per README.
- **No `test/highlight/` directory**: highlight queries don't exist (no `queries/highlights.scm` either — see root AGENTS.md).
- **Corpus is intentionally incomplete**: 11 thematic files, not one per grammar rule. WIP project.
- **`conflicts.txt` is load-bearing**: tree-sitter would refuse to generate the parser without the GLR conflict declarations in `grammar.js` (lines 32-58). Removing these tests is a signal that conflicts were removed.
