import { createRequire } from 'node:module';
import { TIERS, type Tier } from './types.js';

const require = createRequire(import.meta.url);

interface BlueOakLicense {
  name: string;
  id: string;
  url: string;
}

interface BlueOakCategory {
  name: string;
  notes: string;
  licenses: BlueOakLicense[];
}

const list: BlueOakCategory[] = require('@blueoak/list/index.json');

const ratingMap = new Map<string, Tier>();
for (const category of list) {
  const tier = category.name as Tier;
  for (const license of category.licenses) {
    ratingMap.set(license.id, tier);
  }
}

export function lookupTier(spdxId: string): Tier | 'Unrated' {
  return ratingMap.get(spdxId) ?? 'Unrated';
}

export function tierIndex(tier: Tier | 'Unrated'): number {
  if (tier === 'Unrated') return TIERS.length;
  return TIERS.indexOf(tier);
}

export function bestTier(a: Tier | 'Unrated', b: Tier | 'Unrated'): Tier | 'Unrated' {
  // For OR: pick the better (lower index) tier
  // If one side is Unrated, use the rated side
  if (a === 'Unrated') return b;
  if (b === 'Unrated') return a;
  return tierIndex(a) <= tierIndex(b) ? a : b;
}

export function worstTier(a: Tier | 'Unrated', b: Tier | 'Unrated'): Tier | 'Unrated' {
  // For AND: pick the worse (higher index) tier
  // If either side is Unrated, return Unrated (unknown risk)
  if (a === 'Unrated' || b === 'Unrated') return 'Unrated';
  return tierIndex(a) >= tierIndex(b) ? a : b;
}

export function isBelowMinRating(tier: Tier | 'Unrated', minRating: Tier): boolean {
  return tierIndex(tier) > tierIndex(minRating);
}
