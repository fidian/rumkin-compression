"use strict";

/* eslint no-sync:off */
var fs, path, result;

fs = require("fs");
path = require("path");
result = {};

[
    "chargen.txt",
    "rfc1.txt"
].forEach((filename) => {
    result[path.basename(filename)] = fs.readFileSync(path.resolve(__dirname, "fixture", filename));
});

module.exports = result;
