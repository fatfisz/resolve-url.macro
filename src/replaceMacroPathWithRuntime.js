'use strict';

const types = require('@babel/types');

module.exports = function replaceMacroPathWithRuntime(path) {
  const declaration = path.scope.getBinding(path.node.name).path;

  const pathArgument = types.isImportDefaultSpecifier(declaration)
    ? declaration.parentPath.get('source')
    : declaration.get('init').get('arguments.0');

  pathArgument.replaceWith(types.stringLiteral(`${pathArgument.node.value}/src/runtime`));
};
