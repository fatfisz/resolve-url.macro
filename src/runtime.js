'use strict';

exports.getQueryString = function getQueryString(params) {
  const query = Object.keys(params)
    // eslint-disable-next-line
    .filter(key => params[key] != null)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');

  return query.length === 0 ? '' : '?' + query;
};

exports.getUrlWithQueryString = function getUrlWithQueryString(url, params) {
  return url + exports.getQueryString(params);
};
