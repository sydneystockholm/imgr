/**
 * Module dependencies.
 */

var Server = require('./server').Server
  , Converter = require('./converter').Converter
  , constants = require('./constants')
  , utils = require('./utils');

/**
 * Default options.
 */

var default_options = {
    concurrency: 10
};

/**
 * Create a new IMGR instance.
 *
 * @param {Object} options (optional)
 */

var IMGR = exports.IMGR = function (options) {
    this.options = utils.mergeDefaults(options, default_options);
};

/**
 * Create a new image server.
 *
 * @param {String} path
 */

IMGR.prototype.serve = function (path) {
    return new Server(path, this.options, this);
};

/**
 * Create a new image converter.
 *
 * @param {String} path
 */

IMGR.prototype.load = function (path) {
    var converter = new Converter(path, this.options)
      , concurrency = this.options.concurrency
      , identical = {}
      , pending = []
      , running = 0;

    //Only serve `options.concurrency` conversion requests at a time (FIFO)
    utils.concurrent(converter, 'save', this.options.concurrency);

    //Ensure identical conversion requests are executed once
    var save_2 = converter.save;
    converter.save = function (path, callback) {
        var key = utils.md5(JSON.stringify({ path: path, parameters: this.operation }));
        if (key in identical) {
            identical[key].push(callback);
        } else {
            identical[key] = [ callback ];
            save_2.call(this, path, function () {
                for (var i = 0, l = identical[key].length; i < l; i++) {
                    identical[key][i].apply(this, arguments);
                }
                delete identical[key];
            });
        }
        return this;
    };

    return converter;
};

/**
 * Export constants from `./constants.js`.
 */

for (var key in constants) {
    IMGR.prototype[key] = constants[key];
}

