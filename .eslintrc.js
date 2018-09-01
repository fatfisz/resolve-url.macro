'use strict';

module.exports = {
  extends: [require.resolve('../eslint-config-codility')],

  parserOptions: {
    sourceType: 'script',
  },

  overrides: [
    {
      files: 'test/**/*',
      env: { jest: true },
      rules: { 'no-template-curly-in-string': 0 },
    },
  ],
};
