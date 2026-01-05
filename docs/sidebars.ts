import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'installation',
    'quick-start',
    {
      type: 'category',
      label: 'Security Checkers',
      items: [
        'checkers/overview',
        'checkers/deserialization',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'security/cve-2025-55182',
      ],
    },
  ],
};

export default sidebars;