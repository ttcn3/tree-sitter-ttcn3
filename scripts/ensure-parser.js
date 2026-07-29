#!/usr/bin/env node
// Regenerate src/parser.c when it is missing. The Node binding compiles
// parser.c via node-gyp, so end-users installing from a source archive
// (which no longer carries parser.c) need this hook to produce it on
// demand. Requires the `tree-sitter` CLI on PATH.

const {existsSync} = require('fs');
const {join} = require('path');
const {spawnSync} = require('child_process');

const parserPath = join(__dirname, '..', 'src', 'parser.c');

if (existsSync(parserPath)) {
  process.exit(0);
}

const cli = spawnSync('npx', ['--no-install', 'tree-sitter', 'generate'], {
  stdio: 'inherit',
});

if (cli.status === 0) {
  process.exit(0);
}

// Fall back to a globally installed tree-sitter if npx does not have it.
const fallback = spawnSync('tree-sitter', ['generate'], {stdio: 'inherit'});
process.exit(fallback.status === 0 ? 0 : 1);
