"use strict";

const path = require("path"),
    FeedReader = require(path.join(__dirname, "feed-reader")),
    {
        PassThrough,
        Transform,
        Writable
    } = require("stream"),
    Promise = require("bluebird"),
    logger = require(path.join(__dirname, "..", "dependencies", "logger"));
class FeedWatcher {
    constructor(options) {
        Object.assign(this, options);
        if (!this.frequency) {
            this.frequency = 60;
        }
        this.processingTimeouts = new Set();
        const self = this;
        this.feedReader = new FeedReader({
            feedInStream: new PassThrough({
                objectMode: true
            }),
            feedOutStream: new Transform({
                objectMode: true,
                transform: (feed, encoding, callback) => {
                    self
                        .onProcessedFeed(feed)
                        .then(feed => {
                            callback(null, feed);
                            return;
                        })
                        .catch(error => {
                            callback(error);
                        });
                }
            }),
            articlesOutStream: new PassThrough({
                objectMode: true
            })
        });

        this.feedReader
            .feedOutStream
            .pipe(this.feedReader.feedInStream)
            // If in stream finished, we cancel timeouts to avoid futher writing
            .on("finish", () => {
                self.clearTimeouts();
            });
    }

    /**
     * Call after feed processing
     * @param {object} feed
     * @returns {Promise<object>} feed
     * @memberof FeedWatcher
     */
    onProcessedFeed(feed) {
        logger.debug("FeedWatcher.onProcessedFeed", feed);
        const self = this;
        return new Promise(resolve => {
            const timeout = setTimeout(
                () => {
                    self.processingTimeouts.delete(timeout);
                    resolve(feed);
                },
                Math.round(self.frequency * 1000)
            );
            self.processingTimeouts.add(timeout);
        });
    }


    /**
     * Add feeds from feedStream
     * @param {ReadableStream} feedsStream
     * @returns Promise<undefined> resolved when all feeds from feedsStream have been added to watched feeds
     */
    add(feedsStream) {
        const self = this;
        return new Promise((resolve, reject) => {
            feedsStream
                .pipe(new Writable({
                    objectMode: true,
                    "write": (chunk, encoding, callback) => {
                        self
                            .feedReader
                            .feedInStream
                            .write(chunk, encoding, callback);
                    }
                }))
                .on("finish", () => {
                    resolve();
                }).on("error", (error) => {
                    reject(error);
                });
        });
    }
    /**
     * Start watcher
     * 
     * @returns {ReadableStream} Object Mode Stream to read articles from
     * @memberof FeedWatcher
     */
    start() {
        this.feedReader.run();
        return this.feedReader.articlesOutStream;
    }

    /**
     * clearTimeouts in timeouts
     */
    clearTimeouts() {
        for (const timeout of this.processingTimeouts) {
            clearTimeout(timeout);
        }
    }


}
module.exports = FeedWatcher;
