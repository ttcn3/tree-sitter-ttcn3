fn main() {
    let src_dir = std::path::Path::new("src");

    // Regenerate parser.c from grammar.js when it is missing. End-users
    // typically do not have a checked-in parser.c, so this is the build
    // hook that produces it on demand. Requires `tree-sitter` (the CLI)
    // to be on PATH; cargo install tree-sitter-cli if it is not.
    let parser_path = src_dir.join("parser.c");
    if !parser_path.exists() {
        let status = std::process::Command::new("tree-sitter")
            .arg("generate")
            .current_dir(env!("CARGO_MANIFEST_DIR"))
            .status();
        match status {
            Ok(s) if s.success() => {}
            Ok(s) => panic!("tree-sitter generate exited with status {}", s),
            Err(e) => panic!(
                "src/parser.c is missing and `tree-sitter` CLI is not available: {}. \
                 Install it with `cargo install tree-sitter-cli` or `npm install -g tree-sitter-cli`.",
                e
            ),
        }
    }

    let mut c_config = cc::Build::new();
    c_config.std("c11").include(src_dir);

    #[cfg(target_env = "msvc")]
    c_config.flag("-utf-8");

    let parser_path = src_dir.join("parser.c");
    c_config.file(&parser_path);
    println!("cargo:rerun-if-changed={}", parser_path.to_str().unwrap());

    c_config.compile("tree-sitter-ttcn3");
}
