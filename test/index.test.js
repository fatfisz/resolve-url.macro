'use strict';

const { transform } = require('babel-core');
const { stripIndent } = require('common-tags');
const stripAnsi = require('strip-ansi');

function wrapCode(code) {
  return stripIndent`
    const resolve = require('./src/resolveUrl.macro');
    ${stripIndent([code])}
  `;
}

function getTransformedCode(code) {
  const options = {
    filename: 'test.js',
    plugins: ['babel-macros'],
  };
  return transform(wrapCode(code), options).code;
}

function testBabelSucess(testName, code) {
  it(testName, () => {
    const result = getTransformedCode(code);
    expect(stripIndent([result])).toMatchSnapshot();
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

describe('resolve', () => {
  describe('invalid usage', () => {
    testBabelError('should throw when not used as a call', 'resolve;');

    testBabelError('should throw when not used as a call (with property)', 'resolve.something;');

    testBabelError('should throw when the params are missing', 'resolve();');

    testBabelError('should throw when the URL param is not a string', 'resolve(42);');
  });

  describe('happy paths', () => {
    testBabelSucess('should resolve the URL with no params', "resolve('no-params');");

    testBabelSucess(
      'should resolve the URL with no params (empty named params object)',
      "resolve('no-params', {});",
    );

    testBabelSucess(
      'should resolve the URL with identifiers as params',
      "resolve('three-params', one, two, three);",
    );

    testBabelSucess(
      'should resolve the URL with strings as params',
      "resolve('three-params', 'one', 'two', 'three');",
    );

    testBabelSucess(
      'should resolve the URL with numbers as params',
      "resolve('three-params', 1, 2, 3);",
    );

    testBabelSucess(
      'should resolve the URL with expressions as params',
      "resolve('three-params', 1 + 2, 'one' + 'two', (() => 'yo')());",
    );

    testBabelSucess(
      'should resolve the URL with templates as params',
      "resolve('three-params', `${1} + ${2}`, `${'one'} + ${'two'}`, `${(() => `${yo}`)()}`);",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (1 out of 3)',
      "resolve('three-params', 'one', 'two', { third: 'three' });",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (2 out of 3)',
      "resolve('three-params', 'one', { second: 'two', third: 'three' });",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (3 out of 3)',
      "resolve('three-params', { second: 'two', third: 'three', first: 'one' });",
    );

    testBabelSucess(
      'should resolve the URL with partially named params (expressions)',
      "resolve('three-params', { second: 'one' + 'two', third: (() => 'yo')(), first: 1 + 2 });",
    );
  });

  describe('errors while resolving', () => {
    testBabelError('should throw when the URL name is unknown', "resolve('dunno');");

    testBabelError(
      'should throw when the number of params is greater than expected',
      "resolve('no-params', 42);",
    );

    testBabelError(
      'should throw when the number of params is greater than expected',
      "resolve('three-params', 'one', 'two', 'three', 'oops');",
    );

    testBabelError(
      'should throw when the number of params is less than expected',
      "resolve('three-params', 42);",
    );

    testBabelError(
      'should throw when an unknown param is passed',
      "resolve('no-params', { foobar: 42 });",
    );

    testBabelError(
      'should throw when an unknown param is passed (more params)',
      "resolve('three-params', 'one', 'two', { third: three, foobar: 42 });",
    );

    testBabelError(
      'should throw when a computed property is passed',
      "resolve('three-params', 'one', 'two', { ['thi' + 'rd']: three });",
    );

    testBabelError(
      'should throw when a number property is passed',
      "resolve('three-params', 'one', 'two', { 3: three });",
    );

    testBabelError(
      'should throw when a string property is passed',
      "resolve('three-params', 'one', 'two', { 'third': three });",
    );

    testBabelError(
      'should throw when a method is passed',
      "resolve('three-params', 'one', 'two', { third() {} });",
    );

    testBabelError(
      'should throw when a param is duplicated',
      "resolve('three-params', 'one', 'two', 'third', { third: three });",
    );

    testBabelError(
      'should throw when an argument is passed after an object argument',
      "resolve('three-params', 'one', 'two', { third: three }, 'foobar');",
    );
  });
});
