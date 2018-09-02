'use strict';

module.exports = {
  extends: ['@codility/eslint-config-codility'],

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
