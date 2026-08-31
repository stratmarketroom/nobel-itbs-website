import { renderLegalMetadata, renderLegalPage } from '@/lib/content/legal-route';
export function generateMetadata() { return renderLegalMetadata('privacy_policy', 'en'); }
export default function Page() { return renderLegalPage('privacy_policy', 'en'); }
