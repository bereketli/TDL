'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { projectImage, projectPhotoLabels, studioImage, type Copy, type Language } from '@/lib/content';
import { Media } from './Media';

const categories = ['all', 'buildings', 'details', 'fabrication'] as const;
type Category = (typeof categories)[number];
const photos: { src: string; project?: 'mesob' | 'olkai'; category: Exclude<Category, 'all'> }[] = [
  { src: projectImage('mesob-cladding-elevation'), project: 'mesob', category: 'buildings' },
  { src: studioImage('metalwork-in-progress'), category: 'fabrication' },
  { src: projectImage('olkai-signed-frontage'), project: 'olkai', category: 'buildings' },
  { src: projectImage('mesob-screen-and-sky'), project: 'mesob', category: 'details' },
  { src: projectImage('olkai-perforated-corner'), project: 'olkai', category: 'details' },
  { src: projectImage('mesob-courtyard-flags'), project: 'mesob', category: 'buildings' },
  { src: projectImage('mesob-screen-joints'), project: 'mesob', category: 'details' },
  { src: projectImage('olkai-gold-frontage'), project: 'olkai', category: 'buildings' },
  { src: projectImage('mesob-screen-shade'), project: 'mesob', category: 'details' },
  { src: projectImage('olkai-walkway'), project: 'olkai', category: 'buildings' },
  { src: projectImage('mesob-entrance-flags'), project: 'mesob', category: 'buildings' },
];

export function Gallery({ t, language, onOpen }: {
  t: Copy; language: Language; onOpen: (title: string, photos: string[], index: number) => void;
}) {
  const [filter, setFilter] = useState<Category>('all');
  const shown = photos.filter(item => filter === 'all' || item.category === filter);
  const { photo } = projectPhotoLabels[language];

  return <section className="collection section-pad real-collection" aria-labelledby="collection-title">
    <div className="section-heading reveal">
      <div><span className="eyebrow">{t.gallery}</span><h2 id="collection-title">{t.galleryTitle}</h2></div>
      <p>{t.galleryDesc}</p>
    </div>
    <div className="collection-bar reveal">
      <h3>{t.browse}</h3>
      <div className="filters">
        {categories.map(category => <button key={category} type="button" aria-pressed={filter === category}
          onClick={() => setFilter(category)} className={filter === category ? 'active' : ''}>{t[category]}</button>)}
      </div>
    </div>
    <div className="photo-grid">
      {shown.map((item, index) => {
        const title = t.projectData.find(project => project.image === item.project)?.name ?? t.fabrication;
        const album = shown.filter(entry => entry.project === item.project).map(entry => entry.src);
        const wide = filter === 'all' && index === 0;
        return <button key={item.src} type="button" className={`study reveal${wide ? ' wide' : ''}`}
          aria-label={`${title}: ${photo} ${album.indexOf(item.src) + 1}`}
          onClick={() => onOpen(title, album, album.indexOf(item.src))}>
          <div className="study-image reveal-frame">
            <Media src={item.src} alt="" loading="lazy" sizes={wide ? '(max-width: 720px) 100vw, 66vw' : '(max-width: 720px) 50vw, 33vw'} />
            <span className="image-open" aria-hidden="true"><Plus size={18} /></span>
          </div>
          <span className="collection-caption reveal-caption">{title}</span>
        </button>;
      })}
    </div>
  </section>;
}
