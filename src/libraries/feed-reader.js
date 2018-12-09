"use strict";
const Promise = require("bluebird"),
    parallel = require("parallel-stream"),
    FeedParser = require("feedparser"),
    got = require("got"),
    {
        Writable
    } = require("stream");

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
        return new Promise((resolve) => {
            self
                .feedInStream
                .pipe(
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
                        }
                    ))
                .on("data", feed => {
                    if (self.feedOutStream) {
                        self.feedOutStream.write(feed);
                    }
                })
                .on("error", error => {
                    if (self.feedOutStream) {
                        self.feedOutStream.emit("error", error);
                    }
                })
                .on("end", () => {
                    if (self.feedOutStream) {
                        self.feedOutStream.end();
                    }
                    resolve();
                });
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
