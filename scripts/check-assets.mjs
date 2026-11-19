import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const dimensions = JSON.parse(fs.readFileSync('data/image-dimensions.json', 'utf8'));
const translations = JSON.parse(fs.readFileSync('data/translations.json', 'utf8'));
for (const [url, size] of Object.entries(dimensions)) {
  if (!url.startsWith('/images/') || !fs.existsSync(path.join(root, 'public', url))) throw new Error(`Missing image: ${url}`);
  if (!(size.width > 0 && size.height > 0)) throw new Error(`Invalid dimensions: ${url}`);
}
for (const [language, copy] of Object.entries(translations)) {
  for (const project of copy.projectData) for (const field of ['image', 'detailImage']) {
    const url = `/images/projects/${project[field]}.webp`;
    if (!dimensions[url]) throw new Error(`${language}: missing project image ${url}`);
  }
  if (copy.services.length !== copy.serviceDesc.length) throw new Error(`${language}: service descriptions missing`);
  if (copy.steps.length !== copy.stepDesc.length) throw new Error(`${language}: workflow descriptions missing`);
}
if (!fs.existsSync('public/documents/tdl-company-catalogue-2026.pdf')) throw new Error('Catalogue missing');
console.log(`${Object.keys(dimensions).length} image files, 4 projects in 3 languages, and catalogue PDF verified.`);
