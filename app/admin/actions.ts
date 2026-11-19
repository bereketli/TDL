'use server';

import { redirect } from 'next/navigation';
import { hasEditorSession, signInEditor, signOutEditor } from '@/lib/editor-auth';
import { saveSite, storeMedia, validateSite } from '@/lib/site-store';
import type { SiteContent } from '@/lib/site-content';

export async function login(_previous: string, data: FormData) {
  const password = data.get('password');
  const error = await signInEditor(typeof password === 'string' ? password : '');
  if (error) return error;
  redirect('/admin');
}

export async function logout() {
  await signOutEditor();
  redirect('/admin');
}

export async function publishChanges(content: SiteContent) {
  if (!(await hasEditorSession())) return { error: 'Your session expired. Sign in again in another tab, then retry.' };
  try {
    const error = await validateSite(content);
    if (error) return { error };
    const revision = await saveSite(content);
    if (revision === null) return { error: 'Another editor saved changes. Copy any unsaved text you need, then reload before editing again.' };
    return { revision };
  } catch (error) {
    console.error('Could not save website content', error);
    return { error: 'The changes could not be saved. Check that the content storage is writable.' };
  }
}

export async function uploadMedia(data: FormData) {
  if (!(await hasEditorSession())) return { error: 'Your session expired. Sign in again in another tab, then retry.' };
  const file = data.get('file');
  const kind = data.get('kind');
  if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024 || typeof kind !== 'string') {
    return { error: 'Choose a file up to 10 MB.' };
  }
  try {
    const url = await storeMedia(Buffer.from(await file.arrayBuffer()), kind);
    if (!url) return { error: kind === 'catalogue' ? 'Choose a PDF file.' : 'Choose a JPG, PNG or WebP image.' };
    return { url };
  } catch (error) {
    console.error('Could not store uploaded media', error);
    return { error: 'The upload failed. Check that the content storage is writable.' };
  }
}
