import type { AuditResult } from '../types.js';

export function formatJson(result: AuditResult): string {
  const output = {
    project: {
      name: result.projectName,
      version: result.projectVersion,
    },
    total: result.total,
    summary: result.summary,
    failures: result.failures.map((d) => ({
      name: d.name,
      version: d.version,
      license: d.licenseNormalized ?? d.licenseDeclared,
      tier: d.tier,
    })),
    dependencies: result.dependencies.map((d) => ({
      name: d.name,
      version: d.version,
      licenseDeclared: d.licenseDeclared,
      licenseNormalized: d.licenseNormalized,
      tier: d.tier,
      isDirectDep: d.isDirectDep,
    })),
  };

  return JSON.stringify(output, null, 2);
}
