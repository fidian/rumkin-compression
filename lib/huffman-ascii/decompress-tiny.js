/**
 * Tiny implementation of Huffman ASCII encoding decompressor. If you were
 * intending to use Huffman encoding on web pages and not use the full-blown
 * decompressor, then this tiny version may be what you seek. For the ultimate
 * in savings, minify this file.
 *
 * Builds a string as the result. Expects a Base64 string as input.
 */

/* eslint strict:off, eqeqeq:off, no-plusplus:off, space-unary-ops:off, no-bitwise:off, no-constant-condition:off, prefer-template:off */

// var debug = require("debug")("huffmanAscii-decompressTiny");

(this || exports).huffmanAsciiDecompressTiny = function (input) {
    var bits, current, i, list, node, output, tree;

    /**
     * Convert a single Base64 character to its value. Reads the character
     * from the input string.
     *
     * @return {number}
     */
    function getBase64Char() {
        var c;

        c = input.charCodeAt(current++);

        if (c < 47) {
            // + is 43 and becomes 62
            return 62;
        }

        if (c < 48) {
            // / is 47 and becomes 63
            return 63;
        }

        if (c < 58) {
            // numbers become 52 - 61
            // subtract 48, add 52.
            return c + 4;
        }

        // Flipping logic here so errors are treated as "="
        if (c > 96) {
            // a-z becomes 26-51
            // subtract 97, add 26
            return c - 71;
        }

        if (c > 64) {
            // A-Z become 0-25
            // subtract 65
            return c - 65;
        }

        // = is a placeholder. Return 0.
        // Everything else is an error. Return 0.
        return 0;
    }


    /**
     * Reads a bit from the input, starting with the high bit.
     *
     * @return {string} "0" or "1"
     */
    function readBit() {
        if (!bits.length) {
            bits = (128 + getBase64Char()).toString(2).substr(2).split("");
        }

        // debug("readbit %s", bits[0]);
        return bits.shift();
    }

    current = 0;
    bits = [];
    output = "";
    tree = {};
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
                node.v = +readBit() + node.v * 2;
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
