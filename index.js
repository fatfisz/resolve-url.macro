'use strict';

exports.getQueryString = function getQueryString(params) {
  const query = Object.keys(params)
    .filter(key => params[key] != null)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');

  return query.length === 0 ? '' : '?' + query;
}

exports.getUrlWithQueryString = function getUrlWithQueryString(url, params) {
  return url + getQueryString(params);
}
