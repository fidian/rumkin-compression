"use strict";

/* eslint no-bitwise:off */
var debug, DynamicBuffer;

/**
 * Create a set of decompression functions that are designed to work on
 * a single string.
 *
 * @param {Buffer} inBuffer
 * @return {Object}
 */
function createDecompressor(inBuffer) {
    var currentByte, done, maxByte, outBuffer;


    /**
     * Get a byte from inBuffer and advance currentByte.
     *
     * @return {string}
     */
    function getByte() {
        var b;

        b = inBuffer[currentByte];
        currentByte += 1;

        return b;
    }


    /**
     * Copies a set of literal characters from the input to the output.
     *
     * @param {number} firstByte Value from the leading byte in the sequence
     */
    function decodeLiteral(firstByte) {
        var i, length;

        length = firstByte & 0x3F;
        length += 1;

        for (i = 0; i < length; i += 1) {
            outBuffer.write(getByte());
        }

        debug("literal length %d %j", length, outBuffer.getBuffer().slice(outBuffer.length - length).toString("hex"));
    }


    /**
     * Copies a chunk of data from earlier in the output stream. This may
     * legally go back only 3 characters and copy 10, so we copy it byte
     * by byte here.
     *
     * @param {number} distance How far back to start
     */
    function decompress(distance) {
        var i, length, position;

        position = outBuffer.length - distance;

        // Length must always be at least 3
        length = getByte() + 3;

        for (i = 0; i < length; i += 1) {
            outBuffer.write(outBuffer.getBuffer()[position]);
            position += 1;
        }

        debug("length %d %j", length, outBuffer.getBuffer().slice(-length).toString("hex"));
    }


    /**
     * Copies a more distant block of data.
     *
     * @param {number} firstByte Value from the leading byte in the sequence
     */
    function decompressLong(firstByte) {
        var distance, secondByte;

        secondByte = getByte();
        distance = firstByte & 0x3F;
        distance *= 256;
        distance += secondByte;

        // Shorter distances must be encoded the other way.
        distance += 129;
        debug("distance %d high %d low %d", distance, firstByte, secondByte);
        decompress(distance);
    }


    /**
     * Copies a nearby chunk of data.
     *
     * @param {number} firstByte Value from the leading byte in the sequence
     */
    function decompressShort(firstByte) {
        var distance;

        distance = firstByte & 0x7F;

        // Must start back at least 1 byte.
        distance += 1;
        debug("distance %d low %d", distance, firstByte);
        decompress(distance);
    }

    outBuffer = new DynamicBuffer();
    currentByte = 0;
    maxByte = inBuffer.length;
    done = false;

    return {
        getResult: () => {
            return outBuffer.getBuffer();
        },

        getStatus: () => {
            var percent;

            if (maxByte) {
                percent = currentByte / maxByte;
            } else {
                percent = maxByte;
            }

            return {
                length: maxByte,
                percent,
                position: currentByte
            };
        },

        isDone: () => {
            return done;
        },

        work: () => {
            var b;

            if (currentByte >= maxByte) {
                done = true;
            }

            if (done) {
                return;
            }

            b = getByte();

            if ((b & 0xC0) === 0x00) {
                decodeLiteral(b);
            } else if ((b & 0xC0) === 0x40) {
                decompressLong(b);
            } else {
                decompressShort(b);
            }
        }
    };
}

debug = require("debug")("lz77-decompress");
DynamicBuffer = require("@fidian/dynamic-buffer");
module.exports = createDecompressor;
