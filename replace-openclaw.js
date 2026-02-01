#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules, dist, .git, etc.
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === '.next' || entry.name === '.vscode') {
        continue;
      }
      yield* walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      yield fullPath;
    }
  }
}

function replaceText(content) {
  // Replace openclaw -> openhedgehog (lowercase)
  // Replace OpenClaw -> OpenHedgehog (camel case)
  // Replace OPENCLAW -> OPENHEDGEHOG (uppercase)
  // Also handle mixed cases like Openclaw? We'll do a more generic replacement.
  // Use regex with word boundaries to avoid partial replacements inside longer words.
  // We'll match case-insensitively and replace with appropriate case.
  // This is a simple mapping; we can do three passes.
  let replaced = content.replace(/\bopenclaw\b/g, 'openhedgehog');
  replaced = replaced.replace(/\bOpenClaw\b/g, 'OpenHedgehog');
  replaced = replaced.replace(/\bOPENCLAW\b/g, 'OPENHEDGEHOG');
  // Also replace "openclaw/" in import paths (no word boundary due to slash)
  replaced = replaced.replace(/openclaw\//g, 'openhedgehog/');
  // Replace "docs.openclaw.ai"
  replaced = replaced.replace(/docs\.openclaw\.ai/g, 'docs.openhedgehog.ai');
  // Replace "OPENCLAW_" environment variables
  replaced = replaced.replace(/OPENCLAW_/g, 'OPENHEDGEHOG_');
  // Replace "openclaw-" hyphenated
  replaced = replaced.replace(/openclaw-/g, 'openhedgehog-');
  // Replace "openclaw." (maybe config keys)
  replaced = replaced.replace(/openclaw\./g, 'openhedgehog.');
  // Replace "openclawPollId" etc (camel case prefix)
  replaced = replaced.replace(/openclaw([A-Z])/g, 'openhedgehog$1');
  // Replace "OpenClawPollId"
  replaced = replaced.replace(/OpenClaw([A-Z])/g, 'OpenHedgehog$1');
  return replaced;
}

async function main() {
  let changed = 0;
  for await (const filePath of walk(root)) {
    const relative = path.relative(root, filePath);
    const content = await fs.readFile(filePath, 'utf8');
    const newContent = replaceText(content);
    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(`Updated ${relative}`);
      changed++;
    }
  }
  console.log(`Done. Changed ${changed} files.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});