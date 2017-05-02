"use strict";

var huffmanDecompress;

huffmanDecompress = require("../huffman/decompress.js");
module.exports = (input) => {
    var decompressor, inputBuffer, original;

    inputBuffer = Buffer.from(input, "base64");
    decompressor = huffmanDecompress(inputBuffer);
    original = decompressor.getResult;
    decompressor.getResult = () => {
        var binaryBuffer;

        binaryBuffer = original.call(decompressor);

        return binaryBuffer.toString("binary");
    };

    return decompressor;
};
