"use strict";

var debug, outChars, outCharsLength;

/**
 * Create a set of decompression functions that are designed to work on
 * a single string.
 *
 * @param {string} inStr
 * @return {Object}
 */
function createDecompressor(inStr) {
    var currentByte, done, maxByte, out;


    /**
     * Get a character from the string and advance the currentByte.
     *
     * @return {string}
     */
    function getChar() {
        var c;

        c = inStr.charAt(currentByte);
        currentByte += 1;

        return c;
    }


    /**
     * Returns the index of the next character in the input string.
     * This, if all goes well, should be a number between 0 and 90.
     * The currentByte number is incremented.
     *
     * @return {number}
     * @throws {Error} invalid data stream
     */
    function getIndex() {
        var c, index;

        c = getChar();
        index = outChars.indexOf(c);

        if (index < 0) {
            done = new Error();

            throw done;
        }

        return index;
    }


    /**
     * Copies a set of literal characters from the input to the output.
     *
     * @param {number} offset Value from the leading byte in the sequence
     */
    function decodeLiteral(offset) {
        var length;

        // The number passed in is the encoded version. 0 means a length
        // of 1, so increment here.
        length = offset + 1;

        while (length) {
            out += getChar();
            length -= 1;
        }

        debug("literal length %d %j", offset + 1, out.substr(-1 - offset));
    }


    /**
     * Copies a chunk of data from earlier in the output stream. This may
     * legally go back only 3 characters and copy 10, so we copy it byte
     * by byte here.
     *
     * @param {number} length Number of bytes to copy
     * @param {number} high High byte for distance
     * @param {number} low Low byte for distance
     */
    function decompress(length, high, low) {
        var bytesToCopy, distance, position;

        distance = high * outCharsLength + low + 1;
        position = out.length - distance;
        bytesToCopy = length;

        while (bytesToCopy) {
            out += out.charAt(position);
            position += 1;
            bytesToCopy -= 1;
        }

        debug("distance %d high %d low %d length %d %j", distance, high, low, length, out.substr(-length));
    }


    /**
     * Copies more than 3 bytes from a chunk of already decoded data.
     *
     * @param {number} offset Value from the leading byte in the sequence
     */
    function decompressLong(offset) {
        var high, length, low;

        length = offset - 8;
        high = getIndex();
        low = getIndex();
        decompress(length, high, low);
    }


    /**
     * Copies three bytes from a chunk of already decoded data.
     *
     * @param {number} offset Value from the leading byte in the sequence
     */
    function decompressShort(offset) {
        var high, low;

        high = offset - 57;
        low = getIndex();
        decompress(3, high, low);
    }

    out = "";
    currentByte = 0;
    maxByte = inStr.length;
    done = false;

    return {
        getResult: () => {
            return out;
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
            var offset;

            if (currentByte >= maxByte) {
                done = true;
            }

            if (done) {
                return;
            }

            offset = getIndex();

            if (offset < 12) {
                decodeLiteral(offset);
            } else if (offset < 57) {
                decompressLong(offset);
            } else {
                decompressShort(offset);
            }
        }
    };
}

debug = require("debug")("lz77Ascii-decompress");
outChars = "#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
outCharsLength = outChars.length;

module.exports = createDecompressor;
