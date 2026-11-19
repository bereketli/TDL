import Image from 'next/image';
import dimensions from '@/data/image-dimensions.json';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Image>, 'width' | 'height' | 'src'> & { src: string };
/** Real raster files served from public/images; dimensions preserve their aspect ratio. */
export function Media({ src, alt, sizes = '(max-width: 720px) 100vw, 50vw', ...props }: Props) {
  const size = dimensions[src as keyof typeof dimensions];
  if (src.startsWith('/media/')) {
    return <Image src={src} width={1600} height={1000} alt={alt} sizes={sizes} unoptimized {...props} />;
  }
  if (!size) throw new Error(`Image dimensions missing for ${src}`);
  return <Image src={src} width={size.width} height={size.height} alt={alt} sizes={sizes} {...props} />;
}
