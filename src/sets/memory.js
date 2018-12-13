"use strict";
const Promise = require("bluebird");
class MemorySet {
    constructor() {
        this.set = new Set();
    }

    /**
     * Check if value is in set
     * @param {Mixed} value 
     * @returns {Promise<boolean>} return true if value is in set
     */
    has(value) {
        return Promise.resolve(this.set.has(value));
    }

    /**
     * Add value in set
     * @param {Mixed} value
     * @returns {Promise<boolean>} true if value is added, false is already in set
     */
    add(value) {
        const self = this;
        return new Promise((resolve) => {
            const size = self.set.size;
            this.set.add(value);
            resolve(size !== self.set.size);
        });
    }
    /**
     * Delete value from set
     * @param {Mixed} value
     * @returns {Promise<boolean>} true if value is deleted, false is not in set
     */
    delete(value) {
        const self = this;
        return new Promise((resolve) => {
            const size = self.set.size;
            this.set.delete(value);
            resolve(size !== self.set.size);
        });
    }

    /**
     * Return current set size
     * @param {Mixed} value
     * @returns {Promise<Number>}
     */
    size() {
        return Promise.resolve(this.set.size);
    }
}

module.exports = MemorySet;
