'use strict';

const { transform } = require('babel-core');
const { stripIndent } = require('common-tags');
const stripAnsi = require('strip-ansi');

function wrapCode(code) {
  return stripIndent`
    const resolveUrl = require('./src/resolveUrl.macro');
    ${stripIndent([code])}
  `;
}

function getTransformedCode(code) {
  const options = {
    filename: 'test.js',
    plugins: ['babel-plugin-macros'],
  };
  return transform(wrapCode(code), options).code;
}

function testBabelSucess(testName, code, expected) {
  it(testName, () => {
    const result = getTransformedCode(code);
    expect(stripIndent([result])).toBe(expected);
  });
}

function testBabelError(testName, code) {
  it(testName, () => {
    try {
      getTransformedCode(code);
    } catch (error) {
      expect(`${error.message}\n\n${stripAnsi(error.codeFrame)}\n`).toMatchSnapshot();
      return;
    }
    throw new Error('Expected an error, but none was thrown');
  });
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
  });

  describe('errors while resolving', () => {
    testBabelError('should throw when the URL name is unknown', "resolveUrl('dunno');");

    testBabelError(
      'should throw when the number of params is greater than expected',
      "resolveUrl('no-params', 42);",
    );

    testBabelError(
      'should throw when the number of params is greater than expected',
      "resolveUrl('three-params', 'one', 'two', 'three', 'oops');",
    );

    testBabelError(
      'should throw when the number of params is less than expected',
      "resolveUrl('three-params', 42);",
    );

    testBabelError(
      'should throw when an unknown param is passed',
      "resolveUrl('no-params', { foobar: 42 });",
    );

    testBabelError(
      'should throw when an unknown param is passed (more params)',
      "resolveUrl('three-params', 'one', 'two', { third: three, foobar: 42 });",
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
      "resolveUrl('three-params', 'one', 'two', 'third', { third: three });",
    );

    testBabelError(
      'should throw when an argument is passed after an object argument',
      "resolveUrl('three-params', 'one', 'two', { third: three }, 'foobar');",
    );
  });
});
