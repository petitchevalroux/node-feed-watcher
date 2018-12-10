"use strict";
const fs = require("fs"),
    path = require("path"),
    byline = require("byline"),
    feedWatcher = new(require(path.join(__dirname, "..", "libraries", "feed-watcher")))(),
    {
        Transform
    } = require("stream"),
    process = require("process");
module.exports = (argv) => {
    const {
        feedInStream,
        articlesOutStream
    } = feedWatcher.start();
    byline
        .createStream(
            fs.createReadStream(argv.input))
        .pipe(new Transform({
            readableObjectMode: true,
            writableObjectMode: false,
            transform: (chunk, undefined, callback) => {
                callback(null, {
                    url: chunk.toString()
                });
            }
        }))
        .pipe(feedInStream);

    articlesOutStream
        .pipe(new Transform({
            readableObjectMode: false,
            writableObjectMode: true,
            transform: (chunk, undefined, callback) => {
                callback(null, `\n${JSON.stringify(chunk)}`);
            }
        }))
        .pipe(process.stdout);

};
