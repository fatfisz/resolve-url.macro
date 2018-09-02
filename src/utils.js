'use strict';

exports.getPartsFromTemplate = function getPartsFromTemplate(template) {
  const partRegex = /\$\{(\w+)\}/g;
  const parts = template.split(partRegex);
  const strings = parts.filter((element, index) => index % 2 === 0);
  const params = parts.filter((element, index) => index % 2 === 1);
  return { strings, params };
};

exports.getUrlName = function getUrlName(name, arity) {
  return `${name};${arity}`;
};

exports.pathInvariant = function pathInvariant(path, predicate, message) {
  if (!predicate) {
    throw path.buildCodeFrameError(message);
  }
};
