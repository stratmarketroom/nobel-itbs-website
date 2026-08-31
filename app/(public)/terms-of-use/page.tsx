import { renderLegalMetadata, renderLegalPage } from '@/lib/content/legal-route';
export function generateMetadata() { return renderLegalMetadata('terms_of_use', 'en'); }
export default function Page() { return renderLegalPage('terms_of_use', 'en'); }
