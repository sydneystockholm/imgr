var imagesize = require('imagesize')
  , fs = require('fs');

/**
 * Get the dimensions of an image.
 *
 * @param {String} path
 * @param {Function} callback - receives (err, dimensions)
 */

module.exports = function (path, callback) {
    var stream = fs.createReadStream(path);
    imagesize(stream, function (err, dimensions) {
        stream.destroy();
        callback(err, dimensions);
    });
};

