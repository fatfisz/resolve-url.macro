'use strict';

const { transform } = require('@babel/core');
const { stripIndent } = require('common-tags');
const stripAnsi = require('strip-ansi');

function wrapCode(code, useImport) {
  if (useImport) {
    return stripIndent`
      import resolveUrl from './src/resolveUrl.macro';
      ${stripIndent(code)}
    `;
  }

  return stripIndent`
    const resolveUrl = require('./src/resolveUrl.macro');
    ${stripIndent(code)}
  `;
}

function getTransformedCode(code, useImport) {
  const options = {
    filename: 'test.js',
    plugins: ['babel-plugin-macros'],
  };
  return transform(wrapCode(code, useImport), options).code;
}

function testBabelSucess(testName, code, expected, expectedImport = expected) {
  function test(useImport) {
    it(useImport ? `${testName} (import version)` : testName, () => {
      const result = getTransformedCode(code, useImport);
      expect(stripIndent(result)).toBe(stripIndent(useImport ? expectedImport : expected));
    });
  }

  test(false);
  test(true);
}

function stripFiles(message) {
  return message
    .split(': ')
    .slice(2)
    .join(': ');
}

function testBabelError(testName, code) {
  function test(useImport) {
    it(useImport ? `${testName} (import version)` : testName, () => {
      try {
        getTransformedCode(code, useImport);
      } catch (error) {
        expect(`\n${stripFiles(stripAnsi(error.message))}\n`).toMatchSnapshot();
        return;
      }
      throw new Error('Expected an error, but none was thrown');
    });
  }

  test(false);
  test(true);
}

describe('resolveUrl', () => {
  describe('invalid usage', () => {
    testBabelError('should throw when not used as a call', 'resolveUrl;');

    testBabelError('should throw when not used as a call (with property)', 'resolveUrl.something;');

    testBabelError('should throw when the params are missing', 'resolveUrl();');

    testBabelError('should throw when the URL param is not a string', 'resolveUrl(42);');
  });

  describe('happy paths', () => {
    testBabelSucess(
      'should resolve the URL with no params',
      "resolveUrl('no-params');",
      '`params/zero/`;',
    );

    testBabelSucess(
      'should resolve the URL with no params (empty named params object)',
      "resolveUrl('no-params', {});",
      '`params/zero/`;',
    );

    testBabelSucess(
      'should resolve the URL with identifiers as params',
      "resolveUrl('three-params', one, two, three);",
      '`params/three/${one}-${two}/${three}/`;',
    );

    testBabelSucess(
      'should resolve the URL with strings as params',
      "resolveUrl('three-params', 'one', 'two', 'three');",
      "`params/three/${'one'}-${'two'}/${'three'}/`;",
    );

    testBabelSucess(
      'should resolve the URL with numbers as params',
      "resolveUrl('three-params', 1, 2, 3);",
      '`params/three/${1}-${2}/${3}/`;',
    );

    testBabelSucess(
      'should resolve the URL with expressions as params',
      "resolveUrl('three-params', 1 + 2, 'one' + 'two', (() => 'yo')());",
      "`params/three/${1 + 2}-${'one' + 'two'}/${(() => 'yo')()}/`;",
    );

    testBabelSucess(
      'should resolve the URL with templates as params',
      "resolveUrl('three-params', `${1} + ${2}`, `${'one'} + ${'two'}`, `${(() => `${yo}`)()}`);",
      "`params/three/${`${1} + ${2}`}-${`${'one'} + ${'two'}`}/${`${(() => `${yo}`)()}`}/`;",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (1 out of 3)',
      "resolveUrl('three-params', 'one', 'two', { third: 'three' });",
      "`params/three/${'one'}-${'two'}/${'three'}/`;",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (2 out of 3)',
      "resolveUrl('three-params', 'one', { second: 'two', third: 'three' });",
      "`params/three/${'one'}-${'two'}/${'three'}/`;",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (3 out of 3)',
      "resolveUrl('three-params', { second: 'two', third: 'three', first: 'one' });",
      "`params/three/${'one'}-${'two'}/${'three'}/`;",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (expressions)',
      "resolveUrl('three-params', { second: 'one' + 'two', third: (() => 'yo')(), first: 1 + 2 });",
      "`params/three/${1 + 2}-${'one' + 'two'}/${(() => 'yo')()}/`;",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (object shorthand syntax)',
      "resolveUrl('three-params', { first, second, third });",
      '`params/three/${first}-${second}/${third}/`;',
    );

    testBabelSucess(
      'should resolve the URL with optional param not passed',
      "resolveUrl('optional-param');",
      '`params/optional/`;',
    );

    testBabelSucess(
      'should resolve the URL with optional param passed',
      "resolveUrl('optional-param', 'foobar');",
      "`params/optional/${'foobar'}/`;",
    );
  });

  describe('errors while resolving', () => {
    testBabelError('should throw when the URL name is unknown', "resolveUrl('dunno');");

    testBabelError('should throw when the URL name is ignored', "resolveUrl('ignored');");

    testBabelError(
      'should throw when the number of params is greater than expected',
      "resolveUrl('no-params', 42);",
    );

    testBabelError(
      'should throw when the number of params is greater than expected (more params)',
      "resolveUrl('three-params', 'one', 'two', 'three', 'oops');",
    );

    testBabelError(
      'should throw when the number of params is greater than expected (named params)',
      "resolveUrl('three-params', 'one', 'two', { third: 3, oops: 4 });",
    );

    testBabelError(
      'should throw when the number of params is less than expected',
      "resolveUrl('three-params', 42);",
    );

    testBabelError(
      'should throw when an unknown param is passed',
      "resolveUrl('one-param', { foobar: 42 });",
    );

    testBabelError(
      'should throw when an unknown param is passed (more params)',
      "resolveUrl('three-params', 'one', 'two', { foobar: 42 });",
    );

    testBabelError(
      'should throw when a computed property is passed',
      "resolveUrl('three-params', 'one', 'two', { ['thi' + 'rd']: three });",
    );

    testBabelError(
      'should throw when a number property is passed',
      "resolveUrl('three-params', 'one', 'two', { 3: three });",
    );

    testBabelError(
      'should throw when a string property is passed',
      "resolveUrl('three-params', 'one', 'two', { 'third': three });",
    );

    testBabelError(
      'should throw when a method is passed',
      "resolveUrl('three-params', 'one', 'two', { third() {} });",
    );

    testBabelError(
      'should throw when a param is duplicated',
      "resolveUrl('three-params', 'one', 'two', { second: three });",
    );

    testBabelError(
      'should throw when an argument is passed after an object argument',
      "resolveUrl('three-params', 'one', 'two', { third: three }, 'foobar');",
    );

    testBabelError(
      'should throw when an object argument is passed after an object argument',
      "resolveUrl('three-params', 'one', 'two', { third: three }, {});",
    );
  });
});

