import Image from 'next/image';
import type { PartnerCard } from '@/lib/partners/types';

type PartnerLogoImageProps = {
  className: string;
  partner: PartnerCard;
  sizes: string;
};

export function PartnerLogoImage({ className, partner, sizes }: PartnerLogoImageProps) {
  return (
    <span className={`${className} partner-logo-image-${partner.slug}`}>
      <Image
        alt={partner.logoAlt}
        fill
        sizes={sizes}
        src={partner.logoPath}
      />
    </span>
  );
}
