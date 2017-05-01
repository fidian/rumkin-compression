"use strict";

/* eslint no-sync:off */
var fixtures, lz77Ascii;

lz77Ascii = require("..").lz77Ascii;
fixtures = require("./fixtures");

describe("lz77Ascii", () => {
    describe("compression", () => {
        /**
         * Helper for compression tests
         *
         * @param {string} input
         * @param {string} expected
         */
        function runTest(input, expected) {
            var result;

            result = lz77Ascii.compressSync(input);
            expect(result).toEqual(expected);
        }

        it("encodes a literal", () => {
            runTest("a", "#a");
        });
        it("encodes two literals", () => {
            runTest("aa", "$aa");
        });
        it("encodes three literals because no savings from compression", () => {
            runTest("aaa", "%aaa");
        });
        it("starts compression with four characters in a row, copying more bytes than what's been encoded", () => {
            // Just the distance
            runTest("aaaa", "#a]#");
        });
        it("encodes a bit longer", () => {
            // Distance and length
            runTest("aaaaa", "#a/##");
        });
        it("encodes a bunch of literals", () => {
            runTest("abcdefg", ")abcdefg");
        });
        it("encodes with two matches in history", () => {
            runTest("abcabcdefabcdefg", "%abc]%%def1#(#g");
        });
    });
    describe("decompression", () => {
        /**
         * Helper for decompression tests.
         *
         * @param {string} input
         * @param {string} expected
         */
        function runTest(input, expected) {
            var result;

            result = lz77Ascii.decompressSync(input);
            expect(result).toEqual(expected);
        }

        it("decompresses a literal", () => {
            runTest("#a", "a");
        });
        it("decodes two literals", () => {
            runTest("$aa", "aa");
        });
        it("decompresses a short code", () => {
            runTest("#a]#", "aaaa");
        });
        it("decompresses more text", () => {
            runTest("%abc]%%def1#(#g", "abcabcdefabcdefg");
        });
    });
    describe("tiny decompression", () => {
        /**
         * Helper for decompression tests.
         *
         * @param {string} input
         * @param {string} expected
         */
        function runTest(input, expected) {
            var result;

            result = lz77Ascii.decompressTiny(input);
            expect(result).toEqual(expected);
        }

        it("decompresses a literal", () => {
            runTest("#a", "a");
        });
        it("decodes two literals", () => {
            runTest("$aa", "aa");
        });
        it("decompresses a short code", () => {
            runTest("#a]#", "aaaa");
        });
        it("decompresses more text", () => {
            runTest("%abc]%%def1#(#g", "abcabcdefabcdefg");
        });
    });
    describe("fixtures", () => {
        Object.keys(fixtures).forEach((key) => {
            it(`compresses and decompresses ${key}`, () => {
                var compressed, decompressed, text;

                text = fixtures[key].toString("binary");
                compressed = lz77Ascii.compressSync(text);
                decompressed = lz77Ascii.decompressSync(compressed);
                expect(decompressed).toEqual(text);
            });
            it(`compresses and tiny decompresses ${key}`, () => {
                var compressed, decompressed, text;

                text = fixtures[key].toString("binary");
                compressed = lz77Ascii.compressSync(text);
                decompressed = lz77Ascii.decompressTiny(compressed);
                expect(decompressed).toEqual(text);
            });
        });
    });
});
