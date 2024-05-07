## Update grammars

Changes to the grammar must not change existing tests.
If there's no practical way to avoid changing exist

When updating the grammar, you should also add tests.
Be careful when existing tests change

Check if existing tests have been updated correctly carefully, before
committing the changes.

Checklist before committing changes:

- [ ] Update the parser (`tree-sitter generate`)
- [ ] Add tests
- [ ] Run tests (`npm test`)

## Build and test the grammer

    npm test
