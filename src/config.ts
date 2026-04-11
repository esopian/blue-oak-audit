import fs from 'node:fs';
import path from 'node:path';
import { TIERS, type Tier, type PackageJsonConfig } from './types.js';

const CONFIG_KEY = 'blue-oak-audit';

const VALID_KEYS = new Set<keyof PackageJsonConfig>([
  'includeDev',
  'minRating',
  'failOnUnrated',
  'exclude',
  'directOnly',
  'json',
  'output',
  'summary',
]);

export function loadConfig(projectDir: string): PackageJsonConfig {
  const pkgPath = path.join(projectDir, 'package.json');

  let pkgJson: Record<string, unknown>;
  try {
    pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch {
    return {};
  }

  const raw = pkgJson[CONFIG_KEY];
  if (raw === undefined) {
    return {};
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`"${CONFIG_KEY}" in package.json must be an object`);
  }

  const config = raw as Record<string, unknown>;
  const result: PackageJsonConfig = {};

  // Warn on unknown keys
  for (const key of Object.keys(config)) {
    if (!VALID_KEYS.has(key as keyof PackageJsonConfig)) {
      console.error(`Warning: unknown key "${key}" in "${CONFIG_KEY}" config (package.json)`);
    }
  }

  // Validate and extract each field
  if ('includeDev' in config) {
    if (typeof config.includeDev !== 'boolean') {
      throw new Error(`"${CONFIG_KEY}.includeDev" must be a boolean`);
    }
    result.includeDev = config.includeDev;
  }

  if ('minRating' in config) {
    if (typeof config.minRating !== 'string' || !TIERS.includes(config.minRating as Tier)) {
      throw new Error(
        `"${CONFIG_KEY}.minRating" must be one of: ${TIERS.join(', ')}`,
      );
    }
    result.minRating = config.minRating as Tier;
  }

  if ('failOnUnrated' in config) {
    if (typeof config.failOnUnrated !== 'boolean') {
      throw new Error(`"${CONFIG_KEY}.failOnUnrated" must be a boolean`);
    }
    result.failOnUnrated = config.failOnUnrated;
  }

  if ('exclude' in config) {
    if (!Array.isArray(config.exclude) || !config.exclude.every((v) => typeof v === 'string')) {
      throw new Error(`"${CONFIG_KEY}.exclude" must be an array of strings`);
    }
    result.exclude = config.exclude;
  }

  if ('directOnly' in config) {
    if (typeof config.directOnly !== 'boolean') {
      throw new Error(`"${CONFIG_KEY}.directOnly" must be a boolean`);
    }
    result.directOnly = config.directOnly;
  }

  if ('json' in config) {
    if (typeof config.json !== 'boolean') {
      throw new Error(`"${CONFIG_KEY}.json" must be a boolean`);
    }
    result.json = config.json;
  }

  if ('output' in config) {
    if (typeof config.output !== 'string') {
      throw new Error(`"${CONFIG_KEY}.output" must be a string`);
    }
    result.output = config.output;
  }

  if ('summary' in config) {
    if (typeof config.summary !== 'boolean') {
      throw new Error(`"${CONFIG_KEY}.summary" must be a boolean`);
    }
    result.summary = config.summary;
  }

  return result;
}
