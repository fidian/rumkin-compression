"use strict";

/* eslint no-bitwise: off*/
var debug, DynamicBuffer;


/**
 * Returns an empty frequency table including the stop bit (256).
 *
 * @return {Object}
 */
function makeEmptyFrequencyTable() {
    var i, map;

    map = {};

    for (i = 0; i < 256; i += 1) {
        map[i] = 0;
    }

    map[256] = 1;

    return map;
}


/**
 * Builds a tree out of frequency map.
 *
 * @param {Object} map character code -> frequencies
 * @return {Object} tree Either has .code or .left and .right
 */
function buildTree(map) {
    var lowest, nextLowest, nodes;

    /**
     * Keep the two lowest nodes.
     *
     * @param {Object} node
     */
    function findLowestNodes(node) {
        if (!lowest) {
            lowest = node;
        } else if (node.weight < lowest.weight) {
            nextLowest = lowest;
            lowest = node;
        } else if (!nextLowest || nextLowest.weight > node.weight) {
            nextLowest = node;
        }
    }

    /**
     * Return true if this node isn't one of the two lowest nodes.
     *
     * @param {Object} node
     * @return {boolean}
     */
    function removeLowestNodes(node) {
        return node !== lowest && node !== nextLowest;
    }

    nodes = Object.keys(map).map((code) => {
        return {
            // Converting the character code from a string to a number
            code: +code,
            weight: map[code]
        };
    });

    while (nodes.length > 1) {
        lowest = null;
        nextLowest = null;

        nodes.forEach(findLowestNodes);
        nodes = nodes.filter(removeLowestNodes);
        nodes.push({
            left: nextLowest,
            right: lowest,
            weight: nextLowest.weight + lowest.weight
        });
        delete lowest.weight;
        delete nextLowest.weight;
    }

    delete nodes[0].weight;

    return nodes[0];
}


/**
 * Creates codes for each node in the tree. Writes out the header of the
 * compressed data to represent the tree. Returns the mapping between
 * the byte values and their binary codes.
 *
 * @param {Object} tree
 * @param {Function} writeBits
 * @return {Object} mapping
 */
function makeCodes(tree, writeBits) {
    var binary, map, node, nodeList;

    tree.huffman = "";
    nodeList = [
        tree
    ];
    map = {};

    while (nodeList.length) {
        node = nodeList.shift();

        if (node.left) {
            debug("tree node forks");
            writeBits("1");
            node.left.huffman = `${node.huffman}0`;
            nodeList.push(node.left);
            node.right.huffman = `${node.huffman}1`;
            nodeList.push(node.right);
        } else {
            writeBits("0");

            // Encode the character using 9 bits so we can also hold the
            // flag indicating end of message.
            binary = node.code.toString(2);

            while (binary.length < 9) {
                binary = `0${binary}`;
            }

            writeBits(binary);
            debug("tree node value %d %s", node.code, binary);

            // Add to the map
            map[node.code] = node.huffman;
        }
    }

    return map;
}


/**
 * Get a list of all codes used in the file, then change those codes into
 * a tree. Finally, build a map to change original codes (numbers) to
 * the Huffman encoded letters (text version of binary).
 *
 * @param {Object} frequencies
 * @param {Function} writeBits
 * @return {Object} map of byte to binary codes
 */
function buildCodeTree(frequencies, writeBits) {
    var codes, i, tree;

    // Remove empty bytes.
    for (i = 0; i < 256; i += 1) {
        if (!frequencies[i]) {
            delete frequencies[i];
        }
    }

    debug("frequencies %j", frequencies);

    // Build a tree.
    tree = buildTree(frequencies);
    debug("tree %j", tree);

    // Build codes in the tree and write the tree to the output buffer.
    codes = makeCodes(tree, writeBits);
    debug("codes %j", codes);

    return codes;
}


/**
 * Create a set of compression functions that are designed to work on
 * a single buffer.
 *
 * @param {Buffer} inBuffer
 * @return {Object}
 */
function createCompressor(inBuffer) {
    var bitsToEncode, codes, currentByte, frequencies, maxLen, outBuffer, phase;

    /**
     * Writes a bit to the output buffer
     *
     * @param {string} bits
     */
    function writeBits(bits) {
        bitsToEncode += bits;

        while (bitsToEncode.length >= 8) {
            outBuffer.write(parseInt(bitsToEncode.substr(0, 8), 2));
            bitsToEncode = bitsToEncode.substr(8);
        }
    }

    bitsToEncode = "";
    outBuffer = new DynamicBuffer();
    phase = 0;
    frequencies = makeEmptyFrequencyTable();
    currentByte = 0;
    maxLen = inBuffer.length;

    return {
        getResult: () => {
            return outBuffer.getBuffer();
        },

        getStatus: () => {
            var percent;

            if (maxLen) {
                percent = currentByte / (maxLen * 2);

                if (phase) {
                    percent += 0.5;
                }
            } else {
                percent = 0;
            }

            return {
                length: maxLen,
                phase,
                percent,
                position: currentByte
            };
        },

        isDone: () => {
            return phase === 2;
        },

        work: () => {
            if (phase === 0) {
                // Scan and build table of frequencies
                frequencies[inBuffer[currentByte]] += 1;
                currentByte += 1;

                if (currentByte === maxLen) {
                    phase += 1;
                    codes = buildCodeTree(frequencies, writeBits);
                    currentByte = 0;
                }
            } else if (phase === 1) {
                // Encode using the Huffman codes instead
                writeBits(codes[inBuffer[currentByte]]);
                currentByte += 1;

                if (currentByte === maxLen) {
                    writeBits(codes[256]);

                    while (bitsToEncode.length) {
                        writeBits("0");
                    }

                    phase += 1;
                    debug("done");
                }
            }
        }
    };
}

debug = require("debug")("huffman-compress");
DynamicBuffer = require("@fidian/dynamic-buffer");
module.exports = createCompressor;
