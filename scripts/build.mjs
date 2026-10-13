import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const routes = {
  'index.html': '',
  'subscription.html': 'subscription',
  'reseller.html': 'reseller',
  'panel.html': 'panel',
  'server-network.html': 'server-network',
  'setup-guide.html': 'setup-guide',
  'downloads.html': 'downloads',
  'contact.html': 'contact',
  'faq.html': 'faq'
};

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await cp('src/assets', 'dist/assets', { recursive: true });

for (const [file, route] of Object.entries(routes)) {
  const directory = route ? join('dist', route) : 'dist';
  await mkdir(directory, { recursive: true });
  const assetPrefix = route ? '../assets/' : 'assets/';
  const html = (await readFile(join('src/pages', file), 'utf8'))
    .replaceAll('href="/assets/', `href="${assetPrefix}`)
    .replaceAll('src="/assets/', `src="${assetPrefix}`);
  await writeFile(join(directory, 'index.html'), html);
}

const notFound = (await readFile('src/pages/404.html', 'utf8'))
  .replaceAll('href="/assets/', 'href="assets/')
  .replaceAll('src="/assets/', 'src="assets/');
await writeFile('dist/404.html', notFound);
await cp('src/robots.txt', 'dist/robots.txt');
await cp('src/sitemap.xml', 'dist/sitemap.xml');
console.log(`Built ${Object.keys(routes).length} indexable directory routes.`);
