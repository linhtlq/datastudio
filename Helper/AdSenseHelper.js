const Combine = require('../Combine');
const AdSense = require('../Model/AdSense');
var DIMENSION_DATE = 'date';
var DIMENSION_PLATFORM = 'platform';
var DIMENSION_APPLICATION = 'application';
var DIMENSION_COUNTRY = 'country_iso_code';
var METRIC_INTERSTITIAL_IMPRESSIONS = 'interstitial_impressions';
var METRIC_REVENUE = 'revenue'; // Daily.

class AdSenseHelper {
    constructor(helper, apiKey, useCache) {
        this.combine = new Combine();
        this.adSense = new AdSense();
        this.helper = helper;
        this.apiKey = apiKey;
        this.useCache = useCache;
        this.fieldMap = {};
        this.fieldMap[DIMENSION_DATE] = this.adSense.DIMENSION_DATE;
        this.fieldMap[DIMENSION_APPLICATION] = this.adSense.DIMENSION_APP_ID;
        this.fieldMap[DIMENSION_PLATFORM] = this.adSense.DIMENSION_APP_PLATFORM;
        this.fieldMap[DIMENSION_COUNTRY] = this.adSense.DIMENSION_COUNTRY_CODE;
        this.fieldMap[METRIC_INTERSTITIAL_IMPRESSIONS] = this.adSense.METRIC_REACHED_AD_REQUESTS;
        this.fieldMap[METRIC_REVENUE] = this.adSense.METRIC_EARNINGS;
    }

    requestDataInternal(dimensions, metrics, since, until) {
        return this.adSense.requestHttp(dimensions, metrics, since, until, this.useCache);
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
            item[DIMENSION_SOURCE] = 'AdSense';
            item[DIMENSION_REVENUE_TYPE] = 'Ads';
        });
        return data;
    };
}

module.exports = AdSenseHelper;