import { type Page } from '@playwright/test';

/**
 * installTenancyMocks — install Playwright route-level mocks for the tenancy golden path.
 * Intercepts: BotID verify, Vercel Edge Config/Domains, email delivery (Resend/SendGrid).
 * None of these external services are hit in test runs.
 */
export async function installTenancyMocks(page: Page): Promise<void> {
  // BotID mock — always returns valid (score 0.98).
  await page.route(/botid\.dev\/v1\/verify/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true, score: 0.98, threshold: 0.5 }),
    });
  });

  // Vercel Edge Config mock — PATCH succeeds.
  await page.route(/api\.vercel\.com\/v\d+\/edge-config/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"items":[{"updated":true}]}',
    });
  });

  // Vercel Domains/Projects mock — domain verified.
  await page.route(/api\.vercel\.com\/v\d+\/(domains|projects)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        verified: true,
        name: route.request().url(),
        verification: [{ type: 'CNAME', value: 'cname.vercel-dns.com' }],
      }),
    });
  });

  // Email delivery mock — Resend or SendGrid intercepted; no mail sent.
  await page.route(/resend\.com\/emails|api\.sendgrid\.com\/v3\/mail\/send/, async (route) => {
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: '{"id":"mock-email-id"}',
    });
  });
}
