Rumkin Compression
==================

These are the ciphers that are used to power the pages involving compression at [rumkin.com](http://rumkin.com/).

[![Build Status][travis-badge]][travis-link]
[![Dependencies][dependencies-badge]][dependencies-link]
[![Dev Dependencies][devdependencies-badge]][devdependencies-link]
[![codecov.io][codecov-badge]][codecov-link]


Exports
-------

    compression = require("rumkin-compression");

The exported object from the library includes the following encryption techniques.

There are tiny, synchronous functions of decompressors available for use in web pages. They are self-contained functions, so you could call `.toString()` on the functions to minify them.

    // Minifying a tiny decompressor by using `.toString()` on the exported
    // function. This isn't very fun and you could just minify the file
    // itself instead.
    uglifyJs = require("uglifyjs");
    tinyDecompress = uglifyJs({
        lz77DecompressTiny: compression.lz77.decompressTiny.toString(),
    }, {
        fromString: true,
        ... other options ...
    });


LZ77
----

An implementation of [LZ77] that works on `Buffer` objects.

    // Synchronous compression and decompression.
    resultBuffer = compression.lz77.compressSync(inputBuffer);
    decompressedBuffer = compression.lz77.decompressSync(resultBuffer);

    // Promised compression and decompression.
    compression.lz77.compressAsync(inputBuffer).then((resultBuffer) => {
        return compression.lz77.decompressAsync(resultBuffer);
    }).then((decompressedBuffer) => { ... });

    // Asynchronous/callback based compression.
    // Callback definition: callback(err, resultBuffer)
    // Progress definition: progress(progressDataObject)
    compression.lz77.compress(inputBuffer, callbackFn, [progressFn]);
    compression.lz77.decompress(inputBuffer, callbackFn, [progressFn]);

    // Managing the async/sync stuff yourself.
    compressor = compression.lz77.compressDirect(inputBuffer);
    decompressor = compression.lz77.decompressDirect(inputBuffer);

    // Tiny sync version of a decompressor for a browser. Takes a Buffer or
    // any array-like thing where the values are the character codes. Returns
    // a string.
    result = compression.lz77.decompressTiny(inputBufferOrTypedArray);


LZ77 Ascii
----------

An implementation of [LZ77] that encodes strings to ASCII by relying on a base-91 encoding scheme for the control characters.

    // Synchronous compression and decompression.
    resultString = compression.lz77Ascii.compressSync(inputString);
    decompressedString = compression.lz77Ascii.decompressSync(resultString);

    // Promised compression and decompression.
    compression.lz77Ascii.compressAsync(inputString).then((resultString) => {
        return compression.lz77Ascii.decompressAsync(resultString);
    }).then((decompressedString) => { ... });

    // Asynchronous/callback based compression.
    // Callback definition: callback(err, resultString)
    // Progress definition: progress(progressDataObject)
    compression.lz77Ascii.compress(inputString, callbackFn, [progressFn]);
    compression.lz77Ascii.decompress(inputString, callbackFn, [progressFn]);

    // Managing the async/sync stuff yourself.
    compressor = compression.lz77Ascii.compressDirect(inputString);
    decompressor = compression.lz77Ascii.decompressDirect(inputString);

    // Tiny sync version of a decompressor for a browser. This is a self-
    // contained function so you can use .toString() and apply it anywhere.
    // Accepts a string and returns a string.
    result = compression.lz77Ascii.decompressTiny(inputString);


Installation
------------

Use `npm` to install this package easily.

    $ npm install --save rumkin-compression

Alternately you may edit your `package.json` and add this to your `dependencies` object:

    {
        ...
        "dependencies": {
            ...
            "rumkin-compression": "*"
            ...
        }
        ...
    }


License
-------

This software is licensed under a [MIT license][LICENSE] that contains additional non-advertising and patent-related clauses.  [Read full license terms][LICENSE]


[codecov-badge]: https://img.shields.io/codecov/c/github/tests-always-included/xxxxxx/master.svg
[codecov-link]: https://codecov.io/github/tests-always-included/xxxxxx?branch=master
[dependencies-badge]: https://img.shields.io/david/tests-always-included/xxxxxx.svg
[dependencies-link]: https://david-dm.org/tests-always-included/xxxxxx
[devdependencies-badge]: https://img.shields.io/david/dev/tests-always-included/xxxxxx.svg
[devdependencies-link]: https://david-dm.org/tests-always-included/xxxxxx#info=devDependencies
[LICENSE]: LICENSE.md
[LZ77]: https://en.wikipedia.org/wiki/LZ77_and_LZ78
[npm-badge]: https://img.shields.io/npm/v/xxxxxx.svg
[npm-link]: https://npmjs.org/package/xxxxxx
[travis-badge]: https://img.shields.io/travis/tests-always-included/xxxxxx/master.svg
[travis-link]: http://travis-ci.org/tests-always-included/xxxxxx
