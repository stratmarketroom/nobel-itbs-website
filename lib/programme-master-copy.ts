import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homeCopy, type Locale, type NavItem } from '@/lib/i18n';

export type ProgrammeMasterSlug =
  | 'general-psychology'
  | 'child-psychology'
  | 'neuroplastic-reconstruction'
  | 'space-business';

type ProgrammeBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'ordered'; items: string[] };

export type ProgrammeMasterPageCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  backLink: NavItem;
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    supportingCopy: string;
    primaryCta: NavItem;
  };
  facts: Array<{ label: string; value: string }>;
  value: {
    heading: string;
    body: string;
  };
  audience: {
    heading: string;
    items: string[];
  };
  outcomes: {
    heading: string;
    items: string[];
  };
  curriculum: {
    heading: string;
    blocks: ProgrammeBlock[];
  };
  sections: Array<{
    heading: string;
    blocks: ProgrammeBlock[];
  }>;
  faq: Array<{ question: string; answer: string }>;
  closing: {
    heading: string;
    body: string;
    primaryCta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

const programmeFileBasenames: Record<ProgrammeMasterSlug, string> = {
  'general-psychology': 'GENERAL_PSYCHOLOGY',
  'child-psychology': 'CHILD_PSYCHOLOGY',
  'neuroplastic-reconstruction': 'NEUROPLASTIC_RECONSTRUCTION',
  'space-business': 'SPACE_BUSINESS',
};

const suffixByLocale: Record<Locale, string> = {
  en: 'EN',
  ua: 'UA',
  cz: 'CZ',
};

const programmeLabels: Record<Locale, { allProgrammes: string; language: string }> = {
  en: { allProgrammes: 'All programmes', language: 'Language' },
  ua: { allProgrammes: 'Усі програми', language: 'Мова' },
  cz: { allProgrammes: 'Všechny programy', language: 'Jazyk' },
};

const hiddenSections = new Set(['SEO', 'Publication Dependencies']);

const supplementalSections = [
  'Official Context',
  'Partnership Model',
  'Learning Experience',
  'Languages',
  'Lecturer',
  'Expert',
  'Experts',
  'Academic Context',
  'Assessment And Document',
  'Professional Boundary',
  'Cohort And Pricing',
];

export const programmeMasterSlugs = Object.keys(programmeFileBasenames) as ProgrammeMasterSlug[];

function readMasterCopy(locale: Locale, slug: ProgrammeMasterSlug) {
  const file = `${programmeFileBasenames[slug]}_${suffixByLocale[locale]}_MASTER_COPY.md`;
  return readFileSync(join(process.cwd(), 'docs', 'preparation', 'programmes', file), 'utf8');
}

function sectionBody(markdown: string, section: string) {
  const match = markdown.match(new RegExp(`^## ${section}\\n([\\s\\S]*?)(?=\\n## |$)`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function field(markdown: string, key: string) {
  const match = markdown.match(new RegExp(`\`${key}\`:\\s*([^\\n]+)`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function bullets(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s+/, '').replace(/[.;]$/, ''));
}

function facts(markdown: string) {
  return bullets(sectionBody(markdown, 'Programme Facts')).map((item) => {
    const [label, ...value] = item.split(':');
    return { label: label.trim(), value: value.join(':').trim() || item };
  });
}

function parseBlocks(markdown: string): ProgrammeBlock[] {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: ProgrammeBlock[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];

  const flush = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }

    if (orderedItems.length > 0) {
      blocks.push({ type: 'ordered', items: orderedItems });
      orderedItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('`internal_note_not_for_publication`')) {
      continue;
    }

    if (line.startsWith('`heading`')) {
      continue;
    }

    if (line.startsWith('`primary_cta`')) {
      continue;
    }

    if (line.startsWith('### ')) {
      flush();
      blocks.push({ type: 'heading', text: line.replace(/^###\s+/, '') });
      continue;
    }

    if (line.startsWith('- ')) {
      orderedItems = [];
      listItems.push(line.replace(/^-\s+/, ''));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      listItems = [];
      orderedItems.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }

    flush();

    const keyed = line.match(/^`[^`]+`:\s*(.+)$/);
    blocks.push({ type: 'paragraph', text: keyed?.[1]?.trim() ?? line });
  }

  flush();
  return blocks;
}

function sectionHeading(markdown: string, fallback: string) {
  return field(markdown, 'heading') || fallback;
}

function faq(markdown: string) {
  return sectionBody(markdown, 'FAQ')
    .split(/\n### /)
    .map((entry) => entry.trim().replace(/^###\s+/, ''))
    .filter(Boolean)
    .map((entry) => {
      const [question, ...answer] = entry.split('\n');
      return { question: question.trim(), answer: answer.join(' ').trim() };
    });
}

export function getProgrammeMasterPageCopy(locale: Locale, slug: ProgrammeMasterSlug): ProgrammeMasterPageCopy {
  const markdown = readMasterCopy(locale, slug);
  const labels = programmeLabels[locale];
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const path = `/programmes/${slug}`;
  const home = homeCopy[locale];

  const valueSection = sectionBody(markdown, 'Value Section');
  const audienceSection = sectionBody(markdown, 'Audience');
  const outcomesSection = sectionBody(markdown, 'Outcomes');
  const curriculumSection = sectionBody(markdown, 'Curriculum');
  const closingSection = sectionBody(markdown, 'Closing CTA');

  return {
    homeHref: home.homeHref,
    navLabel: home.navLabel,
    localeLabel: labels.language,
    nav: home.nav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: path },
      { locale: 'ua', label: 'UA', href: `/ua${path}` },
      { locale: 'cz', label: 'CZ', href: `/cz${path}` },
    ],
    backLink: { label: labels.allProgrammes, href: `${localePrefix}/programmes` || '/programmes' },
    metadata: {
      title: field(markdown, 'seo_title') || field(markdown, 'h1'),
      description: field(markdown, 'seo_description') || field(markdown, 'lead'),
    },
    hero: {
      eyebrow: field(markdown, 'eyebrow'),
      title: field(markdown, 'h1'),
      lead: field(markdown, 'lead'),
      supportingCopy: field(markdown, 'supporting_copy'),
      primaryCta: { label: field(markdown, 'primary_cta'), href: `${localePrefix}/contact?programme=${slug}` },
    },
    facts: facts(markdown),
    value: {
      heading: field(valueSection, 'heading'),
      body: field(valueSection, 'body'),
    },
    audience: {
      heading: sectionHeading(audienceSection, 'Audience'),
      items: bullets(audienceSection),
    },
    outcomes: {
      heading: sectionHeading(outcomesSection, 'Outcomes'),
      items: bullets(outcomesSection),
    },
    curriculum: {
      heading: sectionHeading(curriculumSection, 'Curriculum'),
      blocks: parseBlocks(curriculumSection),
    },
    sections: supplementalSections
      .map((section) => ({
        heading: sectionHeading(sectionBody(markdown, section), section),
        blocks: parseBlocks(sectionBody(markdown, section)),
      }))
      .filter((section) => section.blocks.length > 0 && !hiddenSections.has(section.heading)),
    faq: faq(markdown),
    closing: {
      heading: field(closingSection, 'heading'),
      body: field(closingSection, 'body'),
      primaryCta: { label: field(closingSection, 'primary_cta'), href: `${localePrefix}/contact?programme=${slug}` },
    },
    footer: home.footer,
  };
}

export function isProgrammeMasterSlug(value: string): value is ProgrammeMasterSlug {
  return value in programmeFileBasenames;
}
