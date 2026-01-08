import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '🛡️ CVE-2025-55182 Protection',
    icon: '🔒',
    description: (
      <>
        Complete protection against React2Shell vulnerability. Blocks prototype 
        pollution, dangerous keys, and all attack vectors targeting React Server 
        Components.
      </>
    ),
  },
  {
    title: '⚡ Zero Performance Impact',
    icon: '🚀',
    description: (
      <>
        Less than 1ms overhead per request. Optimized validation algorithms ensure 
        your application stays fast while remaining secure against all threats.
      </>
    ),
  },
  {
    title: '🎯 7 Layers of Protection',
    icon: '🛡️',
    description: (
      <>
        Deserialization, Injection Detection, Encoding Validation, CSRF, Rate 
        Limiting, Content Validation, and Security Headers - all working together.
      </>
    ),
  },
  {
    title: '👻 Ghost Mode Defense',
    icon: '🔍',
    description: (
      <>
        Detects UTF-16LE encoding bypasses that trick WAFs. Prevents sophisticated 
        attackers from using encoding tricks to deliver malicious payloads.
      </>
    ),
  },
  {
    title: '🔧 Zero Configuration',
    icon: '⚙️',
    description: (
      <>
        Works out of the box with sensible defaults. Add one middleware file and 
        your entire Next.js application is protected. Customize when needed.
      </>
    ),
  },
  {
    title: '📊 Security Logging',
    icon: '📈',
    description: (
      <>
        Comprehensive security event logging with severity levels, confidence 
        scores, and attack details. Send events to Sentry, DataDog, or your SIEM.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <div className={styles.featureIcon}>{icon}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}