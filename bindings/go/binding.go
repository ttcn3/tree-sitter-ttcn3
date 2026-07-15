package tree_sitter_ttcn3

// `src/parser.c` is generated from `grammar.js` by `tree-sitter generate`.
// The cgo directive below includes it directly; consumers must therefore
// run `tree-sitter generate --no-bindings` before `go build` (or rely on
// the repo's Makefile, which does it for you).
//
// #cgo CFLAGS: -std=c11 -fPIC
// #include "../../src/parser.c"
// // NOTE: if your language has an external scanner, add it here.
import "C"

import "unsafe"

// Get the tree-sitter Language for this grammar.
func Language() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_ttcn3())
}
