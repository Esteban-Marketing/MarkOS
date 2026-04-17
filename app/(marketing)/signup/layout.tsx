import type { ReactNode } from 'react';
import styles from './page.module.css';

export default function SignupLayout({ children }: { children: ReactNode }) {
  return <div className={styles.marketingShell}>{children}</div>;
}
