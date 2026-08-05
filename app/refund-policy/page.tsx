import { renderLegalMetadata, renderLegalPage } from '@/lib/content/legal-route';
export function generateMetadata() { return renderLegalMetadata('refund_policy', 'en'); }
export default function Page() { return renderLegalPage('refund_policy', 'en'); }
