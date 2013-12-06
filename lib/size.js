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
        if (err) err = new Error('The image dimensions could not be determined (the image may be invalid).');
        stream.destroy();
        callback(err, dimensions);
    });
};

