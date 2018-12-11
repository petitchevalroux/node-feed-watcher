"use strict";

const path = require("path"),
    FeedReader = require(path.join(__dirname, "feed-reader")),
    {
        PassThrough,
        Transform
    } = require("stream"),
    Promise = require("bluebird"),
    logger = require(path.join(__dirname, "..", "dependencies", "logger"));
class FeedWatcher {
    constructor(options) {
        Object.assign(this, options);
        if (!this.frequency) {
            this.frequency = 60;
        }
    }

    /**
     * Call after feed processing
     * @param {Set} timeouts running timeouts
     * @param {object} feed
     * @returns {Promise<object>} feed
     * @memberof FeedWatcher
     */
    onProcessedFeed(timeouts, feed) {
        logger.debug("FeedWatcher.onProcessedFeed", feed);
        const self = this;
        return new Promise(resolve => {
            const timeout = setTimeout(
                () => {
                    timeouts.delete(timeout);
                    resolve(feed);
                },
                Math.round(self.frequency * 1000)
            );
            timeouts.add(timeout);
        });
    }
    /**
     * Start watcher
     * 
     * @returns {WritableStream} Object Mode Stream to write feed to
     * @memberof FeedWatcher
     */
    start() {

        const feedInStream = new PassThrough({
                objectMode: true
            }),
            feedReader = new FeedReader({
                feedInStream: new PassThrough({
                    objectMode: true
                }),
                feedOutStream: new PassThrough({
                    objectMode: true
                }),
                articlesOutStream: new PassThrough({
                    objectMode: true
                })
            }),
            self = this,
            processingTimeouts = new Set();
        feedReader
            .feedOutStream
            .pipe(
                new Transform({
                    objectMode: true,
                    transform: (feed, encoding, callback) => {
                        self
                            .onProcessedFeed(processingTimeouts, feed)
                            .then(feed => {
                                callback(null, feed);
                                return;
                            })
                            .catch(error => {
                                callback(error);
                            });
                    }
                })
            )
            .pipe(feedReader.feedInStream)
            .on("error", error => {
                logger.error("FeedWatcher.start", error);
            });

        feedReader.feedInStream.on("finish", () => {
            // clear timeouts in order to avoid more write
            self.clearTimeouts(processingTimeouts);
            logger.debug("FeedWatcher.start feedReader.feedInStream finish");
        });
        feedReader.feedInStream.on("end", () => {
            logger.debug("FeedWatcher.start feedReader.feedInStream end");
        });
        // We do not pipe because end must not be emitted
        feedInStream.on("data", data => {
            feedReader.feedInStream.write(data);
        });
        feedReader.run();
        return {
            feedInStream: feedInStream,
            articlesOutStream: feedReader.articlesOutStream,
            feedReader: feedReader
        };
    }
    /**
     * clearTimeouts in timeouts
     * @param {Iterator} timeouts
     */
    clearTimeouts(timeouts) {
        for (const timeout of timeouts) {
            clearTimeout(timeout);
        }
    }


}
module.exports = FeedWatcher;
