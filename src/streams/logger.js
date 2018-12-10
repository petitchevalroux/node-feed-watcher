"use strict";
const {
        Transform
    } = require("stream"),
    path = require("path"),
    logger = require(path.join(__dirname, "..", "dependencies", "logger"));
class LoggerStream extends Transform {
    constructor(options) {
        const message = options.message ? options.message : "";
        const level = options.level ? options.level : "debug";
        super(Object.assign({
            transform: (chunk, encoding, callback) => {
                logger.log(level, message, chunk);
                callback(null, chunk);
            },
            objectMode: true
        }, options));
    }

}
module.exports = LoggerStream;
