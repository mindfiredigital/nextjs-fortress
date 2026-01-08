import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'nextjs-fortress',
  tagline: 'Security Validation middleware for Next.js',
  favicon: 'img/favicon.ico',

  url: 'https://mindfiredigital.github.io',
  baseUrl: '/nextjs-fortress/',

  organizationName: 'mindfiredigital',
  projectName: 'nextjs-fortress',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/mindfiredigital/nextjs-fortress/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/mindfiredigital/nextjs-fortress/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    navbar: {
      title: 'nextjs-fortress',
      logo: {
        alt: 'nextjs-fortress Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/mindfiredigital/nextjs-fortress',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Quick Start',
              to: '/docs/quick-start',
            },
            {
              label: 'API Reference',
              to: '/docs/api/configuration',
            },
          ],
        },
        {
          title: 'Security',
          items: [
            {
              label: 'CVE-2025-55182',
              to: '/docs/security/cve-2025-55182',
            },
            {
              label: 'Threat Detection',
              to: '/docs/security/threat-detection',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/mindfiredigital/nextjs-fortress',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} nextjs-fortress. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;