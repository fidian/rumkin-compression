"use strict";

/* eslint no-bitwise: off*/
var debug, DynamicBuffer;


/**
 * Create a set of compression functions that are designed to work on
 * a single buffer.
 *
 * @param {Buffer} inBuffer
 * @return {Object}
 */
function createCompressor(inBuffer) {
    var currentByte, done, literalBuffer, maxByte, outBuffer;


    /**
     * Adds a literal to the literal buffer, which stores up a bunch of
     * literals before a compressable chunk is found.
     *
     * Adds a single byte and increments the current byte.
     */
    function addLiteral() {
        literalBuffer.write(inBuffer[currentByte]);
        currentByte += 1;
    }


    /**
     * Encodes literals stored in literalBuffer into the byte stream. Stores
     * the encoded data in the out buffer.
     *
     * Does not increment the current byte.
     */
    function encodeLiterals() {
        var actualBuffer, bytesToWrite;

        actualBuffer = literalBuffer.getBuffer();

        while (actualBuffer.length) {
            bytesToWrite = Math.min(64, actualBuffer.length);

            // Binary 00xx xxxx = literal encoding
            debug("literal length %d %j", bytesToWrite, actualBuffer.slice(0, bytesToWrite).toString("hex"));
            outBuffer.write(bytesToWrite - 1);
            outBuffer.concat(actualBuffer.slice(0, bytesToWrite));
            actualBuffer = actualBuffer.slice(bytesToWrite);
        }

        literalBuffer = new DynamicBuffer();
    }


    /**
     * Finds the most recent match to the current position for a given length.
     *
     * @param {number} len The length we're trying to find
     * @return {(number|null)} distance backwards
     */
    function findClosestMatch(len) {
        var distance, idx;

        // Do not run off the end of the buffer.
        if (len > maxByte - currentByte) {
            return null;
        }

        idx = inBuffer.lastIndexOf(inBuffer.slice(currentByte, currentByte + len), currentByte - 1);

        if (idx < 0) {
            return null;
        }

        // Distance must be a positive integer, not zero or smaller.
        distance = currentByte - idx;

        // Reject if this is outside our window.
        if (distance > 16513) {
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
        if (length === 3 && distance > 127) {
            return null;
        }

        return {
            distance,
            length
        };
    }


    /**
     * Encode a distance. This can take the form of a short distance (one byte)
     * or a long distance (two bytes).
     *
     * Writes to the output buffer.
     *
     * @param {number} distance
     */
    function encodeDistance(distance) {
        var high, low, modifiedDistance;

        if (distance <= 128) {
            // Short distances (1-128), are encoded (0-127) with the high bit
            // on.
            low = distance - 1 | 128;
            debug("distance %d low %d", distance, low);
            outBuffer.write(low);
        } else {
            // Long distances (129-16384) are encoded (0-16384) with the
            // leading two bits as 01.
            modifiedDistance = distance - 129;
            low = modifiedDistance & 0xFF;
            high = modifiedDistance >> 8;
            high |= 64;
            debug("distance %d high %d low %d", distance, high, low);
            outBuffer.write(high);
            outBuffer.write(low);
        }
    }


    /**
     * Encodes the length of the text to copy. This is always one byte.
     *
     * Writes to the output buffer and moves the current byte index forward.
     *
     * @param {number} len
     */
    function encodeLength(len) {
        // This is always one byte. Encoding the length also moves ahead the
        // currentByte pointer. This can only encode up to 258 bytes (minimum
        // size is 3, so encoded "0" = actual "3").
        len = Math.min(258, len);
        outBuffer.write(len - 3);
        debug("length %d %j", len, inBuffer.slice(currentByte, currentByte + len).toString("hex"));
        currentByte += len;
    }


    /**
     * A match was found. Encode the distance and length.
     *
     * @param {Object} bestMatch distance and length properties
     */
    function encodeReplicate(bestMatch) {
        encodeDistance(bestMatch.distance);
        encodeLength(bestMatch.length);
    }

    currentByte = 0;
    maxByte = inBuffer.length;
    outBuffer = new DynamicBuffer();
    literalBuffer = new DynamicBuffer();
    done = false;

    // Must add at least one literal. Code can break if there's nothing already
    // encoded, plus there's no other option.
    addLiteral();

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
                encodeReplicate(bestMatch);
            } else {
                addLiteral();
            }
        }
    };
}

debug = require("debug")("lz77-compress");
DynamicBuffer = require("@fidian/dynamic-buffer");
module.exports = createCompressor;
