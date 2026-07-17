#!/usr/bin/env bash
# test/nr5gc/run.sh — Regression test for real-world TTCN-3 code.
#
# Parses every .ttcn file in references/code/NR5GC_IWD_26wk24/ with the
# current tree-sitter parser and reports clean / error counts plus total
# ERROR nodes. Exits non-zero if the corpus is missing OR if the metrics
# regress below the recorded baseline (see BASELINE.txt).
#
# Usage:
#   ./test/nr5gc/run.sh                  # use default corpus + baseline
#   ./test/nr5gc/run.sh --no-regression  # always exit 0, just report
#   CORPUS_DIR=/path ./test/nr5gc/run.sh # override corpus location
#
# The corpus at references/code/NR5GC_IWD_26wk24/ is gitignored (large
# proprietary 3GPP download). The script exits with a helpful message
# if it's missing, so CI on a clean clone doesn't break.

set -u

# ----- paths -----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CORPUS_DIR="${CORPUS_DIR:-$REPO_ROOT/references/code/NR5GC_IWD_26wk24}"
BASELINE_FILE="$SCRIPT_DIR/BASELINE.txt"
RESULTS_FILE="$SCRIPT_DIR/results.txt"

# ----- defaults (from BASELINE.txt as of v0.2.1) -----
MIN_CLEAN_FRACTION="${MIN_CLEAN_FRACTION:-0.995}"   # require ≥99.5% clean
MAX_ERROR_NODES="${MAX_ERROR_NODES:-5}"            # allow up to 5 ERROR nodes

# ----- args -----
CHECK_REGRESSION=1
while [ $# -gt 0 ]; do
    case "$1" in
        --no-regression) CHECK_REGRESSION=0; shift ;;
        -h|--help)
            sed -n '2,15p' "$0"; exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 2 ;;
    esac
done

# ----- corpus check -----
if [ ! -d "$CORPUS_DIR" ]; then
    echo "ERROR: corpus directory not found: $CORPUS_DIR" >&2
    echo "       (gitignored; download from 3GPP FTP per references/README.md)" >&2
    exit 2
fi

# ----- parse every file, count ERROR nodes -----
> "$RESULTS_FILE"

TOTAL=0
CLEAN=0
WITH_ERRORS=0
TOTAL_ERROR_NODES=0

find "$CORPUS_DIR" -type f -name "*.ttcn" -print0 | \
    xargs -0 -I {} -P 1 sh -c '
        f="$1"
        npx --no-install tree-sitter parse "$f" > "/tmp/_p_$$" 2>&1
        ec=$(grep -c "(ERROR" "/tmp/_p_$$" 2>/dev/null)
        ec=${ec:-0}
        if [ "$ec" = "0" ]; then
            printf "CLEAN\t%s\n" "$f"
        else
            printf "ERRORS\t%s\t%s\n" "$ec" "$f"
        fi
        rm -f "/tmp/_p_$$"
    ' _ {} >> "$RESULTS_FILE"

TOTAL=$(wc -l < "$RESULTS_FILE" | tr -d ' ')
CLEAN=$(grep -c "^CLEAN" "$RESULTS_FILE" || echo 0)
WITH_ERRORS=$(grep -c "^ERRORS" "$RESULTS_FILE" || echo 0)
TOTAL_ERROR_NODES=$(awk -F'\t' '/^ERRORS/ {sum += $2} END {print sum+0}' "$RESULTS_FILE")
CLEAN_PCT=$(awk -v c="$CLEAN" -v t="$TOTAL" 'BEGIN { printf "%.1f", (t > 0 ? c*100.0/t : 0) }')

# ----- report -----
echo "=== NR5GC Real-World Regression Test ==="
echo "Corpus:         $CORPUS_DIR"
echo "Total files:    $TOTAL"
echo "Clean:          $CLEAN ($CLEAN_PCT%)"
echo "With errors:    $WITH_ERRORS"
echo "ERROR nodes:    $TOTAL_ERROR_NODES"
echo "Per-file log:   $RESULTS_FILE"

# ----- regression check -----
REGRESSION=0

if [ "$CHECK_REGRESSION" = "1" ]; then
    # Compare against baseline thresholds.
    if awk -v v="$CLEAN_PCT" -v t="$MIN_CLEAN_FRACTION" 'BEGIN { exit !(v+0 < t+0) }'; then
        echo "REGRESSION: clean $CLEAN_PCT% < baseline $MIN_CLEAN_FRACTION%" >&2
        REGRESSION=1
    fi
    if [ "$TOTAL_ERROR_NODES" -gt "$MAX_ERROR_NODES" ]; then
        echo "REGRESSION: ERROR nodes $TOTAL_ERROR_NODES > baseline $MAX_ERROR_NODES" >&2
        REGRESSION=1
    fi
fi

if [ "$REGRESSION" = "1" ]; then
    exit 1
fi
exit 0
