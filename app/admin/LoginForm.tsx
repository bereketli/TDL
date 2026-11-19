'use client';

import { useActionState } from 'react';
import { login } from './actions';

export function LoginForm() {
  const [error, action, pending] = useActionState(login, '');
  return <form action={action} className="editor-login-form">
    <label>Password<input type="password" name="password" autoComplete="current-password" required maxLength={1024} /></label>
    {error && <p role="alert" className="editor-error">{error}</p>}
    <button className="editor-primary" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}
