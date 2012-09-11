var assert = require('assert')
  , gm = require('gm')
  , fs = require('fs')
  , express = require('express')
  , request = require('request')
  , IMGR = require('../').IMGR;

var images = __dirname + '/images/'
  , compiled = __dirname + '/tmp/compiled/';

var imgr = new IMGR;

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
        assert.equal(res.statusCode, code);
        callback();
    });
};

describe('Server', function () {

    it('should serve images from a directory under a custom namespace', function (done) {
        var app = server();
        imgr.serve(images)
            .namespace('/foo')
            .using(app);
        assert.statusCode(app.host + '/foo/1.jpg', 200, function () {
            assert.statusCode(app.host + '/foo/nested/folder/1.jpg', 200, function () {
                assert.statusCode(app.host + '/foo/2.png', 200, function () {
                    assert.statusCode(app.host + '/foo/nothere.jpg', 404, function () {
                        app.server.close()
                        done();
                    });
                });
            });
        });
    });

    it('should serve images from a directory', function (done) {
        var app = server();
        imgr.serve(images).using(app);
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

    it('should serve images with a custom width', function (done) {
        var app = server();
        imgr.serve(images)
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
                        app.server.close()
                        done();
                    });
                });
            });
        });
    });

    it('should serve images with a custom height', function (done) {
        var app = server();
        imgr.serve(images)
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
                        app.server.close()
                        done();
                    });
                });
            });
        });
    });

    it('should serve images with a custom width and height', function (done) {
        var app = server();
        imgr.serve(images)
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
                        app.server.close()
                        done();
                    });
                });
            });
        });
    });

    it('should serve images with a custom width, height and orientation', function (done) {
        var app = server();
        imgr.serve(images)
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
                        app.server.close()
                        done();
                    });
                });
            });
        });
    });

    it('should respect the whitelist', function (done) {
        var app = server();
        imgr.serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .whitelist([ '200x', '300x300' ])
            .using(app);
        assert.statusCode(app.host + '/foo/300x300/1.jpg', 200, function () {
            assert.statusCode(app.host + '/foo/200x/1.jpg', 200, function () {
                assert.statusCode(app.host + '/foo/300x/1.jpg', 403, function () {
                    done();
                });
            });
        });
    });

    it('should respect the blacklist', function (done) {
        var app = server();
        imgr.serve(images)
            .namespace('/foo')
            .cacheDir(compiled)
            .blacklist([ '400x' ])
            .using(app);
        assert.statusCode(app.host + '/foo/400x400/1.jpg', 200, function () {
            assert.statusCode(app.host + '/foo/400x/1.jpg', 403, function () {
                done();
            });
        });
    });

    it('should support a custom rewriting strategy', function (done) {
        var app = server();
        imgr.serve(images)
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
                        app.server.close()
                        done();
                    });
                });
            });
        });
    });

});

