import { TIERS, type AuditResult, type AuditOptions, type Tier } from './types.js';
import { scanDependencies } from './dependencies.js';
import { isBelowMinRating } from './ratings.js';

export function audit(projectDir: string, options: AuditOptions): AuditResult {
  const { dependencies, projectName, projectVersion } = scanDependencies(projectDir, options);

  const summary: Record<Tier | 'Unrated', number> = {
    Model: 0,
    Gold: 0,
    Silver: 0,
    Bronze: 0,
    Lead: 0,
    Unrated: 0,
  };

  for (const dep of dependencies) {
    summary[dep.tier]++;
  }

  // Determine failures based on options
  const failures = dependencies.filter((dep) => {
    if (options.failOnUnrated && dep.tier === 'Unrated') return true;
    if (options.minRating && isBelowMinRating(dep.tier, options.minRating)) return true;
    return false;
  });

  return {
    projectName,
    projectVersion,
    total: dependencies.length,
    dependencies,
    summary,
    failures,
  };
}
