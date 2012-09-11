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
            assert.statusCode(app.host + '/foo/2.png', 200, function () {
                assert.statusCode(app.host + '/foo/nothere.jpg', 404, function () {
                    app.server.close()
                    done();
                });
            });
        });
    });

    it('should serve images from a directory', function (done) {
        var app = server();
        imgr.serve(images).using(app);
        assert.statusCode(app.host + '/1.jpg', 200, function () {
            assert.statusCode(app.host + '/2.png', 200, function () {
                assert.statusCode(app.host + '/nothere.jpg', 404, function () {
                    app.server.close();
                    done();
                });
            });
        });
    });

    it('should serve images with a custom width', function (done) {
        //TODO
        done();
    });

    it('should serve images with a custom height', function (done) {
        //TODO
        done();
    });

    it('should serve images with a custom width and height', function (done) {
        //TODO
        done();
    });

    it('should serve images with a custom width, height and orientation', function (done) {
        //TODO
        done();
    });

    it('should respect the whitelist', function (done) {
        //TODO
        done();
    });

    it('should respect the blacklist', function (done) {
        //TODO
        done();
    });

    it('should support a custom rewriting strategy', function (done) {
        //TODO
        done();
    });

});

