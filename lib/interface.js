"use strict";

/**
 * @typedef {Object} rumkinCompression~interface
 * @property {Function} work Call this repeatedly to compress/decompress. Returns true if more to do.
 * @property {Function} getResult Gets the resulting buffer. Only valid after done working.
 * @property {Function} getStatus Returns rumkinCompression~interfaceStatus
 * @property {Function} isDone Returns true if done.
 */

/**
 * @typedef {Object} rumkinCompression~interfaceStatus
 * @property {number} length Total size to compress.
 * @property {number} percent Amount converted, from 0 to 1.
 * @property {number} position The number of bytes already converted.
 */

var morePromises;

morePromises = require("more-promises");

module.exports = function (functionNamePrefix, creationFunction) {
    var result;

    /**
     * Compresses or decompresses data. When done, supplies the result to a
     * callback. Accepts an optional progress callback, which gets stats
     * every half second or so, but no stats are actually guaranteed.
     *
     * @param {Buffer} input
     * @param {Function} callback (err, Buffer)
     * @param {Function} progressFn (stats)
     */
    function withCallback(input, callback, progressFn) {
        var actor;

        /**
         * Runs a chunk of work. If not done, sets a timeout to call itself.
         * When done, calls the callback. Periodically calls the progress
         * function.
         */
        function runWork() {
            var startTime;

            startTime = new Date();

            while (new Date() - startTime < 500 && !actor.isDone()) {
                actor.work();
            }

            if (actor.isDone()) {
                callback(null, actor.getResult());
            } else {
                if (progressFn) {
                    progressFn(callback.getStatus());
                }

                setTimeout(runWork, 0);
            }
        }

        actor = creationFunction(input);
        setTimeout(runWork, 0);
    }


    /**
     * Compresses or decompresses asynchronously. Returns a Promise that is
     * resolved with the compressed data.
     *
     * @param {Buffer} input
     * @return {Promise.<Buffer>}
     */
    function async(input) {
        return morePromises.promisify(withCallback)(input);
    }


    /**
     * Compresses or decompresses a buffer synchronously. Simply calls the
     * work function over and over. Returns the result.
     *
     * @param {Buffer} input
     * @return {Buffer}
     */
    function sync(input) {
        var actor;

        actor = creationFunction(input);

        while (!actor.isDone()) {
            actor.work();
        }

        return actor.getResult();
    }

    result = {};
    result[functionNamePrefix] = withCallback;
    result[`${functionNamePrefix}Async`] = async;
    result[`${functionNamePrefix}Sync`] = sync;
    result[`${functionNamePrefix}Direct`] = creationFunction;

    return result;
};
