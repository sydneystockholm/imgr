/**
 * Module dependencies.
 */

var gm = require('gm')
  , fs = require('fs')
  , child = require('child_process')
  , path = require('path')
  , utils = require('./utils')
  , imgr = require('./constants');

/**
 * Default conversion / optimisation options.
 */

var default_options = {
    optimisation: imgr.BEST
  , orientation: imgr.CENTRE
};

/**
 * Create a new image converter / optimiser.
 *
 * @param {String} image - the image to load
 * @param {Object} options (optional)
 */

var Converter = exports.Converter = function (image, options) {
    this.image = image;
    this.options = utils.mergeDefaults(options, default_options);
    this.operation = {};
};

/**
 * Resize an image to the specified width.
 *
 * @param {Number} width
 * @return this
 */

Converter.prototype.resizeToWidth = function (width) {
    this.operations.width = width;
    return this;
};

/**
 * Resize an image to the specified height.
 *
 * @param {Number} height
 * @return this
 */

Converter.prototype.resizeToHeight = function (height) {
    this.operations.height = height;
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
    this.operations.factor = factor;
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
 * Optimise an image.
 *
 * @param {Number} quality (optional)
 * @return this
 */

Converter.prototype.optimise = function (quality) {
    this.operation.optimise = quality || this.options.optimisation;
    return this;
};

/**
 * Crop an image to the specified width and height, starting from the
 * specified x and y point.
 *
 * @param {Number} width
 * @param {Number} width
 * @param {Number} width
 * @param {Number} width
 * @return this
 */

Converter.prototype.crop = function (width, height, x, y) {
    this.operation.width = width;
    this.operation.height = height;
    this.operation.x = x || 0;
    this.operation.y = y || 0;
    return this;
};

/**
 * Execute the pending conversion and save the resulting image to `path`.
 *
 * @param {String} path
 * @param {Function} callback
 */

Converter.prototype.save = function (path, callback) {
    //TODO
};

