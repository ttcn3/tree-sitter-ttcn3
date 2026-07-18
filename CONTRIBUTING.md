## Updating the grammar

Changes to the grammar must not change existing tests. If a grammar change
necessarily alters the parse tree of an existing test (e.g. a new conflict
or a renamed rule), update the expected S-expression in the affected
corpus file using `tree-sitter test --update`, then review the diff
carefully before committing.

When you add grammar rules or features, you must also add tests. Put them
in the thematically-named corpus file that matches the feature
(see `test/corpus/AGENTS.md` for the file map). Verify that
`npm test` passes after every edit.

## Pre-commit checklist

- [ ] Edit `grammar.js` (the only hand-written grammar source).
- [ ] Regenerate the parser: `npm test` (runs `tree-sitter generate` + tests).
- [ ] Add or update tests in `test/corpus/` for any new or changed rules.
- [ ] Run `npm run lint` (ESLint over `grammar.js`).
- [ ] If you touched a binding (`bindings/<lang>/`), run that binding's
      test suite (e.g. `cd bindings/rust && cargo test`,
      `cd bindings/python && pytest tests/`, `cd bindings/go && go test`,
      `cd bindings/node && node binding_test.js`).
- [ ] If you added a new query file under `queries/`, confirm it loads
      (consumed by the parser when emitted into bindings).

## Build and test

```bash
# Regenerate parser + run corpus tests (does both)
npm test

# Run corpus tests only (skip regeneration)
npx tree-sitter test

# Regenerate only
npx tree-sitter generate

# Build the C library (static + shared + pkg-config)
make
make install        # installs to /usr/local

# Build / test a single binding
cd bindings/python && pip install . && pytest tests/
cd bindings/rust   && cargo test --release
cd bindings/go     && go test
cd bindings/node   && node binding_test.js
# Swift: CI only (macOS-15). Local `swift test` from bindings/swift.
```

## Commit conventions

- One logical change per commit. Grammar changes, generated-parser
  updates, and test additions can land in separate commits if they read
  clearly that way, but the parser must be regenerated in the same PR as
  any `grammar.js` change.
- Do not edit `src/parser.c`, `src/grammar.json`, `src/node-types.json`
  by hand — they're generated.
- Do not remove entries from `grammar({ conflicts: [...] })` in
  `grammar.js` without verifying the parser still generates. The
  declared conflicts are intentional GLR ambiguities; removing them
  changes parse behavior.
- Branch policy: feature work goes on a topic branch; PRs target
  `develop` (or `master` if `develop` doesn't exist for this fork).
  CI runs on pushes to `master` and on pull requests.
