# TDL — The Design Lab

A complete Next.js App Router frontend for TDL Engineering PLC, based on the supplied 2026 company catalogue. The source uses readable TypeScript/React components and normal image files. It does not embed the old HTML site or a compiled React bundle.

## Run locally

Use Node.js 22 and npm. If you use nvm, run `nvm use` to select the version in `.nvmrc`.

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

To test on a phone connected to the same network, open the Network URL printed by Next.js. The dev server allows the Mac’s current private IPv4 addresses at startup. Restart `npm run dev` after switching networks.

For a production build:

```bash
npm run build
npm start
```

The public site runs without environment variables, a database, API keys or an external image service. The CSS loads DM Sans and Noto Sans Ethiopic from Google Fonts when available; system fonts are the fallback. Fonts can be self-hosted for an offline deployment.

## Included

- Next.js 16.4.6, React 19.3.1 and TypeScript, with dependency lockfile.
- Catalogue-based introduction, company background, six services, materials, five-step process and applications.
- Four documented real projects, their catalogue photographs, locations, years and façade areas.
- A filterable collection of real façade, panel detail and fabrication photography.
- Project photo galleries, scroll reveals and full image viewer with keyboard navigation.
- Dark mode by default, a light mode option, and English, Amharic and Afaan Oromoo content. Browser preferences persist when storage is available.
- Responsive navigation, native expandable project details, reduced-motion support, focus states and a skip link.
- Both published telephone contacts and a downloadable catalogue PDF.
- Local inquiry preparation and clipboard copy. **The form does not send email or save leads.** Connect a server-side mail or CRM handler if you want production inquiry delivery. No provider is assumed.

## Code structure

```text
app/
  layout.tsx                 Metadata, document and global stylesheet
  page.tsx                   Main route
  globals.css                Original design, themes and responsive styles
components/
  Website.tsx                Page composition, preferences and reveal lifecycle
  Header.tsx                 Navigation, language and theme controls
  CatalogueSections.tsx      Studio, real projects, services, materials and process
  ProjectComparisons.tsx     Interactive construction and completion photos
  Gallery.tsx                Real project and fabrication photo collection
  Contact.tsx                Contact details and inquiry draft form
  ViewerDialog.tsx           Accessible image/inquiry dialog
  Media.tsx                  next/image wrapper using real image dimensions
lib/content.ts               Shared types and asset paths
data/translations.json       Editable English, Amharic and Afaan Oromoo copy
data/image-dimensions.json   Dimensions of every image file
public/images/brand/         TDL logo (1 WebP)
public/images/projects/      Project photographs (41 WebP)
public/images/studio/        Team, fabrication, sampling and coating photographs (4 WebP)
public/documents/            Original company catalogue PDF
scripts/                     Asset validator and production smoke test
```

There are **46 separate WebP files** under `public/images`. Next.js serves and optimizes those files through `next/image`.

## Edit content and images

1. Edit `data/translations.json`. Preserve the `en`, `am` and `om` dictionaries and their field names. Update all three language versions when changing public copy.
2. To replace an image, put the new file in `public/images` and adjust the matching path in `lib/content.ts` or the catalogue project data.
3. Keep that file’s width and height up to date in `data/image-dimensions.json`; `Media.tsx` uses them for intrinsic image sizing.
4. Real projects use `image` and `detailImage` names matching `public/images/projects/<name>.webp`.
5. The editorial photo collection is listed in `components/Gallery.tsx`.
6. Comparison pairs are listed in `components/ProjectComparisons.tsx`. A pair appears once both photos are in the image registry. Use **Before and After** in the dashboard’s Visibility tab to control the section.

Catalogue facts are recorded in `docs/content-source.md`. Amharic and Afaan Oromoo copy should receive native editorial review before public launch. No registered domain or email address is invented.

## Verify

```bash
npm run check:assets
npm run typecheck
npm run build
npm run test:smoke
```

The smoke test starts and stops a local production server. It checks server-rendered catalogue content, image-file delivery, Next.js image optimization, catalogue PDF delivery and 404 handling.

## Deployment

Deploy as a normal Next.js project on a Node-compatible host, or import the project into a Next.js-compatible hosting service. Use `npm ci`, `npm run build` and `npm start`. The application uses the standard Next.js image optimizer, so this configuration is a normal server deployment rather than a static HTML export.

## Delivery notes

Production build, TypeScript checks, asset validation and the production HTTP smoke test passed for this codebase. Browser-based visual and interaction verification has not been completed in this environment. See `docs/verification.md` for the exact verification scope.

The ZIP deliberately excludes `node_modules`, `.next`, caches and local environment files. `npm ci` installs the dependencies recorded in `package-lock.json`.

## Website editor

Open `/admin` to sign in. Add a strong, unique password of at least 12 characters to `.env.local` and restart the local server.

```dotenv
TDL_ADMIN_PASSWORD="replace-with-your-own-password"
```

In production, set `TDL_ADMIN_PASSWORD` through your host's environment settings and serve the dashboard over HTTPS. The dashboard uses one shared editor password. Changing it also expires existing sessions.

- **Homepage** edits the intro, adds an optional text section, and selects featured projects.
- **Projects** adds or edits projects, uploads a main and detail photo, and changes display order using the arrows.
- **Services** manages service titles, descriptions, photos, and display order.
- **Company** edits the about and team copy, team photo, and catalogue PDF.
- **Contact** edits phone numbers and social links.
- **Visibility** controls whole sections. Projects and services also have their own visibility switches.

Select English, Amharic, or Afaan Oromoo in any text editing section. Empty Amharic and Afaan Oromoo fields fall back to English. Photos, factual measurements, ordering, and visibility apply across languages. New entries start hidden. **Publish changes** applies the draft to the public site. Image uploads accept JPG, PNG, and WebP. Catalogue uploads accept PDF. Each file can be up to 10 MB.

The editor stores its content and uploads in `.tdl-content/` by default. For deployment, set `TDL_CONTENT_DIR` to a persistent, writable directory that is backed up. Run a single application instance with this storage setup. Public pages continue using the included catalogue content until you publish changes.
