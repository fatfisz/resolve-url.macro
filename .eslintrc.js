'use strict';

const config = require('@codility/eslint-config-codility');

module.exports = {
  ...config,
  parserOptions: {
    ...config.parserOptions,
    sourceType: 'script',
  },
  plugins: config.plugins.filter(plugin => !plugin.includes('react')),
  extends: config.extends.filter(config => !config.includes('react')),

  overrides: [
    {
      files: 'test/**/*',
      env: { jest: true },
      rules: { 'no-template-curly-in-string': 0 },
    },
  ],
};
