var assert = require('assert')
  , gm = require('gm')
  , fs = require('fs')
  , express = require('express')
  , request = require('request')
  , IMGR = require('../').IMGR;

var images = __dirname + '/images/'
  , compiled = __dirname + '/tmp/compiled/';

var imgr = function (options) {
    return new IMGR(options);
};

var port = 12345;
function server() {
    var app = express();
    app.host = 'http://localhost:' + port;
    app.server = app.listen(port++);
    return app;
}

assert.statusCode = function (path, code, callback) {
    request(path, function (err, res, body) {
        assert(!err, err);
        assert.equal(res.statusCode, code, path + ' failed (' + res.statusCode + ')');
        callback();
    });
};

describe('Server', function () {

    it('should serve images from a directory under a custom namespace', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .using(app);
        assert.statusCode(app.host + '/foo/1.jpg', 200, function () {
            assert.statusCode(app.host + '/foo/nested/folder/1.jpg', 200, function () {
                assert.statusCode(app.host + '/foo/2.png', 200, function () {
                    assert.statusCode(app.host + '/foo/nothere.jpg', 404, function () {
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should serve images from a directory', function (done) {
        var app = server();
        imgr().serve(images).using(app);
        assert.statusCode(app.host + '/1.jpg', 200, function () {
            assert.statusCode(app.host + '/nested/folder/1.jpg', 200, function () {
                assert.statusCode(app.host + '/2.png', 200, function () {
                    assert.statusCode(app.host + '/nothere.jpg', 404, function () {
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should not serve images from the content directory if try_content is false', function (done) {
        var app = server();
        imgr({ try_content: false }).serve(images).using(app);
        assert.statusCode(app.host + '/1.jpg', 404, function () {
            app.server.close();
            done();
        });
    });

    it('should serve images with a custom width', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/200x/1.jpg', 200, function () {
            gm(compiled + '200x/1.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.width, 200);
                assert.statusCode(app.host + '/foo/nested/folder/200x/1.jpg', 200, function () {
                    gm(compiled + 'nested/folder/200x/1.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.width, 200);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should force a resize of images if try_cache is false', function (done) {
        var app = server();
        imgr({ try_cache: false }).serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/200x/1.jpg', 200, function () {
            gm(compiled + '200x/1.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.width, 200);
                assert.statusCode(app.host + '/foo/200x/1.jpg', 200, function () {
                    gm(compiled + '200x/1.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.width, 200);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should serve images with a custom height', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/x200/1.jpg', 200, function () {
            gm(compiled + 'x200/1.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.height, 200);
                assert.statusCode(app.host + '/foo/nested/folder/x200/1.jpg', 200, function () {
                    gm(compiled + 'nested/folder/x200/1.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.height, 200);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should serve images with a custom width and height', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/300x200/1.jpg', 200, function () {
            gm(compiled + '300x200/1.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.width, 300);
                assert.equal(size.height, 200);
                assert.statusCode(app.host + '/foo/nested/folder/300x200/1.jpg', 200, function () {
                    gm(compiled + 'nested/folder/300x200/1.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.width, 300);
                        assert.equal(size.height, 200);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should allow for a custom resize filter to be used', function (done) {
        var app = server();
        imgr({ filter: 'Gaussian' }).serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/300x400/1.jpg', 200, function () {
            gm(compiled + '300x400/1.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.width, 300);
                assert.equal(size.height, 400);
                assert.statusCode(app.host + '/foo/nested/folder/300x400/1.jpg', 200, function () {
                    gm(compiled + 'nested/folder/300x400/1.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.width, 300);
                        assert.equal(size.height, 400);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should create progressive jpegs', function (done) {
        var app = server();
        imgr({ interlace: 'Line' }).serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/300x500/1.jpg', 200, function () {
            gm(compiled + '300x500/1.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.width, 300);
                assert.equal(size.height, 500);
                assert.statusCode(app.host + '/foo/nested/folder/300x500/1.jpg', 200, function () {
                    gm(compiled + 'nested/folder/300x500/1.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.width, 300);
                        assert.equal(size.height, 500);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should serve images with a custom width, height and orientation', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/300x200-top/1.jpg', 200, function () {
            gm(compiled + '300x200-top/1.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.width, 300);
                assert.equal(size.height, 200);
                assert.statusCode(app.host + '/foo/nested/folder/300x200-top/1.jpg', 200, function () {
                    gm(compiled + 'nested/folder/300x200-top/1.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.width, 300);
                        assert.equal(size.height, 200);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should respect the whitelist', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .whitelist([ '200x', '300x300' ])
            .using(app);
        assert.statusCode(app.host + '/foo/300x300/1.jpg', 200, function () {
            assert.statusCode(app.host + '/foo/300x300-centre/1.jpg', 200, function () {
                assert.statusCode(app.host + '/foo/200x/1.jpg', 200, function () {
                    assert.statusCode(app.host + '/foo/300x/1.jpg', 403, function () {
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should respect the blacklist', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .blacklist([ '400x', '500x500' ])
            .using(app);
        assert.statusCode(app.host + '/foo/400x400/1.jpg', 200, function () {
            assert.statusCode(app.host + '/foo/500x500-centre/1.jpg', 403, function () {
                assert.statusCode(app.host + '/foo/400x/1.jpg', 403, function () {
                    app.server.close();
                    done();
                });
            });
        });
    });

    it('should support a custom rewriting strategy', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .urlRewrite('/:path/:file-:size.:ext')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/1-300x200-top.jpg', 200, function () {
            gm(compiled + '1-300x200-top.jpg').size(function (err, size) {
                assert(!err, err);
                assert.equal(size.width, 300);
                assert.equal(size.height, 200);
                assert.statusCode(app.host + '/foo/nested/folder/1-300x200-top.jpg', 200, function () {
                    gm(compiled + 'nested/folder/1-300x200-top.jpg').size(function (err, size) {
                        assert(!err, err);
                        assert.equal(size.width, 300);
                        assert.equal(size.height, 200);
                        app.server.close();
                        done();
                    });
                });
            });
        });
    });

    it('should support a rewriting strategy without the extension', function (done) {
        var app = server();
        imgr().serve(images)
            .namespace('/foo')
            .urlRewrite('/:path/:size/:file')
            .cacheDir(compiled)
            .using(app);
        assert.statusCode(app.host + '/foo/3', 200, function () {
            assert.statusCode(app.host + '/foo/300x200-top/3', 200, function () {
                gm(compiled + '300x200-top/3').size(function (err, size) {
                    assert(!err, err);
                    assert.equal(size.width, 300);
                    assert.equal(size.height, 200);
                    app.server.close();
                    done();
                });
            });
        });
    });

    it('should redirect if there\'s a querystring and querystring_301 is true', function (done) {
        var app = server();
        imgr({ querystring_301: true }).serve(images)
            .namespace('/foo')
            .using(app);
        assert.statusCode(app.host + '/foo/1.jpg?foo', 200, function () {
            app.server.close();
            app = server();
            imgr({ querystring_301: true }).serve(images)
                .namespace('/foo')
                .using(app);
            request({ url: app.host + '/foo/1.jpg?foo', followRedirect: false }, function (err, res, body) {
                assert(!err, err);
                assert.equal(res.statusCode, 301);
                app.server.close();
                done();
            });
        });
    });

});

