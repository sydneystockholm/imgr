# IMGR

Resize and optimise images on-demand.

[![Build Status](https://travis-ci.org/sydneystockholm/imgr.svg)](https://travis-ci.org/sydneystockholm/imgr)

### Example

IMGR runs as [express](http://expressjs.com) middleware and requires [GraphicsMagick](http://www.graphicsmagick.org/)

```javascript
var IMGR = require('imgr').IMGR;

var imgr = new IMGR;

imgr.serve('/path/to/images')
    .namespace('/images')
    .urlRewrite('/:path/:size/:file.:ext')
    .whitelist([ '200x300', '100x100' ])
    .using(express_app);
```

Now */path/to/images/foobar.jpg* can be accessed using

- */images/foobar.jpg*
- */images/200x300/foobar.jpg*
- */images/1024x1024/foobar.jpg* => 403 forbidden

Another interesting option instead of whitelist:

```javascript

...
imgr.serve('/path/to/images')
    .namespace('/images')
    .urlRewrite('/:path/:size/:file.:ext')
    .maxsize('500x600') // it works also with 500x, x600 or whatever
    .using(express_app);
```
### Installation

```bash
$ npm install imgr
```

### Documentation

See the [wiki](https://github.com/sydneystockholm/imgr/wiki/imgr).

### Tests

To run the test suite

```bash
$ make check
```

To increase test verbosity

```bash
$ V=1 make check
```

### License (MIT)

Copyright (c) 2013 Sydney Stockholm <opensource@sydneystockholm.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
