**imgr** - resize, optimise and serve your images.

## Installation

**imgr** requires [graphicsmagick](http://www.graphicsmagick.org/)

```bash
$ npm install imgr
```

## Example

Serve images from a directory 

```javascript
var IMGR = require('imgr').IMGR;

var imgr = new IMGR({ concurrency: 5 });

imgr.serve('/path/to/images')
    .namespace('/images')
    .urlRewrite('/:path/:size/:file.:ext')
    .whitelist([ '200x300', '100x100' ])
    .cacheDir('/tmp/imgr')
    .using(express_app);

// Now /path/to/images/foobar.jpg can be accessed using:
//    /images/foobar.jpg
//    /images/200x300/foobar.jpg
//    /images/1024x1024/foobar.jpg => 403 forbidden
```

## Tests

```bash
$ make dependencies
$ make test
```

## License (MIT)

Copyright (c) 2012 Sydney Stockholm <opensource@sydneystockholm.com>

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

