package tree_sitter_ttcn3_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_ttcn3 "github.com/ttcn3/tree-sitter-ttcn3"
)

func TestCanLoadGrammar(t *testing.T) {
	parser := tree_sitter.NewParser()
	defer parser.Close()
	language := tree_sitter.NewLanguage(tree_sitter_ttcn3.Language())
	if err := parser.SetLanguage(language); err != nil {
		t.Fatalf("Error loading TTCN3 grammar: %v", err)
	}
	tree := parser.Parse([]byte("module Hello { }"), nil)
	defer tree.Close()
	if tree.RootNode() == nil {
		t.Fatalf("Parse returned nil root node")
	}
	if tree.RootNode().HasError() {
		t.Fatalf("Parse produced ERROR nodes in root=%s", tree.RootNode().Kind())
	}
}

func TestParseSnippet(t *testing.T) {
	const src = `module Hello {

function MyFunc() return integer {
  return 42
}

}
`
	parser := tree_sitter.NewParser()
	defer parser.Close()
	language := tree_sitter.NewLanguage(tree_sitter_ttcn3.Language())
	if err := parser.SetLanguage(language); err != nil {
		t.Fatalf("Error loading TTCN3 grammar: %v", err)
	}
	tree := parser.Parse([]byte(src), nil)
	defer tree.Close()
	root := tree.RootNode()

	errors := 0
	var walk func(n *tree_sitter.Node)
	walk = func(n *tree_sitter.Node) {
		if n == nil {
			return
		}
		if n.Kind() == "ERROR" {
			errors++
		}
		for i := uint(0); i < n.ChildCount(); i++ {
			walk(n.Child(i))
		}
	}
	walk(root)
	if errors > 0 {
		t.Errorf("%d ERROR nodes in root=%s", errors, root.Kind())
	}
}
