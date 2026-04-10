import { describe, it, expect } from 'vitest';
import { extractLicenseString, normalizeLicense, rateLicense } from '../src/licenses.js';

describe('extractLicenseString', () => {
  it('extracts a string license field', () => {
    expect(extractLicenseString({ license: 'MIT' })).toBe('MIT');
  });

  it('extracts from legacy object format', () => {
    expect(extractLicenseString({ license: { type: 'MIT', url: 'https://...' } })).toBe('MIT');
  });

  it('extracts from legacy array format and joins with OR', () => {
    expect(
      extractLicenseString({
        licenses: [{ type: 'MIT' }, { type: 'ISC' }],
      }),
    ).toBe('MIT OR ISC');
  });

  it('returns null when no license field exists', () => {
    expect(extractLicenseString({})).toBeNull();
  });

  it('returns null for empty licenses array', () => {
    expect(extractLicenseString({ licenses: [] })).toBeNull();
  });

  it('handles single-element legacy array', () => {
    expect(extractLicenseString({ licenses: [{ type: 'Apache-2.0' }] })).toBe('Apache-2.0');
  });
});

describe('normalizeLicense', () => {
  it('normalizes a valid SPDX ID', () => {
    expect(normalizeLicense('MIT')).toBe('MIT');
  });

  it('corrects a lowercase license', () => {
    expect(normalizeLicense('mit')).toBe('MIT');
  });

  it('corrects common variations', () => {
    expect(normalizeLicense('Apache 2.0')).toBe('Apache-2.0');
  });

  it('returns raw string for unrecognized license', () => {
    expect(normalizeLicense('My-Custom-License')).toBe('My-Custom-License');
  });
});

describe('rateLicense', () => {
  it('returns Unrated for null', () => {
    const result = rateLicense(null);
    expect(result.tier).toBe('Unrated');
    expect(result.normalized).toBeNull();
  });

  it('returns Unrated for UNLICENSED', () => {
    const result = rateLicense('UNLICENSED');
    expect(result.tier).toBe('Unrated');
    expect(result.normalized).toBeNull();
  });

  it('rates a simple SPDX ID', () => {
    const result = rateLicense('MIT');
    expect(result.normalized).toBe('MIT');
    expect(result.tier).toBe('Silver');
  });

  it('rates an OR expression with best tier', () => {
    // MIT (Silver) OR Apache-2.0 (Silver) → Silver
    const result = rateLicense('MIT OR Apache-2.0');
    expect(result.tier).toBe('Silver');
  });

  it('rates an AND expression with worst tier', () => {
    // 0BSD (Bronze) AND AAL (Lead) → Lead
    const result = rateLicense('0BSD AND AAL');
    expect(result.tier).toBe('Lead');
  });

  it('handles OR with one Unrated side', () => {
    // MIT (Silver) OR FAKE-LICENSE → bestTier picks Silver
    const result = rateLicense('MIT OR LicenseRef-FAKE');
    expect(result.tier).toBe('Silver');
  });

  it('falls back to direct lookup on unparseable strings', () => {
    const result = rateLicense('MIT');
    expect(result.tier).toBe('Silver');
  });

  it('returns Unrated for completely unknown license', () => {
    const result = rateLicense('TOTALLY-FAKE-999');
    expect(result.tier).toBe('Unrated');
  });
});
