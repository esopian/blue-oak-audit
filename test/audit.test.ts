import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { audit } from '../src/audit.js';
import type { AuditOptions } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fakeProject = path.join(__dirname, 'fixtures', 'fake-project');

const defaultOptions: AuditOptions = {
  includeDev: false,
  failOnUnrated: false,
  exclude: [],
  directOnly: false,
  json: false,
  summary: false,
};

describe('audit', () => {
  it('returns correct summary counts', () => {
    const result = audit(fakeProject, defaultOptions);
    expect(result.total).toBeGreaterThan(0);

    // All tier counts should sum to total
    const sumOfTiers = Object.values(result.summary).reduce((a, b) => a + b, 0);
    expect(sumOfTiers).toBe(result.total);
  });

  it('has no failures when no policy is set', () => {
    const result = audit(fakeProject, defaultOptions);
    expect(result.failures).toHaveLength(0);
  });

  it('detects failures with failOnUnrated', () => {
    const result = audit(fakeProject, { ...defaultOptions, failOnUnrated: true });
    expect(result.failures.length).toBeGreaterThan(0);

    const unratedFailures = result.failures.filter((f) => f.tier === 'Unrated');
    expect(unratedFailures.length).toBeGreaterThan(0);
  });

  it('detects failures with minRating', () => {
    const result = audit(fakeProject, { ...defaultOptions, minRating: 'Silver' });
    expect(result.failures.length).toBeGreaterThan(0);

    // All failures should be below Silver
    for (const failure of result.failures) {
      expect(['Bronze', 'Lead', 'Unrated']).toContain(failure.tier);
    }
  });

  it('combines failOnUnrated and minRating', () => {
    const result = audit(fakeProject, {
      ...defaultOptions,
      failOnUnrated: true,
      minRating: 'Silver',
    });

    // Should include both unrated and below-Silver
    expect(result.failures.length).toBeGreaterThan(0);
  });

  it('returns project metadata', () => {
    const result = audit(fakeProject, defaultOptions);
    expect(result.projectName).toBe('fake-project');
    expect(result.projectVersion).toBe('0.0.0');
  });

  it('exclude option prevents failures', () => {
    // First verify there are failures
    const withFailures = audit(fakeProject, { ...defaultOptions, failOnUnrated: true });
    const unratedNames = withFailures.failures
      .filter((f) => f.tier === 'Unrated')
      .map((f) => f.name);

    // Exclude all unrated packages
    const result = audit(fakeProject, {
      ...defaultOptions,
      failOnUnrated: true,
      exclude: unratedNames,
    });
    const remaining = result.failures.filter((f) => f.tier === 'Unrated');
    expect(remaining).toHaveLength(0);
  });
});
