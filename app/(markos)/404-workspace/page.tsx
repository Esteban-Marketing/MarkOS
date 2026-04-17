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
        <section className={styles.card} aria-labelledby="heading">
          <p className={styles.eyebrow}>{apex}</p>
          <h1 id="heading" className={styles.displayHeading}>
            This address is reserved.
          </h1>
          <p className={styles.body}>
            This subdomain is reserved for platform use. Available workspaces start at{' '}
            <a className={styles.link} href={`https://${apex}/signup`}>{apex}/signup</a>.
          </p>
          <Link className={styles.primaryCta} href={`/signup`}>Create a workspace</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="heading">
        <p className={styles.eyebrow}>{apex}</p>
        <h1 id="heading" className={styles.displayHeading}>
          {slug ? `${slug}.${apex}` : apex} is available.
        </h1>
        <p className={styles.body}>
          This workspace hasn&apos;t been claimed. Start yours and it&apos;s yours.
        </p>
        <Link
          className={styles.primaryCta}
          href={slug ? `/signup?slug=${encodeURIComponent(slug)}` : '/signup'}
        >
          Claim this workspace
        </Link>
      </section>
    </main>
  );
}
