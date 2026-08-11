import { AdminPartnershipEntities } from '@/components/admin-partnership-entities';

export const metadata = { title: 'Partners | Nobel ITBS Admin', robots: { index: false, follow: false } };

export default function AdminPartnersPage() { return <AdminPartnershipEntities kind="partner" />; }
