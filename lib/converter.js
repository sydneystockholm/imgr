/**
 * Module dependencies.
 */

var gm = require('gm')
  , fs = require('fs')
  , child = require('child_process')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , utils = require('./utils')
  , imgr = require('./constants');

/**
 * A stub for skipping optimisation. Replace this function
 * with your own to enable image optimisation.
 *
 * @param {String} path
 * @param {Function} callback
 */

function noOptimisation(path, callback) {
    callback();
}

/**
 * Default options.
 */

var default_options = {
    orientation: imgr.CENTRE
  , image_magick: false
  , optimisation: noOptimisation
  , optimisation_concurrency: 10
};

/**
 * Create a new image converter.
 *
 * @param {String} image - the image to load
 * @param {Object} options (optional)
 */

var Converter = exports.Converter = function (image, options) {
    this.image = image;
    this.options = utils.mergeDefaults(options, default_options);
    this.gm = gm.subClass({ imageMagick: this.options.image_magick });
    this.operation = {};
};

/**
 * Resize an image to the specified width.
 *
 * @param {Number} width
 * @return this
 */

Converter.prototype.resizeToWidth = function (width) {
    this.operation.width = width;
    return this;
};

/**
 * Resize an image to the specified height.
 *
 * @param {Number} height
 * @return this
 */

Converter.prototype.resizeToHeight = function (height) {
    this.operation.height = height;
    return this;
};

/**
 * Resize an image by the specified factor, e.g. 0.5 would resize the image
 * to be half the width and height that it was.
 *
 * @param {Number} factor
 * @return this
 */

Converter.prototype.resizeByFactor = function (factor) {
    this.operation.factor = factor;
    return this;
};

/**
 * Resize an image to an exact width and height using adaptive resizing.
 * Crop the largest portion of the image with the same aspect ratio and
 * then resize to the desired dimensions.
 *
 * @param {Number} width
 * @param {Number} height
 * @param {Number} orientation (optional)
 * @return this
 */

Converter.prototype.adaptiveResize = function (width, height, orientation) {
    this.operation.width = width;
    this.operation.height = height;
    this.operation.orientation = orientation || this.options.orientation;
    return this;
};

/**
 * Crop an image to the specified width and height, starting from the
 * specified x and y point.
 *
 * @param {Number} width
 * @param {Number} height
 * @param {Number} x (optional)
 * @param {Number} y (optional)
 * @return this
 */

Converter.prototype.crop = function (width, height, x, y) {
    this.operation.crop_width = width;
    this.operation.crop_height = height;
    this.operation.x = x || 0;
    this.operation.y = y || 0;
    return this;
};

/**
 * Execute the pending conversion and save the resulting image to `output`.
 *
 * @param {String} output
 * @param {Function} callback
 */

Converter.prototype.save = function (output, callback) {
    var dir = path.dirname(output)
      , image = this.gm(this.image)
      , operation = this.operation
      , self = this;

    this.callback = callback;

    //Create the output dir if it doesn't already exist
    mkdirp(dir, function () {

        //Skip resize/crop?
        if (!operation.width && !operation.height && !operation.factor && !operation.crop_width) {
            return self.copy(self.image, output, function (err) {
                return self.finalise(err);
            });
        }

        //Get the current image dimensions
        image.size(function (err, size) {
            if (err || !size) {
                return self.finalise(err || 'Failed to obtain image dimensions');
            }

            //Adaptive resizing
            if (operation.width && operation.height && typeof operation.crop_width === 'undefined') {
                var original_ar = size.width / size.height
                  , new_ar = operation.width / operation.height;
                if (new_ar < original_ar) {
                    operation.crop_width = Math.round(operation.width * size.height / operation.height);
                    if (operation.orientation === imgr.LEFT) {
                        operation.x = 0;
                    } else if (operation.orientation === imgr.CENTRE) {
                        operation.x = Math.round((size.width - operation.crop_width) / 2);
                    } else if (operation.orientation === imgr.RIGHT) {
                        operation.x = size.width - operation.crop_width;
                    }
                } else if (new_ar > original_ar) {
                    operation.crop_height = Math.round(operation.height * size.width / operation.width);
                    if (operation.orientation === imgr.TOP) {
                        operation.y = 0;
                    } else if (operation.orientation === imgr.CENTRE) {
                        operation.y = Math.round((size.height - operation.crop_height) / 2);
                    } else if (operation.orientation === imgr.BOTTOM) {
                        operation.y = size.height - operation.crop_height;
                    }
                }
            }

            //Apply the crop operation
            if (operation.crop_width || operation.crop_height) {
                operation.x = operation.x || 0;
                operation.y = operation.y || 0;
                operation.crop_width = operation.crop_width || (size.width - operation.x);
                operation.crop_height = operation.crop_height || (size.height - operation.y);
                image.crop(operation.crop_width, operation.crop_height, operation.x, operation.y);
            }

            //Resize by a constant factor
            if (operation.factor) {
                operation.width = size.width * operation.factor;
                operation.height = size.height * operation.factor;
            }

            //Apply the resize operation
            if (operation.width || operation.height) {
                image.resize(operation.width, operation.height);
            }

            //Save the image
            image.write(output, function (err) {
                self.image = output;
                self.finalise(err);
            });
        });
    });
};

/**
 * Copy a file.
 *
 * @param {String} src
 * @param {String} dest
 * @param {Function} callback
 * @api private
 */

Converter.prototype.copy = function (src, dest, callback) {
    var stream = fs.createReadStream(src);
    stream.pipe(fs.createWriteStream(dest));
    stream.on('end', callback);
    stream.on('error', callback);
};

/**
 * Finalise the save() process.
 *
 * @param {Function} callback
 * @api private
 */

Converter.prototype.finalise = function (err) {
    var callback = this.callback
      , image = this.image
      , optimise = this.operation.optimisation
      , concurrency = this.operation.optimisation_concurrency;

    //Reset the operation
    this.operation = {};
    this.image = null;
    this.callback = null;

    if (err || !optimise) {
        if (typeof err === 'object' && err.message.indexOf('installed graphicsmagick') >= 0) {
            err = 'Graphicsmagick is not installed';
        }
        return callback(err);
    }

    //Call the optimisation function
    var fn = { optimise: optimise };
    utils.concurrent(fn, 'optimise', this.operation.optimisation_concurrency);
    fn.optimise(this.image, callback);
};

