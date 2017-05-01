"use strict";

var iface;

iface = require("./interface");

/**
 * Merge an array of objects into a single object. Properties are copied,
 * with the last one in the array taking precedence.
 *
 * @param {Array.<Object>} arrayOfObjects
 * @return {Object}
 */
function merge(arrayOfObjects) {
    return arrayOfObjects.reduce((acc, more) => {
        Object.keys(more).forEach((key) => {
            acc[key] = more[key];
        });

        return acc;
    }, {});
}

module.exports = {
    lz77: merge([
        iface("compress", require("./lz77/compress")),
        iface("decompress", require("./lz77/decompress")),
        {
            decompressTiny: require("./lz77/decompress-tiny").lz77DecompressTiny
        }
    ]),
    lz77Ascii: merge([
        iface("compress", require("./lz77-ascii/compress")),
        iface("decompress", require("./lz77-ascii/decompress")),
        {
            decompressTiny: require("./lz77-ascii/decompress-tiny").lz77AsciiDecompressTiny
        }
    ])
};
