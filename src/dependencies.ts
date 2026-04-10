import fs from 'node:fs';
import path from 'node:path';
import type { DependencyInfo, AuditOptions } from './types.js';
import { extractLicenseString, rateLicense } from './licenses.js';

interface PkgJson {
  name?: string;
  version?: string;
  license?: string | { type: string; url?: string };
  licenses?: Array<{ type: string; url?: string }>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  private?: boolean;
}

function readPkgJson(dir: string): PkgJson | null {
  const pkgPath = path.join(dir, 'package.json');
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Collect all packages installed in node_modules (recursively handles nested node_modules).
 */
function walkNodeModules(nodeModulesDir: string): Map<string, { pkg: PkgJson; dir: string }> {
  const results = new Map<string, { pkg: PkgJson; dir: string }>();

  if (!fs.existsSync(nodeModulesDir)) return results;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.package-lock.json') continue;

    if (entry.name.startsWith('@')) {
      // Scoped package — read one level deeper
      const scopeDir = path.join(nodeModulesDir, entry.name);
      let scopeEntries: fs.Dirent[];
      try {
        scopeEntries = fs.readdirSync(scopeDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const scopeEntry of scopeEntries) {
        if (!scopeEntry.isDirectory()) continue;
        const pkgDir = path.join(scopeDir, scopeEntry.name);
        const pkg = readPkgJson(pkgDir);
        if (pkg?.name) {
          results.set(pkg.name, { pkg, dir: pkgDir });
        }
        // Check for nested node_modules
        const nested = path.join(pkgDir, 'node_modules');
        if (fs.existsSync(nested)) {
          for (const [k, v] of walkNodeModules(nested)) {
            if (!results.has(k)) results.set(k, v);
          }
        }
      }
    } else if (entry.name === '.bin' || entry.name === '.cache') {
      continue;
    } else {
      const pkgDir = path.join(nodeModulesDir, entry.name);
      const pkg = readPkgJson(pkgDir);
      if (pkg?.name) {
        results.set(pkg.name, { pkg, dir: pkgDir });
      }
      // Check for nested node_modules
      const nested = path.join(pkgDir, 'node_modules');
      if (fs.existsSync(nested)) {
        for (const [k, v] of walkNodeModules(nested)) {
          if (!results.has(k)) results.set(k, v);
        }
      }
    }
  }

  return results;
}

/**
 * Build a set of production dependency names by following the transitive
 * dependency graph starting from the root package.json `dependencies`.
 */
function collectProductionDeps(
  rootPkg: PkgJson,
  allPackages: Map<string, { pkg: PkgJson; dir: string }>,
): Set<string> {
  const prodDeps = new Set<string>();
  const queue = Object.keys(rootPkg.dependencies ?? {});

  while (queue.length > 0) {
    const name = queue.pop()!;
    if (prodDeps.has(name)) continue;
    prodDeps.add(name);

    const entry = allPackages.get(name);
    if (entry?.pkg.dependencies) {
      for (const dep of Object.keys(entry.pkg.dependencies)) {
        if (!prodDeps.has(dep)) queue.push(dep);
      }
    }
  }

  return prodDeps;
}

export function scanDependencies(projectDir: string, options: AuditOptions): {
  dependencies: DependencyInfo[];
  projectName: string;
  projectVersion: string;
} {
  const rootPkg = readPkgJson(projectDir);
  if (!rootPkg) {
    throw new Error(`No package.json found in ${projectDir}`);
  }

  const nodeModulesDir = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) {
    throw new Error(
      `No node_modules directory found in ${projectDir}. Run npm install first.`,
    );
  }

  const allPackages = walkNodeModules(nodeModulesDir);

  // Determine which packages are direct dependencies
  const directProdDeps = new Set(Object.keys(rootPkg.dependencies ?? {}));
  const directDevDeps = new Set(Object.keys(rootPkg.devDependencies ?? {}));
  const directDeps = new Set([...directProdDeps, ...(options.includeDev ? directDevDeps : [])]);

  // Determine the full set of packages to include
  let includedNames: Set<string>;

  if (options.directOnly) {
    includedNames = directDeps;
  } else if (options.includeDev) {
    // All installed packages
    includedNames = new Set(allPackages.keys());
  } else {
    // Production only: follow transitive deps from `dependencies`
    includedNames = collectProductionDeps(rootPkg, allPackages);
  }

  // Apply exclusions
  const excludeSet = new Set(options.exclude);

  const dependencies: DependencyInfo[] = [];

  for (const name of includedNames) {
    if (excludeSet.has(name)) continue;

    const entry = allPackages.get(name);
    if (!entry) continue;

    const raw = extractLicenseString(entry.pkg);
    const { normalized, tier } = rateLicense(raw);

    dependencies.push({
      name,
      version: entry.pkg.version ?? 'unknown',
      licenseDeclared: raw,
      licenseNormalized: normalized,
      tier,
      isDirectDep: directProdDeps.has(name) || directDevDeps.has(name),
      path: entry.dir,
    });
  }

  // Sort: worst tier first, then alphabetically
  dependencies.sort((a, b) => {
    const tierOrder = ['Model', 'Gold', 'Silver', 'Bronze', 'Lead', 'Unrated'];
    const ai = tierOrder.indexOf(a.tier);
    const bi = tierOrder.indexOf(b.tier);
    if (ai !== bi) return bi - ai; // worst first
    return a.name.localeCompare(b.name);
  });

  return {
    dependencies,
    projectName: rootPkg.name ?? 'unknown',
    projectVersion: rootPkg.version ?? 'unknown',
  };
}
