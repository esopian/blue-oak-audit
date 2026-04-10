import { describe, it, expect, beforeAll } from 'vitest';
import chalk from 'chalk';
import { formatSummary } from '../../src/formatters/summary.js';
import type { AuditResult } from '../../src/types.js';

beforeAll(() => {
  chalk.level = 0;
});

function makeResult(overrides: Partial<AuditResult> = {}): AuditResult {
  return {
    projectName: 'test-project',
    projectVersion: '1.0.0',
    total: 5,
    dependencies: [],
    summary: { Model: 0, Gold: 1, Silver: 3, Bronze: 0, Lead: 1, Unrated: 0 },
    failures: [],
    ...overrides,
  };
}

describe('formatSummary', () => {
  it('contains the project header', () => {
    const output = formatSummary(makeResult());
    expect(output).toContain('Blue Oak Audit: test-project@1.0.0');
  });

  it('contains the audited count', () => {
    const output = formatSummary(makeResult());
    expect(output).toContain('5 dependencies audited');
  });

  it('shows tier names and counts', () => {
    const output = formatSummary(makeResult());
    expect(output).toContain('Gold');
    expect(output).toContain('Silver');
    expect(output).toContain('Lead');
  });

  it('contains bar chart characters', () => {
    const output = formatSummary(makeResult());
    expect(output).toContain('█');
  });

  it('shows warning markers for Lead', () => {
    const output = formatSummary(makeResult());
    expect(output).toContain('!!');
  });

  it('shows failure count when failures exist', () => {
    const result = makeResult({
      failures: [
        {
          name: 'bad-pkg',
          version: '1.0.0',
          licenseDeclared: 'AAL',
          licenseNormalized: 'AAL',
          tier: 'Lead',
          isDirectDep: false,
          path: '/fake',
        },
      ],
    });
    const output = formatSummary(result);
    expect(output).toContain('1 package(s) below minimum rating');
  });

  it('does not show failure line when no failures', () => {
    const output = formatSummary(makeResult());
    expect(output).not.toContain('below minimum rating');
  });
});
