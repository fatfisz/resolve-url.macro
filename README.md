# resolve-url.macro

> Resolve your URLs during build

[![Build Status](https://travis-ci.org/fatfisz/resolve-url.macro.svg?branch=master)](https://travis-ci.org/fatfisz/resolve-url.macro)
[![Greenkeeper badge](https://badges.greenkeeper.io/fatfisz/resolve-url.macro.svg)](https://greenkeeper.io/)

This macro allows you to resolve the URLs from the back end (e.g. a Django app) in the client-side JS code.
Thanks to that the URLs can be verified at the build time, and only used URLs will appear in the code.

## Getting started

First of all, you'll [Babel](https://github.com/babel/babel).

Then, install [babel-plugin-macros](https://github.com/kentcdodds/babel-plugin-macros) together with this package:
```shell
yarn add -D resolve-url.macro babel-plugin-macros
# or
npm install -D resolve-url.macro babel-plugin-macros
```

Finally, add a configuration file in the root of your project, called `.babel-plugin-macros.config.js`:
```js
module.exports = {
  resolve: {
    urlsPath: 'path/to/urls',
  },
};
```

This is it for the configuration, but what's inside the URLs file?

## The URLs file

This file should contain a list of available URLs. Each URL should consist of:
- a name: e.g. "login", "get-me-that-data",
- a template: e.g. "/login", "/items/${id}"

As for the format, it can be either a JS file:
```js
module.exports = [
  {
    name: 'no-params',
    template: 'params/zero/',
  },
  {
    name: 'three-params',
    template: 'params/three/${first}-${second}/${third}/',
  },
];
```

or a JSON file:
```json
[
  {
    "name": "no-params",
    "template": "params/zero/"
  },
  {
    "name": "three-params",
    "template": "params/three/${first}-${second}/${third}/"
  }
]
```

The parts of the URL wrapped in `${}` will be recognized as URL parameters.

Such a file will most probably be produced by another tool (coming soon!).

## Using in the code

As with other macros built on `babel-plugin-macros`, you'll need to import the macro. After that just use it as a function:
```js
const resolveUrl = require('./src/resolveUrl.macro');

$.post(resolveUrl('three-params', 2 + 2, -1, 'quick maths'), data, ...);
```

The URL will be inlined using the configuration and will turn into something like this:
```js
$.post(`params/three/${2 + 2}-${-1}-${'quick maths'}`, data, ...);
```

The number of parameters has to match the predefined URL template. Notice that the expressions are preserved and will be computed at runtime.

### Using the object parameter

It's also possible to pass an object as a parameter to the `resolveUrl` function. In that case property names have to match parameters from the URL template:
```js
const resolveUrl = require('./src/resolveUrl.macro');

$.post(resolveUrl('three-params', 2 + 2, { third: 'quick maths', second: -1 }), data, ...);
```

In such a situation the object has to be the last argument.

## Info for contributors

Everyone is welcome to contribute to the package - just be nice.

After cloning the repo you'll have a few commands useful in development:
* `lint` - just lints (using [ESLint](https://github.com/eslint/eslint) and [Prettier](https://github.com/prettier/prettier))
* `lint:fix` - lints and fixes what's possible; use it especially for autoformatting
* `test` - tests the code using [Jest](https://github.com/facebook/jest)
* `test:update` - test and updates the snapshots if they've changed

## License

Copyright (c) 2018 Rafał Ruciński. Licensed under the MIT license.
