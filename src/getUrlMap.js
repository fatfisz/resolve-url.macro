'use strict';

const types = require('@babel/types');

const { getPartsFromTemplate, getUrlName } = require('./utils');

const fileCache = new Map();

function getQuasiFromString(string) {
  // HACK: For now leave raw and cooked the same until someone complains, there is no easy fix
  return types.templateElement({ raw: string, cooked: string });
}

function processConfig(config) {
  config.forEach(info => {
    const { strings, params } = getPartsFromTemplate(info.template);
    info.quasis = strings.map(getQuasiFromString);
    info.params = params;
    info.arity = params.length;
  });
  return new Map(config.map(info => [getUrlName(info.name, info.arity), info]));
}

module.exports = function getUrlMap({ urlsPath }) {
  if (!urlsPath) {
    return new Map();
  }
  if (!fileCache.has(urlsPath)) {
    const config = require(urlsPath);
    const processedConfig = processConfig(config);
    fileCache.set(urlsPath, processedConfig);
  }
  return fileCache.get(urlsPath);
};
