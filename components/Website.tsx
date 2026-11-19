'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { type Language, type Theme } from '@/lib/content';
import { localizedCopy, siteCopy, type PublishedSite } from '@/lib/site-content';
import { Header } from './Header';
import { Media } from './Media';
import { Studio, Projects, Expertise, Materials, Applications, Process } from './CatalogueSections';
import { Gallery } from './Gallery';
import { getProjectComparisons, ProjectComparisons } from './ProjectComparisons';
import { Contact } from './Contact';
import { ViewerDialog, type ModalState } from './ViewerDialog';

export default function Website({ site }: { site: PublishedSite }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const t = siteCopy(site, language);
  const { visibility } = site;
  const work = visibility.projects && site.projects.length > 0;
  const comparisons = work && visibility.comparisons ? getProjectComparisons(site.projects, language) : [];
  const expertise = visibility.services && site.services.length > 0;
  const featured = visibility.featured ? site.projects.filter(project => project.featured) : [];
  const [heroProject, ...otherFeatured] = featured;
  function openPhotos(title: string, photos: string[], index: number) {
    setModal({ kind: 'project', title, photos, index });
  }
  // Match the server-rendered defaults first, then restore browser preferences.
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('tdl-language');
      const savedTheme = localStorage.getItem('tdl-theme');
      if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'om') setLanguage(savedLanguage);
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    } catch { /* The controls still work when browser storage is unavailable. */ }
    setPreferencesReady(true);
  }, []);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('tdl-language', language); localStorage.setItem('tdl-theme', theme); } catch { /* Memory-only preferences are sufficient. */ }
  }, [language, theme, preferencesReady]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px 28px 0px' });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return <>
    <a className="skip-link" href="#main-content">{language === 'am' ? 'ወደ ዋናው ይዘት' : language === 'om' ? 'Gara qabiyyee ijoo' : 'Skip to content'}</a>
    <Header sections={{ studio: visibility.company, work, comparisons: comparisons.length > 0, expertise, contact: visibility.contact }} t={t} language={language} theme={theme} onLanguageChange={setLanguage} onThemeChange={() => setTheme(current => current === 'light' ? 'dark' : 'light')} />
    <main id="main-content">
      <div id="home">
        {visibility.homepage && <section className="hero">
          <div className="hero-copy"><div className="eyebrow">{t.eyebrow}</div>
            <h1><span className="hero-title-line"><span>{t.title[0]}</span></span>{' '}
              <span className="hero-title-line"><em>{t.title[1]}</em></span></h1>
            <div className="intro-row"><div><p className="lead">{t.intro}</p><p>{t.intro2}</p>
              {work && <a className="text-link" href="#work">{t.explore}<ArrowRight size={23} /></a>}
            </div><span className="hero-side">THE DESIGN LAB<br />FORM / LIGHT / IDENTITY</span></div>
          </div>
          {heroProject && <div className="hero-image"><Media src={heroProject.image} alt={localizedCopy(heroProject.text, language).name} sizes="100vw" priority />
            <span className="image-caption">TDL / 3D FAÇADES</span>
            {work && <a className="scroll-pill" href={`#project-${heroProject.id}`}>{t.scroll}<ArrowRight size={16} /></a>}
          </div>}
          {otherFeatured.length > 0 && <div className="featured-projects section-pad">{otherFeatured.map(project => {
            const { name } = localizedCopy(project.text, language);
            const preview = <><Media src={project.image} alt={name} loading="lazy" /><h3>{name}</h3></>;
            return work ? <a key={project.id} className="reveal" href={`#project-${project.id}`}>{preview}</a> : <article key={project.id} className="reveal">{preview}</article>;
          })}</div>}
        </section>}
        {visibility.extra && t.extraText && <section className="homepage-content section-pad reveal">
          {t.extraTitle && <h2>{t.extraTitle}</h2>}<p>{t.extraText}</p>
        </section>}
      </div>
      {visibility.company && <Studio t={t} team={visibility.team} teamPhoto={site.teamPhoto} catalogue={site.catalogue} />}
      {work && <Projects t={t} projects={site.projects} language={language}
        onOpenPhotos={openPhotos} />}
      {comparisons.length > 0 && <ProjectComparisons comparisons={comparisons} copy={t.comparison} />}
      {visibility.gallery && <Gallery t={t} language={language} onOpen={openPhotos} />}
      {expertise && <Expertise t={t} services={site.services} language={language} contact={visibility.contact} />}
      {visibility.materials && <Materials t={t} contact={visibility.contact} />}
      {visibility.applications && <Applications t={t} />}
      {visibility.process && <Process t={t} />}
      {visibility.contact && <Contact t={t} site={site} onPrepare={text => setModal({ kind: 'inquiry', text })} />}
    </main>
    <footer><span>TDL / THE DESIGN LAB</span><span>{t.footer}</span><a href="#home">{t.location}<ArrowUpRight size={15} /></a></footer>
    <ViewerDialog key={modal?.kind === 'inquiry' ? modal.text : 'image-viewer'} t={t} language={language} modal={modal}
      onClose={() => setModal(null)} onNavigate={direction => setModal(current => {
        if (!current || current.kind === 'inquiry') return current;
        const count = current.photos.length;
        return { ...current, index: (current.index + direction + count) % count };
      })} />
  </>;
}
