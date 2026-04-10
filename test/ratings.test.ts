import { describe, it, expect } from 'vitest';
import { lookupTier, tierIndex, bestTier, worstTier, isBelowMinRating } from '../src/ratings.js';

describe('lookupTier', () => {
  it('returns Model for BlueOak-1.0.0', () => {
    expect(lookupTier('BlueOak-1.0.0')).toBe('Model');
  });

  it('returns Silver for MIT', () => {
    expect(lookupTier('MIT')).toBe('Silver');
  });

  it('returns Silver for Apache-2.0', () => {
    expect(lookupTier('Apache-2.0')).toBe('Silver');
  });

  it('returns Silver for ISC', () => {
    expect(lookupTier('ISC')).toBe('Silver');
  });

  it('returns Bronze for 0BSD', () => {
    expect(lookupTier('0BSD')).toBe('Bronze');
  });

  it('returns Lead for AAL', () => {
    expect(lookupTier('AAL')).toBe('Lead');
  });

  it('returns Gold for BSD-2-Clause-Patent', () => {
    expect(lookupTier('BSD-2-Clause-Patent')).toBe('Gold');
  });

  it('returns Unrated for unknown license', () => {
    expect(lookupTier('TOTALLY-FAKE-LICENSE-999')).toBe('Unrated');
  });
});

describe('tierIndex', () => {
  it('orders tiers correctly: Model < Gold < Silver < Bronze < Lead < Unrated', () => {
    expect(tierIndex('Model')).toBeLessThan(tierIndex('Gold'));
    expect(tierIndex('Gold')).toBeLessThan(tierIndex('Silver'));
    expect(tierIndex('Silver')).toBeLessThan(tierIndex('Bronze'));
    expect(tierIndex('Bronze')).toBeLessThan(tierIndex('Lead'));
    expect(tierIndex('Lead')).toBeLessThan(tierIndex('Unrated'));
  });

  it('returns 0 for Model', () => {
    expect(tierIndex('Model')).toBe(0);
  });

  it('returns 5 for Unrated (beyond TIERS length)', () => {
    expect(tierIndex('Unrated')).toBe(5);
  });
});

describe('bestTier', () => {
  it('picks the better (lower index) tier', () => {
    expect(bestTier('Gold', 'Silver')).toBe('Gold');
    expect(bestTier('Silver', 'Gold')).toBe('Gold');
  });

  it('returns same tier when both are equal', () => {
    expect(bestTier('Silver', 'Silver')).toBe('Silver');
  });

  it('defers Unrated to the other side', () => {
    expect(bestTier('Unrated', 'Silver')).toBe('Silver');
    expect(bestTier('Bronze', 'Unrated')).toBe('Bronze');
  });

  it('returns Unrated when both are Unrated', () => {
    expect(bestTier('Unrated', 'Unrated')).toBe('Unrated');
  });
});

describe('worstTier', () => {
  it('picks the worse (higher index) tier', () => {
    expect(worstTier('Gold', 'Silver')).toBe('Silver');
    expect(worstTier('Silver', 'Gold')).toBe('Silver');
  });

  it('returns same tier when both are equal', () => {
    expect(worstTier('Bronze', 'Bronze')).toBe('Bronze');
  });

  it('returns Unrated if either side is Unrated', () => {
    expect(worstTier('Unrated', 'Silver')).toBe('Unrated');
    expect(worstTier('Gold', 'Unrated')).toBe('Unrated');
  });
});

describe('isBelowMinRating', () => {
  it('returns true when tier is worse than min', () => {
    expect(isBelowMinRating('Lead', 'Silver')).toBe(true);
    expect(isBelowMinRating('Bronze', 'Gold')).toBe(true);
  });

  it('returns false when tier meets the min', () => {
    expect(isBelowMinRating('Silver', 'Silver')).toBe(false);
    expect(isBelowMinRating('Model', 'Silver')).toBe(false);
  });

  it('returns true for Unrated against any min', () => {
    expect(isBelowMinRating('Unrated', 'Lead')).toBe(true);
  });
});
