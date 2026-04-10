import { describe, it, expect, beforeAll } from 'vitest';
import chalk from 'chalk';
import { formatTable } from '../../src/formatters/table.js';
import type { AuditResult } from '../../src/types.js';

beforeAll(() => {
  chalk.level = 0;
});

function makeResult(overrides: Partial<AuditResult> = {}): AuditResult {
  return {
    projectName: 'test-project',
    projectVersion: '1.0.0',
    total: 2,
    dependencies: [
      {
        name: 'pkg-a',
        version: '1.0.0',
        licenseDeclared: 'MIT',
        licenseNormalized: 'MIT',
        tier: 'Silver',
        isDirectDep: true,
        path: '/fake/path/pkg-a',
      },
      {
        name: 'pkg-b',
        version: '2.0.0',
        licenseDeclared: 'AAL',
        licenseNormalized: 'AAL',
        tier: 'Lead',
        isDirectDep: false,
        path: '/fake/path/pkg-b',
      },
    ],
    summary: { Model: 0, Gold: 0, Silver: 1, Bronze: 0, Lead: 1, Unrated: 0 },
    failures: [],
    ...overrides,
  };
}

describe('formatTable', () => {
  it('contains the project header', () => {
    const output = formatTable(makeResult());
    expect(output).toContain('Blue Oak Audit: test-project@1.0.0');
  });

  it('contains the audited count', () => {
    const output = formatTable(makeResult());
    expect(output).toContain('2 dependencies audited');
  });

  it('contains column headers', () => {
    const output = formatTable(makeResult());
    expect(output).toContain('Package');
    expect(output).toContain('Version');
    expect(output).toContain('License');
    expect(output).toContain('Rating');
  });

  it('lists package names and tiers', () => {
    const output = formatTable(makeResult());
    expect(output).toContain('pkg-a');
    expect(output).toContain('pkg-b');
    expect(output).toContain('Silver');
    expect(output).toContain('Lead');
  });

  it('shows direct dependency marker', () => {
    const output = formatTable(makeResult());
    expect(output).toContain('(direct)');
  });

  it('shows summary section', () => {
    const output = formatTable(makeResult());
    expect(output).toContain('Summary:');
    expect(output).toContain('Silver');
    expect(output).toContain('1 package');
  });

  it('shows failure section when failures exist', () => {
    const result = makeResult({
      failures: [
        {
          name: 'pkg-b',
          version: '2.0.0',
          licenseDeclared: 'AAL',
          licenseNormalized: 'AAL',
          tier: 'Lead',
          isDirectDep: false,
          path: '/fake/path/pkg-b',
        },
      ],
    });
    const output = formatTable(result);
    expect(output).toContain('1 package(s) below minimum rating:');
    expect(output).toContain('pkg-b@2.0.0');
  });

  it('handles empty dependency list', () => {
    const result = makeResult({
      total: 0,
      dependencies: [],
      summary: { Model: 0, Gold: 0, Silver: 0, Bronze: 0, Lead: 0, Unrated: 0 },
    });
    const output = formatTable(result);
    expect(output).toContain('No dependencies found');
  });
});
