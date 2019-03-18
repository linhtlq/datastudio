const EE = require('../EE');
const ee = new EE();
const AsyncLock = require('async-lock');
var LOCK_DURATION = 60 * 1000;
var lock = new AsyncLock({
    timeout: LOCK_DURATION
});
var DIMENSION_DATE = 'date';
var DIMENSION_SOURCE = 'source';
var DIMENSION_PLATFORM = 'platform';
var DIMENSION_ZONE = 'zone';
var DIMENSION_COUNTRY = 'country_iso_code';
var METRIC_AD_REQUESTS = 'adrequests';
var METRIC_AVAILABLE = 'available';
var METRIC_STARTED = 'started';
var METRIC_VIEWS = 'views';
var METRIC_REVENUE = 'revenue';
var _sessionId = EE.getSessionId();

class UnityAds {
    constructor() {}

    getSessionId() {
        return _sessionId;
    }

    mapHeader(name) {
        if (name == DIMENSION_COUNTRY) {
            return 'country';
        }
        if (name == DIMENSION_PLATFORM) {
            return DIMENSION_SOURCE;
        }
        return name;
    }

    mapHeader(name) {
        if (name == 'Date') {
            return DIMENSION_DATE;
        }
        if (name == 'Source game name') {
            return DIMENSION_SOURCE;
        }
        if (name == 'Source game id') {
            return DIMENSION_PLATFORM;
        }
        if (name == 'Source zone') {
            return DIMENSION_ZONE;
        }
        if (name == 'Country code') {
            return DIMENSION_COUNTRY;
        }
        return name;
    }

    formatUrl(apiKey, dimensions, metrics, since, until) {
        var url = [
            `https://gameads-admin.applifier.com/stats/monetization-api`,
            `?apikey=${apiKey}`,
            `&splitBy=${dimensions.join(',')}`,
            `&fields=${metrics.join(',')}`,
            `&scale=day`,
            `&start=${ee.formatDate(since)}`,
            `&end=${ee.formatDate(until)}T23:59:59.999Z`
        ].join('');
        return url;
    }

    downloadData(url) {
        var result = ee.sendHttpGET(url, {}).then(res => {
            return res.json();
        }).then(json => {
            return json;
        });
        return result;
    }

    retrieveData(key, url, useCache) {
        var data = undefined;
        lock.acquire(key, (done) => {
            data = downloadData(apiKey, url);
            done();
        }, (err, ret) => {
            return JSON.parse(data);
        })
    }

    parseData(data, androidIds, iosIds, since, until) {
        var headers = data[0].map(mapHeader);
        var rows = [];
        for (var i = 1; i < data.length; ++i) {
            var dict = {};
            for (var j = 0; j < headers.length; ++j) {
                var header = headers[j];
                var value = data[i][j];
                if (header == DIMENSION_DATE) {
                    value = ee.parseDate(value);
                }
                if (header == DIMENSION_PLATFORM) {
                    if (androidIds.includes(value)) {
                        value = 'Android';
                    } else if (iosIds.includes(value)) {
                        value = 'iOS';
                    } else {
                        value = 'Unknown platform';
                    }
                }
                dict[header] = value;
            }
            rows.push(dict);
        }
        return rows;
    }

    buildKey(apiKey, dimensions, metrics, since, until) {
        var params = [];
        params.push(apiKey);
        params.extend(dimensions);
        params.extend(metrics);
        params.push(ee.formatDate(since));
        params.push(ee.formatDate(until));
        return params.join('|');
    }

    requestHttp(apiKey, androidIds, iosIds, dimensions, metrics, since, until, useCache) {
        var url = this.formatUrl(apiKey, dimensions.map(mapQuery), metrics.map(mapQuery), since, until);
        var data = this.retrieveData(key, url, useCache);
        var parsedData = this.parseData(data, androidIds, iosIds, since, until);
        return parsedData;
    }
}

module.exports = UnityAds;