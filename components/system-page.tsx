import Image from 'next/image';
import Link from 'next/link';
import type { SystemPageCopy } from '@/lib/system-copy';

type SystemPageProps = {
  copy: SystemPageCopy;
};

export function SystemPage({ copy }: SystemPageProps) {
  return (
    <main className="system-page">
      <section className="system-panel" aria-labelledby="system-title">
        <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={190} height={45} alt="Nobel ITBS" priority />
        <p className="eyebrow dark">{copy.eyebrow}</p>
        <h1 id="system-title">{copy.heading}</h1>
        <p>{copy.body}</p>
        <div className="system-actions">
          <Link className="button primary" href={copy.primaryCta.href}>
            {copy.primaryCta.label}
          </Link>
          {copy.secondaryCta ? (
            <Link className="text-link" href={copy.secondaryCta.href}>
              {copy.secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
