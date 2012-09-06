/**
 * Module dependencies.
 */

var express = require('express')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , child = require('child_process')
  , path = require('path')
  , utils = require('./utils');

/**
 * Default image server options.
 */

var default_options = {
    namespace: '/'
  , cache_dir: '/tmp'
};

/**
 * Create a new static image server.
 *
 * @param {String} path - where to serve images from
 * @param {Object} options (optional)
 */

var Server = exports.Server = function (path, options) {
    this.path = path;
    this.options = utils.mergeDefaults(options, default_options);
};

/**
 * Set the image namespace.
 *
 * @param {String} namespace - e.g. /images
 */

Server.prototype.namespace = function (namespace) {
    this.options.namespace = namespace;
};

/**
 * Set the cached/compiled image directory.
 *
 * @param {String} path
 */

Server.prototype.cacheDir = function (cache_dir) {
    this.options.cache_dir = cache_dir;
};

