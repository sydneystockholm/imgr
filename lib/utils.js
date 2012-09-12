var crypto = require('crypto')
  , utils = exports;

/**
 * Merge defaults into an options object.
 *
 * @param {Object} options
 * @param {Object] defaults
 */

utils.mergeDefaults = function (options, defaults) {
    options = options || {};
    for (var key in defaults) {
        if (typeof options[key] === 'undefined') {
            options[key] = defaults[key];
        } else if (typeof defaults[key] === 'object') {
            utils.mergeDefault(options[key], defaults[key]);
        }
    }
    return options;
};

/**
 * Create a set from an array where elements are stored as object keys.
 *
 * @param {Array} arr
 * @return {Object} set
 * @api public
 */

utils.createSet = function (arr) {
    var obj = {};
    arr.forEach(function (elem) {
        obj[elem] = 1;
    });
    return obj;
};

/**
 * Get the MD5 hash of a string.
 *
 * @param {String} str
 * @return {String} hash
 * @api public
 */

utils.md5 = function (str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

/**
 * Manage concurrency.
 *
 * @param {Object} prototype
 * @param {String} fn - the function name
 * @param {Number} concurrency
 */

utils.concurrent = function (prototype, fn, concurrency) {
    var original = prototype[fn]
      , running = 0
      , pending = [];
    prototype[fn] = function () {
        var scope = this;
        pending.push(Array.prototype.slice.call(arguments));
        (function next() {
            while (pending.length && running < concurrency) {
                var args = pending.shift()
                  , callback = args.pop();
                args.push(function () {
                    running--;
                    process.nextTick(next);
                    callback.apply(this, arguments);
                });
                running++;
                original.apply(scope, args);
            }
        })();
    };
};

