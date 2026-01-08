import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.logoContainer}>
            <img 
              src="/img/mindfire-logo.png" 
              alt="Mindfire Digital" 
              className={styles.mindfireLogo}
            />
          </div>
          
          <div className={styles.fortressTitle}>
            <span className={styles.fortressIcon}>🏰</span>
            <Heading as="h1" className="hero__title">
              nextjs-fortress
            </Heading>
          </div>
          
          <p className={styles.heroSubtitle}>
            Universal Security Validation Framework for Next.js
          </p>
          
          <p className={styles.heroDescription}>
            Protect your Next.js application from <strong>CVE-2025-55182</strong> (React2Shell) 
            and all major attack vectors with zero configuration.
          </p>

          <div className={styles.securityBadges}>
            <span className={styles.badge}>
              <span className={styles.badgeIcon}>🛡️</span>
              CVE-2025-55182 Protected
            </span>
            <span className={styles.badge}>
              <span className={styles.badgeIcon}>⚡</span>
              {'<1ms Overhead'}
            </span>
            <span className={styles.badge}>
              <span className={styles.badgeIcon}>🔒</span>
              7 Security Layers
            </span>
          </div>

          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/quick-start">
              Get Started - 5 minutes ⚡
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/intro">
              Why Fortress? 🤔
            </Link>
          </div>

          <div className={styles.codePreview}>
            <div className={styles.codeHeader}>
              <span className={styles.codeDot} style={{background: '#ff5f56'}}></span>
              <span className={styles.codeDot} style={{background: '#ffbd2e'}}></span>
              <span className={styles.codeDot} style={{background: '#27c93f'}}></span>
              <span className={styles.codeTitle}>middleware.ts</span>
            </div>
            <pre className={styles.codeContent}>
              <code>{`import { createFortressMiddleware } from 'nextjs-fortress';
import { fortressConfig } from './fortress.config';

export const middleware = createFortressMiddleware(fortressConfig);

// ✅ Your entire app is now protected!`}</code>
            </pre>
          </div>

          <div className={styles.statsContainer}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>7</div>
              <div className={styles.statLabel}>Security Layers</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{'<1ms'}</div>
              <div className={styles.statLabel}>Overhead</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>CVE Protected</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>0</div>
              <div className={styles.statLabel}>Config Required</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function SecurityAlert() {
  return (
    <div className={styles.alertBanner}>
      <div className="container">
        <div className={styles.alertContent}>
          <span className={styles.alertIcon}>⚠️</span>
          <div className={styles.alertText}>
            <strong>Security Advisory:</strong> CVE-2025-55182 (React2Shell) is being 
            actively exploited. Install nextjs-fortress immediately to protect your application.
          </div>
          <Link 
            className="button button--danger button--sm"
            to="/docs/cve/cve-2025-55182">
            Learn More →
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Protected in 3 Steps
        </Heading>
        
        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3>Install</h3>
              <pre className={styles.stepCode}>
                <code>npm install @mindfiredigital/nextjs-fortress</code>
              </pre>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3>Configure</h3>
              <pre className={styles.stepCode}>
                <code>{`// fortress.config.ts
export const fortressConfig = {
  enabled: true,
  mode: 'production',
  modules: { /* all enabled by default */ }
}`}</code>
              </pre>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h3>Protect</h3>
              <pre className={styles.stepCode}>
                <code>{`// middleware.ts
export const middleware = createFortressMiddleware(fortressConfig);
// Done! 🎉`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className={styles.trustedSection}>
      <div className="container">
        <p className={styles.trustedText}>
          Built with ❤️ by <strong>Mindfire Digital</strong>
        </p>
        <p className={styles.trustedSubtext}>
          Open source • MIT License • Community Driven
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="nextjs-fortress - Universal Security for Next.js"
      description="Protect your Next.js application from CVE-2025-55182 and all major attack vectors. Zero configuration, 7 security layers, <1ms overhead.">
      <SecurityAlert />
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickStart />
        <TrustedBy />
      </main>
    </Layout>
  );
}