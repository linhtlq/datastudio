const EE = require('../EE');
const ee = new EE();

var LOCK_DURATION = 60 * 1000;
const AsyncLock = require('async-lock');
var lock = new AsyncLock({
    timeout: LOCK_DURATION
});
var DIMENSION_DATE = 'date';
var DIMENSION_APP = 'app';
var DIMENSION_COUNTRY = 'country_iso_code';
var DIMENSION_AD_SOURCE = 'adSource';

var _sessionId = EE.getSessionId();

class IronSource {
    getSessionId() {
        return _sessionId;
    }

    mapQuery(name) {
        if (name == DIMENSION_COUNTRY) {
            return 'country';
        }
        return name;
    }

    mapHeader(name) {
        if (name == 'countryCode') {
            return DIMENSION_COUNTRY;
        }
        if (name == 'appName') {
            return DIMENSION_APP;
        }
        if (name == 'providerName') {
            return DIMENSION_AD_SOURCE;
        }
        return name;
    }

    formatUrl(dimensions, metrics, since, until) {
        var url = [
            `https://platform.ironsrc.com/partners/publisher/mediation/applications/v3/stats`,
            `?startDate=${ee.formatDate(since)}`,
            `&endDate=${ee.formatDate(until)}`,
            `&breakdowns=${dimensions.join(',')}`,
            `&metrics=${metrics.join(',')}`
        ].join('')
        return url;
    }

    downloadData(username, secretKey, url) {
        var encoded = window.btoa(`${username}:${secretKey}`);
        var options = {
            headers: {
                Authorization: Utilities.formatString('Basic %s', encoded),
            },
        };
        /*
        var code = result.getResponseCode();
        if (code == 429) {
          // Exceeded request limit.
          return null;
        }
        */
        var result = ee.sendHttpGET(url, options).then(res => {
            return res.json();
        }).then(json => {
            return json;
        });
        return result;
    }

    retrieveData(key, username, secretKey, url, useCache) {
        var data = undefined;
        var result = lock.acquire(key, (done) => {
            data = downloadData(username, secretKey, url);
            done();
        }, (err, ret) => {
            return JSON.parse(data);
        })
        return result;
    }

    parseData(data, since, until) {
        var parsedData = [];
        if (data) {
            // May return empty data.    
            data.forEach(function (item) {
                item.data.forEach(function (subItem) {
                    var parsedItem = {}
                    Object.keys(item).forEach(function (key) {
                        if (key != 'data') {
                            var header = mapHeader(key);
                            var value = item[key];
                            if (header == DIMENSION_DATE) {
                                value = ee.parseDate(value);
                            }
                            parsedItem[header] = value;
                        }
                    });
                    Object.keys(subItem).forEach(function (key) {
                        var header = mapHeader(key);
                        parsedItem[header] = subItem[key];
                    });
                    parsedData.push(parsedItem);
                });
            });
        }
        return parsedData;
    }

    buildKey(username, secretKey, dimensions, metrics, since, until) {
        var params = [];
        params.push(username);
        params.push(secretKey);
        params.extend(dimensions);
        params.extend(metrics);
        params.push(EE.formatDate(since));
        params.push(EE.formatDate(until));
        return params.join('|');
    }

    requestHttp(username, secretKey, dimensions, metrics, since, until, useCache) {
        var url = this.formatUrl(dimensions.map(mapQuery), metrics.map(mapQuery), since, until);

        var key = EE.hash(buildKey(username, secretKey, dimensions, metrics, since, until));
        var data = this.retrieveData(key, username, secretKey, url, useCache);
        // console.log(Utilities.formatString('%s: data = %s', getSessionId(), JSON.stringify(data)));

        var parsedData = this.parseData(data);
        return parsedData;
    }
}

module.exports = IronSource;