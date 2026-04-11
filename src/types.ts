export const TIERS = ['Model', 'Gold', 'Silver', 'Bronze', 'Lead'] as const;
export type Tier = (typeof TIERS)[number];

export interface DependencyInfo {
  name: string;
  version: string;
  licenseDeclared: string | null;
  licenseNormalized: string | null;
  tier: Tier | 'Unrated';
  isDirectDep: boolean;
  path: string;
}

export interface AuditResult {
  projectName: string;
  projectVersion: string;
  total: number;
  dependencies: DependencyInfo[];
  summary: Record<Tier | 'Unrated', number>;
  failures: DependencyInfo[];
}

export interface PackageJsonConfig {
  includeDev?: boolean;
  minRating?: Tier;
  failOnUnrated?: boolean;
  exclude?: string[];
  directOnly?: boolean;
  json?: boolean;
  output?: string;
  summary?: boolean;
}

export interface AuditOptions {
  includeDev: boolean;
  minRating?: Tier;
  failOnUnrated: boolean;
  exclude: string[];
  directOnly: boolean;
  json: boolean;
  output?: string;
  summary: boolean;
}
