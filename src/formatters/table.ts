import chalk from 'chalk';
import type { AuditResult, DependencyInfo, Tier } from '../types.js';

const tierColor: Record<Tier | 'Unrated', (s: string) => string> = {
  Model: chalk.green,
  Gold: chalk.green,
  Silver: chalk.cyan,
  Bronze: chalk.yellow,
  Lead: chalk.red,
  Unrated: chalk.magenta,
};

function pad(str: string, len: number): string {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

function formatRow(dep: DependencyInfo, nameW: number, versionW: number, licenseW: number): string {
  const color = tierColor[dep.tier];
  const direct = dep.isDirectDep ? chalk.dim(' (direct)') : '';
  return [
    pad(dep.name, nameW),
    pad(dep.version, versionW),
    pad(dep.licenseNormalized ?? dep.licenseDeclared ?? 'NONE', licenseW),
    color(dep.tier),
    direct,
  ].join('  ');
}

export function formatTable(result: AuditResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold(`Blue Oak Audit: ${result.projectName}@${result.projectVersion}`));
  lines.push(chalk.dim(`${result.total} dependencies audited`));
  lines.push('');

  if (result.dependencies.length === 0) {
    lines.push(chalk.dim('  No dependencies found.'));
    return lines.join('\n');
  }

  const nameW = Math.max(7, ...result.dependencies.map((d) => d.name.length));
  const versionW = Math.max(7, ...result.dependencies.map((d) => d.version.length));
  const licenseW = Math.max(7, ...result.dependencies.map((d) => (d.licenseNormalized ?? d.licenseDeclared ?? 'NONE').length));

  // Header
  const header = [
    pad('Package', nameW),
    pad('Version', versionW),
    pad('License', licenseW),
    'Rating',
  ].join('  ');
  lines.push(chalk.bold.underline(header));

  for (const dep of result.dependencies) {
    lines.push(formatRow(dep, nameW, versionW, licenseW));
  }

  lines.push('');

  // Summary footer
  lines.push(chalk.bold('Summary:'));
  for (const tier of ['Model', 'Gold', 'Silver', 'Bronze', 'Lead', 'Unrated'] as const) {
    const count = result.summary[tier];
    if (count === 0) continue;
    const color = tierColor[tier];
    const warn = tier === 'Lead' || tier === 'Unrated' ? chalk.red(' !!') : '';
    lines.push(`  ${color(pad(tier, 8))} ${count} package${count === 1 ? '' : 's'}${warn}`);
  }

  if (result.failures.length > 0) {
    lines.push('');
    lines.push(chalk.red.bold(`${result.failures.length} package(s) below minimum rating:`));
    for (const dep of result.failures) {
      lines.push(chalk.red(`  - ${dep.name}@${dep.version} (${dep.tier})`));
    }
  }

  lines.push('');
  return lines.join('\n');
}
