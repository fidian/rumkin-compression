"use strict";

/* eslint no-sync:off */
var fixtures, huffman;

huffman = require("..").huffman;
fixtures = require("./fixtures");

describe("huffman", () => {
    describe("compression", () => {
        /**
         * Helper for compression tests
         *
         * @param {string} input
         * @param {string} expectedHex
         */
        function runTest(input, expectedHex) {
            var inputBuffer, result;

            inputBuffer = Buffer.from(input, "utf8");
            result = huffman.compressSync(inputBuffer).toString("hex");
            result = result.toString("hex").replace(/(..)/g, "$1 ").trim();
            expect(result).toEqual(expectedHex);
        }

        // "a" has a frequency of 1. Algorithm makes the left branch mean EOF.
        it("encodes a letter", () => {
            runTest("a", "a0 03 0c");
        });

        // "a" has a frequency of 2 and is moved to be first.
        it("encodes two letters", () => {
            runTest("aa", "8c 28 01");
        });

        // Proof that the above encoding is correct.
        it("encodes five letters", () => {
            runTest("aaaaa", "8c 28 00 20");
        });

        it("encodes 50 letters", () => {
            runTest("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "8c 28 00 00 00 00 00 00 01");
        });
    });
    describe("decompression", () => {
        /**
         * Helper for decompression tests.
         *
         * @param {string} inputHex
         * @param {string} expectedString
         */
        function runTest(inputHex, expectedString) {
            var inputStr, result;

            inputStr = inputHex.replace(/ /g, "");
            result = huffman.decompressSync(Buffer.from(inputStr, "hex"));
            result = result.toString("utf8");
            expect(result).toEqual(expectedString);
        }

        it("decompresses a letter", () => {
            runTest("a0 03 0c", "a");
        });
        it("decompresses a letter with a flipped tree", () => {
            // Hex from above:    a    0    0    3    0    c
            // Binary from above: 1010 0000 0000 0011 0000 1100
            // Root tree node:    1
            // EOF node on left:   010 0000 000
            // "a" node on right:              0 0011 0000 1
            // Bit stream:                                  10
            // Padding:                                       0
            //
            // Now we flip the nodes so the "a" is on the left node and inverse
            // the bits in the bit stream.
            //
            // Broken apart: 1 + 0 0011 0000 1 + 010 0000 000 + 01 + 0
            // Spaced normally 1000 1100 0010 1000 0000 0010
            runTest("8c 28 02", "a");
        });
        it("decompresses two letters", () => {
            runTest("8c 28 01", "aa");
        });
        it("decompresses five letters", () => {
            runTest("8c 28 00 20", "aaaaa");
        });
        it("decompresses 50 letters", () => {
            runTest("8c 28 00 00 00 00 00 00 01", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        });
    });
    describe("fixtures", () => {
        Object.keys(fixtures).forEach((key) => {
            it(`compresses and decompresses ${key}`, () => {
                var compressed, decompressed;

                compressed = huffman.compressSync(fixtures[key]);
                decompressed = huffman.decompressSync(compressed);
                expect(decompressed.toString("hex")).toEqual(fixtures[key].toString("hex"));
            });
            it(`compresses and tiny decompresses ${key}`, () => {
                var compressed, decompressed;

                compressed = huffman.compressSync(fixtures[key]);
                decompressed = huffman.decompressTiny(compressed);
                expect(decompressed).toEqual(fixtures[key].toString("binary"));
            });
        });
    });
});
