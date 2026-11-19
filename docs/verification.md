# Verification scope

## Executed for the Next.js migration

- `npm run check:assets`: verified 29 WebP image files, all 15 concept studies, project image references across three translations, matching service/process descriptions and the catalogue PDF.
- `npm run typecheck`: TypeScript strict checking passed.
- `npm run build`: Next.js optimized production build passed, including page prerendering.
- `npm run test:smoke`: production HTTP server checked for server-rendered project copy, language choices, separate image delivery, Next.js image optimization, PDF delivery and unknown-route 404 behavior.

No embedded data-URL images, old bundled runtime, iframe wrapper or raw HTML injection is used in the Next.js application source. The image assets are files in public/images.

## Remaining verification

Browser-level layout, animation, language wrapping, screen-reader and mobile interaction checks were not executed for this migration. The preceding managed preview environment returned Site Unavailable. Build and HTTP results are not a substitute for those visual checks.

Amharic and Afaan Oromoo translations are draft launch copy and should receive native editorial review. The inquiry form intentionally only prepares a copyable draft. No email, lead-storage or external messaging integration is configured or claimed.
