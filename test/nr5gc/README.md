# `test/nr5gc/` — Real-World TTCN-3 Regression Test

**Generated:** 2026-07-17 (v0.1.1)

## OVERVIEW

`run.sh` parses every `.ttcn` file in the 3GPP NR5GC conformance corpus with
the current tree-sitter parser and reports clean / error counts plus total
ERROR-node count. Exits non-zero if the corpus is missing **or** if metrics
regress below the recorded baseline.

This is a complement to `test/corpus/` (synthetic `.txt` corpus tests for
specific grammar features). It exercises the grammar against real-world
TTCN-3 code from the 3GPP conformance testsuite.

## FILES

```
test/nr5gc/
├── run.sh         # The test script (executable)
├── BASELINE.txt   # Recorded v0.1.1 metrics (the regression threshold)
└── README.md      # This file
```

## REQUIREMENTS

- The 3GPP NR5GC corpus at `references/code/NR5GC_IWD_26wk24/`.
  This is **gitignored** (it's a large proprietary ~19.5 MB download).
  See `references/README.md` for the source URL.
- `npx tree-sitter` available via dev dependencies in this repo.

## USAGE

```bash
# Run from repo root:
./test/nr5gc/run.sh

# Always exit 0 (skip the regression threshold check):
./test/nr5gc/run.sh --no-regression

# Point at a different corpus:
CORPUS_DIR=/path/to/other-corpus ./test/nr5gc/run.sh
```

The script writes per-file results to `test/nr5gc/results.txt` (gitignored —
regenerated on every run).

## OUTPUT

```
=== NR5GC Real-World Regression Test ===
Corpus:         /path/to/references/code/NR5GC_IWD_26wk24
Total files:    385
Clean:          376 (97.7%)
With errors:    9
ERROR nodes:    18
Per-file log:   test/nr5gc/results.txt
```

Exit code `0` = passed (no regression), `1` = regression detected,
`2` = corpus missing or bad args.

## BASELINE & THRESHOLDS

`BASELINE.txt` records the v0.1.1 metrics:

| Metric | Value |
|---|---|
| Total files | 385 |
| Clean | 376 |
| Clean % | 97.7% |
| ERROR nodes | 18 |

`run.sh` enforces two thresholds (with headroom over the baseline so that
small noise doesn't cause false failures):

- **Clean %** must be ≥ **97.0%**
- **ERROR nodes** must be ≤ **25**

When the grammar improves and the threshold is no longer tight, bump the
numbers in `BASELINE.txt` and update the `MIN_CLEAN_FRACTION` /
`MAX_ERROR_NODES` defaults in `run.sh`.

## REMAINING KNOWN GAPS (post v0.1.1)

The 18 remaining ERROR nodes across 9 files fall into **3 distinct grammar
gaps** unrelated to the rel_expression fix:

1. **`-> value v_X` redirect inside `receive()` call** (5 errors, 4 files)
   — TTCN-3 spec §22.2; `redirection_expr` not accepted in receive-argument
   position.
2. **Array type with explicit size `[N]`** (1 error, 1 file) — array types
   with size specifier are unimplemented.
3. **Inline `/* @status ... */` comment inside `type record` body** (4
   errors, 1 file) — comments between `{` and the first field confuse the
   block parser.

Plus 1 minor GLR-recovery edge in `IMS_CommonTemplates.ttcn` (2 errors).
