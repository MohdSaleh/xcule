"use strict";
// Sorting algorithm taken from NeDB (https://github.com/louischatriot/nedb)
// See https://github.com/louischatriot/nedb/blob/e3f0078499aa1005a59d0c2372e425ab789145c1/lib/model.js#L189
Object.defineProperty(exports, "__esModule", { value: true });
exports.sorter = exports.compare = exports.compareArrays = exports.compareNSB = void 0;
function compareNSB(a, b) {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}
exports.compareNSB = compareNSB;
function compareArrays(a, b) {
    for (let i = 0, l = Math.min(a.length, b.length); i < l; i++) {
        const comparison = compare(a[i], b[i]);
        if (comparison !== 0) {
            return comparison;
        }
    }
    // Common section was identical, longest one wins
    return compareNSB(a.length, b.length);
}
exports.compareArrays = compareArrays;
function compare(a, b, compareStrings = compareNSB) {
    if (a === b) {
        return 0;
    }
    // undefined
    if (a === undefined) {
        return -1;
    }
    if (b === undefined) {
        return 1;
    }
    // null
    if (a === null) {
        return -1;
    }
    if (b === null) {
        return 1;
    }
    // Numbers
    if (typeof a === 'number') {
        return typeof b === 'number' ? compareNSB(a, b) : -1;
    }
    if (typeof b === 'number') {
        return 1;
    }
    // Strings
    if (typeof a === 'string') {
        return typeof b === 'string' ? compareStrings(a, b) : -1;
    }
    if (typeof b === 'string') {
        return 1;
    }
    // Booleans
    if (typeof a === 'boolean') {
        return typeof b === 'boolean' ? compareNSB(a, b) : -1;
    }
    if (typeof b === 'boolean') {
        return 1;
    }
    // Dates
    if (a instanceof Date) {
        return b instanceof Date ? compareNSB(a.getTime(), b.getTime()) : -1;
    }
    if (b instanceof Date) {
        return 1;
    }
    // Arrays (first element is most significant and so on)
    if (Array.isArray(a)) {
        return Array.isArray(b) ? compareArrays(a, b) : -1;
    }
    if (Array.isArray(b)) {
        return 1;
    }
    // Objects
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    for (let i = 0, l = Math.min(aKeys.length, bKeys.length); i < l; i++) {
        const comparison = compare(a[aKeys[i]], b[bKeys[i]]);
        if (comparison !== 0) {
            return comparison;
        }
    }
    return compareNSB(aKeys.length, bKeys.length);
}
exports.compare = compare;
// An in-memory sorting function according to the
// $sort special query parameter
function sorter($sort) {
    const get = (value, path) => path.reduce((value, key) => value[key], value);
    const compares = Object.keys($sort).map((key) => {
        const direction = $sort[key];
        const path = key.split('.');
        if (path.length === 1) {
            return (a, b) => direction * compare(a[key], b[key]);
        }
        else {
            return (a, b) => direction * compare(get(a, path), get(b, path));
        }
    });
    return function (a, b) {
        for (const compare of compares) {
            const comparasion = compare(a, b);
            if (comparasion !== 0) {
                return comparasion;
            }
        }
        return 0;
    };
}
exports.sorter = sorter;
//# sourceMappingURL=sort.js.map