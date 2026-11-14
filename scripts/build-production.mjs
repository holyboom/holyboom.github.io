import { lstat, readFile, readdir, realpath, mkdtemp, mkdir, writeFile, rm, rename } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Copy only reviewed public resources. Runtime code and asset bytes are not transformed.
const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const manifest = JSON.parse(await readFile(join(root, 'publish-manifest.json'), 'utf8'));
if (manifest.version !== 1 || manifest.outputDirectory !== 'dist') {
  throw new Error('Expected publish-manifest version 1 and the derived output directory "dist".');
}
for (const key of ['files', 'assetDirectories', 'retainedNotices']) {
  if (!Array.isArray(manifest[key])) throw new Error(`Missing manifest array: ${key}`);
}

const notices = new Set(manifest.retainedNotices);
const selected = new Set();
const forbiddenRoots = new Set(['docs', 'scripts', 'qa', 'node_modules', 'dist']);
const allowedExtensions = new Set([
  '.html', '.css', '.js', '.json', '.xml', '.txt', '.png', '.webp', '.svg',
  '.jpg', '.jpeg', '.avif', '.gif', '.woff', '.woff2', '.pcm', '.wav', '.mp3',
  '.ogg', '.m4a', '.mid', '.ly'
]);

function validatePath(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.startsWith('/')) {
    throw new Error(`Invalid public path: ${JSON.stringify(path)}`);
  }
  const parts = path.split('/');
  if (parts.some(part => !part || part === '..' || (part.startsWith('.') && path !== '.nojekyll'))) {
    throw new Error(`Hidden or relative path is not publishable: ${path}`);
  }
  if (forbiddenRoots.has(parts[0]) || /\.map$/i.test(path)) {
    throw new Error(`Development material is not publishable: ${path}`);
  }
  return path;
}

async function checkedSource(path, expectedType) {
  validatePath(path);
  let absolute = root;
  for (const part of path.split('/')) {
    absolute = join(absolute, part);
    const info = await lstat(absolute).catch(error => {
      throw new Error(`Missing publish resource: ${path}`, { cause: error });
    });
    if (info.isSymbolicLink()) throw new Error(`Symlinks are not publishable: ${path}`);
  }
  const physical = await realpath(absolute);
  if (!physical.startsWith(root + sep)) throw new Error(`Resource leaves project root: ${path}`);
  const info = await lstat(physical);
  if (expectedType === 'file' ? !info.isFile() : !info.isDirectory()) {
    throw new Error(`Expected ${expectedType} in publish manifest: ${path}`);
  }
  return physical;
}

function selectFile(path) {
  validatePath(path);
  if (path !== '.nojekyll' && !allowedExtensions.has(extname(path).toLowerCase()) && !notices.has(path)) {
    throw new Error(`File type is not publishable without a retained-notice entry: ${path}`);
  }
  if (selected.has(path)) throw new Error(`Duplicate publish resource: ${path}`);
  selected.add(path);
}

for (const path of manifest.files) selectFile(path);
for (const path of manifest.retainedNotices) {
  if (typeof path !== 'string' || !path.startsWith('assets/')) {
    throw new Error('Retained notices must be explicit paths under assets/.');
  }
  selectFile(path);
}
for (const entry of manifest.assetDirectories) {
  if (!entry || typeof entry.path !== 'string' || !entry.path.startsWith('assets/') ||
      !Array.isArray(entry.extensions) || !entry.extensions.length ||
      entry.extensions.some(extension => !['.webp', '.png', '.svg', '.jpg', '.jpeg', '.avif', '.woff2'].includes(extension))) {
    throw new Error('Asset directories require an assets/ path and narrowly allowed image/font extensions.');
  }
  const directory = await checkedSource(entry.path, 'directory');
  let count = 0;
  for (const child of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (child.isSymbolicLink()) throw new Error(`Symlinks are not publishable: ${entry.path}/${child.name}`);
    // Deliberately non-recursive: new subdirectories and master assets need separate review.
    if (!child.isFile() || child.name.startsWith('.') || !entry.extensions.includes(extname(child.name).toLowerCase())) continue;
    selectFile(`${entry.path}/${child.name}`);
    count++;
  }
  if (!count) throw new Error(`No publishable assets found in ${entry.path}`);
}

// Read and validate every source before replacing any previous build.
const resources = [];
for (const path of [...selected].sort()) {
  const bytes = await readFile(await checkedSource(path, 'file'));
  if (['.js', '.css'].includes(extname(path).toLowerCase()) &&
      /(?:\/\/|\/\*)\s*[@#]\s*sourceMappingURL\s*=/.test(bytes.toString('utf8'))) {
    throw new Error(`Public source-map directive is not allowed: ${path}`);
  }
  resources.push({ path, bytes });
}

const output = join(root, manifest.outputDirectory);
const currentOutput = await lstat(output).catch(error => {
  if (error.code === 'ENOENT') return undefined;
  throw error;
});
if (currentOutput && (!currentOutput.isDirectory() || currentOutput.isSymbolicLink())) {
  throw new Error('Refusing to replace dist because it is not a regular directory.');
}
const staging = await mkdtemp(join(root, '.dist-build-'));
try {
  for (const { path, bytes } of resources) {
    const destination = join(staging, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  throw error;
}
console.log(JSON.stringify({
  output: 'dist',
  files: resources.length,
  bytes: resources.reduce((sum, resource) => sum + resource.bytes.length, 0),
  transformedFiles: 0,
  deploymentChanged: false
}, null, 2));
