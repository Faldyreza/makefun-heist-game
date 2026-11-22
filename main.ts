// main.ts — the hand-in program for MIDNIGHT VAULT (Node 22, stdlib only).
// It copies this repository's game/ and screenshots/ into the output
// directory (MAKEFUN_OUTPUT_DIR when set, else /output) and writes
// /output/dossier.json with buildDossier from the vendored make.fun
// library. It never deletes anything: the output directory is expected to
// start empty, and a second run over the same directory writes the same
// bytes again.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameSource = join(repoRoot, 'game');
const shotsSource = join(repoRoot, 'screenshots');

if (!existsSync(gameSource)) throw new Error(`main.ts: no game/ directory beside this file (${gameSource})`);
if (!existsSync(shotsSource)) throw new Error(`main.ts: no screenshots/ directory beside this file (${shotsSource})`);

mkdirSync(outputDir, { recursive: true });
mkdirSync(join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });

// Copy the whole game and its screenshots, preserving file contents.
cpSync(gameSource, join(outputDir, 'game'), { recursive: true, dereference: false });
cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true, dereference: false });

// The dossier the sealed scorer re-derives byte for byte: at most 4
// screenshots of at most 256 KiB, source text capped at 160 KiB, game/
// at most 993 entries and 48 MiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`main.ts: wrote ${outputDir}/dossier.json (${dossier.length} bytes)`);
