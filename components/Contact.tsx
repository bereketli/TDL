'use client';
import { ArrowUpRight } from 'lucide-react';
import type { Copy } from '@/lib/content';
import type { PublishedSite } from '@/lib/site-content';

export function Contact({ t, site, onPrepare }: { t: Copy; site: PublishedSite; onPrepare: (inquiry: string) => void }) {
  return <section className="contact section-pad"><div className="contact-copy reveal"><span className="eyebrow">{t.contact}</span><h2>{t.contactTitle}</h2><p>{t.contactText}</p>
    {site.phones.map((phone, index) => <a key={index} className={index ? 'phone secondary-phone' : 'phone'} href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone} <ArrowUpRight size={19} /></a>)}
    {site.catalogue && <a className="text-link catalogue-download" href={site.catalogue} download>{t.catalogue}<ArrowUpRight size={19} /></a>}
    <p className="micro catalogue-company">TDL Engineering PLC / The Design Lab</p><span className="micro">{t.location}</span>
    {t.socialHandle && <p className="social-handle">{t.socialHandle}</p>}
    {site.socials.length > 0 && <ul className="social-links">{site.socials.map(({ label, url }, index) =>
      <li key={index}><a className="text-link" href={url}>{label}<ArrowUpRight size={16} /></a></li>
    )}</ul>}
  </div>{site.visibility.inquiry && <form className="reveal" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); onPrepare(`${form.get('name')}\n${form.get('email')}\n\n${form.get('message')}`); }}>
    <label>{t.name}<input name="name" required autoComplete="name" maxLength={150} /></label>
    <label>{t.email}<input name="email" required type="email" autoComplete="email" maxLength={254} /></label>
    <label>{t.message}<textarea name="message" required rows={3} maxLength={5000} /></label>
    <button className="button" type="submit">{t.send}<ArrowUpRight size={19} /></button><p className="form-note">{t.formNote}</p>
  </form>}</section>;
}
