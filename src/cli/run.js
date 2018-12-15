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
    feedWatcher.add(
        byline
            .createStream(fs.createReadStream(argv.input))
            .pipe(
                new Transform({
                    readableObjectMode: true,
                    writableObjectMode: false,
                    transform: (chunk, undefined, callback) => {
                        callback(null, {
                            url: chunk.toString()
                        });
                    }
                })
            )
    );

    feedWatcher
        .start()
        .pipe(new Transform({
            readableObjectMode: false,
            writableObjectMode: true,
            transform: (chunk, undefined, callback) => {
                callback(null, `\n${new Date()} - ${JSON.stringify(chunk)}`);
            }
        }))
        .pipe(process.stdout);

};
