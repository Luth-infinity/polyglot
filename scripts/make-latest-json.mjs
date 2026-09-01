#!/usr/bin/env node
/**
 * Prépare le dossier `release/` à téléverser sur GitHub après un `tauri build`.
 *
 * Il n'y a pas de CI sur ce projet : `latest.json` (le manifeste que l'app
 * interroge) doit donc être fabriqué à la main. Ce script s'en charge, et
 * surtout il **fusionne** avec un `latest.json` déjà présent — Windows et macOS
 * se construisent sur deux machines différentes, chacune n'ajoute que son
 * entrée sans effacer celle de l'autre.
 *
 *   node scripts/make-latest-json.mjs --notes "Corrige le collage sur Word"
 *
 * Options :
 *   --notes <texte>   Notes de version écrites dans le manifeste.
 *   --arch <x64|arm64>  Force l'architecture (défaut : celle de la machine).
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REPO = "Luth-infinity/polyglot";

// ── Arguments ───────────────────────────────────────────────────────────────

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const notes = arg("notes", "");
const arch = arg("arch", process.arch === "arm64" ? "arm64" : "x64");

// ── Version ─────────────────────────────────────────────────────────────────

const conf = require(path.join(root, "src-tauri/tauri.conf.json"));
const pkg = require(path.join(root, "package.json"));
const version = conf.version;

if (pkg.version !== version) {
  console.error(
    `package.json (${pkg.version}) et tauri.conf.json (${version}) divergent.\n` +
      "Aligne les deux avant de publier : l'app affiche la version du bundle Tauri."
  );
  process.exit(1);
}

// ── Recherche des artefacts ─────────────────────────────────────────────────

const bundleDir = path.join(root, "src-tauri/target/release/bundle");
if (!fs.existsSync(bundleDir)) {
  console.error(`Aucun bundle trouvé dans ${bundleDir}. Lance d'abord : npm run tauri build`);
  process.exit(1);
}

/** Retourne le premier fichier du dossier qui satisfait le prédicat. */
function findIn(dir, predicate) {
  const full = path.join(bundleDir, dir);
  if (!fs.existsSync(full)) return null;
  const name = fs.readdirSync(full).find(predicate);
  return name ? path.join(full, name) : null;
}

/** Artefact de mise à jour de la plateforme courante, avec sa signature. */
function currentArtifact() {
  if (process.platform === "win32") {
    // NSIS est le format que l'updater sait installer sans interaction.
    const exe = findIn("nsis", (f) => f.endsWith("-setup.exe"));
    if (!exe) return null;
    return {
      key: "windows-x86_64",
      file: exe,
      // Le nom porte déjà la version et l'archi : rien à renommer.
      name: path.basename(exe),
    };
  }

  if (process.platform === "darwin") {
    const tar = findIn("macos", (f) => f.endsWith(".app.tar.gz"));
    if (!tar) return null;
    return {
      key: arch === "arm64" ? "darwin-aarch64" : "darwin-x86_64",
      file: tar,
      // Tauri produit le même nom pour les deux architectures : sans ce
      // renommage, la seconde écraserait la première sur la release.
      name: `Polyglot_${version}_${arch}.app.tar.gz`,
    };
  }

  return null;
}

const artifact = currentArtifact();
if (!artifact) {
  console.error(
    "Artefact de mise à jour introuvable.\n" +
      'Vérifie que `"createUpdaterArtifacts": true` est bien dans tauri.conf.json.'
  );
  process.exit(1);
}

const sigPath = `${artifact.file}.sig`;
if (!fs.existsSync(sigPath)) {
  console.error(
    `Signature absente : ${sigPath}\n` +
      "Le build doit tourner avec TAURI_SIGNING_PRIVATE_KEY défini (voir CLAUDE.md)."
  );
  process.exit(1);
}

// ── Écriture de release/ ────────────────────────────────────────────────────

const outDir = path.join(root, "release");
fs.mkdirSync(outDir, { recursive: true });

fs.copyFileSync(artifact.file, path.join(outDir, artifact.name));

const manifestPath = path.join(outDir, "latest.json");
let manifest = { version, notes, pub_date: new Date().toISOString(), platforms: {} };

if (fs.existsSync(manifestPath)) {
  const existing = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  // Un manifeste d'une version antérieure ne doit rien conserver : ses URLs
  // pointeraient vers des binaires de l'ancienne release.
  if (existing.version === version) {
    manifest = { ...existing, notes: notes || existing.notes, pub_date: manifest.pub_date };
  }
}

manifest.platforms[artifact.key] = {
  signature: fs.readFileSync(sigPath, "utf8").trim(),
  url: `https://github.com/${REPO}/releases/download/v${version}/${artifact.name}`,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const covered = Object.keys(manifest.platforms);
console.log(`release/ prêt pour la v${version}`);
console.log(`  ${artifact.name}`);
console.log(`  latest.json — plateformes couvertes : ${covered.join(", ")}`);
if (!covered.some((k) => k.startsWith("darwin"))) {
  console.log("  (aucune entrée macOS : relance ce script sur un Mac après son build)");
}
if (!covered.includes("windows-x86_64")) {
  console.log("  (aucune entrée Windows : relance ce script sur Windows après son build)");
}
console.log(`\nPublier :\n  gh release create v${version} release/* --title "v${version}"`);
