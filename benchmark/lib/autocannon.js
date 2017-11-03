'use strict';

var autocannon = require('autocannon');
var fs = require('fs');
var autocannonCompare = require('autocannon-compare');
var path = require('path');

var resultsDirectory = path.join(process.cwd(), 'results');

function writeResult(handler, version, result) {
    try {
        fs.accessSync(resultsDirectory);
    } catch (e) {
        fs.mkdirSync(resultsDirectory);
    }

    result.server = handler;

    var dest = path.join(resultsDirectory, handler + '-' + version + '.json');
    return fs.writeFileSync(dest, JSON.stringify(result, null, 4));
}

function fire(opts, handler, version, save, cb) {
    opts = opts || {};
    opts.url = 'http://localhost:3000';

    autocannon(opts, function onResult(err, result) {
        if (err) {
            cb(err);
            return;
        }

        if (save) {
            writeResult(handler, version, result);
        }

        cb();
    });
}

function compare(a, b) {
    var resA = require(resultsDirectory + '/' + a + '.json');
    var resB = require(resultsDirectory + '/' + b + '.json');
    var comp = autocannonCompare(resA, resB);
    if (comp.equal) {
        return {
            equal: true,
            fastestAverage: resA.requests.average,
            slowestAverage: resB.requests.average
        };
    } else if (comp.aWins) {
        return {
            equal: false,
            diff: comp.requests.difference,
            fastest: a,
            slowest: b,
            fastestAverage: resA.requests.average,
            slowestAverage: resB.requests.average
        };
    }
    return {
        equal: false,
        diff: autocannonCompare(resB, resA).requests.difference,
        fastest: b,
        slowest: a,
        fastestAverage: resB.requests.average,
        slowestAverage: resA.requests.average
    };
}

module.exports = {
    fire: fire,
    compare: compare
};
