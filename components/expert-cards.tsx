import Image from 'next/image';
import type { ExpertCard } from '@/lib/experts/types';

type ExpertCardsProps = {
  experts: ExpertCard[];
};

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function ExpertCards({ experts }: ExpertCardsProps) {
  return (
    <div className="expert-cards">
      {experts.map((expert, index) => (
        <article className="expert-card" key={expert.slug}>
          <div className="expert-card-portrait">
            {expert.photoPath && expert.photoAlt ? (
              <Image
                src={expert.photoPath}
                fill
                sizes="(max-width: 700px) calc(100vw - 2.5rem), (max-width: 1050px) 44vw, 28rem"
                alt={expert.photoAlt}
              />
            ) : (
              <span aria-hidden="true">{initials(expert.name)}</span>
            )}
            <small aria-hidden="true">{String(index + 1).padStart(2, '0')}</small>
          </div>
          <div className="expert-card-copy">
            <p>{expert.role}</p>
            <h3>{expert.name}</h3>
            <span>{expert.category}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
