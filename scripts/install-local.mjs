// Local DSH profile installer (Windows-friendly fallback for `dsh plugin add`).
//
// Some WSL/CLI combinations translate F:\... into /mnt/f/... and pnpm then
// records a broken `link:` path. This script installs the plugin by placing a
// junction (or copy) under the profile's node_modules and appending the bundle
// entry, with a package.json backup.
//
// Usage (Windows PowerShell):
//   node scripts/install-local.mjs
//   node scripts/install-local.mjs --profile web
//   node scripts/install-local.mjs --remove
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '..');
const packageJson = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
const pluginName = packageJson.name;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const profileName = argValue('--profile') ?? 'desktop';
const remove = process.argv.includes('--remove');
const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh');
const profileDir = join(dshHome, 'profiles', profileName);
const profilePackage = join(profileDir, 'package.json');
const target = join(profileDir, 'node_modules', pluginName);

if (!existsSync(profilePackage)) {
  console.error(`profile not found: ${profilePackage}`);
  process.exit(1);
}

function loadProfile() {
  return JSON.parse(readFileSync(profilePackage, 'utf8'));
}

function saveProfile(data) {
  writeFileSync(profilePackage, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function bundleList(data) {
  data.dsh ??= {};
  data.dsh.profile ??= {};
  data.dsh.profile.bundles ??= [];
  return data.dsh.profile.bundles;
}

if (remove) {
  const data = loadProfile();
  const bundles = bundleList(data);
  const index = bundles.indexOf(pluginName);
  if (index >= 0) bundles.splice(index, 1);
  saveProfile(data);
  if (existsSync(target)) {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink()) rmSync(target);
    else rmSync(target, { recursive: true, force: true });
  }
  console.log(`removed ${pluginName} from ${profileDir}`);
  console.log('restart DSH to unload the host half.');
  process.exit(0);
}

// Back up package.json once per run.
copyFileSync(profilePackage, `${profilePackage}.bak-${Date.now()}`);
mkdirSync(join(profileDir, 'node_modules'), { recursive: true });
if (existsSync(target)) {
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) rmSync(target);
  else rmSync(target, { recursive: true, force: true });
}

let installedAs = 'copy';
try {
  symlinkSync(source, target, 'junction');
  installedAs = 'junction';
} catch (error) {
  console.warn(`junction failed (${error?.message ?? error}); copying files instead`);
  cpSync(source, target, {
    recursive: true,
    filter: (path) =>
      !path.includes(`${source}\\node_modules`) &&
      !path.includes(`${source}\\research`) &&
      !path.includes(`${source}\\.git`) &&
      !path.includes(`${source}\\.dict-test`) &&
      !path.includes('.install-backup'),
  });
}

const data = loadProfile();
const bundles = bundleList(data);
if (!bundles.includes(pluginName)) bundles.push(pluginName);
saveProfile(data);
console.log(`${installedAs}: ${source} -> ${target}`);
console.log(`bundle appended: ${pluginName}`);
console.log('Next: fully restart DSH (the host half adds tools/routes), then click 「天文术语」 in the sidebar.');
