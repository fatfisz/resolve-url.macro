'use strict';

const config = require('@codility/eslint-config-codility');

config.parserOptions.sourceType = 'script';
config.plugins = config.plugins.filter(plugin => !plugin.includes('react'));
config.extends = config.extends.filter(config => !config.includes('react'));

module.exports = config;
