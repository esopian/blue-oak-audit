import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fakeProject = path.join(__dirname, 'fixtures', 'fake-project');
const configProject = path.join(__dirname, 'fixtures', 'config-project');

afterEach(() => {
  vi.restoreAllMocks();
});

function createTempConfig(config: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'boa-config-'));
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'test', 'blue-oak-audit': config }),
  );
  return dir;
}

describe('loadConfig', () => {
  it('returns empty object when no config key exists', () => {
    const config = loadConfig(fakeProject);
    expect(config).toEqual({});
  });

  it('returns empty object when package.json does not exist', () => {
    const config = loadConfig('/nonexistent/path');
    expect(config).toEqual({});
  });

  it('parses valid config from package.json', () => {
    const config = loadConfig(configProject);
    expect(config).toEqual({
      minRating: 'Silver',
      failOnUnrated: true,
      summary: true,
    });
  });

  it('throws on invalid minRating', () => {
    const dir = createTempConfig({ minRating: 'Platinum' });
    expect(() => loadConfig(dir)).toThrow('must be one of');
  });

  it('throws when exclude is not an array', () => {
    const dir = createTempConfig({ exclude: 'not-an-array' });
    expect(() => loadConfig(dir)).toThrow('must be an array of strings');
  });

  it('throws when config is not an object', () => {
    const dir = createTempConfig('not-an-object');
    expect(() => loadConfig(dir)).toThrow('must be an object');
  });

  it('throws when boolean field has wrong type', () => {
    const dir = createTempConfig({ includeDev: 'yes' });
    expect(() => loadConfig(dir)).toThrow('must be a boolean');
  });

  it('warns on unknown keys', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dir = createTempConfig({ unknownKey: true });
    loadConfig(dir);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('unknown key "unknownKey"'));
  });
});
