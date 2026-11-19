'use client';

import { useEffect, useId, useState, useTransition, type ChangeEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { languages, type Language } from '@/lib/content';
import { localize, projectFields, textFields, visibilityLabels, type Project, type Service, type SiteContent, type TextField } from '@/lib/site-content';
import { logout, publishChanges, uploadMedia } from './actions';

type Tab = keyof typeof textFields | 'Visibility';
type MediaPicker = (event: ChangeEvent<HTMLInputElement>, kind: 'image' | 'catalogue', update: (url: string) => void) => void;
const tabs: Tab[] = ['Homepage', 'Projects', 'Services', 'Company', 'Contact', 'Visibility'];

function Field({ label, value, onChange, multiline = false, type = 'text', maxLength = 5000 }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string; maxLength?: number;
}) {
  const id = useId();
  return <div className="editor-field"><label htmlFor={id}>{label}</label>
    {multiline
      ? <textarea id={id} rows={4} value={value} onChange={event => onChange(event.target.value)} maxLength={maxLength} />
      : <input id={id} type={type} value={value} onChange={event => onChange(event.target.value)} maxLength={maxLength} />}
  </div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="editor-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />{label}</label>;
}

function MediaField({ label, value, onChange, choose, kind = 'image' }: {
  label: string; value: string; onChange: (url: string) => void; choose: MediaPicker; kind?: 'image' | 'catalogue';
}) {
  return <div className="editor-media">
    {value && (kind === 'image'
      ? <img src={value} alt={label} loading="lazy" />
      : <a className="editor-link" href={value} download>Download current PDF</a>)}
    <label className="editor-field"><span><Upload size={15} /> {label}</span>
      <input type="file" accept={kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} onChange={event => choose(event, kind, onChange)} />
    </label>
    {value && <button type="button" onClick={() => onChange('')}>Remove file</button>}
  </div>;
}

function Entry({ name, index, length, visible, opened, toggle, move, remove, children }: {
  name: string; index: number; length: number; visible: boolean; opened: boolean;
  toggle: () => void; move: (direction: number) => void; remove: () => void; children: ReactNode;
}) {
  return <article className="editor-entry">
    <div className="editor-entry-bar">
      <button type="button" className="editor-entry-name" aria-expanded={opened} onClick={toggle}>
        {index + 1}. {name} <small>{visible ? 'Visible' : 'Hidden'}</small>
      </button>
      <div className="editor-entry-controls">
        <button type="button" aria-label={`Move ${name} up`} disabled={index === 0} onClick={() => move(-1)}><ArrowUp size={17} /></button>
        <button type="button" aria-label={`Move ${name} down`} disabled={index === length - 1} onClick={() => move(1)}><ArrowDown size={17} /></button>
        <button type="button" aria-label={`Remove ${name}`} onClick={() => {
          if (window.confirm(`Remove “${name}” when you publish?`)) remove();
        }}><Trash2 size={17} /></button>
      </div>
    </div>
    {opened && <div className="editor-entry-body">{children}</div>}
  </article>;
}

function newEntryId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
}

