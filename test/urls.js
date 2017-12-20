'use strict';

module.exports = [
  {
    name: 'no-params',
    template: 'params/zero',
    strings: ['params/zero'],
    params: [],
  },
  {
    name: 'three-params',
    template: 'params/${first}-${second}/${third}/',
    strings: ['params/', '-', '/', '/'],
    params: [
      'first',
      'second',
      'third',
    ],
  },
];
