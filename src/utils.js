'use strict';

function getPartsFromTemplate(template) {
  const partRegex = /\$\{(\w+)\}/g;
  const parts = template.split(partRegex);
  const strings = parts.filter((element, index) => index % 2 === 0);
  const params = parts.filter((element, index) => index % 2 === 1);
  return { strings, params };
}

module.exports.getPartsFromTemplate = getPartsFromTemplate;
