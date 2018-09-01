'use strict';

const { getQueryString } = require('../index');

describe('getQueryString', () => {
  it('should return empty string for no parameters', () => {
    expect(getQueryString({})).toBe('');
  });

  it('should convert special characters', () => {
    const params = { redirect_url: 'https://example.com/foobar' };
    expect(getQueryString(params)).toBe('?redirect_url=https%3A%2F%2Fexample.com%2Ffoobar');
  });

  it('should handle multiple params', () => {
    const params = { foo: 42, bar: 'hello world' };
    expect(getQueryString(params)).toBe('?foo=42&bar=hello%20world');
  });

  it('should ignore null and undefined', () => {
    const params = { foo: 42, ignored1: undefined, ignored2: null, bar: 'hello world' };
    expect(getQueryString(params)).toBe('?foo=42&bar=hello%20world');
  });
});
