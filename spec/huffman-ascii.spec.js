"use strict";

/* eslint no-sync:off */
var fixtures, huffmanAscii;

huffmanAscii = require("..").huffmanAscii;
fixtures = require("./fixtures");

describe("huffmanAscii", () => {
    describe("compression", () => {
        /**
         * Helper for compression tests
         *
         * @param {string} input
         * @param {string} expected
         */
        function runTest(input, expected) {
            var result;

            result = huffmanAscii.compressSync(input);
            expect(result).toEqual(expected);
        }

        // "a" has a frequency of 1. Algorithm makes the left branch mean EOF.
        it("encodes a letter", () => {
            runTest("a", "oAMM");
        });

        // "a" has a frequency of 2 and is moved to be first.
        it("encodes two letters", () => {
            runTest("aa", "jCgB");
        });

        // Proof that the above encoding is correct.
        it("encodes five letters", () => {
            runTest("aaaaa", "jCgAIA==");
        });

        it("encodes 50 letters", () => {
            runTest("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "jCgAAAAAAAAB");
        });
    });
    describe("decompression", () => {
        /**
         * Helper for decompression tests.
         *
         * @param {string} input
         * @param {string} expectedString
         */
        function runTest(input, expectedString) {
            var result;

            result = huffmanAscii.decompressSync(input);
            expect(result).toEqual(expectedString);
        }

        it("decompresses a letter", () => {
            runTest("oAMM", "a");
        });
        it("decompresses two letters", () => {
            runTest("jCgB", "aa");
        });
        it("decompresses five letters", () => {
            runTest("jCgAIA==", "aaaaa");
        });
        it("decompresses 50 letters", () => {
            runTest("jCgAAAAAAAAB", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        });
    });
    describe("fixtures", () => {
        Object.keys(fixtures).forEach((key) => {
            it(`compresses and decompresses ${key}`, () => {
                var compressed, decompressed;

                compressed = huffmanAscii.compressSync(fixtures[key]);
                decompressed = huffmanAscii.decompressSync(compressed);
                expect(decompressed).toEqual(fixtures[key].toString("binary"));
            });
            it(`compresses and tiny decompresses ${key}`, () => {
                var compressed, decompressed;

                compressed = huffmanAscii.compressSync(fixtures[key]);
                decompressed = huffmanAscii.decompressTiny(compressed);
                expect(decompressed).toEqual(fixtures[key].toString("binary"));
            });
        });
    });
});
