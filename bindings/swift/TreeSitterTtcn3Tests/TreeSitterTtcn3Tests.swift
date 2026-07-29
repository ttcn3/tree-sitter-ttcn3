import SwiftTreeSitter
import XCTest
@testable import TreeSitterTtcn3

final class TreeSitterTtcn3Tests: XCTestCase {
    func testCanLoadGrammar() {
        let parser = Parser()
        let language = Language(language: tree_sitter_ttcn3())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading TTCN3 grammar")
    }
}
