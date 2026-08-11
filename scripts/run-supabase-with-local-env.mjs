import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const allowedVariables = ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_PASSWORD'];
const envFile = await readFile('.env.local', 'utf8');
const projectRef = (await readFile('supabase/.temp/project-ref', 'utf8')).trim();

function literalValue(name) {
  const line = envFile.split(/\r?\n/).find((candidate) => candidate.startsWith(`${name}=`));
  if (!line) return undefined;

  const raw = line.slice(name.length + 1).trim();
  if (
    raw.length >= 2
    && ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

const secureEnvironment = { ...process.env };
for (const name of allowedVariables) {
  const value = literalValue(name);
  if (!value) {
    console.error(`Missing ${name} in .env.local.`);
    process.exit(1);
  }
  secureEnvironment[name] = value;
}

const executable = path.resolve('node_modules/.bin/supabase');
const requestedArguments = process.argv.slice(2);
const usePooler = requestedArguments.includes('--pooler');
const argumentsWithoutWrapperFlags = requestedArguments.filter((argument) => argument !== '--pooler');
const password = secureEnvironment.SUPABASE_DB_PASSWORD;
const poolerUrl = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
const cliArguments = usePooler
  ? [...argumentsWithoutWrapperFlags.filter((argument) => argument !== '--linked'), '--db-url', poolerUrl]
  : argumentsWithoutWrapperFlags;

const child = spawn(executable, cliArguments, {
  cwd: process.cwd(),
  env: secureEnvironment,
  stdio: 'inherit',
});

child.on('error', () => {
  console.error('Failed to start the local Supabase CLI.');
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
