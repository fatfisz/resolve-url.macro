'use strict';

const types = require('@babel/types');

const { pathInvariant } = require('./utils');

function getCallPath(path) {
  if (types.isCallExpression(path.parentPath.node)) {
    return { callPath: path.parentPath };
  }

  if (types.isMemberExpression(path.parentPath.node)) {
    pathInvariant(
      path.parentPath.get('property'),
      types.isIdentifier(path.parentPath.node.property, { name: 'withQuery' }),
      'Unknown property of `resolve` (only `resolve.withQuery` is supported)',
    );

    pathInvariant(
      path.parentPath,
      types.isCallExpression(path.parentPath.parentPath.node),
      '`resolve.withQuery` should be called like a function',
    );

    return { callPath: path.parentPath.parentPath, withQuery: true };
  }

  pathInvariant(path, false, '`resolve` should be called like a function');
}

module.exports = function validateAndGetArguments(path) {
  const { callPath, withQuery = false } = getCallPath(path);

  const argsPath = callPath.get('arguments');
  pathInvariant(callPath, argsPath.length > 0, 'Missing the argument with URL name');

  const [namePath, ...paramPaths] = argsPath;
  pathInvariant(
    namePath,
    types.isStringLiteral(namePath.node),
    'The URL name should be a string literal',
  );

  const queryParamPath = withQuery ? paramPaths.pop() : null;
  pathInvariant(namePath, !withQuery || queryParamPath, 'The query argument is missing');

  const namedParamPaths = [];
  let hadObjectParam = false;

  for (const paramPath of paramPaths) {
    pathInvariant(
      paramPath,
      !hadObjectParam,
      'No more parameters should appear after an object parameter',
    );

    if (types.isObjectExpression(paramPath.node)) {
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
          types.isIdentifier(keyPath.node),
          `Expected an identifier as a property name, not a ${typeof keyPath.node.value}`,
        );

        namedParamPaths.push([keyPath, propertyPath.get('value')]);
      }
    }
  }

  if (hadObjectParam) {
    paramPaths.pop();
  }

  return {
    callPath,
    nameArg: namePath.node.value,
    paramPaths,
    namedParamPaths,
    queryParamPath,
  };
};
