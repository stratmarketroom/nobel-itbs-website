import Link from 'next/link';

const roleLabels = ['Owner', 'Super Admin', 'Content Manager', 'Credential Manager'];

export const metadata = {
  title: 'Admin Users | Nobel ITBS',
};

export default function AdminUsersPage() {
  return (
    <main className="admin-shell">
      <section className="admin-hero" aria-labelledby="admin-users-title">
        <p className="eyebrow">Admin</p>
        <h1 id="admin-users-title">User management</h1>
        <p>
          Manage active status and role assignments through protected server routes backed by Supabase Auth.
        </p>
        <Link className="admin-login-link" href="/admin/login">
          Admin sign in
        </Link>
        <Link className="admin-login-link" href="/admin/contact-submissions">
          Contact submissions
        </Link>
      </section>

      <section className="admin-grid" aria-label="User management controls">
        <article className="admin-panel">
          <div>
            <p className="admin-kicker">Access</p>
            <h2>Owner and Super Admin only</h2>
          </div>
          <p>
            User management routes require a valid admin session. Mutations require MFA/AAL2. Owner and Super Admin
            role changes remain Owner-only.
          </p>
        </article>

        <article className="admin-panel">
          <div>
            <p className="admin-kicker">Roles</p>
            <h2>Multi-role assignment</h2>
          </div>
          <div className="role-list">
            {roleLabels.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </article>

        <article className="admin-panel admin-panel-wide">
          <div>
            <p className="admin-kicker">API</p>
            <h2>Server-managed operations</h2>
          </div>
          <dl className="endpoint-list">
            <div>
              <dt>GET</dt>
              <dd>/api/v1/admin/me</dd>
            </div>
            <div>
              <dt>GET / POST</dt>
              <dd>/api/v1/admin/users</dd>
            </div>
            <div>
              <dt>PATCH</dt>
              <dd>/api/v1/admin/users/:id</dd>
            </div>
            <div>
              <dt>PUT / DELETE</dt>
              <dd>/api/v1/admin/users/:id/roles</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
