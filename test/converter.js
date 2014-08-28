var assert = require('assert')
  , gm = require('gm')
  , fs = require('fs')
  , IMGR = require('../').IMGR;

var images = __dirname + '/images/'
  , tmp = __dirname + '/tmp/';

var imgr = new IMGR();

describe('Converter', function () {

    it('should copy images when no resize/crop/optimisation is specified', function (done) {
        imgr.load(images + '1.jpg')
            .save(tmp + '1-copy.jpg', function (err) {
                assert(!err, err);
                fs.stat(tmp + '1-copy.jpg', function (err, file) {
                    assert(!err, err);
                    assert.equal(file.size, 70096, 'File was not copied');
                    done();
                });
            });
    });

    it('should create the output directory if it doesn\'t exist', function (done) {
        imgr.load(images + '1.jpg')
            .save(tmp + 'some/nested/dir/1-copy.jpg', function (err) {
                assert(!err, err);
                fs.stat(tmp + 'some/nested/dir/1-copy.jpg', function (err, file) {
                    assert(!err, err);
                    assert.equal(file.size, 70096, 'File was not copied');
                    done();
                });
            });
    });

    it('should resize to an exact width', function (done) {
        imgr.load(images + '1.jpg')
            .resizeToWidth(100)
            .save(tmp + '1-100width.jpg', function (err) {
                assert(!err, err);
                gm(tmp + '1-100width.jpg').size(function (err, size) {
                    assert(!err, err);
                    assert.equal(size.width, 100);
                    done();
                });
            });
    });

    it('should resize to an exact height', function (done) {
        imgr.load(images + '1.jpg')
            .resizeToHeight(100)
            .save(tmp + '1-100height.jpg', function (err) {
                assert(!err, err);
                gm(tmp + '1-100height.jpg').size(function (err, size) {
                    assert(!err, err);
                    assert.equal(size.height, 100);
                    done();
                });
            });
    });

    it('should resize by a factor', function (done) {
        imgr.load(images + '1.jpg')
            .resizeByFactor(0.5)
            .save(tmp + '1-halfsize.jpg', function (err) {
                assert(!err, err);
                gm(tmp + '1-halfsize.jpg').size(function (err, size) {
                    assert(!err, err);
                    assert.equal(size.width, 362);
                    assert.equal(size.height, 189);
                    done();
                });
            });
    });

    it('should resize adaptively with aspect ratio > 1', function (done) {
        imgr.load(images + '1.jpg')
            .adaptiveResize(200, 300)
            .save(tmp + '1-200x300.jpg', function (err) {
                assert(!err, err);
                gm(tmp + '1-200x300.jpg').size(function (err, size) {
                    assert(!err, err);
                    assert.equal(size.width, 200);
                    assert.equal(size.height, 300);
                    done();
                });
            });
    });

    it('should resize adaptively with aspect ratio < 1', function (done) {
        imgr.load(images + '2.png')
            .adaptiveResize(300, 200)
            .save(tmp + '2-300x200.png', function (err) {
                assert(!err, err);
                gm(tmp + '2-300x200.png').size(function (err, size) {
                    assert(!err, err);
                    assert.equal(size.width, 300);
                    assert.equal(size.height, 200);
                    done();
                });
            });
    });

    it('should handle PNG images with extra compressed data', function (done) {
        imgr.load(images + 'extra-compressed.png')
            .resizeToWidth(100)
            .save(tmp + 'extra-100.png', function (err) {
                assert(!err, err);
                gm(tmp + 'extra-100.png').size(function (err, size) {
                    assert(!err, err);
                    assert.equal(size.width, 100);
                    done();
                });
            });
    });

});

