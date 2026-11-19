import type { Metadata } from 'next';
import { editorConfigured, hasEditorSession } from '@/lib/editor-auth';
import { readSite } from '@/lib/site-store';
import { Dashboard } from './Dashboard';
import { LoginForm } from './LoginForm';
import './admin.css';

export const metadata: Metadata = { title: 'Website editor | The Design Lab', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (await hasEditorSession()) return <Dashboard initialSite={await readSite()} />;

  return <main className="editor editor-login">
    <section className="editor-card">
      <p className="editor-brand">TDL / THE DESIGN LAB</p>
      <h1>Website editor</h1>
      {editorConfigured() ? <LoginForm /> : <p>Editing is disabled. Set <code>TDL_ADMIN_PASSWORD</code> to a password with at least 12 characters and restart the server.</p>}
      <a className="editor-link" href="/">Back to website</a>
    </section>
  </main>;
}
