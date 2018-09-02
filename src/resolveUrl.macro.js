'use strict';

const types = require('@babel/types');
const { createMacro } = require('babel-plugin-macros');
const { commaListsOr } = require('common-tags');

const getUrlMap = require('./getUrlMap');
const replaceMacroPathWithRuntime = require('./replaceMacroPathWithRuntime');
const { getUrlName, pathInvariant } = require('./utils');
const validateAndGetArguments = require('./validateAndGetArguments');

function quotedStrings(strings) {
  return [...strings].map(string => `"${string}"`);
}

function getReplacementNode(path, quasis, paramExpressions, queryParamPath) {
  const urlTemplateNode = types.templateLiteral(quasis, paramExpressions);

  if (queryParamPath === null) {
    return urlTemplateNode;
  }

  return types.callExpression(
    types.memberExpression(path.node, types.identifier('getUrlWithQueryString')),
    [urlTemplateNode, queryParamPath.node],
  );
}

function handlePath(path, urlMap, state) {
  const {
    callPath,
    nameArg,
    paramPaths,
    namedParamPaths,
    queryParamPath,
  } = validateAndGetArguments(path);
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

  const replacementNode = getReplacementNode(path, quasis, paramExpressions, queryParamPath);
  callPath.replaceWith(replacementNode);

  if (queryParamPath !== null && !state.hasRuntime) {
    replaceMacroPathWithRuntime(path);
    state.hasRuntime = true;
  }
}

function resolve({ references, config = {} }) {
  if (!references || !references.default || references.default.length === 0) {
    return;
  }

  const urlMap = getUrlMap(config);
  const state = { hasRuntime: false };

  references.default.forEach(path => handlePath(path, urlMap, state));

  return {
    keepImports: state.hasRuntime,
  };
}

module.exports = createMacro(resolve, { configName: 'resolve' });
