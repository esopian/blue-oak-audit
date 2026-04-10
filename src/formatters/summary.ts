import chalk from 'chalk';
import type { AuditResult, Tier } from '../types.js';

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

export function formatSummary(result: AuditResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold(`Blue Oak Audit: ${result.projectName}@${result.projectVersion}`));
  lines.push(chalk.dim(`${result.total} dependencies audited`));
  lines.push('');

  const maxCount = Math.max(...Object.values(result.summary));
  const barWidth = 40;

  for (const tier of ['Model', 'Gold', 'Silver', 'Bronze', 'Lead', 'Unrated'] as const) {
    const count = result.summary[tier];
    const barLen = maxCount > 0 ? Math.round((count / maxCount) * barWidth) : 0;
    const bar = '█'.repeat(barLen);
    const color = tierColor[tier];
    const warn = (tier === 'Lead' || tier === 'Unrated') && count > 0 ? chalk.red(' !!') : '';
    lines.push(`  ${color(pad(tier, 8))} ${pad(String(count), 4)} ${color(bar)}${warn}`);
  }

  if (result.failures.length > 0) {
    lines.push('');
    lines.push(chalk.red.bold(`${result.failures.length} package(s) below minimum rating`));
  }

  lines.push('');
  return lines.join('\n');
}
