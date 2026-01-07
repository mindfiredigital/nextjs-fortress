import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'motivation',
    'quick-start',
    {
      type: 'category',
      label: 'Security Modules',
      collapsible: true,
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Deserialization Protection',
          items: [
            'modules/deserialization/dangerous-keys',
            'modules/deserialization/depth-limiting',
            'modules/deserialization/circular-references',
            'modules/deserialization/dangerous-patterns',
          ],
        },
        {
          type: 'category',
          label: 'Injection Detection',
          items: [
            'modules/injection/sql-injection',
            'modules/injection/command-injection',
            'modules/injection/xss-protection',
            'modules/injection/code-injection',
          ],
        },
        {
          type: 'category',
          label: 'Encoding Validation',
          items: [
            'modules/encoding/ghost-mode',
          ],
        },
        {
          type: 'category',
          label: 'CSRF Protection',
          items: [
            'modules/csrf/csrf-protection',
          ],
        },
        {
          type: 'category',
          label: 'Rate Limiting',
          items: [
            'modules/rate-limit/rate-limiting',
          ],
        },
      ],
    },
  ],
};

export default sidebars;