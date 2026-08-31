import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'app/layout.tsx',
  'app/(public)/layout.tsx',
  'app/(public)/page.tsx',
  'app/(public)/[locale]/page.tsx',
  'app/base.css',
  'app/public.css',
  'components/public-shell.tsx',
  'lib/i18n.ts',
  'proxy.ts',
  'next.config.mjs',
  'tsconfig.json',
  'eslint.config.mjs',
  'next-env.d.ts',
  'package.json',
];

const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync('lib/i18n.ts')) {
  const i18n = readFileSync('lib/i18n.ts', 'utf8');
  const requiredSnippets = [
    "export const locales = ['en', 'ua', 'cz'] as const;",
    "export const prefixedLocales = ['ua', 'cz'] as const;",
    "href: '/'",
    "href: '/ua'",
    "href: '/cz'",
  ];

  for (const snippet of requiredSnippets) {
    if (!i18n.includes(snippet)) {
      errors.push(`i18n config missing required snippet: ${snippet}`);
    }
  }

  if (i18n.includes('/uk') || i18n.includes('/cs')) {
    errors.push('i18n config must not use /uk or /cs prefixes.');
  }
}

if (existsSync('components/public-shell.tsx')) {
  const shell = readFileSync('components/public-shell.tsx', 'utf8');
  if (/News|Blog/i.test(shell)) {
    errors.push('Release 1 public shell must not include News/Blog navigation.');
  }
}

if (existsSync('app/public.css')) {
  const css = readFileSync('app/public.css', 'utf8');
  if (!css.includes('oklch(')) {
    errors.push('Design tokens should use OKLCH colors.');
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const requiredScripts = {
    dev: 'next dev',
    build: 'next build',
    lint: 'eslint .',
    'verify:fef-001': 'node scripts/verify-fef-001.mjs',
  };

  for (const [name, command] of Object.entries(requiredScripts)) {
    if (pkg.scripts?.[name] !== command) {
      errors.push(`package.json must expose ${name}: ${command}`);
    }
  }
}

if (errors.length > 0) {
  console.error('FEF-001 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('FEF-001 verification passed.');
