// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["src/parser.c"]
if FileManager.default.fileExists(atPath: "src/scanner.c") {
    sources.append("src/scanner.c")
}

let package = Package(
    name: "TreeSitterTtcn3",
    products: [
        .library(name: "TreeSitterTtcn3", targets: ["TreeSitterTtcn3"]),
    ],
    dependencies: [
        .package(name: "SwiftTreeSitter", url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterTtcn3",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterTtcn3Tests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterTtcn3",
            ],
            path: "bindings/swift/TreeSitterTtcn3Tests"
        )
    ],
    cLanguageStandard: .c11
)
