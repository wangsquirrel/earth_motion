import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

async function findTestModules(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedModules = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findTestModules(absolutePath);
    }
    return entry.isFile() && entry.name.endsWith('.test.ts') ? [absolutePath] : [];
  }));
  return nestedModules.flat();
}

// Use the project's existing TypeScript/Vite transform, without adding a test framework.
const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});
try {
  const testsRoot = path.resolve('tests');
  const testModules = (await findTestModules(testsRoot)).sort();
  if (testModules.length === 0) {
    throw new Error('No tests/**/*.test.ts modules found');
  }
  for (const testModule of testModules) {
    const relativePath = path.relative(process.cwd(), testModule).split(path.sep).join('/');
    await server.ssrLoadModule(`/${relativePath}`);
  }
} finally {
  await server.close();
}
