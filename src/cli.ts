import { Command } from 'commander';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { audit } from './audit.js';
import { formatTable } from './formatters/table.js';
import { formatJson } from './formatters/json.js';
import { formatSummary } from './formatters/summary.js';
import { TIERS, type Tier, type AuditOptions } from './types.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('blue-oak-audit')
  .description('Audit npm dependencies against the Blue Oak Council license quality list')
  .version(version)
  .argument('[path]', 'Project directory to audit', '.')
  .option('--json', 'Output results as JSON')
  .option('--output <file>', 'Write results to a file instead of stdout')
  .option('--include-dev', 'Include devDependencies (default: production only)')
  .option('--direct', 'Only audit direct dependencies (not transitive)')
  .option(
    '--min-rating <tier>',
    'Minimum acceptable Blue Oak tier (Model|Gold|Silver|Bronze|Lead). Exit 1 if any dep is below.',
  )
  .option('--fail-on-unrated', 'Exit with error code 1 if any dependency has an unrecognized license')
  .option('--summary', 'Show condensed summary with counts per tier')
  .option('--exclude <packages>', 'Comma-separated list of packages to skip')
  .action((projectPath: string, opts) => {
    const resolvedPath = path.resolve(projectPath);

    // Validate --min-rating
    let minRating: Tier | undefined;
    if (opts.minRating) {
      if (!TIERS.includes(opts.minRating as Tier)) {
        console.error(
          chalk.red(`Invalid --min-rating "${opts.minRating}". Must be one of: ${TIERS.join(', ')}`),
        );
        process.exit(2);
      }
      minRating = opts.minRating as Tier;
    }

    const options: AuditOptions = {
      includeDev: opts.includeDev ?? false,
      minRating,
      failOnUnrated: opts.failOnUnrated ?? false,
      exclude: opts.exclude ? opts.exclude.split(',').map((s: string) => s.trim()) : [],
      directOnly: opts.direct ?? false,
      json: opts.json ?? false,
      output: opts.output,
      summary: opts.summary ?? false,
    };

    try {
      const result = audit(resolvedPath, options);

      let output: string;
      if (options.json) {
        output = formatJson(result);
      } else if (options.summary) {
        output = formatSummary(result);
      } else {
        output = formatTable(result);
      }

      if (options.output) {
        const outPath = path.resolve(options.output);
        fs.writeFileSync(outPath, output, 'utf-8');
        console.log(chalk.green(`Results written to ${outPath}`));
      } else {
        console.log(output);
      }

      // Exit with error if policy violations found
      if (result.failures.length > 0) {
        process.exit(1);
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

program.parse();
