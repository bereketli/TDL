import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { defaultTheme } from '@/lib/content';
import './globals.css';
export const metadata: Metadata = {
  title: 'TDL The Design Lab | Façade Design, Engineering & Fabrication',
  description: 'TDL Engineering PLC: 3D façade design, parametric modelling, visualisation, physical sampling, fabrication, powder coating and installation in Ethiopia.',
  applicationName: 'The Design Lab',
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" data-theme={defaultTheme} suppressHydrationWarning><body>{children}</body></html>;
}
