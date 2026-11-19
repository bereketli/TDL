import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import dimensions from '@/data/image-dimensions.json';
import { catalogueUrl } from './content';
import { defaultSite, languageCodes, projectFields, visibilityLabels, type SiteContent } from './site-content';

function directory() {
  const configured = process.env.TDL_CONTENT_DIR;
  // Content is supplied by writable runtime storage, outside the build artifact.
  return configured ? path.resolve(/*turbopackIgnore: true*/ configured) : path.join(process.cwd(), '.tdl-content');
}
const mediaDirectory = () => path.join(directory(), 'media');
const contentFile = () => path.join(directory(), 'site.json');
const mediaPattern = /^[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/;
let pending = Promise.resolve();

export async function readSite(): Promise<SiteContent> {
  try {
    const site: SiteContent = JSON.parse(await readFile(contentFile(), 'utf8'));
    return { ...site, visibility: { ...defaultSite.visibility, ...site.visibility } };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return defaultSite;
    throw error;
  }
}

function validText(value: unknown, max = 5000): value is string {
  return typeof value === 'string' && value.length <= max;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function fields(value: unknown, keys: string[], test: (value: unknown) => boolean) {
  return record(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key) && test(value[key]));
}

function localized(value: unknown, keys: string[]) {
  return fields(value, languageCodes, item => fields(item, keys, field => validText(field)));
}

function mediaName(url: string) {
  const prefix = '/media/';
  return url.startsWith(prefix) && mediaPattern.test(url.slice(prefix.length)) ? url.slice(prefix.length) : '';
}

function image(value: unknown, optional = false) {
  return typeof value === 'string' && (
    (optional && value === '') || Object.hasOwn(dimensions, value) || /\.(jpg|png|webp)$/.test(mediaName(value))
  );
}

function socialLink(value: unknown) {
  if (!validText(value, 2048)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function item(value: unknown): value is Record<string, unknown> {
  return record(value) && validText(value.id, 80) && /^[\w-]+$/.test(value.id) && typeof value.visible === 'boolean';
}

export async function validateSite(input: unknown): Promise<string> {
  if (!record(input) || !Number.isSafeInteger(input.revision) ||
      !fields(input.visibility, Object.keys(visibilityLabels), value => typeof value === 'boolean') ||
      !localized(input.text, Object.keys(defaultSite.text.en))) return 'Some page fields are invalid or too long.';

  const { projects, services, teamPhoto, catalogue, phones, socials } = input;
  if (!Array.isArray(projects) || projects.length > 100 || !projects.every(project =>
    item(project) && typeof project.featured === 'boolean' &&
    ['year', 'area', 'height'].every(key => validText(project[key], 80)) &&
    image(project.image, !project.visible) && image(project.detailImage, true) &&
    localized(project.text, Object.keys(projectFields)) &&
    (!project.visible || (record(project.text) && record(project.text.en) && typeof project.text.en.name === 'string' && project.text.en.name.trim()))
  )) return 'Visible projects need an English name and main photo. Check project fields and the 100 project limit.';

  if (!Array.isArray(services) || services.length > 100 || !services.every(service =>
    item(service) && image(service.image, true) && localized(service.text, ['title', 'description']) &&
    (!service.visible || (record(service.text) && record(service.text.en) && typeof service.text.en.title === 'string' && service.text.en.title.trim()))
  )) return 'Visible services need an English title. Check service fields and the 100 service limit.';

  if ([projects, services].some(items => new Set(items.map(({ id }) => id)).size !== items.length)) return 'Some entries have duplicate identifiers. Reload and try again.';
  if (!image(teamPhoto, true) || typeof catalogue !== 'string' || (catalogue !== '' && catalogue !== catalogueUrl && !mediaName(catalogue).endsWith('.pdf'))) return 'Choose a supported team photo and a PDF catalogue.';
  if (!Array.isArray(phones) || phones.length > 10 || !phones.every(phone => validText(phone, 40) && /^\+?[\d ().-]+$/.test(phone) && phone.replace(/\D/g, '').length >= 5)) return 'Enter valid phone numbers, up to 10.';
  if (!Array.isArray(socials) || socials.length > 10 || !socials.every(link => record(link) && validText(link.label, 80) && link.label.trim() && socialLink(link.url))) return 'Enter a label and HTTPS URL for each social link, up to 10.';

  const files = new Set([teamPhoto, catalogue, ...projects.flatMap(project => [project.image, project.detailImage]), ...services.map(service => service.image)].map(mediaName).filter(Boolean));
  for (const file of files) {
    try {
      if (!(await stat(path.join(mediaDirectory(), file))).isFile()) return 'An uploaded file is missing. Upload it again.';
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'An uploaded file is missing. Upload it again.';
      throw error;
    }
  }
  return '';
}

export async function saveSite(site: SiteContent) {
  const operation = pending.then(async () => {
    const current = await readSite();
    if (site.revision !== current.revision) return null;
    const next = { ...site, revision: site.revision + 1 };
    await mkdir(directory(), { recursive: true, mode: 0o700 });
    const temporary = path.join(directory(), `site-${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
      await rename(temporary, contentFile());
    } finally {
      await unlink(temporary).catch(() => {});
    }
    return next.revision;
  });
  pending = operation.then(() => {}, () => {});
  return operation;
}

export async function storeMedia(bytes: Buffer, kind: string) {
  const prefix = (offset: number, length: number) => bytes.subarray(offset, offset + length).toString('ascii');
  let extension = '';
  if (kind === 'catalogue' && prefix(0, 5) === '%PDF-') extension = 'pdf';
  if (kind === 'image') {
    if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) extension = 'jpg';
    else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = 'png';
    else if (prefix(0, 4) === 'RIFF' && prefix(8, 4) === 'WEBP') extension = 'webp';
  }
  if (!extension) return '';
  await mkdir(mediaDirectory(), { recursive: true, mode: 0o700 });
  const file = `${randomUUID()}.${extension}`;
  await writeFile(path.join(mediaDirectory(), file), bytes, { flag: 'wx', mode: 0o600 });
  return `/media/${file}`;
}

export async function readMedia(file: string) {
  if (!mediaPattern.test(file)) return null;
  try {
    return await readFile(path.join(mediaDirectory(), file));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
