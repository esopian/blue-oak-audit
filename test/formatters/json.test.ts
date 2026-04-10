import { describe, it, expect } from 'vitest';
import { formatJson } from '../../src/formatters/json.js';
import type { AuditResult } from '../../src/types.js';

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

describe('formatJson', () => {
  it('produces valid JSON', () => {
    const output = formatJson(makeResult());
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('contains the expected top-level keys', () => {
    const parsed = JSON.parse(formatJson(makeResult()));
    expect(parsed).toHaveProperty('project');
    expect(parsed).toHaveProperty('total');
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('failures');
    expect(parsed).toHaveProperty('dependencies');
  });

  it('includes project metadata', () => {
    const parsed = JSON.parse(formatJson(makeResult()));
    expect(parsed.project.name).toBe('test-project');
    expect(parsed.project.version).toBe('1.0.0');
  });

  it('includes all dependencies with expected fields', () => {
    const parsed = JSON.parse(formatJson(makeResult()));
    expect(parsed.dependencies).toHaveLength(2);
    expect(parsed.dependencies[0]).toHaveProperty('name');
    expect(parsed.dependencies[0]).toHaveProperty('version');
    expect(parsed.dependencies[0]).toHaveProperty('licenseDeclared');
    expect(parsed.dependencies[0]).toHaveProperty('licenseNormalized');
    expect(parsed.dependencies[0]).toHaveProperty('tier');
    expect(parsed.dependencies[0]).toHaveProperty('isDirectDep');
  });

  it('includes failures when present', () => {
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
    const parsed = JSON.parse(formatJson(result));
    expect(parsed.failures).toHaveLength(1);
    expect(parsed.failures[0].name).toBe('pkg-b');
  });

  it('handles zero dependencies', () => {
    const result = makeResult({
      total: 0,
      dependencies: [],
      summary: { Model: 0, Gold: 0, Silver: 0, Bronze: 0, Lead: 0, Unrated: 0 },
    });
    const parsed = JSON.parse(formatJson(result));
    expect(parsed.total).toBe(0);
    expect(parsed.dependencies).toHaveLength(0);
  });
});
