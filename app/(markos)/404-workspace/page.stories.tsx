import type { Meta, StoryObj } from '@storybook/react';
import Link from 'next/link';
import styles from './page.module.css';

// Phase 213.4 Plan 07 — Phase 213.5 polish — synchronous wrapper for Storybook.
//
// app/(markos)/404-workspace/page.tsx is an async Server Component (per D-23
// preserves Next.js notFound() + force-dynamic + searchParams: Promise<…>).
// Storybook 8 cannot reliably render async Server Components in browser
// context (React minified error #482 on Chromatic snapshot capture). This
// story file renders the same JSX/markup synchronously by inlining the
// resolved-params branch logic — verifies primitive composition, copy, and
// `.c-card--feature` hero exception (D-13) without invoking the async RSC
// path. Production component is untouched per D-23.

function StoryWrapper({ slug, reserved }: { slug?: string; reserved?: string }) {
  const apex = 'markos.dev';
  const cleanSlug = (slug || '').toLowerCase();
  const isReserved = reserved === '1';

  if (isReserved) {
    return (
      <main className={styles.page}>
        <section className={`c-card c-card--feature ${styles.cardWrap}`} aria-labelledby="heading">
          <span className="t-label-caps">{apex}</span>
          <h1 id="heading">This address is reserved.</h1>
          <p>
            This subdomain is reserved for platform use. Available workspaces start at{' '}
            <a className={styles.link} href={`https://${apex}/signup`}>{apex}/signup</a>.
          </p>
          <Link className="c-button c-button--primary" href="/signup">Create a workspace</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={`c-card c-card--feature ${styles.cardWrap}`} aria-labelledby="heading">
        <span className="t-label-caps">{apex}</span>
        <h1 id="heading">
          {cleanSlug ? `${cleanSlug}.${apex}` : apex} is available.
        </h1>
        <p>This workspace has not been claimed. Start yours.</p>
        <div className={styles.ctaRow}>
          <Link
            className="c-button c-button--primary"
            href={cleanSlug ? `/signup?slug=${encodeURIComponent(cleanSlug)}` : '/signup'}
          >
            Claim this workspace
          </Link>
          <Link className="c-button c-button--tertiary" href="/">Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}

const meta = {
  title: '404Workspace',
  component: StoryWrapper,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: { slug: 'acme', reserved: undefined },
  parameters: {
    docs: {
      description: {
        story:
          'Workspace `acme.{apex}` not yet claimed. ' +
          '.c-card--feature hero (32px radius per D-13). ' +
          '.c-button--primary "Claim this workspace" + .c-button--tertiary "Back to dashboard". ' +
          'NO [err] glyph on heading; NO red splash (D-13 + DESIGN.md "Don\'t shout").',
      },
    },
  },
};

export const Reserved: Story = {
  args: { slug: '', reserved: '1' },
  parameters: {
    docs: {
      description: {
        story:
          'Reserved subdomain — platform use only. ' +
          '.c-card--feature hero. .c-button--primary "Create a workspace". ' +
          'No secondary CTA on reserved variant per UI-SPEC F Copywriting.',
      },
    },
  },
};
