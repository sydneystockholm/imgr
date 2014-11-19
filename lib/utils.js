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
            utils.mergeDefaults(options[key], defaults[key]);
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
 * @param {String} fn_name
 * @param {Number} concurrency
 */

utils.concurrent = function (prototype, fn_name, concurrency) {
    var original = prototype[fn_name]
      , running = 0
      , pending = [];
    prototype[fn_name] = function () {
        pending.push([this, Array.prototype.slice.call(arguments)]);
        (function next() {
            while (pending.length && running < concurrency) {
                var context = pending.shift()
                  , scope = context[0]
                  , args = context[1]
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

/**
 * Prevent a function from being called with the same arguments simultaneously.
 *
 * @param {Object} prototype
 * @param {String} fn_name
 * @api public
 */

utils.floodProtection = function (prototype, fn_name) {
    var original = prototype[fn_name]
      , queue = {};
    prototype[fn_name] = function () {
        var args = Array.prototype.slice.call(arguments)
          , callback = args.pop()
          , hash = fn_name + ':' + JSON.stringify(args);
        if (hash in queue) {
            queue[hash].push(callback);
            return;
        } else {
            queue[hash] = [ callback ];
        }
        args.push(function () {
            var result = Array.prototype.slice.call(arguments);
            queue[hash].forEach(function (callback) {
                callback.apply(null, result);
            });
            delete queue[hash];
        });
        original.apply(this, args);
    };
};