function reorder<T>(entries: T[], index: number, direction: number) {
  const next = [...entries];
  const target = index + direction;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function Dashboard({ initialSite }: { initialSite: SiteContent }) {
  const [site, setSite] = useState(initialSite);
  const [tab, setTab] = useState<Tab>('Homepage');
  const [language, setLanguage] = useState<Language>('en');
  const [open, setOpen] = useState('');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: '' });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function update(change: (current: SiteContent) => SiteContent) {
    setSite(change);
    setDirty(true);
    setStatus({ text: '' });
  }

  function patch(values: Partial<SiteContent>) {
    update(current => ({ ...current, ...values }));
  }

  function project(id: string, change: (entry: Project) => Project) {
    update(current => ({ ...current, projects: current.projects.map(item => item.id === id ? change(item) : item) }));
  }

  function service(id: string, change: (entry: Service) => Service) {
    update(current => ({ ...current, services: current.services.map(item => item.id === id ? change(item) : item) }));
  }

  const choose: MediaPicker = (event, kind, onChange) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ text: 'Choose a file up to 10 MB.', error: true });
      return;
    }
    const data = new FormData();
    data.set('file', file);
    data.set('kind', kind);
    startTransition(async () => {
      try {
        const result = await uploadMedia(data);
        if (result.url) {
          onChange(result.url);
          setStatus({ text: 'File uploaded. Publish changes to show it on the website.' });
        } else setStatus({ text: result.error ?? 'The request failed. Please try again.', error: true });
      } catch {
        setStatus({ text: 'The upload failed. Check your connection and try again.', error: true });
      }
    });
  };

  function publish() {
    startTransition(async () => {
      try {
        const result = await publishChanges(site);
        if (result.revision === undefined) {
          setStatus({ text: result.error ?? 'The request failed. Please try again.', error: true });
          return;
        }
        setSite(current => ({ ...current, revision: result.revision }));
        setDirty(false);
        setStatus({ text: 'Changes published.' });
      } catch {
        setStatus({ text: 'Publishing failed. Check your connection and try again.', error: true });
      }
    });
  }

  function addProject() {
    const id = newEntryId();
    patch({ projects: [...site.projects, {
      id, visible: false, featured: false, image: '', detailImage: '', year: '', area: '', height: '',
      text: localize(() => ({ name: '', client: '', location: '', title: '', text: '' })),
    }] });
    setOpen(id);
  }

  function addService() {
    const id = newEntryId();
    patch({ services: [...site.services, {
      id, visible: false, image: '', text: localize(() => ({ title: '', description: '' })),
    }] });
    setOpen(id);
  }

  const labels = tab === 'Visibility' ? [] : Object.entries(textFields[tab]) as [TextField, string][];
  return <main className="editor">
    <div className="editor-shell">
      <div className="editor-top">
        <div><p className="editor-brand">TDL / THE DESIGN LAB</p><h1>Website editor</h1></div>
        <div className="editor-actions">
          <a className="editor-link" href="/" target="_blank" rel="noreferrer">View website ↗</a>
          <form action={logout}><button type="submit" disabled={pending}>Sign out</button></form>
        </div>
      </div>
      <div className="editor-toolbar">
        <span className={status.error ? 'editor-error' : ''} role={status.error ? 'alert' : 'status'}>
          {pending ? 'Working…' : status.text || (dirty ? 'Unpublished changes' : 'All changes published')}
        </span>
        <button type="button" className="editor-primary" onClick={publish} disabled={!dirty || pending}>Publish changes</button>
      </div>
      <div className="editor-tabs" aria-label="Editor sections">
        {tabs.map(item => <button key={item} type="button" aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      <fieldset className="editor-card editor-panel" disabled={pending}>
        <div className="editor-panel-head">
          <h2>{tab}</h2>
          {tab !== 'Visibility' && <div className="editor-language"><label htmlFor="editor-language">Editing language</label>
            <select id="editor-language" value={language} onChange={event => setLanguage(event.target.value as Language)}>
              {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </div>}
        </div>
        {tab !== 'Visibility' && language !== 'en' && <p className="editor-help">Empty translation fields use the English text. Photos, ordering and visibility apply to all languages.</p>}
        {labels.length > 0 && <div className="editor-grid">{labels.map(([key, label]) =>
          <Field key={key} label={label} value={site.text[language][key]} multiline={/intro|text/i.test(key)}
            onChange={value => update(current => ({ ...current, text: { ...current.text, [language]: { ...current.text[language], [key]: value } } }))} />
        )}</div>}
        {tab === 'Visibility' && <div className="editor-visibility">
          {Object.entries(visibilityLabels).map(([key, label]) => {
            const section = key as keyof SiteContent['visibility'];
            return <Toggle key={key} label={label} checked={site.visibility[section]}
              onChange={checked => patch({ visibility: { ...site.visibility, [section]: checked } })} />;
          })}
        </div>}
        {tab === 'Homepage' && <div className="editor-subsection">
          <h3>Featured projects</h3>
          <p className="editor-help">The first visible featured project in Projects order supplies the main photo.</p>
          {site.projects.length === 0 && <p className="editor-help">Add a project in the Projects section first.</p>}
          {site.projects.map(item => <Toggle key={item.id} label={(item.text.en.name || 'Untitled project') + (item.visible ? '' : ' (hidden)')}
            checked={item.featured} onChange={featured => project(item.id, entry => ({ ...entry, featured }))} />)}
        </div>}
        {tab === 'Projects' && <div className="editor-subsection">
          <div className="editor-list-head"><h3>Project list</h3><button type="button" onClick={addProject} disabled={site.projects.length >= 100}><Plus size={16} /> Add project</button></div>
          {site.projects.map((item, index) => <Entry key={item.id} name={item.text[language].name || item.text.en.name || 'Untitled project'}
            index={index} length={site.projects.length} visible={item.visible} opened={open === item.id} toggle={() => setOpen(open === item.id ? '' : item.id)}
            move={direction => patch({ projects: reorder(site.projects, index, direction) })}
            remove={() => patch({ projects: site.projects.filter(entry => entry.id !== item.id) })}>
            <div className="editor-toggles">
              <Toggle label="Show on website" checked={item.visible} onChange={visible => project(item.id, entry => ({ ...entry, visible }))} />
              <Toggle label="Feature on homepage" checked={item.featured} onChange={featured => project(item.id, entry => ({ ...entry, featured }))} />
            </div>
            <div className="editor-grid">
              {Object.entries(projectFields).map(([key, label]) => {
                const field = key as keyof typeof projectFields;
                return <Field key={key} label={label} value={item.text[language][field]} multiline={field === 'text'}
                  onChange={value => project(item.id, entry => ({ ...entry, text: { ...entry.text, [language]: { ...entry.text[language], [field]: value } } }))} />;
              })}
              {(['year', 'area', 'height'] as const).map(key => <Field key={key} label={key[0].toUpperCase() + key.slice(1)} value={item[key]} maxLength={80}
                onChange={value => project(item.id, entry => ({ ...entry, [key]: value }))} />)}
              <MediaField label="Main photo" value={item.image} choose={choose} onChange={image => project(item.id, entry => ({ ...entry, image }))} />
              <MediaField label="Detail photo" value={item.detailImage} choose={choose} onChange={detailImage => project(item.id, entry => ({ ...entry, detailImage }))} />
            </div>
          </Entry>)}
        </div>}
        {tab === 'Services' && <div className="editor-subsection">
          <div className="editor-list-head"><h3>Service list</h3><button type="button" onClick={addService} disabled={site.services.length >= 100}><Plus size={16} /> Add service</button></div>
          {site.services.map((item, index) => <Entry key={item.id} name={item.text[language].title || item.text.en.title || 'Untitled service'}
            index={index} length={site.services.length} visible={item.visible} opened={open === item.id} toggle={() => setOpen(open === item.id ? '' : item.id)}
            move={direction => patch({ services: reorder(site.services, index, direction) })}
            remove={() => patch({ services: site.services.filter(entry => entry.id !== item.id) })}>
            <Toggle label="Show on website" checked={item.visible} onChange={visible => service(item.id, entry => ({ ...entry, visible }))} />
            <div className="editor-grid">
              {(['title', 'description'] as const).map(key => <Field key={key} label={key === 'title' ? 'Service title' : 'Description'}
                value={item.text[language][key]} multiline={key === 'description'}
                onChange={value => service(item.id, entry => ({ ...entry, text: { ...entry.text, [language]: { ...entry.text[language], [key]: value } } }))} />)}
              <MediaField label="Service photo" value={item.image} choose={choose} onChange={image => service(item.id, entry => ({ ...entry, image }))} />
            </div>
          </Entry>)}
        </div>}
        {tab === 'Company' && <div className="editor-subsection editor-grid">
          <MediaField label="Team photo" value={site.teamPhoto} choose={choose} onChange={teamPhoto => patch({ teamPhoto })} />
          <MediaField label="Catalogue PDF" value={site.catalogue} choose={choose} kind="catalogue" onChange={catalogue => patch({ catalogue })} />
        </div>}
        {tab === 'Contact' && <div className="editor-subsection">
          <div className="editor-list-head"><h3>Phone numbers</h3><button type="button" disabled={site.phones.length >= 10}
            onClick={() => patch({ phones: [...site.phones, ''] })}><Plus size={16} /> Add phone</button></div>
          {site.phones.map((phone, index) => <div className="editor-contact-row" key={index}>
            <Field label={`Phone ${index + 1}`} type="tel" maxLength={40} value={phone} onChange={value => patch({ phones: site.phones.map((item, i) => i === index ? value : item) })} />
            <button type="button" onClick={() => patch({ phones: site.phones.filter((_, i) => i !== index) })}>Remove</button>
          </div>)}
          <div className="editor-list-head"><h3>Social links</h3><button type="button" disabled={site.socials.length >= 10}
            onClick={() => patch({ socials: [...site.socials, { label: '', url: '' }] })}><Plus size={16} /> Add link</button></div>
          {site.socials.map((link, index) => <div className="editor-contact-row" key={index}>
            <Field label="Link label" maxLength={80} value={link.label} onChange={label => patch({ socials: site.socials.map((item, i) => i === index ? { ...item, label } : item) })} />
            <Field label="HTTPS URL" type="url" maxLength={2048} value={link.url} onChange={url => patch({ socials: site.socials.map((item, i) => i === index ? { ...item, url } : item) })} />
            <button type="button" onClick={() => patch({ socials: site.socials.filter((_, i) => i !== index) })}>Remove</button>
          </div>)}
        </div>}
      </fieldset>
    </div>
  </main>;
}
