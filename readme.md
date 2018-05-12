# stylelint-webpack-plugin

A CSSComb plugin for webpack

## Requirements

This module requires a minimum of Node v6.9.0 and it's compatible with both Webpack 3 and 4.

## Getting Started

To begin, you'll need to install `csscomb-webpack-plugin`:

```console
$ npm install csscomb-webpack-plugin --save-dev
```

Then add the plugin to your `webpack` config. For example:

```js
// webpack.config.js
const CSSCombPlugin = require('csscomb-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new CSSCombPlugin(options),
  ],
  // ...
}
```

And run `webpack` via your preferred method.

## Options

### `configFile`

Type: `String`
Default: `./.csscomb`

Specify the config file location to be used by `CSSComb`.

_Note: If no config was found, it will load CSSComb standard config_

### `files`

Type: `String|Array[String]`
Default: `'**/*.s?(a|c)ss'`

Specify the glob pattern for finding files.

### `displayErrors`

Type: `Boolean`
Default: `true`

Show CSSComb error messages.

## License

#### [MIT](./LICENSE)