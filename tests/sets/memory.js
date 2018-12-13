"use strict";
const
    path = require("path"),
    MemorySet = require(path.join(__dirname, "..", "..", "src", "sets",
        "memory")),
    assert = require("assert"),
    Promise = require("bluebird");
describe("sets/memory", () => {
    let set;

    beforeEach(() => {
        set = new MemorySet();
    });

    describe("add", () => {
        it("add value return true/false", () => {
            return Promise
                .all([
                    set.add("foo"),
                    set.add("foo")
                ])
                .then(results => {
                    assert(results[0]);
                    assert(!results[1]);
                    return results;
                });
        });
    });

    describe("has", () => {
        it("true/false if set has or hasn't value", () => {
            return Promise
                .all([
                    set.add("foo"),
                    set.has("foo"),
                    set.has("bar"),
                ])
                .then(results => {
                    assert(results[1]);
                    assert(!results[2]);
                    return results;
                });
        });
    });

    describe("delete", () => {
        it("add value return true/false if value is deleted or not", () => {
            return Promise
                .all([
                    set.add("foo"),
                    set.delete("foo"),
                    set.delete("bar")
                ])
                .then(results => {
                    assert(results[1]);
                    assert(!results[2]);
                    return results;
                });
        });
    });


    describe("size", () => {
        it("update size on delete/add", () => {
            return Promise
                .all([
                    set.add("foo"),
                    set.size("foo"),
                    set.delete("foo"),
                    set.size("foo")
                ])
                .then(results => {
                    assert.equal(results[1], 1);
                    assert.equal(results[3], 0);
                    return results;
                });
        });
    });

});
