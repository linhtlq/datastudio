const EE = require('../EE');
const ee = new EE();
var LOCK_DURATION = 60 * 1000;
const AsyncLock = require('async-lock');
var lock = new AsyncLock({
    timeout: LOCK_DURATION
});

var LOCK_DURATION = 60 * 1000;

var CONFIG_BUCKET_ID = 'BUCKET_ID';
var DIMENSION_DATE = 'date';
var DIMENSION_TRANSACTION_TYPE = 'type';
var DIMENSION_PRODUCT_TITLE = 'product_title';
var DIMENSION_PRODUCT_ID = 'product_id';
var DIMENSION_PRODUCT_TYPE = 'product_type';
var DIMENSION_SKU_ID = 'sku';
var DIMENSION_BUYER_COUNTRY = 'country_iso_code';
var METRIC_AMOUNT = 'amount';
var _sessionId = ee.getSessionId();

class AndroidPublisher {
    getAccessToken() {
        // fix me
        // return 'ya29.GlwHBYfPbpTWaKXl3KbgdpUZf9SWj-d3qvts3Uf57qYmdMjjO5iqPP2t-JB1S0fOpnU1JdJGO-ZiBogA6YIedieICFhyJpf57SU-FA0H9LPFaAFBV0LGI-6y-7lzyw';
        //return getOAuthService().getAccessToken();
    }
    createOptionsFromToken(accessToken) {
        var options = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };
        return options;
    }

    createOption(accessToken) {
        return this.createOptionsFromToken(accessToken);
    }

    mapHeaderIndex(name) {
        if (name == DIMENSION_DATE) {
            return 1;
        }
        if (name == DIMENSION_TRANSACTION_TYPE) {
            return 3;
        }
        if (name == DIMENSION_PRODUCT_TITLE) {
            return 5;
        }
        if (name == DIMENSION_PRODUCT_ID) {
            return 6;
        }
        if (name == DIMENSION_PRODUCT_TYPE) {
            return 7;
        }
        if (name == DIMENSION_SKU_ID) {
            return 8;
        }
        if (name == METRIC_AMOUNT) {
            return 12;
        }
        if (name == DIMENSION_BUYER_COUNTRY) {
            return 16;
        }
        return name;
    }

    formatObjectsListUrl(bucketId) {
        var format = [
            `https://www.googleapis.com/storage/v1`,
            `/b/${bucketId}`,
            `/o`,
            `?prefix=sales`,
            `&fields=items(name,mediaLink)`
        ].join('');
        return format;
    }

    parseReportDateRange(name) {
        // name format: earnings/earnings_yyyyMM_xxxxxxxxxxxxxxxx-n.zip
        // name format: sales/salesreport_yyyyMM.zip
        var year = parseInt(name.substring(18, 22), 10);
        var month = parseInt(name.substring(22, 24), 10);
        var since = new Date(Date.UTC(year, month - 1, 1));
        var until = new Date(Date.UTC(year, month, 0));
        return {
            since: since,
            until: until
        };
    }

    parseData(data, headers, since, until) {
        var rows = [];
        if (data.items) {
            var items = data.items;
            items.forEach(function (item) {
                var reportRange = parseReportDateRange(item.name);
                var reportSince = reportRange.since;
                var reportUntil = reportRange.until;
                if (!(since <= reportUntil && reportSince <= until)) {
                    // Out of range.
                    return;
                }
                // console.log(Utilities.formatString(
                //   '%s: reportName = %s since = %s until = %s',
                //   getSessionId(),
                //   item.name,
                //   EE.formatDate(reportSince),
                //   EE.formatDate(reportUntil)
                // ));
                // console.log(Utilities.formatString('%s: mediaLink = %s', getSessionId(), item.mediaLink));

                var blob = UrlFetchApp.fetch(item.mediaLink, createOptions()).getBlob();
                blob.setContentType('application/zip');
                // console.log(Utilities.formatString('%s: blob size = %d', getSessionId(), blob.getBytes().length));

                var unzippedBlob = Utilities.unzip(blob);
                var unzippedData = unzippedBlob[0].getDataAsString();

                var dataRows = Utilities.parseCsv(unzippedData);
                dataRows.forEach(function (row) {
                    var date = new Date(row[mapHeaderIndex(DIMENSION_DATE)]);
                    if (!(since <= date && date <= until)) {
                        // Out of range.
                        return;
                    }
                    var dict = {};
                    headers.forEach(function (header) {
                        var value = row[mapHeaderIndex(header)];
                        if (header == DIMENSION_DATE) {
                            value = ee.parseDate(value);
                        }
                        if (header == METRIC_AMOUNT) {
                            // Remove all commas.
                            value = value.replace(/,/g, '');

                            // Minus 30% Google charge.
                            value = value * 0.7;

                            // Multiply by conversion rate.
                            var currency = row[9];
                            var rate = ee.getRate(currency);
                            value = value * rate;
                        }
                        dict[header] = value;
                    });
                    rows.push(dict);
                });
            });
        }
        return rows;
    }

    buildKey(bucketId, dimensions, metrics, since, until) {
        var params = [];
        params.push(getAccessToken());
        params.push(bucketId);
        params.extend(dimensions);
        params.extend(metrics);
        params.push(ee.formatDate(since));
        params.push(ee.formatDate(until));
        return params.join('|');
    }

    retrieveData(url) {
        var options = createOptions();
        var result = ee.sendHttpGET(url, options).then(res => {
            return res.json();
        }).then(json => {
            return json;
        });
        var dict = JSON.parse(result);
        return dict;
    }

    requestHttp(bucketId, dimensions, metrics, since, until, useCache) {
        var parseData = undefined;
        lock.acquire(key, (done) => {
            var url = formatObjectsListUrl(bucketId);
            var data = this.retrieveData(url);
            var headers = dimensions.concat(metrics);
            parsedData = this.parseData(data, headers, since, until);
            done();
        }, (err, ret) => {
            return JSON.parse(parseData);
        })
    }
}
module.exports = AndroidPublisher;