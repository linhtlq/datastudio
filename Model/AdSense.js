const EE = require('../EE')
const ee = new EE();
const LOCK_DURATION = 60 * 1000;
const AsyncLock = require('async-lock');
var LOCK_DURATION = 60 * 1000;
var lock = new AsyncLock({
    timeout: LOCK_DURATION
});

var DIMENSION_AD_CLIENT_ID = 'AD_CLIENT_ID';
var DIMENSION_AD_UNIT_ID = 'AD_UNIT_ID';
var DIMENSION_AD_UNIT_NAME = 'AD_UNIT_NAME';
var DIMENSION_APP_NAME = 'APP_NAME';
var DIMENSION_APP_ID = 'APP_ID';
var DIMENSION_APP_PLATFORM = 'APP_PLATFORM';
var DIMENSION_COUNTRY_CODE = 'country_iso_code';
var DIMENSION_DATE = 'DATE';
var DIMENSION_MONTH = 'MONTH';
var DIMENSION_WEEK = 'WEEK';
var METRIC_CLICKS = 'CLICKS';
var METRIC_EARNINGS = 'EARNINGS';
var METRIC_MATCHED_AD_REQUESTS = 'MATCHED_AD_REQUESTS';
var METRIC_REACHED_AD_REQUESTS = 'REACHED_AD_REQUESTS';
var METRIC_VIEWED_IMPRESSIONS = 'VIEWED_IMPRESSIONS';
var METRIC_REACHED_AD_REQUESTS_MATCH_RATE = 'REACHED_AD_REQUESTS_MATCH_RATE';
var METRIC_REACHED_AD_REQUESTS_SHOW_RATE = 'REACHED_AD_REQUESTS_SHOW_RATE';
var _sessionId = ee.getSessionId();

class AdSense {
    getSessionId() {
        return _sessionId;
    }

    mapQuery(name) {
        if (name == DIMENSION_COUNTRY_CODE) {
            return 'COUNTRY_CODE';
        }
        return name;
    }

    mapHeader(name) {
        if (name == 'COUNTRY_CODE') {
            return DIMENSION_COUNTRY_CODE;
        }
        return name;
    }

    downloadData(dimensions, metrics, since, until) {
        var report = AdSense.Reports.generate(
            ee.formatDate(since),
            ee.formatDate(until), {
                dimension: dimensions.map(this.mapQuery),
                metric: metrics.map(this.mapQuery),
                fields: 'headers,rows'
            }
        );
        return JSON.stringify(report);
    }


    retrieveData(key, dimensions, metrics, since, until, useCache) {
        var data = undefined;
        lock.acquire(key, (done) => {
            data = downloadData(apiKey, url);
            done();
        }, (err, ret) => {
            return JSON.parse(data);
        })
    }

    parseData(data) {
        var rows = [];
        if (data.rows) {
            var headers = data.headers;
            rows = data.rows.map(item => {
                var dict = {};
                for (var i = 0; i < headers.length; ++i) {
                    var header = this.mapHeader(headers[i].name);
                    var value = item[i];
                    if (header == DIMENSION_DATE) {
                        value = ee.parseDate(value);
                    }
                    dict[header] = value;
                }
                return dict;
            });
        }
        return rows;
    }

    buildKey(dimensions, metrics, since, until) {
        //Todo: find the way to get token
        var params = [];
        params.push(ScriptApp.getOAuthToken());
        params.extend(dimensions);
        params.extend(metrics);
        params.push(ee.formatDate(since));
        params.push(ee.formatDate(until));
        return params.join('|');
    }

    requestHttp(dimensions, metrics, since, until, useCache) {
        var key = ee.hash(buildKey(dimensions, metrics, since, until));
        var data = this.retrieveData(key, dimensions, metrics, since, until, useCache);
        // console.log(Utilities.formatString('%s: data = %s', getSessionId(), JSON.stringify(data)));

        var parsedData = this.parseData(data);
        return parsedData;
    }
}

module.exports = AdSense;