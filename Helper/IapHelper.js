const Combine = require('../Combine');
const AndroidPublisher = require('../Model/AndroidPublisher');
var DIMENSION_DATE = 'date';
var DIMENSION_PLATFORM = 'platform';
var DIMENSION_APPLICATION = 'application';
var DIMENSION_COUNTRY = 'country_iso_code';
var DIMENSION_SOURCE = 'source';
var DIMENSION_REVENUE_TYPE = 'revenue_type';
var METRIC_REVENUE = 'revenue'; // Daily.


class IapHelper {
    constructor(helper, apiKey, useCache) {
        this.combine = new Combine();
        this.androidPublisher = new AndroidPublisher();
        this.helper = helper;
        this.apiKey = apiKey;
        this.useCache = useCache;

        this.fieldMap = {};
        this.fieldMap[DIMENSION_DATE] = this.androidPublisher.DIMENSION_DATE;
        this.fieldMap[DIMENSION_APPLICATION] = this.androidPublisher.DIMENSION_PRODUCT_ID;
        this.fieldMap[DIMENSION_COUNTRY] = this.androidPublisher.DIMENSION_BUYER_COUNTRY;
        this.fieldMap[METRIC_REVENUE] = this.androidPublisher.METRIC_AMOUNT;
    }

    requestDataInternal(dimensions, metrics, since, until) {
        this.androidPublisher.requestHttp()
        return this.androidPublisher.requestHttp(dimensions, metrics, since, until, this.useCache);
    }

    getFieldMap() {
        return this.fieldMap;
    };

    getSupportedDimensions(dimensions) {
        return this.combine.getSupportedDimensions(dimensions);
    };

    getSupportedMetrics(metrics) {
        return this.combine.getSupportedMetrics(metrics);
    };

    requestData() {
        var data = this.helper.requestData(this, this.requestDataInternal);
        data.forEach(function (item) {
            item[DIMENSION_SOURCE] = 'In-App Purchase';
            item[DIMENSION_REVENUE_TYPE] = 'In-App Purchase';
            item[DIMENSION_PLATFORM] = 'Android';
        });
        return data;
    };
}

module.exports = IapHelper;