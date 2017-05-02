"use strict";

var huffmanCompress;

huffmanCompress = require("../huffman/compress.js");
module.exports = (input) => {
    var compressor, inputBuffer, original;

    inputBuffer = Buffer.from(input, "binary");
    compressor = huffmanCompress(inputBuffer);
    original = compressor.getResult;
    compressor.getResult = () => {
        var binaryBuffer;

        binaryBuffer = original.call(compressor);

        return binaryBuffer.toString("base64");
    };

    return compressor;
};
