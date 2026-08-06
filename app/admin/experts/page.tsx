import { AdminPartnershipEntities } from '@/components/admin-partnership-entities';

export const metadata = { title: 'Experts | Nobel ITBS Admin', robots: { index: false, follow: false } };

export default function AdminExpertsPage() { return <AdminPartnershipEntities kind="expert" />; }
