'use strict';

module.exports = {
  maxFunctions: 12,
  profiles: {
    full: {
      description: 'Build the complete app and API surface.',
      include: ['api/**/*.js', 'app/**/page.tsx'],
    },
    hobby: {
      description: 'Keep the hosted onboarding surface only so Hobby deployments stay within the serverless function cap.',
      include: [
        // Onboarding bootstrap and polling.
        'api/config.js',
        'api/status.js',

        // Draft lifecycle used by the hosted onboarding flow.
        'api/submit.js',
        'api/regenerate.js',
        'api/approve.js',
      ],
    },
  },
};