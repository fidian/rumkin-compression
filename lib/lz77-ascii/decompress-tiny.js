/**
 * Tiny implementation of LZ77-ASCII decompressor. If you were intending to
 * use LZ77 on web pages and not use the full-blown decompressor, then this
 * tiny version may be what you seek. For the ultimate in savings, minify
 * this file.
 */

/* eslint strict:off, eqeqeq:off, no-plusplus:off, space-unary-ops:off */

// var debug = require("debug")("lz77Ascii-decompressTiny"), debugMessage;

(this || exports).lz77AsciiDecompressTiny = function (input) {
    var codes, i, offset, pos, result;

    /**
     * Get a character from the string and advance the current byte
     *
     * @return {number}
     */
    function getIndex() {
        var c;

        c = input.charAt(pos++);

        return codes.indexOf(c);
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
        var position;

        // debugMessage = `distance ${high * codes.length + low} high ${high} low ${low} length ${length} "`;
        position = result.length - high * codes.length - low - 1;

        while (length--) {
            // debugMessage += result.charAt(position);
            result += result.charAt(position++);
        }

        // debugMessage += '"';
        // debug(debugMessage);
    }


    codes = "";
    pos = 0;
    result = "";

    // Generate the list of ASCII codes
    for (i = 35; i < 127; i++) {
        codes += String.fromCharCode(i);

        if (i == 91) {
            i += 1;
        }
    }

    // Decode
    while (pos < input.length) {
        offset = getIndex();

        if (offset < 12) {
            // literal
            // debugMessage = `literal length ${offset + 1} "`;
            offset ++;

            while (offset--) {
                // debugMessage += input.charAt(pos);
                result += input.charAt(pos++);
            }

            // debugMessage += '"';
            // debug(debugMessage);
        } else if (offset < 57) {
            // long
            decompress(offset - 8, getIndex(), getIndex());
        } else {
            // short
            decompress(3, offset - 57, getIndex());
        }
    }

    return result;
};
