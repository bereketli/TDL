import { ArrowUpRight, Images } from 'lucide-react';
import { projectImage, projectPhotoLabels, projectPhotoSets, studioImage, type Copy, type Language } from '@/lib/content';
import { localizedCopy, type Project, type Service } from '@/lib/site-content';
import { Media } from './Media';

export function Studio({ t, team, teamPhoto, catalogue }: { t: Copy; team: boolean; teamPhoto: string; catalogue: string }) {
  return <section className="catalogue-studio section-pad" id="studio">
    <div className="section-heading reveal"><div><span className="eyebrow">{t.aboutLabel}</span><h2>{t.aboutTitle}</h2></div>
      <div><p>{t.aboutText}</p><span className="micro">{t.toolsLabel}</span><p className="design-tools">{t.designTools}</p></div>
    </div>
    {team && <div className="craft-row"><div className="craft-photos reveal">
      {teamPhoto && <Media src={teamPhoto} alt={t.teamTitle} loading="lazy" sizes="(max-width:720px) 55vw, 30vw" />}
      <Media src={studioImage('sample')} alt={t.services[3]} loading="lazy" sizes="(max-width:720px) 45vw, 20vw" />
    </div><div className="reveal"><span className="eyebrow">TDL / THE DESIGN LAB</span><h3>{t.teamTitle}</h3><p>{t.teamText}</p>
    </div></div>}
    {catalogue && <a className="text-link studio-catalogue" href={catalogue} download>{t.catalogue}<ArrowUpRight size={19} /></a>}
  </section>;
}

export function Projects({ t, projects, language, onOpenPhotos }: {
  t: Copy; projects: Project[]; language: Language;
  onOpenPhotos: (title: string, photos: string[], index: number) => void;
}) {
  const { photo } = projectPhotoLabels[language];
  return <section id="work" className="catalogue-work section-pad">
    <div className="section-heading reveal"><div><span className="eyebrow">01 / {t.selected}</span><h2>{t.projectsTitle}</h2></div><p>{t.projectsText}</p></div>
    <div className="real-projects">{projects.map((entry, index) => {
      const project = { ...entry, ...localizedCopy(entry.text, language) };
      const facts = [[t.clientLabel, project.client], [t.locationLabel, project.location], [t.areaLabel, project.area], [t.yearLabel, project.year], ...(project.height ? [[t.heightLabel, project.height]] : [])].filter(([, value]) => value);
      const extraPhotos = projectPhotoSets[project.id] ?? [];
      const photos = [...new Set([...extraPhotos.map(projectImage), project.detailImage].filter(Boolean))];
      return <article className="real-project reveal" key={project.id} id={`project-${project.id}`}>
        <div className="real-project-photo"><Media src={project.image} alt={project.name} loading="lazy" /><span className="project-number">{String(index + 1).padStart(2, '0')}</span></div>
        <div className="real-project-body"><div className="project-title-row"><h3>{project.name}</h3><span className="micro">{project.year}</span></div><h4>{project.title}</h4><p className="project-description">{project.text}</p>
          <details><summary>{t.projectDetails}<ArrowUpRight size={18} />
            {extraPhotos.length > 0 && <span className="project-photo-count"><Images size={16} aria-hidden="true" />
              <span className="sr-only">{photo} </span>{photos.length}
            </span>}
          </summary>
            <dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            {extraPhotos.length > 0 ? <div className="project-photos">
              {photos.map((src, photoIndex) => <button type="button" key={src}
                aria-label={`${project.name}: ${photo} ${photoIndex + 1}`}
                onClick={() => onOpenPhotos(project.name, photos, photoIndex)}>
                <Media src={src} alt="" loading="lazy" sizes="(max-width: 720px) 45vw, 23vw" />
              </button>)}
            </div> : project.detailImage && <Media className="project-detail-photo" src={project.detailImage} alt={`${project.name} / ${t.projectDetails}`} loading="lazy" />}
          </details>
        </div>
      </article>;
    })}</div>
  </section>;
}

export function Expertise({ t, services, language, contact }: { t: Copy; services: Service[]; language: Language; contact: boolean }) {
  return <section className="expertise section-pad" id="expertise">
    <div className="section-heading reveal"><div><span className="eyebrow">03 / {t.expertise}</span><h2>{t.expertTitle}</h2></div><p>{t.expertIntro}</p></div>
    <div className="services">{services.map((service, index) => {
      const { title, description } = localizedCopy(service.text, language);
      return <article className="reveal" key={service.id}>
        {service.image && <Media className="service-photo" src={service.image} alt={title} loading="lazy" />}
        <span className="micro">{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{description}</p>
        {contact && <a href="#contact" aria-label={`${t.start}: ${title}`}><ArrowUpRight size={19} /></a>}
      </article>;
    })}</div>
  </section>;
}

export function Materials({ t, contact }: { t: Copy; contact: boolean }) {
  return <section className="materials"><div className="material-image reveal"><Media src={studioImage('coating')} alt={t.materials} loading="lazy" /></div>
    <div className="material-copy reveal"><span className="eyebrow">{t.materials}</span><h2>{t.materialTitle}</h2><p>{t.materialText}</p>
      <ul className="finish-points">{t.finishPoints.map(item => <li key={item}>{item}</li>)}</ul>
      {contact && <a href="#contact" className="text-link">{t.start}<ArrowUpRight size={19} /></a>}
    </div>
  </section>;
}

export function Applications({ t }: { t: Copy }) {
  return <section className="catalogue-applications section-pad"><div className="section-heading reveal"><div><span className="eyebrow">{t.applicationsLabel}</span><h2>{t.applicationsTitle}</h2></div><p>{t.applicationsText}</p></div>
    <div className="application-grid">{['hillside-detail', 'ceiling', 'signage'].map((image, index) => <article className="reveal" key={image}>
      <Media src={projectImage(image)} alt={t.applicationNames[index]} loading="lazy" sizes="(max-width:720px) 100vw, 33vw" /><h3>{t.applicationNames[index]}</h3>
    </article>)}</div>
  </section>;
}

export function Process({ t }: { t: Copy }) {
  return <section className="process section-pad"><span className="eyebrow reveal">04 / {t.process}</span><h2 className="reveal">{t.processTitle}</h2>
    <div className="steps">{t.steps.map((name, index) => <article className="reveal" key={index}><span>0{index + 1}</span><h3>{name}</h3><p>{t.stepDesc[index]}</p></article>)}</div>
  </section>;
}
