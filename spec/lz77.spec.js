"use strict";

/* eslint no-sync:off */
var fixtures, lz77;

lz77 = require("..").lz77;
fixtures = require("./fixtures");

describe("lz77", () => {
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
            result = lz77.compressSync(inputBuffer).toString("hex");
            result = result.toString("hex").replace(/(..)/g, "$1 ").trim();
            expect(result).toEqual(expectedHex);
        }

        it("encodes a literal", () => {
            runTest("a", "00 61");
        });
        it("encodes two literals", () => {
            runTest("aa", "01 61 61");
        });
        it("encodes three literals because no savings from compression", () => {
            runTest("aaa", "02 61 61 61");
        });
        it("starts compression with four characters in a row, copying more bytes than what's been encoded", () => {
            runTest("aaaa", "00 61 80 00");
        });
        it("encodes a bit longer", () => {
            runTest("aaaaa", "00 61 80 01");
        });
        it("encodes a bunch of literals", () => {
            runTest("abcdefg", "06 61 62 63 64 65 66 67");
        });
        it("encodes with two matches in history", () => {
            runTest("abcabcdefabcdefg", "02 61 62 63 82 00 02 64 65 66 85 03 00 67");
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
            result = lz77.decompressSync(Buffer.from(inputStr, "hex"));
            result = result.toString("utf8");
            expect(result).toEqual(expectedString);
        }

        it("decompresses a literal", () => {
            runTest("00 61", "a");
        });
        it("decodes two literals", () => {
            runTest("01 61 61", "aa");
        });
        it("decompresses a short code", () => {
            runTest("00 61 80 00", "aaaa");
        });
        it("decompresses more text", () => {
            runTest("02 61 62 63 82 00 02 64 65 66 85 03 00 67", "abcabcdefabcdefg");
        });
    });
    describe("fixtures", () => {
        Object.keys(fixtures).forEach((key) => {
            it(`compresses and decompresses ${key}`, () => {
                var compressed, decompressed;

                compressed = lz77.compressSync(fixtures[key]);
                decompressed = lz77.decompressSync(compressed);
                expect(decompressed.toString("hex")).toEqual(fixtures[key].toString("hex"));
            });
            it(`compresses and tiny decompresses ${key}`, () => {
                var compressed, decompressed;

                compressed = lz77.compressSync(fixtures[key]);
                decompressed = lz77.decompressTiny(compressed);
                expect(decompressed).toEqual(fixtures[key].toString("binary"));
            });
        });
    });
});
