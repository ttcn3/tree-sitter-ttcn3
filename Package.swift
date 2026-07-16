// swift-tools-version:5.3
import PackageDescription
import Foundation

// `src/parser.c` is generated from `grammar.js` by `tree-sitter generate`.
// Run that on demand before Swift Package Manager builds if the parser
// source is missing. SPM's `.prebuildCommand` (5.6+) makes this automatic;
// older toolchains require the consumer to run `tree-sitter generate`
// before `swift build`.
let ensureParserScript = """
#!/bin/sh
set -e
if [ ! -f src/parser.c ]; then
  echo "src/parser.c is missing; running 'tree-sitter generate'"
  tree-sitter generate
fi
"""

let package = Package(
    name: "TreeSitterTtcn3",
    products: [
        .library(name: "TreeSitterTtcn3", targets: ["TreeSitterTtcn3"]),
    ],
    dependencies: [],
    targets: [
        .target(name: "TreeSitterTtcn3",
                path: ".",
                exclude: [
                    "Cargo.toml",
                    "Makefile",
                    "binding.gyp",
                    "bindings/c",
                    "bindings/go",
                    "bindings/node",
                    "bindings/python",
                    "bindings/rust",
                    "prebuilds",
                    "grammar.js",
                    "package.json",
                    "package-lock.json",
                    "pyproject.toml",
                    "scripts",
                    "setup.py",
                    "test",
                    "examples",
                    ".editorconfig",
                    ".github",
                    ".gitignore",
                    ".gitattributes",
                    ".gitmodules",
                ],
                sources: [
                    "src/parser.c",
                    // NOTE: if your language has an external scanner, add it here.
                ],
                resources: [
                    .copy("queries")
                ],
                publicHeadersPath: "bindings/swift",
                cSettings: [.headerSearchPath("src")])
    ],
    cLanguageStandard: .c11
)
