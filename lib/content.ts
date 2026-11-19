import translations from '@/data/translations.json';
export type Language = keyof typeof translations;
export type Copy = typeof translations.en;
export type Theme = 'light' | 'dark';
export const defaultTheme: Theme = 'dark';
export const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' }, { code: 'am', label: 'አማርኛ' }, { code: 'om', label: 'Afaan Oromoo' },
];
export function getCopy(language: Language): Copy { return translations[language]; }
export const catalogueUrl = '/documents/tdl-company-catalogue-2026.pdf';
export const projectImage = (name: string) => `/images/projects/${name}.webp`;
export const projectPhotoSets: Readonly<Partial<Record<string, readonly string[]>>> = {
  hillside: ['hillside-entrance-evening', 'hillside-panel-fitting', 'hillside-canopy-lighting'],
  olkai: ['olkai-panel-installation', 'olkai-panel-alignment'],
  mesob: [
    'mesob-front-elevation', 'mesob-screen-from-below', 'mesob-screen-oblique',
    'mesob-panel-and-foliage', 'mesob-folded-panels', 'mesob-panel-finish',
  ],
};
export const projectPhotoLabels = {
  en: { photo: 'Project photo', previous: 'Previous photo', next: 'Next photo' },
  am: { photo: 'የፕሮጀክት ፎቶ', previous: 'ቀዳሚ ፎቶ', next: 'ቀጣይ ፎቶ' },
  om: { photo: 'Suuraa pirojektii', previous: 'Suuraa duraa', next: 'Suuraa itti aanu' },
} satisfies Record<Language, { photo: string; previous: string; next: string }>;
export const studioImage = (name: string) => `/images/studio/${name}.webp`;
