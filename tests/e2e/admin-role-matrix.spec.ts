import { expect, test, type Page } from '@playwright/test';

type AdminRole = 'owner' | 'super_admin' | 'content_manager' | 'credential_manager';

type RoleCase = {
  role: AdminRole;
  label: string;
  allowedRoutes: string[];
};

const allRoutes = [
  '/admin',
  '/admin/content-pages',
  '/admin/programmes',
  '/admin/programme-areas',
  '/admin/programme-types',
  '/admin/partners',
  '/admin/experts',
  '/admin/contact-submissions',
  '/admin/learners',
  '/admin/credentials',
  '/admin/email-templates',
  '/admin/credential-templates',
  '/admin/site-settings',
  '/admin/users',
  '/admin/audit-history',
] as const;

const contentRoutes = [
  '/admin',
  '/admin/content-pages',
  '/admin/programmes',
  '/admin/programme-areas',
  '/admin/programme-types',
  '/admin/partners',
  '/admin/experts',
];

const credentialRoutes = [
  '/admin',
  '/admin/contact-submissions',
  '/admin/learners',
  '/admin/credentials',
  '/admin/email-templates',
];

const roleCases: RoleCase[] = [
  { role: 'owner', label: 'Owner', allowedRoutes: [...allRoutes] },
  { role: 'super_admin', label: 'Super Admin', allowedRoutes: [...allRoutes] },
  { role: 'content_manager', label: 'Content Manager', allowedRoutes: contentRoutes },
  { role: 'credential_manager', label: 'Credential Manager', allowedRoutes: credentialRoutes },
];

const mfaRequiredRoles = new Set<AdminRole>(['owner', 'super_admin', 'credential_manager']);

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function fakeAccessToken(role: AdminRole, aal: 'aal1' | 'aal2'): string {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({
      aal,
      aud: 'authenticated',
      email: `${role}@e2e.invalid`,
      exp: now + 60 * 60,
      iat: now,
      role: 'authenticated',
      sub: `00000000-0000-4000-8000-${role.padEnd(12, '0').slice(0, 12)}`,
    }),
    'e2e-signature',
  ].join('.');
}

async function seedBrowserSession(page: Page, role: AdminRole, aal: 'aal1' | 'aal2'): Promise<void> {
  const accessToken = fakeAccessToken(role, aal);
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const userId = `00000000-0000-4000-8000-${role.padEnd(12, '0').slice(0, 12)}`;

  await page.addInitScript(({ token, expiry, id, email }) => {
    window.localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: token,
      refresh_token: 'e2e-refresh-token',
      expires_in: 3600,
      expires_at: expiry,
      token_type: 'bearer',
      user: {
        id,
        aud: 'authenticated',
        role: 'authenticated',
        email,
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-01-01T00:00:00.000Z',
      },
    }));
  }, { token: accessToken, expiry: expiresAt, id: userId, email: `${role}@e2e.invalid` });
}

async function mockAdminApi(
  page: Page,
  role: AdminRole,
  aal: 'aal1' | 'aal2',
  satisfied: boolean,
): Promise<string[]> {
  const requests: string[] = [];

  await page.route('**/api/v1/admin/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    requests.push(pathname);

    if (pathname === '/api/v1/admin/me') {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          user: { id: `e2e-${role}`, email: `${role}@e2e.invalid` },
          profile: {
            full_name: `${role} E2E`,
            is_owner: role === 'owner',
            mfa_required: mfaRequiredRoles.has(role),
          },
          roles: [role],
          mfa: { required: mfaRequiredRoles.has(role), aal, satisfied },
        }),
      });
      return;
    }

    if (pathname === '/api/v1/admin/dashboard') {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          generatedAt: '2026-09-01T08:00:00.000Z',
          content: role === 'credential_manager' ? null : {
            programmes: { total: 5, published: 5, draft: 0, archived: 0 },
            translationsNeedingAttention: { contentPages: 0, programmes: 0 },
          },
          operations: role === 'content_manager' ? null : {
            newContactSubmissions: 0,
            learners: { active: 0, archived: 0 },
            credentials: { pending: 0, valid: 0, revoked: 0, voided: 0 },
          },
        }),
      });
      return;
    }

    const emptyResponses: Record<string, unknown> = {
      '/api/v1/admin/content-pages': { pages: [] },
      '/api/v1/admin/programmes': { programmes: [] },
      '/api/v1/admin/programme-areas': { areas: [] },
      '/api/v1/admin/programme-types': { types: [] },
      '/api/v1/admin/partners': { partners: [] },
      '/api/v1/admin/experts': { experts: [] },
      '/api/v1/admin/contact-submissions': { submissions: [], total: 0 },
      '/api/v1/admin/learners': { learners: [], total: 0 },
      '/api/v1/admin/credentials': {
        credentials: [],
        total: 0,
        references: {
          learners: [], programmes: [], programmeRuns: [], credentialTypes: [], canUseManualNumber: role === 'owner',
        },
      },
      '/api/v1/admin/credential-sets': { credentialSets: [], total: 0 },
      '/api/v1/admin/document-numbers': { documentNumbers: [], total: 0 },
      '/api/v1/admin/email-templates': { templates: [] },
      '/api/v1/admin/credential-templates': {
        packages: [],
        references: {
          programmes: [], programmeRuns: [], credentialTypes: [], fileTypes: [], languages: [],
        },
      },
      '/api/v1/admin/site-settings': {
        setting: {
          setting_key: 'for_organisations_application_url',
          value_text: null,
          description: 'E2E fixture',
          updated_at: '2026-09-01T08:00:00.000Z',
        },
      },
      '/api/v1/admin/users': { users: [] },
      '/api/v1/admin/audit-events': { events: [], total: 0 },
    };
    const payload = emptyResponses[pathname] ?? {};
    await route.fulfill({ contentType: 'application/json', status: 200, body: JSON.stringify(payload) });
  });

  return requests;
}

