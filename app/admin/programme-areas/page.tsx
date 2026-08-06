import { AdminProgrammeTaxonomy } from '@/components/admin-programme-taxonomy';

export const metadata = { title: 'Programme Areas | Nobel ITBS Admin', robots: { index: false, follow: false } };

export default function AdminProgrammeAreasPage() { return <AdminProgrammeTaxonomy kind="area" />; }
