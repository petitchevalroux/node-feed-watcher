"use strict";

const path = require("path"),
    FeedReader = require(path.join(__dirname, "..", "..", "src", "libraries",
        "feed-reader")),
    assert = require("assert"),
    {
        Writable,
        Readable,
        PassThrough
    } = require("stream"),
    sinon = require("sinon"),
    Promise = require("bluebird");

describe("libraries/feedReader", () => {

    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        sandbox.restore();
    });

    describe("constructor", () => {
        it("throw an error if no articles stream in options", () => {
            assert.throws(() => {
                new FeedReader();
            });
        });

        it("throw an error if no feed in stream in options", () => {
            assert.throws(() => {
                new FeedReader({
                    articlesOutStream: new Writable()
                });
            });
        });

        it("set a default number concurrency", () => {
            assert.equal(
                typeof(
                    new FeedReader({
                        articlesOutStream: new Writable(),
                        feedInStream: new Readable()
                    })
                        .concurrency), "number");
        });

        it("set number concurrency", () => {
            assert.equal(
                new FeedReader({
                    articlesOutStream: new Writable(),
                    feedInStream: new Readable(),
                    concurrency: 7
                }).concurrency,
                7
            );
        });
    });

    describe("run", () => {
        let feedReader;
        beforeEach(() => {
            sandbox.restore();
            feedReader = new FeedReader({
                articlesOutStream: new Writable(),
                feedInStream: new PassThrough({
                    objectMode: true
                }),
                feedOutStream: new PassThrough({
                    objectMode: true
                })
            });
            sandbox.stub(feedReader, "process").callsFake(() => {
                return Promise.resolve();
            });
        });
        it(
            "call process function with feed urls when a feed is write in feedInStream",
            () => {
                feedReader.feedInStream.write({
                    "url": "http://www.example.com/feed"
                }, undefined, () => {
                    feedReader.feedInStream.write({
                        "url": "http://www.example.com/feed2"
                    }, undefined, () => {
                        feedReader.feedInStream.end();
                    });
                });
                return feedReader.run()
                    .then(() => {
                        assert.equal(
                            feedReader.process.getCall(0).args[0],
                            "http://www.example.com/feed"
                        );
                        assert.equal(
                            feedReader.process.getCall(1).args[0],
                            "http://www.example.com/feed2"
                        );
                        return;
                    });
            });

        it(
            "write feed in feedOutStream when processed and spread stream end",
            (done) => {
                const
                    outFeeds = [];
                feedReader.feedOutStream.on("data", feed => {
                    outFeeds.push(feed);
                });
                feedReader.feedOutStream.on("end", () => {
                    assert.equal(outFeeds.length, 1);
                    assert.equal(outFeeds[0].url,
                        "http://www.example.com/feed3");
                    done();
                });
                feedReader.feedInStream.write({
                    "url": "http://www.example.com/feed3"
                }, undefined, () => {
                    feedReader.feedInStream.end();
                });
                feedReader.run();
            });
    });

    describe("process", () => {
        const feedReader = new FeedReader({
                articlesOutStream: new PassThrough({
                    objectMode: true
                }),
                feedInStream: new PassThrough({
                    objectMode: true
                }),
                feedOutStream: new PassThrough({
                    objectMode: true
                })
            }),
            outArticles = [];
        feedReader.articlesOutStream.on("data", data => {
            outArticles.push(data);
        });
        beforeEach(() => {
            outArticles.splice(0, outArticles.length);
        });
        it("write articles in articlesOutStream", () => {
            return feedReader.process("https://news.ycombinator.com/rss").then(
                () => {
                    assert(outArticles.length > 0);
                    assert.equal(typeof(outArticles[0].url), "string");
                    assert.equal(typeof(outArticles[0].title), "string");
                    assert(outArticles[0].date instanceof Date);
                    return;
                });
        });
    });

});