async function expectResponsiveShell(page: Page, expectedRoutes: string[]): Promise<void> {
  await expect(page.locator('.admin-app-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

  const adminNav = page.getByRole('navigation', { name: 'Admin modules' }).filter({ visible: true });
  await expect(adminNav).toHaveCount(1);
  await expect(adminNav.getByRole('link')).toHaveCount(expectedRoutes.length);

  const hrefs = await adminNav.getByRole('link').evaluateAll((links) => (
    links.map((link) => link.getAttribute('href'))
  ));
  expect(hrefs).toEqual(expectedRoutes);
  await expect(adminNav.locator('a[href="/admin"]')).toHaveAttribute('aria-current', 'page');

  const isMobile = page.viewportSize()!.width < 760;
  if (isMobile) {
    await expect(page.locator('.admin-app-mobile-bar')).toBeVisible();
    await expect(page.locator('.admin-app-sidebar')).toBeHidden();
  } else {
    await expect(page.locator('.admin-app-sidebar')).toBeVisible();
    await expect(page.locator('.admin-app-mobile-bar')).toBeHidden();
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('ADM-E2E-ROLE-MATRIX', () => {
  for (const roleCase of roleCases) {
    test(`${roleCase.label}: role-aware shell and navigation`, async ({ page }) => {
      await seedBrowserSession(page, roleCase.role, 'aal2');
      const requests = await mockAdminApi(page, roleCase.role, 'aal2', true);

      await page.goto('/admin');
      await expectResponsiveShell(page, roleCase.allowedRoutes);
      expect(requests).toContain('/api/v1/admin/me');
      expect(requests).toContain('/api/v1/admin/dashboard');
    });

    test(`${roleCase.label}: every allowed route opens the protected shell`, async ({ page }) => {
      await seedBrowserSession(page, roleCase.role, 'aal2');
      const requests = await mockAdminApi(page, roleCase.role, 'aal2', true);

      for (const route of roleCase.allowedRoutes) {
        requests.length = 0;
        await page.goto(route);
        await expect(page.locator('.admin-app-shell')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Access not available' })).toHaveCount(0);
        expect(requests).toContain('/api/v1/admin/me');
      }
    });

    const forbiddenRoutes = allRoutes.filter((route) => !roleCase.allowedRoutes.includes(route));
    if (forbiddenRoutes.length) {
      test(`${roleCase.label}: forbidden routes do not load protected module APIs`, async ({ page }) => {
        await seedBrowserSession(page, roleCase.role, 'aal2');
        const requests = await mockAdminApi(page, roleCase.role, 'aal2', true);

        for (const route of forbiddenRoutes) {
          requests.length = 0;
          await page.goto(route);
          await expect(page.getByRole('heading', { name: 'Access not available' })).toBeVisible();
          await expect(page.getByText('No protected data has been loaded.')).toBeVisible();
          expect(requests).toEqual(['/api/v1/admin/me']);
        }
      });
    }
  }

  for (const roleCase of roleCases) {
    test(`${roleCase.label}: AAL1 MFA contract`, async ({ page }) => {
      const requiresMfa = mfaRequiredRoles.has(roleCase.role);
      await seedBrowserSession(page, roleCase.role, 'aal1');
      const requests = await mockAdminApi(page, roleCase.role, 'aal1', !requiresMfa);

      await page.goto('/admin');

      if (requiresMfa) {
        await expect(page.getByRole('heading', { name: 'MFA is required' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Verify MFA' })).toHaveAttribute('href', '/admin/login');
        expect(requests).toEqual(['/api/v1/admin/me']);
      } else {
        await expectResponsiveShell(page, roleCase.allowedRoutes);
        expect(requests).toContain('/api/v1/admin/dashboard');
      }
    });
  }

  test('signed-out browser receives the login state without protected API access', async ({ page }) => {
    const protectedRequests: string[] = [];
    await page.route('**/api/v1/admin/**', async (route) => {
      protectedRequests.push(new URL(route.request().url()).pathname);
      await route.fulfill({ contentType: 'application/json', status: 401, body: '{}' });
    });

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Sign in required' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/admin/login');
    expect(protectedRequests).toEqual([]);
  });
});
