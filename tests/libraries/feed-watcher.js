"use strict";

const path = require("path"),
    FeedWatcher = require(path.join(__dirname, "..", "..", "src", "libraries",
        "feed-watcher")),
    assert = require("assert"),
    sinon = require("sinon"),
    Promise = require("bluebird");

describe("libraries/feedWatcher", () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        sandbox.restore();
    });
    describe("constructor", () => {
        it("set default frequency", () => {
            const feedWatcher = new FeedWatcher();
            assert.equal(typeof(feedWatcher.frequency), "number");
        });
    });

    describe("start", () => {
        const feedWatcher = new FeedWatcher(),
            stubFeedReaderProcess = (feedReader, feedUrl, articles) => {
                feedReader.process.withArgs(feedUrl).callsFake(() => {
                    return Promise.all(articles.map(article => {
                        return new Promise((resolve, reject) => {
                            feedReader.articlesOutStream
                                .write(article, (error => {
                                    if (error) {
                                        return reject(
                                            error
                                        );
                                    }
                                    resolve();
                                }));
                        });
                    }))
                        .then(() => {
                            return;
                        });
                });
            };


        it("stop when input stream is ended", (done) => {
            const {
                feedInStream
            } = feedWatcher.start();
            feedInStream.end();
            done();
        });

        it("process feeds writen in input", (done) => {
            feedWatcher.frequency = 0.001;
            const {
                    feedInStream,
                    articlesOutStream,
                    feedReader
                } = feedWatcher.start(),
                articlesOut = [];
            sandbox.stub(feedReader, "process");
            stubFeedReaderProcess(
                feedReader,
                "http://example.com/feed-1",
                [{
                    url: "http://example.com/feed-1/article-1",
                    title: "http://example.com/feed-1/article-1",
                },
                {
                    url: "http://example.com/feed-1/article-2",
                    title: "http://example.com/feed-1/article-2",
                },
                ]);
            stubFeedReaderProcess(
                feedReader,
                "http://example.com/feed-2",
                [{
                    url: "http://example.com/feed-2/article-1",
                    title: "http://example.com/feed-2/article-1",
                },
                {
                    url: "http://example.com/feed-2/article-2",
                    title: "http://example.com/feed-2/article-2",
                },
                ]);
            articlesOutStream.on("data", article => {
                articlesOut.push(article);
            });
            articlesOutStream.on("end", () => {
                assert.equal(articlesOut.length, 4);
                done();
            });
            feedInStream.write({
                url: "http://example.com/feed-1"
            }, undefined, () => {
                feedInStream.write({
                    url: "http://example.com/feed-2"
                }, undefined, () => {
                    // We end in stream to stop the watcher
                    feedReader.feedInStream.end();
                });
            });
        });

    });
});
