import { catalogueUrl, getCopy, languages, projectImage, studioImage, type Language } from './content';

export const textFields = {
  Homepage: {
    headline: 'Headline',
    accent: 'Headline accent',
    intro: 'Introduction',
    intro2: 'Second introductory paragraph',
    extraTitle: 'Additional content heading',
    extraText: 'Additional content',
  },
  Projects: { projectsTitle: 'Section heading', projectsText: 'Section introduction' },
  Services: { expertTitle: 'Section heading', expertIntro: 'Section introduction' },
  Company: {
    aboutTitle: 'About heading', aboutText: 'About text', teamTitle: 'Team heading',
    teamText: 'Team information', catalogue: 'Catalogue link label',
  },
  Contact: { contactTitle: 'Heading', contactText: 'Introduction', location: 'Company location', socialHandle: 'Social handle' },
} as const;

type SectionFields<S> = S extends unknown ? keyof S : never;
export type TextField = SectionFields<(typeof textFields)[keyof typeof textFields]>;
export type SiteText = Record<TextField, string>;
export type Localized<T> = Record<Language, T>;

export const visibilityLabels = {
  homepage: 'Homepage introduction',
  extra: 'Additional homepage content',
  projects: 'Projects',
  featured: 'Featured projects on homepage',
  services: 'Services',
  company: 'Company',
  team: 'Team',
  catalogue: 'Catalogue download',
  contact: 'Contact section',
  inquiry: 'Inquiry form',
  comparisons: 'Before and After',
  gallery: 'Photo collection',
  materials: 'Materials',
  applications: 'Applications',
  process: 'Process',
} as const;

export const projectFields = {
  name: 'Name', client: 'Client', location: 'Location', title: 'Subtitle', text: 'Description',
} as const;
type ProjectText = Record<keyof typeof projectFields, string>;

export type Project = {
  id: string;
  visible: boolean;
  featured: boolean;
  image: string;
  detailImage: string;
  year: string;
  area: string;
  height: string;
  text: Localized<ProjectText>;
};
export type Service = { id: string; visible: boolean; image: string; text: Localized<{ title: string; description: string }> };
type PublicSettings = {
  visibility: Record<keyof typeof visibilityLabels, boolean>;
  text: Localized<SiteText>;
  projects: Project[];
  services: Service[];
  teamPhoto: string;
  catalogue: string;
  phones: string[];
  socials: { label: string; url: string }[];
};
export type SiteContent = PublicSettings & { revision: number };
export type PublishedSite = PublicSettings;

export function localize<T>(getValue: (language: Language) => T): Localized<T> {
  return { en: getValue('en'), am: getValue('am'), om: getValue('om') };
}

const text = localize(language => {
  const copy = getCopy(language);
  const entries = Object.values(textFields).flatMap(fields => Object.keys(fields)).map(key => {
    const value = copy[key as keyof typeof copy];
    return [key, typeof value === 'string' ? value : ''];
  });
  return { ...Object.fromEntries(entries), headline: copy.title[0], accent: copy.title[1] } as SiteText;
});

export const defaultSite: SiteContent = {
  revision: 0,
  visibility: Object.fromEntries(Object.keys(visibilityLabels).map(key => [key, true])) as PublicSettings['visibility'],
  text,
  projects: getCopy('en').projectData.map((project, index) => ({
    id: project.image, visible: true, featured: index === 0,
    image: projectImage(project.image), detailImage: projectImage(project.detailImage),
    year: project.year, area: project.area, height: project.height ?? '',
    text: localize(language => {
      const { name, client, location, title, text } = getCopy(language).projectData[index];
      return { name, client, location, title, text };
    }),
  })),
  services: getCopy('en').services.map((_, index) => ({
    id: `service-${index + 1}`, visible: true, image: '',
    text: localize(language => ({ title: getCopy(language).services[index], description: getCopy(language).serviceDesc[index] })),
  })),
  teamPhoto: studioImage('team'),
  catalogue: catalogueUrl,
  phones: ['+251 949 44 44 43', '+251 911 47 51 24'],
  socials: [],
};

export function localizedCopy<T extends Record<string, string>>(values: Localized<T>, language: Language): T {
  return Object.fromEntries(Object.entries(values.en).map(([key, fallback]) => [key, values[language][key] || fallback])) as T;
}

export function siteCopy(site: PublishedSite, language: Language) {
  const { headline, accent, extraTitle, extraText, ...edited } = localizedCopy(site.text, language);
  return { ...getCopy(language), ...edited, title: [headline, accent], extraTitle, extraText };
}

export function publishSite({ revision: _revision, ...site }: SiteContent): PublishedSite {
  const { visibility } = site;
  return {
    ...site,
    text: localize(language => {
      const copy = { ...site.text[language] };
      const hide = (fields: TextField[]) => fields.forEach(field => { copy[field] = ''; });
      if (!visibility.homepage) hide(['headline', 'accent', 'intro', 'intro2']);
      if (!visibility.extra) hide(['extraTitle', 'extraText']);
      if (!visibility.projects) hide(['projectsTitle', 'projectsText']);
      if (!visibility.services) hide(['expertTitle', 'expertIntro']);
      if (!visibility.company) hide(['aboutTitle', 'aboutText']);
      if (!visibility.company || !visibility.team) hide(['teamTitle', 'teamText']);
      if (!visibility.catalogue) hide(['catalogue']);
      if (!visibility.contact) hide(['contactTitle', 'contactText', 'socialHandle']);
      return copy;
    }),
    projects: site.projects.filter(project => project.visible && (visibility.projects || (visibility.homepage && visibility.featured && project.featured))),
    services: visibility.services ? site.services.filter(service => service.visible) : [],
    teamPhoto: visibility.company && visibility.team ? site.teamPhoto : '',
    catalogue: visibility.catalogue && (visibility.company || visibility.contact) ? site.catalogue : '',
    phones: visibility.contact ? site.phones : [],
    socials: visibility.contact ? site.socials : [],
  };
}

export const languageCodes = languages.map(language => language.code);
