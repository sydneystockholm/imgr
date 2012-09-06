/**
 * Module dependencies.
 */

var server = require('./server').Server
  , converter = require('./converter').Converter
  , constants = require('./constants');

/**
 * Create a new IMGR instance.
 *
 * @param {Object} options (optional)
 */

var IMGR = exports.IMGR = function (options) {
    this.options = options;
};

/**
 * Create a new image server.
 *
 * @param {String} path
 */

IMGR.prototype.serve = function (path) {
    return new Server(path, this.options);
};

/**
 * Create a new image converter.
 *
 * @param {String} path
 */

IMGR.prototype.load = function (path) {
    return new Converter(path, this.options);
};

/**
 * Export constants from `./constants.js`.
 */

for (var key in constants) {
    IMGR.prototype[key] = constants[key];
}

