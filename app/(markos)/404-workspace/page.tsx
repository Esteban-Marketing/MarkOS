import Link from 'next/link';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function WorkspaceNotFoundPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; reserved?: string }>;
}) {
  const params = await searchParams;
  const slug = (params.slug || '').toLowerCase();
  const isReserved = params.reserved === '1';

  const apex = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'markos.dev';

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
          {slug ? `${slug}.${apex}` : apex} is available.
        </h1>
        <p>This workspace has not been claimed. Start yours.</p>
        <div className={styles.ctaRow}>
          <Link
            className="c-button c-button--primary"
            href={slug ? `/signup?slug=${encodeURIComponent(slug)}` : '/signup'}
          >
            Claim this workspace
          </Link>
          <Link className="c-button c-button--tertiary" href="/">Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}
