/**
 * Tiny implementation of Huffman encoding decompressor. If you were
 * intending to use Huffman encoding on web pages and not use the full-blown
 * decompressor, then this tiny version may be what you seek. For the ultimate
 * in savings, minify this file.
 *
 * Builds a STRING as the result. Expects a Buffer, UInt8Array or other
 * similar structure where values can be found by using indexing.  For example,
 * input[0] would return the character code of the first byte.
 */

/* eslint strict:off, eqeqeq:off, no-plusplus:off, space-unary-ops:off, no-bitwise:off, no-constant-condition:off, prefer-template:off */

// var debug = require("debug")("lz77-decompressTiny");

(this || exports).huffmanDecompressTiny = function (input) {
    var bits, current, i, list, node, output, tree;

    /**
     * Reads a bit from the input, starting with the high bit.
     *
     * @return {string} "0" or "1"
     */
    function readBit() {
        if (!bits.length) {
            bits = ("0000000" + (+input[current++]).toString(2)).substr(-8).split("");
        }

        return bits.shift();
    }


    bits = [];
    output = "";
    tree = {};
    current = 0;
    list = [
        tree
    ];

    while (list.length) {
        node = list.shift();

        if (+readBit()) {
            // debug("tree node forks");
            list.push(node[0] = {});
            list.push(node[1] = {});
        } else {
            node.v = 0;

            for (i = 0; i++ < 9;) {
                // node.v *= 2;
                // node.v += +readBit();
                node.v = +readBit() + node.v * 2;

                // debug("tree node bit read, is now %d %s", node.v, node.v.toString(2));
            }

            // debug("tree node value %d", node.v);
        }
    }

    // debug("tree %j", tree);

    while (true) {
        node = tree;

        while (!node.v) {
            node = node[readBit()];
        }

        if (node.v > 255) {
            return output;
        }

        output += String.fromCharCode(node.v);
    }
};
