'use strict';

const { createMacro } = require('babel-macros');
const types = require('babel-types');

function getQuasiFromString(string) {
  return types.templateElement({ raw: string });
}

const urls = [
  {
    name: 'sendgrid-event',
    urlTemplate: 'sendgrid/event/',
    quasis: ['sendgrid/event/'].map(getQuasiFromString),
    params: [],
  },
  {
    name: 'view_lesson_task',
    urlTemplate: 'programmers/lessons/${number}-${slug}/${task_name}/',
    quasis: ['programmers/lessons/', '-', '/', '/'].map(getQuasiFromString),
    params: [
      'number',
      'slug',
      'task_name',
    ],
  },
];

const urlMap = new Map(urls.map(info => [info.name, info]));

function pathInvariant(path, predicate, message) {
  if (!predicate) {
    throw path.buildCodeFrameError(message);
  }
}

function handlePath(path) {
  const callPath = path.parentPath;
  pathInvariant(path, types.isCallExpression(callPath), '`resolve` should be called like a function');

  const argsPath = callPath.get('arguments');
  pathInvariant(callPath, argsPath.length > 0, 'Missing the argument with URL name');

  const [namePath, ...paramPaths] = argsPath;
  pathInvariant(namePath, types.isStringLiteral(namePath), 'The URL name should be a string literal');

  const urlName = namePath.node.value;
  pathInvariant(namePath, urlMap.has(urlName), `A URL with name "${urlName}" was not found`);

  const { params, quasis } = urlMap.get(urlName);
  const expectedParamCount = params.length;
  const paramExpressions = [];
  const allParams = new Set(params);
  const leftParams = new Set(params);
  let hadObjectParam = false;
  for (const paramPath of paramPaths) {
    if (types.isObjectExpression(paramPath)) {
      hadObjectParam = true;

      for (const propertyPath of paramPath.get('properties')) {
        const keyPath = propertyPath.get('key');
        pathInvariant(keyPath, types.isIdentifier(keyPath), 'Expected a valid identifier');

        const { name } = keyPath.node;
        pathInvariant(
          keyPath,
          allParams.has(name),
          `Unknown parameter, expected one of: ${[...allParams].join(', ')}`,
        );
        pathInvariant(keyPath, leftParams.has(name), 'Named parameter overrides the value from preceeding arguments');

        paramExpressions[params.indexOf(name)] = propertyPath.get('value').node;
        leftParams.delete(name);
      }
    } else {
      pathInvariant(paramPath, !hadObjectParam, 'No more parameters should appear after an object param');

      const index = paramPath.key - 1;
      pathInvariant(
        paramPath,
        index < expectedParamCount,
        `URL "${urlName}" accepts at most ${expectedParamCount} parameters; more were found`,
      );

      paramExpressions[index] = paramPath.node;
      leftParams.delete(params[index]);
    }
  }

  pathInvariant(callPath, leftParams.size === 0, `Missing values for parameters: ${[...leftParams].join(', ')}`);

  const urlTemplate = types.templateLiteral(quasis, paramExpressions);
  callPath.replaceWith(urlTemplate);
}

function resolve({ references, state, babel }) {
  if (!references || !references.default || references.default.length === 0) {
    return;
  }

  references.default.forEach(path => handlePath(path));
}

module.exports = createMacro(resolve);