describe('resolveUrl.withQuery', () => {
  describe('invalid usage', () => {
    testBabelError('should throw when not used as a call', 'resolveUrl.withQuery;');

    testBabelError('should throw when the params are missing', 'resolveUrl.withQuery();');

    testBabelError('should throw when the URL param is not a string', 'resolveUrl.withQuery(42);');

    testBabelError(
      'should throw when the query argument is missing',
      "resolveUrl.withQuery('no-params');",
    );
  });

  describe('happy paths', () => {
    testBabelSucess(
      'should resolve the URL with no params',
      "resolveUrl.withQuery('no-params', { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should work with multiple calls',
      `
        resolveUrl.withQuery('no-params', { foo: bar });
        resolveUrl.withQuery('no-params', { foo: bar });
      `,
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should resolve the URL with no params (empty named params object)',
      "resolveUrl.withQuery('no-params', {}, { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/zero/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should resolve the URL with params',
      "resolveUrl.withQuery('three-params', 'one', 'two', 'three', { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should resolve the URL with partially named params (1 out of 3)',
      "resolveUrl.withQuery('three-params', 'one', 'two', { third: 'three' }, { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should resolve the URL with partially named params (2 out of 3)',
      "resolveUrl.withQuery('three-params', 'one', { second: 'two', third: 'three' }, { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should resolve the URL with partially named params (3 out of 3)',
      "resolveUrl.withQuery('three-params', { second: 'two', third: 'three', first: 'one' }, { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/three/$\{'one'}-$\{'two'}/$\{'three'}/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should resolve the URL with optional param not passed',
      "resolveUrl.withQuery('optional-param', { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/optional/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/optional/\`, {
          foo: bar
        });
      `,
    );

    testBabelSucess(
      'should resolve the URL with optional param passed',
      "resolveUrl.withQuery('optional-param', 'foobar', { foo: bar });",
      `
        const resolveUrl = require("./src/resolveUrl.macro/src/runtime");

        resolveUrl.getUrlWithQueryString(\`params/optional/$\{'foobar'}/\`, {
          foo: bar
        });
      `,
      `
        import resolveUrl from "./src/resolveUrl.macro/src/runtime";
        resolveUrl.getUrlWithQueryString(\`params/optional/$\{'foobar'}/\`, {
          foo: bar
        });
      `,
    );
  });
});
