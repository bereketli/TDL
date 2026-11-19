import Website from '@/components/Website';
import { publishSite } from '@/lib/site-content';
import { readSite } from '@/lib/site-store';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <Website site={publishSite(await readSite())} />;
}
