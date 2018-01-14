'use strict';

const { createMacro } = require('babel-plugin-macros');
const types = require('babel-types');
const { commaLists, commaListsOr } = require('common-tags');

const { getPartsFromTemplate } = require('./utils');

function pathInvariant(path, predicate, message) {
  if (!predicate) {
    throw path.buildCodeFrameError(message);
  }
}

function addQuotes(string) {
  return `"${string}"`;
}

function handlePath(path, urlMap) {
  const callPath = path.parentPath;
  pathInvariant(
    path,
    types.isCallExpression(callPath),
    '`resolve` should be called like a function',
  );

  const argsPath = callPath.get('arguments');
  pathInvariant(callPath, argsPath.length > 0, 'Missing the argument with URL name');

  const [namePath, ...paramPaths] = argsPath;
  pathInvariant(
    namePath,
    types.isStringLiteral(namePath),
    'The URL name should be a string literal',
  );

  const urlName = namePath.node.value;
  pathInvariant(namePath, urlMap.has(urlName), `A URL with name "${urlName}" was not found`);

  const { params, quasis, template } = urlMap.get(urlName);
  const expectedParamCount = params.length;
  const paramExpressions = [];
  const allParams = new Set(params);
  const leftParams = new Set(params);
  let hadObjectParam = false;
  for (const paramPath of paramPaths) {
    if (types.isObjectExpression(paramPath)) {
      hadObjectParam = true;

      for (const propertyPath of paramPath.get('properties')) {
        pathInvariant(
          propertyPath,
          !propertyPath.node.computed,
          'Expected a non-computed identifier',
        );
        pathInvariant(
          propertyPath,
          !propertyPath.node.method,
          'Expected a property that is not a method',
        );

        const keyPath = propertyPath.get('key');
        pathInvariant(
          propertyPath,
          types.isIdentifier(keyPath),
          `Expected an identifier as a property name, not a ${typeof keyPath.node.value}`,
        );

        const { name } = keyPath.node;
        pathInvariant(
          keyPath,
          allParams.has(name),
          allParams.size === 0
            ? `Unknown parameter "${name}", none were expected (in "${template}")`
            : commaListsOr`Unknown parameter "${name}", expected one of: ${[...allParams].map(
                addQuotes,
              )} (in "${template}")`,
        );
        pathInvariant(
          keyPath,
          leftParams.has(name),
          `Named parameter "${name}" overrides the value from the preceeding arguments (in "${template}")`,
        );

        paramExpressions[params.indexOf(name)] = propertyPath.get('value').node;
        leftParams.delete(name);
      }
    } else {
      pathInvariant(
        paramPath,
        !hadObjectParam,
        'No more parameters should appear after an object parameter',
      );

      const index = paramPath.key - 1;
      pathInvariant(
        paramPath,
        index < expectedParamCount,
        `URL "${urlName}" accepts at most ${expectedParamCount} parameters but more were found (in "${template}")`,
      );

      paramExpressions[index] = paramPath.node;
      leftParams.delete(params[index]);
    }
  }

  pathInvariant(
    callPath,
    leftParams.size === 0,
    commaLists`Missing values for parameters: ${[...leftParams].map(addQuotes)} (in "${template}")`,
  );

  const urlTemplate = types.templateLiteral(quasis, paramExpressions);
  callPath.replaceWith(urlTemplate);
}

const fileCache = new Map();

function getQuasiFromString(string) {
  return types.templateElement({ raw: string });
}

function processConfig(config) {
  config.forEach(info => {
    const { strings, params } = getPartsFromTemplate(info.template);
    info.params = params;
    info.quasis = strings.map(getQuasiFromString);
    info.strings = strings;
  });
  return new Map(config.map(info => [info.name, info]));
}

function getUrlMap({ urlsPath }) {
  if (!urlsPath) {
    return new Map();
  }
  if (!fileCache.has(urlsPath)) {
    const config = require(urlsPath);
    const processedConfig = processConfig(config);
    fileCache.set(urlsPath, processedConfig);
  }
  return fileCache.get(urlsPath);
}

function resolve({ references, config = {} }) {
  if (!references || !references.default || references.default.length === 0) {
    return;
  }
  const urlMap = getUrlMap(config);
  references.default.forEach(path => handlePath(path, urlMap));
}

module.exports = createMacro(resolve, { configName: 'resolve' });
