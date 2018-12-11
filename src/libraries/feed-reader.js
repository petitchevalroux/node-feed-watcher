"use strict";
const Promise = require("bluebird"),
    parallel = require("parallel-stream"),
    FeedParser = require("feedparser"),
    got = require("got"),
    {
        Writable,
        pipeline
    } = require("stream"),
    path = require("path"),
    LoggerStream = require(path.join(__dirname, "..", "streams", "logger")),
    logger = require(path.join(__dirname, "..", "dependencies", "logger"));

class FeedReader {
    /**
     * Creates an instance of FeedReader.
     * @param Object options
     *  articlesOutStream stream.Writable stream where articles are writen
     *  feedInStream stream.Readable stream from where feeds are read
     *  concurrency Number optional number of feed to process in //
     *  feedOutStream stream.Writable optional stream where processed feed are writen
     * @memberof FeedReader
     */
    constructor(options) {
        Object.assign(this, options);
        if (!this.articlesOutStream) {
            throw new Error("Missing articlesOutStream");
        }
        if (!this.feedInStream) {
            throw new Error("Missing feedInStream");
        }
        if (!this.concurrency) {
            this.concurrency = 10;
        }
        this.articlesOutStream.on("end", () => {
            logger.debug("feedReader.articlesOutStream end");
        });
    }
    /**
     * Run feedreader, it will read feeds from feedInStream and write found articles in articlesOutStream
     * 
     * It end when feedInStream emit an end event
     *
     * @returns Promise<undefined>
     * @memberof FeedReader
     */
    run() {
        const self = this;
        return new Promise((resolve, reject) => {
            const pipelineArgs = [
                self.feedInStream,
                new LoggerStream({
                    message: "feedReader.run feedInStream>"
                }),
                parallel.transform(
                    (feed, encoding, callback) => {
                        self
                            .process(feed.url)
                            .then(() => {
                                callback(null, feed);
                                return feed;
                            })
                            .catch(error => {
                                callback(error);
                            });
                    }, {
                        objectMode: true,
                        concurrency: self.concurrency
                    }),
                new LoggerStream({
                    message: "feedReader.run parallel.transform>"
                }),
            ];
            if (self.feedOutStream) {
                pipelineArgs.push(
                    new LoggerStream({
                        message: "feedReader.run >feedOutStream"
                    }),
                    self.feedOutStream
                );
            }
            // Pipeline final argument is a callback
            pipelineArgs.push(error => {
                if (error) {
                    logger.error("feedReader.run error", error);
                    return reject(error);
                }
                self.articlesOutStream.end(error => {
                    if (error) {
                        logger.error("feedReader.run error", error);
                        return reject(error);
                    }
                    logger.debug("feedReader.run end");
                    resolve();
                });
            });
            pipeline.apply(null, pipelineArgs);
        });
    }
    /**
     * Read articles from feed at url url and write articles to articlesOutStream
     *
     * @param {string} url
     * @returns {Promise<undefined>}
     * @memberof FeedReader
     */
    process(url) {
        return new Promise((resolve, reject) => {
            const feedParser = new FeedParser();
            got.stream.get(url)
                .pipe(feedParser)
                .pipe(new Writable({
                    objectMode: true,
                    write: (item, encoding, callback) => {
                        this.articlesOutStream.write(
                            Object.assign({}, {
                                url: item.link,
                                title: item.title,
                                date: item.pubdate
                            }),
                            undefined,
                            (error) => {
                                callback(error);
                            }
                        );
                    }
                }))
                .on("error", error => {
                    reject(error);
                })
                .on("finish", () => {
                    resolve();
                });
        });
    }
}

module.exports = FeedReader;
