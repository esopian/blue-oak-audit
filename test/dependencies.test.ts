import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDependencies } from '../src/dependencies.js';
import type { AuditOptions } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const fakeProject = path.join(fixturesDir, 'fake-project');
const emptyProject = path.join(fixturesDir, 'empty-project');
const noNodeModules = path.join(fixturesDir, 'no-node-modules');

const defaultOptions: AuditOptions = {
  includeDev: false,
  failOnUnrated: false,
  exclude: [],
  directOnly: false,
  json: false,
  summary: false,
};

describe('scanDependencies', () => {
  it('finds production dependencies including transitive', () => {
    const { dependencies } = scanDependencies(fakeProject, defaultOptions);
    const names = dependencies.map((d) => d.name);

    // Direct production deps
    expect(names).toContain('mit-pkg');
    expect(names).toContain('@scope/isc-pkg');
    expect(names).toContain('dual-or');
    expect(names).toContain('copyleft-and');
    expect(names).toContain('unlicensed-pkg');
    expect(names).toContain('lead-pkg');

    // Transitive dep (mit-pkg depends on transitive-pkg)
    expect(names).toContain('transitive-pkg');

    // Dev-only should be excluded by default
    expect(names).not.toContain('dev-only-pkg');

    // Non-production packages not in the dependency chain
    expect(names).not.toContain('legacy-obj');
    expect(names).not.toContain('legacy-array');
    expect(names).not.toContain('no-license');
  });

  it('returns correct project metadata', () => {
    const { projectName, projectVersion } = scanDependencies(fakeProject, defaultOptions);
    expect(projectName).toBe('fake-project');
    expect(projectVersion).toBe('0.0.0');
  });

  it('marks direct vs transitive deps correctly', () => {
    const { dependencies } = scanDependencies(fakeProject, defaultOptions);
    const mitPkg = dependencies.find((d) => d.name === 'mit-pkg');
    const transitivePkg = dependencies.find((d) => d.name === 'transitive-pkg');

    expect(mitPkg?.isDirectDep).toBe(true);
    expect(transitivePkg?.isDirectDep).toBe(false);
  });

  it('includes dev dependencies when includeDev is true', () => {
    const { dependencies } = scanDependencies(fakeProject, { ...defaultOptions, includeDev: true });
    const names = dependencies.map((d) => d.name);
    expect(names).toContain('dev-only-pkg');
    // Also includes non-dep packages in node_modules when includeDev is true
    expect(names).toContain('legacy-obj');
    expect(names).toContain('no-license');
  });

  it('returns only direct deps when directOnly is true', () => {
    const { dependencies } = scanDependencies(fakeProject, { ...defaultOptions, directOnly: true });
    const names = dependencies.map((d) => d.name);

    expect(names).toContain('mit-pkg');
    expect(names).toContain('@scope/isc-pkg');
    expect(names).not.toContain('transitive-pkg');
    expect(names).not.toContain('dev-only-pkg');
  });

  it('excludes packages in the exclude list', () => {
    const { dependencies } = scanDependencies(fakeProject, {
      ...defaultOptions,
      exclude: ['unlicensed-pkg', 'lead-pkg'],
    });
    const names = dependencies.map((d) => d.name);
    expect(names).not.toContain('unlicensed-pkg');
    expect(names).not.toContain('lead-pkg');
  });

  it('finds scoped packages', () => {
    const { dependencies } = scanDependencies(fakeProject, defaultOptions);
    const scoped = dependencies.find((d) => d.name === '@scope/isc-pkg');
    expect(scoped).toBeDefined();
    expect(scoped?.version).toBe('2.0.0');
    expect(scoped?.tier).toBe('Silver');
  });

  it('sorts worst tier first, then alphabetically', () => {
    const { dependencies } = scanDependencies(fakeProject, defaultOptions);
    const tiers = dependencies.map((d) => d.tier);
    const tierOrder = ['Model', 'Gold', 'Silver', 'Bronze', 'Lead', 'Unrated'];

    // Verify sorting: later tiers appear first
    for (let i = 1; i < tiers.length; i++) {
      const prevIdx = tierOrder.indexOf(tiers[i - 1]);
      const currIdx = tierOrder.indexOf(tiers[i]);
      if (prevIdx !== currIdx) {
        expect(prevIdx).toBeGreaterThanOrEqual(currIdx);
      }
    }
  });

  it('returns empty deps for a project with no dependencies', () => {
    const { dependencies } = scanDependencies(emptyProject, defaultOptions);
    expect(dependencies).toHaveLength(0);
  });

  it('throws when no package.json exists', () => {
    expect(() => scanDependencies('/nonexistent/path', defaultOptions)).toThrow('No package.json found');
  });

  it('throws when no node_modules exists', () => {
    expect(() => scanDependencies(noNodeModules, defaultOptions)).toThrow('No node_modules directory');
  });
});
