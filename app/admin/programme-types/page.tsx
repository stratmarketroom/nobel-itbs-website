import { AdminProgrammeTaxonomy } from '@/components/admin-programme-taxonomy';

export const metadata = { title: 'Programme Types | Nobel ITBS Admin', robots: { index: false, follow: false } };

export default function AdminProgrammeTypesPage() { return <AdminProgrammeTaxonomy kind="type" />; }
