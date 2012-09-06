/**
 * Module dependencies.
 */

var gm = require('gm')
  , fs = require('fs')
  , child = require('child_process')
  , path = require('path')
  , utils = require('./utils');

/**
 * Default conversion / optimisation options.
 */

var default_options = {
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
};

