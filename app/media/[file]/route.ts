import { hasEditorSession } from '@/lib/editor-auth';
import { publishSite } from '@/lib/site-content';
import { readMedia, readSite } from '@/lib/site-store';

const types: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const type = types[file.split('.').pop() ?? ''];
  const missing = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (!type) return missing();

  if (!(await hasEditorSession())) {
    const site = publishSite(await readSite());
    const url = `/media/${file}`;
    const projectUsesFile = site.projects.some(project => project.image === url || (site.visibility.projects && project.detailImage === url));
    if (site.teamPhoto !== url && site.catalogue !== url && !projectUsesFile && !site.services.some(service => service.image === url)) return missing();
  }

  const bytes = await readMedia(file);
  if (!bytes) return missing();
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (type === 'application/pdf') headers['Content-Disposition'] = 'attachment; filename="tdl-catalogue.pdf"';
  return new Response(new Uint8Array(bytes), { headers });
}
