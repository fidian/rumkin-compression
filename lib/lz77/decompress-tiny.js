/**
 * Tiny implementation of LZ77 decompressor. If you were intending to use LZ77
 * on web pages and not use the full-blown decompressor, then this tiny version
 * may be what you seek. For the ultimate in savings, minify this file.
 *
 * Builds a STRING as the result. Expects a Buffer, UInt8Array or other
 * similar structure where values can be found by using indexing.  For example,
 * input[0] would return the character code of the first byte.
 */

/* eslint strict:off, eqeqeq:off, no-plusplus:off, space-unary-ops:off, no-bitwise:off */

// var debug = require("debug")("lz77-decompressTiny"), debugMessage, debugHex = (c) => { return Math.floor(c/16).toString(16) + (c%16).toString(16); };

(this || exports).lz77DecompressTiny = function (input) {
    var pos, result, val;

    /**
     * Copies a chunk of data from earlier in the output stream. This may
     * legally go back only 3 characters and copy 10, so we copy it byte
     * by byte here.
     *
     * @param {number} distance How far back to start copying
     */
    function decompress(distance) {
        var current, length;

        // debugMessage = `length ${input[pos] + 3} "`;
        current = result.length - distance;
        length = input[pos++] + 3;

        while (length--) {
            // debugMessage += debugHex(result.charCodeAt(current));
            result += result.charAt(current++);
        }

        // debugMessage += '"';
        // debug(debugMessage);
    }


    pos = 0;
    result = "";

    // Decode
    while (pos < input.length) {
        val = input[pos++];

        if (val & 0x80) {
            // short
            // debug(`distance ${(val & 0x7f) + 1} low ${val}`);
            decompress((val & 0x7f) + 1);
        } else if (val & 0x40) {
            // long
            // debug(`distance ${(val & 0x3f) * 256 + input[pos] + 129} high ${val} low ${input[pos]}`);
            decompress((val & 0x3F) * 256 + input[pos++] + 129);
        } else {
            // literal
            // debugMessage = `literal length ${val + 1} "`;
            val ++;

            while (val--) {
                // debugMessage += debugHex(input[pos]);
                result += String.fromCharCode(input[pos++]);
            }

            // debugMessage += '"';
            // debug(debugMessage);
        }
    }

    return result;
};
