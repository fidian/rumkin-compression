"use strict";

/* eslint no-bitwise:off */
var debug, DynamicBuffer;

/**
 * Create a set of decompression functions that are designed to work on
 * a single buffer.
 *
 * @param {Buffer} inBuffer
 * @return {Object}
 */
function createDecompressor(inBuffer) {
    var bits, currentByte, done, maxByte, outBuffer, tree;


    /**
     * Reads a bit from the buffer, starting with the high bit
     *
     * @return {string} "0" or "1"
     */
    function readBit() {
        var binaryString;

        if (!bits.length) {
            binaryString = (+inBuffer[currentByte]).toString(2);

            while (binaryString.length < 8) {
                binaryString = `0${binaryString}`;
            }

            bits = binaryString.split("");
            currentByte += 1;
        }

        return bits.shift();
    }


    /**
     * Builds the tree object from the buffer. Nodes all either have a .code
     * property (number from 0 to 256 where 256 = stop code) or have nodes
     * linked from .left and .right properties.
     *
     * @return {Object} Has .left and .right or .code
     */
    function readTree() {
        var binary, node, nodeList, root;

        root = {};
        nodeList = [
            root
        ];

        while (nodeList.length) {
            node = nodeList.shift();

            if (readBit() === "1") {
                debug("tree node forks");
                node.left = {};
                nodeList.push(node.left);
                node.right = {};
                nodeList.push(node.right);
            } else {
                binary = readBit() + readBit() + readBit() + readBit() + readBit() + readBit() + readBit() + readBit() + readBit();
                node.code = parseInt(binary, 2);
                debug("tree node value %d %s", node.code, binary);
            }
        }

        debug("tree %j", root);

        return root;
    }


    outBuffer = new DynamicBuffer();
    currentByte = 0;
    bits = [];
    maxByte = inBuffer.length;
    done = false;
    tree = readTree();

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
            var node;

            node = tree;

            while (!node.code) {
                if (readBit() === "0") {
                    node = node.left;
                } else {
                    node = node.right;
                }
            }

            if (node.code < 256) {
                outBuffer.write(node.code);

                return true;
            }

            done = true;
            debug("done");

            return false;
        }
    };
}

debug = require("debug")("huffman-decompress");
DynamicBuffer = require("@fidian/dynamic-buffer");
module.exports = createDecompressor;
