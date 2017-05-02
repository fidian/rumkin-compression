#!/usr/bin/env node

"use strict";

var compression, neodoc, options, readFileStdin;

/**
 * The standard help message.
 *
 * @return {string}
 */
function help() {
    return `Test compression / decompression routines.

Usage:

    test.js (compress | decompress | both | decompress-tiny | both-tiny)
        (huffman | huffman-ascii | lz77 | lz77-ascii)
        [FILENAME]
`;
}


/**
 * Generic way to call the compress and decompress functions
 *
 * @param {Object} definition
 * @param {Object} flags
 * @param {Buffer} buffer
 */
function callCompressor(definition, flags, buffer) {
    var promise;

    promise = Promise.resolve(buffer);

    if (definition.inputType === "string") {
        promise = promise.then((data) => {
            return data.toString("binary");
        });
    }

    if (flags.compress) {
        promise = promise.then((data) => {
            return definition.group.compressAsync(data);
        });
    }

    if (flags.decompress) {
        promise = promise.then((data) => {
            return definition.group.decompressAsync(data);
        });
    }

    if (flags.decompressTiny) {
        promise = promise.then((data) => {
            return definition.group.decompressTiny(data);
        });
    }

    promise.then((data) => {
        process.stdout.write(data);
    });
}

compression = require("..");
neodoc = require("neodoc");
readFileStdin = require("read-file-stdin");
options = neodoc.run(help());
readFileStdin(options.FILENAME, (err, buffer) => {
    var flags, methods;

    if (err) {
        console.error(err);
    } else {
        flags = {
            compress: options.compress || options.both || options["both-tiny"],
            decompress: options.decompress || options.both,
            decompressTiny: options["decompress-tiny"] || options["both-tiny"]
        };
        methods = {
            huffman: {
                inputType: "buffer",
                group: compression.huffman
            },
            "huffman-ascii": {
                inputType: "string",
                group: compression.huffmanAscii
            },
            lz77: {
                inputType: "buffer",
                group: compression.lz77
            },
            "lz77-ascii": {
                inputType: "string",
                group: compression.lz77Ascii
            }
        };

        Object.keys(methods).forEach((method) => {
            if (options[method]) {
                callCompressor(methods[method], flags, buffer);
            }
        });
    }
});
