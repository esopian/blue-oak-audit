import spdxCorrect from 'spdx-correct';
import spdxParse from 'spdx-expression-parse';
import type { Tier } from './types.js';
import { lookupTier, bestTier, worstTier } from './ratings.js';

interface PackageJson {
  license?: string | { type: string; url?: string };
  licenses?: Array<{ type: string; url?: string }>;
}

export function extractLicenseString(pkg: PackageJson): string | null {
  // Standard string field
  if (typeof pkg.license === 'string') {
    return pkg.license;
  }

  // Legacy object: { type: "MIT", url: "..." }
  if (pkg.license && typeof pkg.license === 'object' && pkg.license.type) {
    return pkg.license.type;
  }

  // Legacy array: licenses: [{ type: "MIT" }, { type: "ISC" }]
  if (Array.isArray(pkg.licenses) && pkg.licenses.length > 0) {
    return pkg.licenses.map((l) => l.type).join(' OR ');
  }

  return null;
}

export function normalizeLicense(raw: string): string | null {
  // Try spdx-correct first
  const corrected = spdxCorrect(raw);
  if (corrected) return corrected;

  // If correction fails, return the raw string for best-effort parsing
  return raw;
}

function rateNode(node: spdxParse.Info): Tier | 'Unrated' {
  if ('license' in node) {
    return lookupTier(node.license);
  }

  const left = rateNode(node.left);
  const right = rateNode(node.right);

  if (node.conjunction === 'or') {
    return bestTier(left, right);
  } else {
    return worstTier(left, right);
  }
}

export function rateLicense(raw: string | null): {
  normalized: string | null;
  tier: Tier | 'Unrated';
} {
  if (!raw || raw === 'UNLICENSED') {
    return { normalized: null, tier: 'Unrated' };
  }

  const normalized = normalizeLicense(raw);
  if (!normalized) {
    return { normalized: null, tier: 'Unrated' };
  }

  try {
    const parsed = spdxParse(normalized);
    const tier = rateNode(parsed);
    return { normalized, tier };
  } catch {
    // If parsing fails, try direct lookup on the raw/normalized string
    const tier = lookupTier(normalized);
    return { normalized, tier };
  }
}
