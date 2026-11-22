'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { defaultTheme, type Language, type Theme } from '@/lib/content';
import { localizedCopy, siteCopy, type PublishedSite } from '@/lib/site-content';
import { Header } from './Header';
import { HeroVideo } from './HeroVideo';
import { Media } from './Media';
import { Studio, Projects, Expertise, Materials, Applications, Process } from './CatalogueSections';
import { Gallery } from './Gallery';
import { getProjectComparisons, ProjectComparisons } from './ProjectComparisons';
import { Contact } from './Contact';
import { ViewerDialog, type ModalState } from './ViewerDialog';
import { ScrollSection } from './ScrollSection';
import { useScrollReveals } from './useScrollReveals';

export default function Website({ site }: { site: PublishedSite }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>(defaultTheme);
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
  useScrollReveals();
  return <>
    <a className="skip-link" href="#main-content">{language === 'am' ? 'ወደ ዋናው ይዘት' : language === 'om' ? 'Gara qabiyyee ijoo' : 'Skip to content'}</a>
    <Header sections={{ studio: visibility.company, work, comparisons: comparisons.length > 0, expertise, contact: visibility.contact }} t={t} language={language} theme={theme} onLanguageChange={setLanguage} onThemeChange={() => setTheme(current => current === 'light' ? 'dark' : 'light')} />
    <main id="main-content">
      <div id="home">
        {visibility.homepage && <section className="hero">
          <div className="hero-copy">
            <HeroVideo playLabel={t.playBackgroundVideo} pauseLabel={t.pauseBackgroundVideo} />
            <div className="eyebrow">{t.eyebrow}</div>
            <h1><span className="hero-title-line"><span>{t.title[0]}</span></span>{' '}
              <span className="hero-title-line"><em>{t.title[1]}</em></span></h1>
            <div className="intro-row"><div>
              <p className="lead">{t.intro}<span className="hero-intro-extended">{' '}{t.introExtended}</span></p>
              {t.intro2 && <p>{t.intro2}</p>}
              {work && <a className="text-link" href="#work">{t.explore}<ArrowRight size={23} /></a>}
            </div><span className="hero-side">THE DESIGN LAB<br />FORM / LIGHT / IDENTITY</span></div>
          </div>
          {heroProject && <ScrollSection><div className="hero-image reveal"><Media src={heroProject.image} className="reveal-frame" alt={localizedCopy(heroProject.text, language).name} sizes="100vw" priority />
            <span className="image-caption">TDL / 3D FAÇADES</span>
            {work && <a className="scroll-pill" href={`#project-${heroProject.id}`}>{t.scroll}<ArrowRight size={16} /></a>}
          </div></ScrollSection>}
          {otherFeatured.length > 0 && <ScrollSection><div className="featured-projects section-pad">{otherFeatured.map(project => {
            const { name } = localizedCopy(project.text, language);
            const preview = <><Media src={project.image} className="reveal-frame" alt={name} loading="lazy" /><h3 className="reveal-caption">{name}</h3></>;
            return work ? <a key={project.id} className="reveal" href={`#project-${project.id}`}>{preview}</a> : <article key={project.id} className="reveal">{preview}</article>;
          })}</div></ScrollSection>}
        </section>}
        {visibility.extra && t.extraText && <ScrollSection><section className="homepage-content section-pad reveal">
          {t.extraTitle && <h2>{t.extraTitle}</h2>}<p>{t.extraText}</p>
        </section></ScrollSection>}
      </div>
      {visibility.company && <ScrollSection id="studio"><Studio t={t} team={visibility.team}
        teamPhoto={site.teamPhoto} catalogue={site.catalogue} /></ScrollSection>}
      {work && <ScrollSection id="work"><Projects t={t} projects={site.projects} language={language}
        onOpenPhotos={openPhotos} /></ScrollSection>}
      {comparisons.length > 0 && <ScrollSection id="before-after">
        <ProjectComparisons comparisons={comparisons} copy={t.comparison} />
      </ScrollSection>}
      {visibility.gallery && <ScrollSection><Gallery t={t} language={language} onOpen={openPhotos} /></ScrollSection>}
      {expertise && <ScrollSection id="expertise">
        <Expertise t={t} services={site.services} language={language} contact={visibility.contact} />
      </ScrollSection>}
      {visibility.materials && <ScrollSection><Materials t={t} contact={visibility.contact} /></ScrollSection>}
      {visibility.applications && <ScrollSection><Applications t={t} /></ScrollSection>}
      {visibility.process && <ScrollSection><Process t={t} /></ScrollSection>}
      {visibility.contact && <ScrollSection id="contact">
        <Contact t={t} site={site} onPrepare={text => setModal({ kind: 'inquiry', text })} />
      </ScrollSection>}
    </main>
    <footer className="reveal"><span>TDL / THE DESIGN LAB</span><span>{t.footer}</span><a href="#home">{t.location}<ArrowUpRight size={15} /></a></footer>
    <ViewerDialog key={modal?.kind === 'inquiry' ? modal.text : 'image-viewer'} t={t} language={language} modal={modal}
      onClose={() => setModal(null)} onNavigate={direction => setModal(current => {
        if (!current || current.kind === 'inquiry') return current;
        const count = current.photos.length;
        return { ...current, index: (current.index + direction + count) % count };
      })} />
  </>;
}
