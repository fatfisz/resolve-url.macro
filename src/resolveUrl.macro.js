'use strict';

const types = require('@babel/types');
const { createMacro } = require('babel-plugin-macros');
const { commaListsOr } = require('common-tags');

const getUrlMap = require('./getUrlMap');
const { getUrlName } = require('./utils');

function pathInvariant(path, predicate, message) {
  if (!predicate) {
    throw path.buildCodeFrameError(message);
  }
}

function quotedStrings(strings) {
  return [...strings].map(string => `"${string}"`);
}

function validateAndGetArguments(path) {
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

  const namedParamPaths = [];
  let hadObjectParam = false;

  for (const paramPath of paramPaths) {
    pathInvariant(
      paramPath,
      !hadObjectParam,
      'No more parameters should appear after an object parameter',
    );

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

        namedParamPaths.push([keyPath, propertyPath.get('value')]);
      }
    }
  }

  if (hadObjectParam) {
    paramPaths.pop();
  }

  return [namePath.node.value, paramPaths, namedParamPaths];
}

function handlePath(path, urlMap) {
  const [nameArg, paramPaths, namedParamPaths] = validateAndGetArguments(path);
  const arity = paramPaths.length + namedParamPaths.length;
  const urlName = getUrlName(nameArg, arity);

  pathInvariant(
    path,
    urlMap.has(urlName),
    `A URL with name "${nameArg}" and arity ${arity} was not found`,
  );

  const { params, quasis, template } = urlMap.get(urlName);
  const paramExpressions = [];
  const allParams = new Set(params);
  const leftParams = new Set(params);

  for (const paramPath of paramPaths) {
    paramExpressions.push(paramPath.node);
    leftParams.delete(params[paramPath.key - 1]);
  }

  for (const [keyPath, paramPath] of namedParamPaths) {
    const { name } = keyPath.node;
    pathInvariant(
      keyPath,
      allParams.has(name),
      commaListsOr`
        Unknown parameter "${name}", expected one of: ${quotedStrings(allParams)} (in "${template}")
      `,
    );
    pathInvariant(
      keyPath,
      leftParams.has(name),
      `Named parameter "${name}" overrides the value from the preceeding arguments (in "${template}")`,
    );

    paramExpressions[params.indexOf(name)] = paramPath.node;
    leftParams.delete(name);
  }

  const urlTemplate = types.templateLiteral(quasis, paramExpressions);
  path.parentPath.replaceWith(urlTemplate);
}

function resolve({ references, config = {} }) {
  if (!references || !references.default || references.default.length === 0) {
    return;
  }
  const urlMap = getUrlMap(config);
  references.default.forEach(path => handlePath(path, urlMap));
}

module.exports = createMacro(resolve, { configName: 'resolve' });
