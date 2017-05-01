"use strict";

var debug, maxDistance, maxDistanceShort, outChars, outCharsLength;

/**
 * Create a set of compression functions that are designed to work on
 * a single string.
 *
 * @param {string} inStr
 * @return {Object}
 */
function createCompressor(inStr) {
    var currentByte, done, literal, maxByte, out;


    /**
     * Adds a literal to the literal string, which stores up a bunch of
     * literals before a compressable chunk is found.
     *
     * Adds a single byte and increments the current byte.
     */
    function addLiteral() {
        literal += inStr.charAt(currentByte);
        currentByte += 1;
    }


    /**
     * Encodes literals stored in literal string into the byte stream. Stores
     * the encoded data in the out string.
     *
     * Does not increment the current byte.
     */
    function encodeLiterals() {
        var bytes;

        while (literal.length) {
            bytes = Math.min(literal.length, 12);

            debug("literal length %d %j", bytes, literal.substr(0, bytes));
            out += outChars.charAt(bytes - 1) + literal.substr(0, bytes);
            literal = literal.substr(bytes);
        }
    }


    /**
     * Finds the most recent match to the current position for a given length.
     *
     * @param {number} len The length we're trying to find
     * @return {(number|null)} distance backwards
     */
    function findClosestMatch(len) {
        var distance, idx;

        // Do not run off the end of the string
        if (len > maxByte - currentByte) {
            return null;
        }

        idx = inStr.lastIndexOf(inStr.slice(currentByte, currentByte + len), currentByte - 1);

        if (idx < 0) {
            return null;
        }

        // Distance must be a positive integer, not zero or smaller.
        distance = currentByte - idx;

        // Reject if this is outside our window.
        if (distance > maxDistance) {
            return null;
        }

        return distance;
    }


    /**
     * Keep searching backwards to find the best match to what's at the current
     * byte. If it is fewer than a length of three bytes, give up. If three
     * bytes and it is too far back, skip because there's no savings in
     * compressing it. If four or more bytes, keep.
     *
     * @return {Object} distance (backwards) and length properties
     */
    function findLongestMatch() {
        var betterHit, distance, length;

        length = 3;
        distance = findClosestMatch(length);

        if (!distance) {
            return null;
        }

        length += 1;
        betterHit = findClosestMatch(length);

        while (betterHit) {
            distance = betterHit;
            length += 1;
            betterHit = findClosestMatch(length);
        }

        length -= 1;

        // Short codes only go back 127 bytes. If we are only encoding three
        // bytes, then there is no gain if we go back more than 127 bytes.
        if (length === 3 && distance > maxDistanceShort) {
            return null;
        }

        return {
            distance,
            length
        };
    }


    /**
     * Encode a distance. This can take the form of a short replication
     * (copies 3 bytes from a nearby location) or a long replication (4
     * or more bytes and that number is encoded separately).
     *
     * Writes to the output string.
     *
     * Advances the current byte.
     *
     * @param {Object} bestMatch
     */
    function encodeLengthAndDistance(bestMatch) {
        var distance, high, length, low;

        // Subtract 1 from distance because going back 0 bytes is invalid.
        distance = bestMatch.distance - 1;
        low = distance % outCharsLength;
        high = (distance - low) / outCharsLength;
        length = Math.min(48, bestMatch.length);
        debug("distance %d high %d low %d length %d %j", distance + 1, high, low, 3, inStr.substr(currentByte, length));

        if (length < 4) {
            high += 57;
        } else {
            out += outChars.charAt(length + 8);
        }

        out += outChars.charAt(high);
        out += outChars.charAt(low);
        currentByte += length;
    }

    currentByte = 0;
    maxByte = inStr.length;
    out = "";
    literal = "";
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
            var bestMatch;

            // Just in case this is called after the work is complete
            if (done) {
                return;
            }

            // We can not encode fewer than 3 characters and save any space.
            // Also, this is where we detect that we're at the end and wrap
            // up any remaining bytes.
            if (currentByte > maxByte - 3) {
                // Consume the rest of the buffer
                while (currentByte < maxByte) {
                    addLiteral();
                }

                // Finish the compressed output
                encodeLiterals();
                done = true;

                return;
            }

            // Find the longest string in the entire history
            bestMatch = findLongestMatch();

            // If it's a short match, often we are better throwing it away.
            //
            // For future enhancement: Add a test to see what would happen if
            // we have at least 1 literal and bestMatch.length === 3 and we
            // peeked ahead to see if the next bestMatch is of a longer length.
            // Or just blindly skip compressing when we have a literal and
            // bestMatch is 3?

            if (bestMatch) {
                encodeLiterals();
                encodeLengthAndDistance(bestMatch);
            } else {
                addLiteral();
            }
        }
    };
}

debug = require("debug")("lz77Ascii-compress");
outChars = "#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
outCharsLength = outChars.length;
maxDistance = outCharsLength * outCharsLength;
maxDistanceShort = 34 * outCharsLength;
module.exports = createCompressor;
