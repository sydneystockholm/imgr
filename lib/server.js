/**
 * Module dependencies.
 */

var express = require('express')
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , child = require('child_process')
  , path = require('path')
  , utils = require('./utils')
  , imgr = require('./constants');

/**
 * Default options.
 */

var default_options = {
    namespace: '/'
  , cache_dir: '/tmp/imgr'
  , url_rewrite: '/:path/:size/:file.:ext'
  , whitelist: false
  , blacklist: false
  , debug: false
  , as_route: false
};

/**
 * Create a new static image server.
 *
 * @param {String} path - where to serve images from
 * @param {Object} options (optional)
 */

var Server = exports.Server = function (path, options, imgr) {
    this.path = path;
    this.imgr = imgr;
    this.options = utils.mergeDefaults(options, default_options);
};

/**
 * Set the image namespace.
 *
 * @param {String} namespace - e.g. /images
 * @return this
 */

Server.prototype.namespace = function (namespace) {
    this.options.namespace = namespace || '/';
    return this;
};

/**
 * Set the cached/compiled image directory.
 *
 * @param {String} path
 * @return this
 */

Server.prototype.cacheDir = function (cache_dir) {
    this.options.cache_dir = cache_dir;
    return this;
};

/**
 * Whitelist image sizes. Image sizes are specified using 'WIDTHxHEIGHT-ORIENTATION'
 * where any parameter can be omitted, e.g. '200x300-centre' or just '200x' to
 * allow images with a width of 200 and any height. Pass `false` to disable
 * the whitelist.
 *
 * @param {String|Array|Boolean} whitelist
 * @return this
 */

Server.prototype.whitelist = function (whitelist) {
    if (!Array.isArray(whitelist)) {
        whitelist = [ whitelist ];
    }
    this.options.whitelist = whitelist;
    return this;
};

/**
 * Blacklist image sizes. The parameters are the same as `whitelist()`.
 *
 * @param {String|Array|Boolean} blacklist
 * @return this
 */

Server.prototype.blacklist = function (blacklist) {
    if (!Array.isArray(blacklist)) {
        blacklist = [ blacklist ];
    }
    this.options.blacklist = blacklist;
    return this;
};

/**
 * Set the rewriting strategy. Accepted tokens are :path (dirname), :file.:ext (basename),
 * :size (e.g. 200x200, 300x or 200x100-centre). Size is optional and is used to resize
 * the image on demand. Pass `false` to disable url rewriting.
 *
 * Example using the default '/:path/:size/:file.:ext':
 *
 *    /images/foobar.jpg => serves the unaltered image
 *    /images/200x300-centre/foobar.jpg => resizes /images/foobar.jpg to be exactly
 *                                         200x300, cropping from the centre
 *    /images/400x/foobar.jpg => resizes /images/foobar.jpg to be 400 pixels wide
 *
 * Another example '/:path/:file-:size.:ext'
 *
 *    /images/foobar-200x300-centre.jpg
 *    /images/foobar-400x.jpg
 *
 * @param {String|Boolean} url_rewrite
 * @return this
 */

Server.prototype.urlRewrite = function (url_rewrite) {
    this.options.url_rewrite = url_rewrite;
    return this;
};

/**
 * Debug the server.
 *
 * @param {Boolean} enable (optional)
 * @return this
 */

Server.prototype.debug = function (enable) {
    if (typeof enable === 'undefined') {
        enable = true;
    }
    this.options.debug = !!enable;
    return this;
};

/**
 * Output a debug msg.
 *
 * @param {String} msg
 * @param {Array} args
 * @api private
 */

Server.prototype.info = function (msg, args) {
    if (!this.options.debug) {
        return;
    }
    args = Array.prototype.slice.call(arguments);
    args[0] = 'imgr: ' + args[0];
    console.log.apply(console, args);
};

/**
 * Bind an express app and begin serving images.
 *
 * @param {ExpressApp} express
 * @return this
 */

