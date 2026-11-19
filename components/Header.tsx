'use client';
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Menu, Moon, Sun } from 'lucide-react';
import { languages, type Copy, type Language, type Theme } from '@/lib/content';
import { Media } from './Media';

export function Header({ t, language, theme, sections, onLanguageChange, onThemeChange }: {
  sections: { studio: boolean; work: boolean; comparisons: boolean; expertise: boolean; contact: boolean };
  t: Copy; language: Language; theme: Theme;
  onLanguageChange: (language: Language) => void; onThemeChange: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { id: 'studio', label: t.nav[0], visible: sections.studio },
    { id: 'work', label: t.nav[1], visible: sections.work },
    { id: 'before-after', label: t.comparison.title, visible: sections.comparisons },
    { id: 'expertise', label: t.nav[2], visible: sections.expertise },
    { id: 'contact', label: t.nav[3], visible: sections.contact },
  ].filter(link => link.visible);
  return <header className="site-header">
    <a className="brand" href="#home" aria-label="TDL The Design Lab">
      <Media src="/images/brand/tdl-logo.webp" alt="TDL The Design Lab Façades" sizes="(max-width: 860px) 125px, 175px" priority />
    </a>
    <nav id="main-navigation" className={menuOpen ? 'open' : ''} aria-label={t.menu}>
      {links.map(({ id, label }) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
    </nav>
    <div className="preferences">
      <label className="language"><span className="sr-only">{t.language}</span>
        <select value={language} onChange={event => onLanguageChange(event.target.value as Language)}>
          {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select><ChevronDown size={13} aria-hidden="true" />
      </label>
      <button type="button" className="icon theme-toggle" onClick={onThemeChange} aria-label={t.theme} aria-pressed={theme === 'dark'}>{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
      {sections.contact && <a href="#contact" className="button small header-cta">{t.start}<ArrowUpRight size={19} /></a>}
      {links.length > 0 && <button className="icon mobile-menu" aria-label={t.menu} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>}
    </div>
  </header>;
}
