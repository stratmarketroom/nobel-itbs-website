import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
export { migrationRows } from './managed-content-migrations.mjs';

// PostgreSQL jsonb does not retain source insertion order for object keys.
export function jsonbOrder(value) {
  if (Array.isArray(value)) return value.map(jsonbOrder);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .sort(([a], [b]) => Buffer.byteLength(a) - Buffer.byteLength(b) || Buffer.compare(Buffer.from(a), Buffer.from(b)))
      .map(([key, item]) => [key, jsonbOrder(item)]));
  }
  return value;
}

function compile(path, dependencies) {
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, { exports, require: (name) => {
    if (name in dependencies) return dependencies[name];
    if (name === 'react/jsx-runtime') return require(name);
    throw new Error(`Unexpected fixture dependency: ${name}`);
  } }, { filename: path });
  return exports;
}

const empty = () => null;
const { ManagedContentPage } = compile('components/managed-content-page.tsx', {
  'next/link': ({ children, ...props }) => React.createElement('a', props, children),
  '@/lib/content/localization': compile('lib/content/localization.ts', {}),
  './expert-cards': { ExpertCards: empty },
  './public-footer': { PublicFooter: empty },
  './partner-logo-image': { PartnerLogoImage: empty },
  './public-responsive-header': { PublicResponsiveHeader: empty },
  './public-enquiry-form': { PublicEnquiryForm: () => React.createElement('section', { id: 'contact' }, 'Contact fixture') },
});

// Isolated real renderer and localization, no database/network/forms are used.
export function renderFixture(row, primaryHrefOverride) {
  return renderToStaticMarkup(React.createElement(ManagedContentPage, {
    page: { pageKey: row.pageKey, h1: row.sections.blocks[0].fields.h1, sections: jsonbOrder(row.sections) },
    locale: row.locale,
    primaryHrefOverride,
  }));
}

export function renderedSection(row, key, primaryHrefOverride) {
  const index = row.sections.blocks.slice(1).findIndex((block) => block.key === key);
  const html = renderFixture(row, primaryHrefOverride);
  return [...html.matchAll(/<section class="managed-section">[\s\S]*?<\/section>/g)][index]?.[0] ?? '';
}