Server.prototype.using = function (app) {
    var namespace = this.options.namespace.replace(/\/$/, '')
      , namespace_prefix = new RegExp('^' + namespace + '/')
      , rewrite = this.compileRegexp(this.options.url_rewrite)
      , base_dir = this.path.replace(/\/$/, '')
      , cache_dir = this.options.cache_dir.replace(/\/$/, '')
      , whitelist = this.options.whitelist
      , blacklist = this.options.blacklist
      , info = this.info.bind(this)
      , self = this;

    //Setup the static servers
    var base_static = express.static(base_dir)
      , cache_static = base_static
    if (cache_dir !== base_dir) {
        cache_static = express.static(cache_dir);
    }

    if (whitelist) {
        info('whitelist: [%s]', whitelist.join(', '));
        whitelist = utils.createSet(whitelist);
    }
    if (blacklist) {
        info('blacklist: [%s]', blacklist.join(', '));
        blacklist = utils.createSet(blacklist);
    }

    function middleware(request, response, next) {
        if (namespace && !namespace_prefix.test(request.url)) {
            return next();
        }

        //Remove the namespace
        var original_url = request.url;
        request.url = request.url.substr(namespace.length);

        info('request url is %s', request.url);
        info('trying to serve %s', path.join(base_dir, request.url));

        //Check if the image exists in the base dir
        base_static(request, response, function (err) {
            if (err) {
                return next(err);
            }

            info('image doesn\'t exist %s');
            info('trying to serve %s', path.join(cache_dir, request.url));

            //Check if the image exists in the compiled dir
            cache_static(request, response, function (err) {
                if (err) {
                    return next(err);
                }

                info('cached image doesn\'t exist');

                //If not, try and extract size parameters
                var parameters = rewrite(request.url);
                if (!parameters) {
                    request.url = original_url;
                    return next();
                }

                info('extracted size %s', parameters.size);

                var src_image = path.join(base_dir, parameters.path)
                  , dest_image = path.join(cache_dir, request.url);

                //Check for blacklisted and whitelisted parameters
                if (blacklist && parameters.size in blacklist) {
                    info('image size is in blacklist');
                    return response.send(403);
                } else if (whitelist && !(parameters.size in whitelist)) {
                    info('image size is not in whitelist');
                    return response.send(403);
                }

                info('image size is allowed');
                info('checking if original image exists %s', src_image);

                //Check if the image exists with parameters stripped
                fs.stat(src_image, function (err, size) {
                    if (err | !size) {
                        request.url = original_url;
                        return next();
                    }

                    info('compiling %s', dest_image);

                    //Resize / crop as necessary
                    var imgr = self.imgr.load(src_image, self.options);
                    if (parameters.width) {
                        if (parameters.height) {
                            imgr.adaptiveResize(parameters.width, parameters.height, parameters.orientation);
                        } else {
                            imgr.resizeToWidth(parameters.width);
                        }
                    } else if (parameters.height) {
                        imgr.resizeToHeight(parameters.height);
                    }

                    //Save the image
                    imgr.save(dest_image, function (err) {
                        if (err) {
                            info('conversion error: %s', err);
                            return next(err);
                        }

                        info('serving %s', dest_image);

                        //..and serve it
                        cache_static(request, response, function (err) {
                            if (err) {
                                return next(err);
                            }
                            request.url = original_url;
                            next();
                        });
                    });
                });
            });
        });
    }

    if (this.options.as_route) {
        app.all(namespace_prefix, middleware);
    } else {
        app.use(middleware);
    }
};

/**
 * Compile a URL regexp.
 *
 * @param {String} pattern
 * @return {Object|Boolean} regexp
 * @api private
 */

Server.prototype.compileRegexp = function (pattern) {
    if (!pattern){
        return function () {
            return false;
        };
    }
    var directive_match = /:([a-z]+)/g
      , directives = []
      , match;
    pattern = pattern.replace(/\(/g, '(?:').replace(/\./g, '\\.');
    while ((match = directive_match.exec(pattern))) {
        directives.push(match[1]);
    }
    pattern = pattern.replace(':size', '(\\d+x|x+\\d+|\\d+x\\d+(?:-[a-z]+)?)')
                     .replace('/:path', '(?:/(.+?))?')
                     .replace(':ext', '([^/]+?)')
                     .replace(':file', '([^/]+?)');
    var regexp = new RegExp('^' + pattern + '$');
    return function (url) {
        var match = url.match(regexp);
        if (!match) {
            return false;
        }
        var parsed = {}, result = {};
        for (var i = 0, l = directives.length; i < l; i++) {
            parsed[directives[i]] = match[i+1];
        }
        result.path = path.join(parsed.path || '', parsed.file + '.' + parsed.ext);
        if (parsed.size) {
            result.size = parsed.size;
            result.width = parsed.size.split('x', 2);
            result.height = (result.width[1] || '').split('-', 2);
            result.orientation = result.height[1] || null;
            result.height = Number(result.height[0]) || null;
            result.width = Number(result.width[0]) || null;
            if (result.orientation) {
                switch (result.orientation) {
                    case 'top': result.orientation = imgr.TOP; break;
                    case 'left': result.orientation = imgr.LEFT; break;
                    case 'right': result.orientation = imgr.RIGHT; break;
                    case 'bottom': result.orientation = imgr.BOTTOM; break;
                    default: result.orientation = imgr.CENTRE; break;
                }
            }
        }
        return result;
    };
};

