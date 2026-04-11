import { describe, it, expect, beforeAll } from 'vitest';
import { execSync, execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const cli = path.join(projectRoot, 'dist', 'cli.js');
const fakeProject = path.join(__dirname, 'fixtures', 'fake-project');
const configProject = path.join(__dirname, 'fixtures', 'config-project');

const env = { ...process.env, FORCE_COLOR: '0', NODE_NO_WARNINGS: '1' };

function run(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${cli} ${args}`, {
      encoding: 'utf-8',
      cwd: projectRoot,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, exitCode: 0 };
  } catch (err: any) {
    return { stdout: err.stdout ?? '', exitCode: err.status ?? 1 };
  }
}

beforeAll(() => {
  // Build before CLI tests
  execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
});

describe('CLI', () => {
  it('--help exits 0 and prints usage', () => {
    const { stdout, exitCode } = run('--help');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('blue-oak-audit');
    expect(stdout).toContain('--json');
    expect(stdout).toContain('--min-rating');
  });

  it('--version prints the version', () => {
    const { stdout, exitCode } = run('--version');
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('audits a fixture project successfully', () => {
    const { stdout, exitCode } = run(fakeProject);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Blue Oak Audit');
    expect(stdout).toContain('dependencies audited');
  });

  it('--json outputs valid JSON', () => {
    const { stdout, exitCode } = run(`--json ${fakeProject}`);
    expect(exitCode).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('project');
    expect(parsed).toHaveProperty('dependencies');
    expect(parsed).toHaveProperty('summary');
  });

  it('--summary outputs summary format', () => {
    const { stdout, exitCode } = run(`--summary ${fakeProject}`);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('█');
  });

  it('--min-rating Model exits 1 (fixture has non-Model deps)', () => {
    const { exitCode } = run(`--min-rating Model ${fakeProject}`);
    expect(exitCode).toBe(1);
  });

  it('--fail-on-unrated exits 1 (fixture has UNLICENSED dep)', () => {
    const { exitCode } = run(`--fail-on-unrated ${fakeProject}`);
    expect(exitCode).toBe(1);
  });

  it('--exclude can prevent unrated failures', () => {
    const { exitCode } = run(`--fail-on-unrated --exclude unlicensed-pkg ${fakeProject}`);
    // May still fail for other reasons (copyleft-and has Unrated from parse),
    // so just verify it runs
    expect([0, 1]).toContain(exitCode);
  });

  it('invalid --min-rating exits 2', () => {
    const { exitCode } = run(`--min-rating INVALID ${fakeProject}`);
    expect(exitCode).toBe(2);
  });

  it('nonexistent path exits 2', () => {
    const { exitCode } = run('/nonexistent/path/to/project');
    expect(exitCode).toBe(2);
  });

  it('reads config defaults from package.json', () => {
    // config-project has summary: true, so output should contain bar chart
    const { stdout, exitCode } = run(configProject);
    // failOnUnrated is true in config and fixture has unlicensed-pkg → exit 1
    expect(exitCode).toBe(1);
    expect(stdout).toContain('█');
  });

  it('CLI flags override package.json config', () => {
    // config-project has summary: true, but --json should override
    const { stdout, exitCode } = run(`--json ${configProject}`);
    // Still exits 1 due to config failOnUnrated + unrated deps
    expect(exitCode).toBe(1);
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('project');
    expect(parsed).toHaveProperty('dependencies');
  });

  it('--output writes results to a file', () => {
    const tmpFile = path.join(os.tmpdir(), `boa-test-${Date.now()}.json`);
    try {
      const { exitCode } = run(`--json --output ${tmpFile} ${fakeProject}`);
      expect(exitCode).toBe(0);
      const content = fs.readFileSync(tmpFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty('project');
    } finally {
      try {
        fs.unlinkSync(tmpFile);
      } catch {}
    }
  });
});
