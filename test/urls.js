'use strict';

module.exports = [
  {
    name: 'no-params',
    template: 'params/zero/',
  },
  {
    name: 'one-param',
    template: 'params/one/${first}/',
  },
  {
    name: 'three-params',
    template: 'params/three/${first}-${second}/${third}/',
  },
  {
    name: 'optional-param',
    template: 'params/optional/',
  },
  {
    name: 'optional-param',
    template: 'params/optional/${id}/',
  },
];
