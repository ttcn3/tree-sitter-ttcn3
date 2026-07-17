# `test/nr5gc/` — Real-World TTCN-3 Regression Test

**Generated:** 2026-07-17 (v0.2.1)

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
├── BASELINE.txt   # Recorded v0.2.1 metrics (the regression threshold)
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
Clean:          385 (100.0%)
With errors:    0
ERROR nodes:    0
Per-file log:   test/nr5gc/results.txt
```

Exit code `0` = passed (no regression), `1` = regression detected,
`2` = corpus missing or bad args.

## BASELINE & THRESHOLDS

`BASELINE.txt` records the v0.2.1 metrics:

| Metric | Value |
|---|---|
| Total files | 385 |
| Clean | 385 |
| Clean % | 100.0% |
| ERROR nodes | 0 |

`run.sh` enforces two thresholds (with headroom over the baseline so that
small noise doesn't cause false failures):

- **Clean %** must be ≥ **99.5%**
- **ERROR nodes** must be ≤ **5**

When the grammar improves and the threshold is no longer tight, bump the
numbers in `BASELINE.txt` and update the `MIN_CLEAN_FRACTION` /
`MAX_ERROR_NODES` defaults in `run.sh`.

## REMAINING KNOWN GAPS

None. The NR5GC corpus parses 100% clean at v0.2.1.
