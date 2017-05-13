Rumkin Compression
==================

These are the ciphers that are used to power the pages involving compression at [rumkin.com](http://rumkin.com/).

[![Build Status][travis-badge]][travis-link]
[![Dependencies][dependencies-badge]][dependencies-link]
[![Dev Dependencies][devdependencies-badge]][devdependencies-link]
[![codecov.io][codecov-badge]][codecov-link]


Available Libraries
-------------------

* `huffman` - A [Huffman] encoder for `Buffer` objects.
* `huffmanAscii` - [Huffman] encoding of strings. Results are in Base64.
* `lz77` - Implementation of [LZ77] for `Buffer` objects.
* `lz77` - [LZ77] that uses a custom Base91 encoding.


How to Use
----------

Every library exports the same interface. It can be called synchronously or asynchronously.

    // First, pick your library.
    var library = require("@fidian/rumkin-compression").lz77;

    // Synchronous compression and decompression.
    resultBuffer = library.compressSync(inputBuffer);
    decompressedBuffer = library.decompressSync(resultBuffer);

    // Promised compression and decompression.
    library.compressAsync(inputBuffer).then((resultBuffer) => {
        return library.decompressAsync(resultBuffer);
    }).then((decompressedBuffer) => { ... });

    // Asynchronous/callback based compression.
    // Callback definition: callback(err, resultBuffer)
    // Progress definition: progress(progressDataObject)
    // Call the cancel function to abort compression/decompression
    cancelFn = library.compress(inputBuffer, callbackFn, [progressFn]);
    cancelFn = library.decompress(inputBuffer, callbackFn, [progressFn]);

    // Managing the async/sync stuff yourself.
    compressor = library.compressDirect(inputBuffer);
    decompressor = library.decompressDirect(inputBuffer);

    // Tiny sync version of a decompressor for a browser.
    // For ASCII flavors, this takes the encoded string. For the Buffer
    // variants, this takes a Buffer or any array-like thing where the values
    // are the character codes (eg. input[0] == 97). They always return a
    // string.
    result = library.decompressTiny(inputBufferOrTypedArray);


Making Tiny Tinier
------------------

The tiny, synchronous functions of decompressors available for use in web pages. They are self-contained functions, so you could call `.toString()` on the functions to minify them.

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

Alternately, you can minify from the command line.

    uglifyjs node-modules/@fidian/rumkin-compression/lib/lz77/decompress-tiny.js --screw-ie8 -m -c


Installation
------------

Use `npm` to install this package easily.

    $ npm install --save @fidian/rumkin-compression

Alternately you may edit your `package.json` and add this to your `dependencies` object:

    {
        ...
        "dependencies": {
            ...
            "@fidian/rumkin-compression": "*"
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
[Huffman]: https://en.wikipedia.org/wiki/Huffman_coding
[LICENSE]: LICENSE.md
[LZ77]: https://en.wikipedia.org/wiki/LZ77_and_LZ78
[npm-badge]: https://img.shields.io/npm/v/xxxxxx.svg
[npm-link]: https://npmjs.org/package/xxxxxx
[travis-badge]: https://img.shields.io/travis/tests-always-included/xxxxxx/master.svg
[travis-link]: http://travis-ci.org/tests-always-included/xxxxxx
