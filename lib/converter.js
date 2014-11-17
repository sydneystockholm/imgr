/**
 * Module dependencies.
 */

var gm = require('gm')
  , fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , utils = require('./utils')
  , imagesize = require('./size')
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
  , gm_quality: 100
  , crop_offset: 0
  , filter: null
  , interlace: null
  , coalesce: true
  , trace: function () {}
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
 * Get an image size.
 *
 * @param {String} image
 * @param {Function} callback
 */

Converter.prototype.size = function (image, callback) {
    imagesize(image, callback);
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
        self.size(self.image, function (err, size) {
            if (err || !size) {
                return self.finalise(err || 'Failed to obtain image dimensions');
            }

            //Adaptive resizing
            if (operation.width && operation.height && typeof operation.crop_width === 'undefined') {
                var original_ar = size.width / size.height
                  , new_ar = operation.width / operation.height
                  , crop_offset = 0;
                if (new_ar < original_ar) {
                    operation.crop_width = Math.round(operation.width * size.height / operation.height);
                    if (self.options.crop_offset) {
                        crop_offset = size.width * self.options.crop_offset / 100;
                    }
                    if (operation.orientation === imgr.LEFT) {
                        operation.x = crop_offset;
                        if (operation.x + operation.crop_width > size.width) {
                            operation.x = size.width - operation.crop_width;
                        }
                    } else if (operation.orientation === imgr.CENTRE) {
                        operation.x = Math.round((size.width - operation.crop_width) / 2);
                    } else if (operation.orientation === imgr.RIGHT) {
                        operation.x = Math.max(size.width - operation.crop_width - crop_offset, 0);
                    }
                } else if (new_ar > original_ar) {
                    operation.crop_height = Math.round(operation.height * size.width / operation.width);
                    if (self.options.crop_offset) {
                        crop_offset = size.height * self.options.crop_offset / 100;
                    }
                    if (operation.orientation === imgr.TOP) {
                        operation.y = crop_offset;
                        if (operation.y + operation.crop_height > size.height) {
                            operation.y = size.height - operation.crop_height;
                        }
                    } else if (operation.orientation === imgr.CENTRE) {
                        operation.y = Math.round((size.height - operation.crop_height) / 2);
                    } else if (operation.orientation === imgr.BOTTOM) {
                        operation.y = Math.max(size.height - operation.crop_height - crop_offset, 0);
                    }
                }
            }

            //Coalesce images (when resizing animated gifs)
            if (self.options.coalesce) {
                image.coalesce();
            }

            //Apply the crop operation
            if (operation.crop_width || operation.crop_height) {
                operation.x = operation.x || 0;
                operation.y = operation.y || 0;
                operation.crop_width = operation.crop_width || (size.width - operation.x);
                operation.crop_height = operation.crop_height || (size.height - operation.y);
                image.crop(operation.crop_width, operation.crop_height, operation.x, operation.y);
                image.repage(0, 0, 0, 0);
            }

            //Resize by a constant factor
            if (operation.factor) {
                operation.width = Math.round(size.width * operation.factor);
                operation.height = Math.round(size.height * operation.factor);
            }

            image.quality(self.options.gm_quality);

            //Use a custom resizing filter
            if (self.options.filter) {
                image.filter(self.options.filter);
            }

            //Specify the type of interlacing scheme
            if (self.options.interlace) {
                image.interlace(self.options.interlace);
            }

            //Fill in the missing dimension
            if (!operation.width && operation.height) {
                operation.width = Math.ceil(operation.height / size.height * size.width);
            }
            if (!operation.height && operation.width) {
                operation.height = Math.ceil(operation.width / size.width * size.height);
            }

            //Apply the resize operation
            if (operation.width || operation.height) {
                image.resize(operation.width, operation.height);
            }

            //Save the image
            image.write(output, function (err) {
                self.options.trace('gm_convert');
                self.image = output;
                self.finalise(err, operation);
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
    this.options.trace('image_copy');
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

Converter.prototype.finalise = function (err, operation) {
    var callback = this.callback
      , image = this.image
      , optimise = this.options.optimisation;

    //Reset the operation
    this.operation = {};
    delete this.image;
    delete this.callback;

    if (err || !optimise) {
        if (typeof err === 'object' && err.message.indexOf('installed graphicsmagick') >= 0) {
            err = 'Graphicsmagick is not installed';
        }
        return callback(err);
    }

    if (optimise.length === 2) {
        optimise(image, callback);
    } else if (optimise.length === 3) {
        optimise(image, operation, callback);
    }
};

/**
 * Manage concurrency.
 */

utils.concurrent(Converter.prototype, 'size', 5);
utils.floodProtection(Converter.prototype, 'size');
utils.concurrent(Converter.prototype, 'save', 5);
utils.floodProtection(Converter.prototype, 'save');

