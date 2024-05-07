package tree_sitter_ttcn3_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-ttcn3"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_ttcn3.Language())
	if language == nil {
		t.Errorf("Error loading Ttcn3 grammar")
	}
}
