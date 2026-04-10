# blue-oak-audit

Audit npm dependencies against the [Blue Oak Council](https://blueoakcouncil.org/list) license quality list.

[![npm](https://img.shields.io/npm/v/blue-oak-audit)](https://www.npmjs.com/package/blue-oak-audit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What It Does

Scans your project's `node_modules` and rates every dependency's license against the Blue Oak Council's permissive license rating system:

| Tier | Meaning |
|------|---------|
| **Model** | Exemplary permissive license |
| **Gold** | Explicitly addresses patents, simple notice required |
| **Silver** | Robust language, may lack patent clause |
| **Bronze** | Permissive but with notable limitations |
| **Lead** | Minimally permissive, use with caution |
| **Unrated** | License not recognized by Blue Oak Council |

## Installation

```bash
# Run directly with npx (no install needed)
npx blue-oak-audit

# Or install globally
npm install -g blue-oak-audit

# Or add to your project
npm install --save-dev blue-oak-audit
```

## Quick Start

```bash
# Audit the current project
npx blue-oak-audit

# Require all deps to be at least Silver-rated
npx blue-oak-audit --min-rating Silver

# Get JSON output for tooling
npx blue-oak-audit --json

# Quick summary view
npx blue-oak-audit --summary
```

## CLI Options

| Option | Description |
|--------|-------------|
| `[path]` | Project directory to audit (default: `.`) |
| `--json` | Output results as JSON |
| `--output <file>` | Write results to a file instead of stdout |
| `--include-dev` | Include devDependencies (default: production only) |
| `--direct` | Only audit direct dependencies (skip transitive) |
| `--min-rating <tier>` | Minimum acceptable tier: `Model`, `Gold`, `Silver`, `Bronze`, or `Lead`. Exits with code 1 if any dependency falls below. |
| `--fail-on-unrated` | Exit with code 1 if any dependency has an unrecognized license |
| `--summary` | Show condensed bar chart summary |
| `--exclude <packages>` | Comma-separated list of packages to skip |
| `--version` | Print version |
| `--help` | Print help |

## Output Formats

### Default Table

```
Blue Oak Audit: my-app@1.0.0
42 dependencies audited

Package          Version  License      Rating
──────────────────────────────────────────────
express          4.18.2   MIT          Silver  (direct)
debug            4.3.4    MIT          Silver
body-parser      1.20.2   MIT          Silver
ms               2.1.3    MIT          Silver
...

Summary:
  Silver   38 packages
  Bronze   3 packages
  Lead     1 package !!
```

### JSON (`--json`)

```json
{
  "project": { "name": "my-app", "version": "1.0.0" },
  "total": 42,
  "summary": {
    "Model": 0, "Gold": 2, "Silver": 38,
    "Bronze": 1, "Lead": 1, "Unrated": 0
  },
  "failures": [],
  "dependencies": [
    {
      "name": "express",
      "version": "4.18.2",
      "licenseDeclared": "MIT",
      "licenseNormalized": "MIT",
      "tier": "Silver",
      "isDirectDep": true
    }
  ]
}
```

### Summary (`--summary`)

```
Blue Oak Audit: my-app@1.0.0
42 dependencies audited

  Silver   38   ████████████████████████████████████████
  Bronze   3    ███
  Lead     1    █ !!
```

## Exit Codes

| Code | Meaning |
|------|---------|
| **0** | All dependencies meet the configured policy |
| **1** | Policy violations found (below `--min-rating` or unrated with `--fail-on-unrated`) |
| **2** | Runtime error (invalid arguments, missing `package.json`, no `node_modules`, etc.) |

## CI/CD Integration

### GitHub Actions

```yaml
name: License Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx blue-oak-audit --min-rating Silver --fail-on-unrated
```

### GitLab CI

```yaml
license-audit:
  image: node:20
  script:
    - npm ci
    - npx blue-oak-audit --min-rating Silver --fail-on-unrated
```

### Pre-commit Hook

```json
{
  "scripts": {
    "precommit": "blue-oak-audit --min-rating Silver --fail-on-unrated --direct"
  }
}
```

## SPDX Expression Handling

The tool understands compound SPDX license expressions:

- **OR** expressions (e.g., `MIT OR Apache-2.0`): Uses the **best** (highest-rated) tier
- **AND** expressions (e.g., `MIT AND GPL-3.0`): Uses the **worst** (lowest-rated) tier

Legacy `package.json` license formats are also supported:
- Object format: `{ "license": { "type": "MIT" } }`
- Array format: `{ "licenses": [{ "type": "MIT" }, { "type": "ISC" }] }` (treated as OR)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm test`
6. Submit a pull request

### Development

```bash
npm run dev          # Watch mode (rebuild on changes)
npm test             # Run tests
npm run test:watch   # Watch mode tests
npm run typecheck    # Type checking
```

## License

MIT
