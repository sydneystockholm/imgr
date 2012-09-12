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

