#!/usr/bin/env node
/**
 * Expo ships `@expo/expo-modules-macros-plugin` with a PREBUILT, arm64-only
 * `ExpoModulesMacros-tool` Swift macro plugin. On Intel (x86_64) Macs that
 * binary cannot execute, and compiling any Expo module that uses the
 * `@OptimizedFunction` macro (e.g. expo-crypto) fails with:
 *
 *   external macro implementation type 'ExpoModulesMacros.OptimizedFunctionAttachedMacro'
 *   could not be found ... 'ExpoModulesMacros-tool' produced malformed response
 *
 * The macro runs on the HOST during compilation, so we just need a host-arch
 * build of the tool. This script rebuilds it from the source that ships inside
 * the package whenever the prebuilt binary's arch doesn't match the host.
 *
 * No-op on Apple Silicon (prebuilt arm64 already matches), on non-macOS, and
 * when the toolchain/package is unavailable. Never fails `npm install`.
 */
'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const log = (msg) => console.log(`[fix-expo-macro-tool] ${msg}`);

if (process.platform !== 'darwin') process.exit(0);

const hostArch = { x64: 'x86_64', arm64: 'arm64' }[process.arch];
if (!hostArch) process.exit(0);

const pkgDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'expo-modules-macros-plugin',
  'apple'
);
const toolPath = path.join(pkgDir, 'ExpoModulesMacros-tool');

// Package not installed (partial install) — nothing to do.
if (!fs.existsSync(toolPath)) process.exit(0);

// If the prebuilt tool already matches the host arch, leave it alone.
try {
  if (execSync(`file "${toolPath}"`, { encoding: 'utf8' }).includes(hostArch)) {
    process.exit(0);
  }
} catch {
  // `file` unavailable — fall through and attempt a rebuild.
}

log(`Prebuilt macro tool is not ${hostArch}; rebuilding from source for this host...`);

// Need the Swift toolchain (Xcode Command Line Tools) to rebuild.
try {
  execSync('xcrun --find swift', { stdio: 'ignore' });
} catch {
  log('Swift toolchain not found. Skipping — native iOS builds will fail until Xcode CLT is installed.');
  process.exit(0);
}

// The published Package.swift declares a test target whose `Tests/` sources are
// not shipped in the npm tarball, which makes `swift build` fail with
// "overlapping sources". Strip it (idempotent).
const manifestPath = path.join(pkgDir, 'Package.swift');
try {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (manifest.includes('.testTarget(')) {
    manifest = manifest.replace(/\n\s*\.testTarget\([\s\S]*?\n\s*\),/, '');
    fs.writeFileSync(manifestPath, manifest);
    log('Removed unused .testTarget from Package.swift');
  }
} catch (e) {
  log(`Could not patch Package.swift: ${e.message}`);
}

try {
  execSync('swift build -c release', { stdio: 'inherit', cwd: pkgDir });
  const built = path.join(pkgDir, '.build', 'release', 'ExpoModulesMacros-tool');
  fs.rmSync(toolPath, { force: true });
  fs.copyFileSync(built, toolPath);
  fs.chmodSync(toolPath, 0o755);
  try {
    execSync(`strip "${toolPath}"`, { stdio: 'ignore' });
  } catch {
    /* strip is best-effort */
  }
  log(`Rebuilt ExpoModulesMacros-tool for ${hostArch}.`);
} catch (e) {
  log(`Rebuild failed: ${e.message}`);
  process.exit(0); // never break the install
}
